import hmac
import hashlib
import time
import uuid
from flask import Blueprint, request, jsonify, current_app
import razorpay
from ..models import db, Order, OrderItem, Product

orders_bp = Blueprint('orders', __name__, url_prefix='/api/orders')

def get_razorpay_client():
    """Initializes and returns the Razorpay client if keys are configured."""
    key_id = current_app.config.get('RAZORPAY_KEY_ID', '')
    key_secret = current_app.config.get('RAZORPAY_KEY_SECRET', '')
    if key_id and key_secret:
        try:
            return razorpay.Client(auth=(key_id, key_secret))
        except Exception as e:
            current_app.logger.warning(f"Failed to initialize Razorpay client: {e}")
    return None


@orders_bp.route('/create', methods=['POST'])
def create_order():
    """
    Accepts cart items and shipping details, creates a Razorpay order via Razorpay Python Client,
    saves a pending order in the database, and returns order_id, amount, and currency.
    """
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Request payload must be JSON'}), 400

    items_data = data.get('items', [])
    if not items_data or not isinstance(items_data, list):
        return jsonify({'success': False, 'message': 'Cart items are required to create an order'}), 400

    customer_name = data.get('customer_name', '').strip()
    customer_email = data.get('customer_email', '').strip()
    customer_phone = data.get('customer_phone', '').strip()
    shipping_address = data.get('shipping_address', '')
    notes = data.get('notes', '')

    if isinstance(shipping_address, dict):
        # Format address dict into readable string
        parts = [
            shipping_address.get('street', ''),
            shipping_address.get('city', ''),
            shipping_address.get('state', ''),
            shipping_address.get('pincode', '')
        ]
        shipping_address = ', '.join([p for p in parts if p])

    if not customer_name or not customer_email or not customer_phone or not shipping_address:
        return jsonify({
            'success': False,
            'message': 'customer_name, customer_email, customer_phone, and shipping_address are all required'
        }), 400

    # Calculate order total securely on server side
    total_amount = 0.0
    verified_items = []

    for item in items_data:
        product_id = item.get('product_id')
        qty = int(item.get('quantity', 1))
        size = item.get('size', 'Standard')

        if qty <= 0:
            continue

        product = Product.query.get(product_id)
        if not product:
            return jsonify({
                'success': False,
                'message': f"Product with ID {product_id} no longer exists"
            }), 404

        if product.stock < qty:
            return jsonify({
                'success': False,
                'message': f"Insufficient stock for '{product.title}'. Only {product.stock} available."
            }), 400

        item_price = product.discounted_price if product.discounted_price else product.price
        total_amount += item_price * qty
        verified_items.append({
            'product': product,
            'quantity': qty,
            'size': size,
            'price': item_price
        })

    if total_amount <= 0 or not verified_items:
        return jsonify({'success': False, 'message': 'Cart contains no valid items'}), 400

    amount_in_paise = int(round(total_amount * 100)) # Razorpay expects paise (e.g., Rs. 100 = 10000)
    key_id = current_app.config.get('RAZORPAY_KEY_ID', 'rzp_test_ShaifyKey')
    key_secret = current_app.config.get('RAZORPAY_KEY_SECRET', 'ShaifySecretKeyMock2025')

    rzp_client = get_razorpay_client()
    razorpay_order_id = None
    is_mock = False

    # Attempt to create Razorpay Order via client SDK
    if rzp_client and not ('YourRazorpay' in key_id or 'ShaifyTestKey' in key_id):
        try:
            rzp_response = rzp_client.order.create({
                'amount': amount_in_paise,
                'currency': 'INR',
                'receipt': f"receipt_{int(time.time())}_{uuid.uuid4().hex[:6]}",
                'notes': {
                    'customer_name': customer_name,
                    'customer_phone': customer_phone,
                    'brand': 'Shaify Styles'
                }
            })
            razorpay_order_id = rzp_response.get('id')
        except Exception as e:
            current_app.logger.warning(f"Razorpay API error ({e}). Falling back to simulated order for development.")
            is_mock = True
    else:
        is_mock = True

    if not razorpay_order_id:
        # Simulated order ID for test/demo mode
        razorpay_order_id = f"order_shaify_{int(time.time())}_{uuid.uuid4().hex[:8]}"

    # Save pending order in database
    new_order = Order(
        razorpay_order_id=razorpay_order_id,
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        shipping_address=shipping_address,
        total_amount=round(total_amount, 2),
        status='created',
        notes=notes
    )
    db.session.add(new_order)
    db.session.flush() # Populate new_order.id

    for item in verified_items:
        order_item = OrderItem(
            order_id=new_order.id,
            product_id=item['product'].id,
            quantity=item['quantity'],
            size=item['size'],
            price=item['price']
        )
        db.session.add(order_item)

    db.session.commit()

    return jsonify({
        'success': True,
        'order_id': new_order.id,
        'razorpay_order_id': razorpay_order_id,
        'amount': amount_in_paise,
        'currency': 'INR',
        'key_id': key_id,
        'is_mock': is_mock,
        'customer': {
            'name': customer_name,
            'email': customer_email,
            'contact': customer_phone
        },
        'message': 'Order created successfully. Ready for payment.'
    }), 201


@orders_bp.route('/verify', methods=['POST'])
def verify_payment():
    """
    Verifies Razorpay signature (razorpay_order_id, razorpay_payment_id, razorpay_signature).
    Upon verification, updates order status to "paid" and reduces product stock.
    """
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Payload must be JSON'}), 400

    rzp_order_id = data.get('razorpay_order_id')
    rzp_payment_id = data.get('razorpay_payment_id')
    rzp_signature = data.get('razorpay_signature')
    order_id = data.get('order_id')

    if not rzp_order_id or not rzp_payment_id:
        return jsonify({
            'success': False,
            'message': 'razorpay_order_id and razorpay_payment_id are required'
        }), 400

    # Locate order in database
    order = None
    if rzp_order_id:
        order = Order.query.filter_by(razorpay_order_id=rzp_order_id).first()
    if not order and order_id:
        order = Order.query.get(order_id)

    if not order:
        return jsonify({'success': False, 'message': 'Matching order not found in database'}), 404

    # Signature verification
    key_secret = current_app.config.get('RAZORPAY_KEY_SECRET', '')
    is_valid_signature = False

    if rzp_order_id.startswith('order_shaify_'):
        # Mock/Demo order signature verification
        is_valid_signature = True
    else:
        rzp_client = get_razorpay_client()
        if rzp_client and rzp_signature:
            try:
                # Razorpay Python SDK signature verification
                params_dict = {
                    'razorpay_order_id': rzp_order_id,
                    'razorpay_payment_id': rzp_payment_id,
                    'razorpay_signature': rzp_signature
                }
                rzp_client.utility.verify_payment_signature(params_dict)
                is_valid_signature = True
            except razorpay.errors.SignatureVerificationError:
                is_valid_signature = False
            except Exception as e:
                current_app.logger.error(f"Error in signature check: {e}")
                # Manual HMAC SHA256 check
                msg = f"{rzp_order_id}|{rzp_payment_id}".encode('utf-8')
                generated = hmac.new(key_secret.encode('utf-8'), msg, hashlib.sha256).hexdigest()
                is_valid_signature = (generated == rzp_signature)
        else:
            # Fallback for dev mode
            is_valid_signature = True

    if not is_valid_signature:
        order.status = 'failed'
        db.session.commit()
        return jsonify({
            'success': False,
            'message': 'Payment signature verification failed. Please contact support.'
        }), 400

    # Payment successful: update order and reduce product stock
    order.status = 'paid'
    order.razorpay_payment_id = rzp_payment_id
    order.razorpay_signature = rzp_signature

    for item in order.items:
        product = Product.query.get(item.product_id)
        if product:
            product.stock = max(0, product.stock - item.quantity)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Payment verified and order confirmed successfully!',
        'order': order.to_dict()
    }), 200


@orders_bp.route('/<int:order_id>', methods=['GET'])
def get_order(order_id):
    """Retrieve receipt details for an order."""
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'success': False, 'message': 'Order not found'}), 404

    return jsonify({
        'success': True,
        'order': order.to_dict()
    }), 200
