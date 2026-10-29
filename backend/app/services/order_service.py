import hmac
import hashlib
import time
import uuid
from typing import Optional, Dict, Any, Tuple
import razorpay
from ..repositories.order_repository import OrderRepository
from ..repositories.product_repository import ProductRepository
from ..repositories.user_repository import UserRepository

class OrderService:
    """
    Business logic service for customer checkout, payment verification, and order processing.
    """
    def __init__(
        self,
        order_repo: Optional[OrderRepository] = None,
        product_repo: Optional[ProductRepository] = None,
        user_repo: Optional[UserRepository] = None
    ):
        self.order_repo = order_repo or OrderRepository()
        self.product_repo = product_repo or ProductRepository()
        self.user_repo = user_repo or UserRepository()

    def _get_razorpay_client(self, config: Dict[str, Any]) -> Optional[razorpay.Client]:
        key_id = config.get('RAZORPAY_KEY_ID', '')
        key_secret = config.get('RAZORPAY_KEY_SECRET', '')
        if key_id and key_secret:
            try:
                return razorpay.Client(auth=(key_id, key_secret))
            except Exception:
                pass
        return None

    def create_order(self, data: Dict[str, Any], config: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        """Validate cart, compute totals, create payment intent, and persist order."""
        if not data:
            return {'success': False, 'message': 'Request payload must be JSON'}, 400

        items_data = data.get('items', [])
        if not items_data or not isinstance(items_data, list):
            return {'success': False, 'message': 'Cart items are required to create an order'}, 400

        customer_name = (data.get('customer_name') or '').strip()
        customer_email = (data.get('customer_email') or '').strip()
        customer_phone = (data.get('customer_phone') or '').strip()
        shipping_address = data.get('shipping_address', '')
        notes = data.get('notes', '')

        if isinstance(shipping_address, dict):
            parts = [
                shipping_address.get('street', ''),
                shipping_address.get('city', ''),
                shipping_address.get('state', ''),
                shipping_address.get('pincode', '')
            ]
            shipping_address = ', '.join([p for p in parts if p])

        if not customer_name or not customer_email or not customer_phone or not shipping_address:
            return {
                'success': False,
                'message': 'customer_name, customer_email, customer_phone, and shipping_address are all required'
            }, 400

        total_amount = 0.0
        verified_items = []

        for item in items_data:
            product_id = item.get('product_id')
            qty = int(item.get('quantity', 1))
            size = item.get('size', 'Standard')

            if qty <= 0:
                continue

            product = self.product_repo.get_by_id(product_id)
            if not product:
                return {
                    'success': False,
                    'message': f"Product with ID {product_id} no longer exists"
                }, 404

            if product.stock < qty:
                return {
                    'success': False,
                    'message': f"Insufficient stock for '{product.title}'. Only {product.stock} available."
                }, 400

            item_price = product.discounted_price if product.discounted_price else product.price
            total_amount += item_price * qty
            verified_items.append({
                'product_id': product.id,
                'quantity': qty,
                'size': size,
                'price': item_price
            })

        if total_amount <= 0 or not verified_items:
            return {'success': False, 'message': 'Cart contains no valid items'}, 400

        # Apply promo coupon if supplied
        coupon_code = (data.get('coupon_code') or '').strip().upper()
        discount_amount = 0.0
        if coupon_code:
            try:
                from ..repositories.coupon_repository import CouponRepository
                coupon = CouponRepository().get_by_code(coupon_code)
                if coupon and coupon.is_valid_for(total_amount):
                    discount_amount = coupon.calculate_discount(total_amount)
                    total_amount = max(1.0, round(total_amount - discount_amount, 2))
                else:
                    coupon_code = None
            except Exception:
                coupon_code = None

        amount_in_paise = int(round(total_amount * 100))
        key_id = config.get('RAZORPAY_KEY_ID', 'rzp_test_ShaifyKey')
        key_secret = config.get('RAZORPAY_KEY_SECRET', 'ShaifySecretKeyMock2025')

        rzp_client = self._get_razorpay_client(config)
        razorpay_order_id = None
        is_mock = False

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
            except Exception:
                is_mock = True
        else:
            is_mock = True

        if not razorpay_order_id:
            razorpay_order_id = f"order_shaify_{int(time.time())}_{uuid.uuid4().hex[:8]}"

        # Identify linked registered customer user
        user_id = data.get('user_id')
        if not user_id:
            phone_digits = ''.join(c for c in customer_phone if c.isdigit())
            user_match = None
            if len(phone_digits) >= 10:
                user_match = self.user_repo.get_by_phone(phone_digits[-10:])
            if not user_match and customer_email:
                user_match = self.user_repo.get_by_email(customer_email.lower())
            if user_match:
                user_id = user_match.id

        order_fields = {
            'user_id': user_id,
            'razorpay_order_id': razorpay_order_id,
            'customer_name': customer_name,
            'customer_email': customer_email,
            'customer_phone': customer_phone,
            'shipping_address': shipping_address,
            'total_amount': total_amount,
            'status': 'created',
            'notes': notes,
            'coupon_code': coupon_code,
            'discount_amount': discount_amount
        }

        new_order = self.order_repo.create_order_with_items(order_fields, verified_items)

        return {
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
        }, 201

    def verify_payment(self, data: Dict[str, Any], config: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        """Verify Razorpay payment signature, transition status to paid, and update inventory."""
        if not data:
            return {'success': False, 'message': 'Payload must be JSON'}, 400

        rzp_order_id = data.get('razorpay_order_id')
        rzp_payment_id = data.get('razorpay_payment_id')
        rzp_signature = data.get('razorpay_signature')
        order_id = data.get('order_id')

        if not rzp_order_id or not rzp_payment_id:
            return {
                'success': False,
                'message': 'razorpay_order_id and razorpay_payment_id are required'
            }, 400

        order = None
        if rzp_order_id:
            order = self.order_repo.get_by_razorpay_order_id(rzp_order_id)
        if not order and order_id:
            order = self.order_repo.get_by_id(order_id)

        if not order:
            return {'success': False, 'message': 'Matching order not found in database'}, 404

        key_secret = config.get('RAZORPAY_KEY_SECRET', '')
        is_valid_signature = False

        if rzp_order_id.startswith('order_shaify_'):
            is_valid_signature = True
        else:
            rzp_client = self._get_razorpay_client(config)
            if rzp_client and rzp_signature:
                try:
                    params_dict = {
                        'razorpay_order_id': rzp_order_id,
                        'razorpay_payment_id': rzp_payment_id,
                        'razorpay_signature': rzp_signature
                    }
                    rzp_client.utility.verify_payment_signature(params_dict)
                    is_valid_signature = True
                except razorpay.errors.SignatureVerificationError:
                    is_valid_signature = False
                except Exception:
                    msg = f"{rzp_order_id}|{rzp_payment_id}".encode('utf-8')
                    generated = hmac.new(key_secret.encode('utf-8'), msg, hashlib.sha256).hexdigest()
                    is_valid_signature = (generated == rzp_signature)
            else:
                is_valid_signature = True

        if not is_valid_signature:
            self.order_repo.update_payment(order, payment_id=rzp_payment_id, signature=rzp_signature, status='failed')
            return {
                'success': False,
                'message': 'Payment signature verification failed. Please contact support.'
            }, 400

        # Payment succeeded: update order and deduct stock
        updated_order = self.order_repo.update_payment(
            order, payment_id=rzp_payment_id, signature=rzp_signature, status='paid'
        )

        for item in updated_order.items:
            self.product_repo.decrement_stock(item.product_id, item.quantity)

        if updated_order.coupon_code:
            try:
                from ..repositories.coupon_repository import CouponRepository
                coupon = CouponRepository().get_by_code(updated_order.coupon_code)
                if coupon:
                    CouponRepository().increment_usage(coupon)
            except Exception:
                pass

        return {
            'success': True,
            'message': 'Payment verified and order confirmed successfully!',
            'order': updated_order.to_dict()
        }, 200

    def get_order(self, order_id: int) -> Tuple[Dict[str, Any], int]:
        """Fetch receipt / invoice details for an order."""
        order = self.order_repo.get_by_id(order_id)
        if not order:
            return {'success': False, 'message': 'Order not found'}, 404
        return {'success': True, 'order': order.to_dict()}, 200

    def get_admin_orders(
        self,
        page: int = 1,
        per_page: int = 20,
        status: str = '',
        search: str = '',
        date_from: str = '',
        date_to: str = ''
    ) -> Tuple[Dict[str, Any], int]:
        """Paginated order query for admin panel."""
        paginated = self.order_repo.get_paginated(
            page=page,
            per_page=per_page,
            status_filter=status,
            search=search,
            date_from=date_from,
            date_to=date_to
        )
        return {
            'success': True,
            'orders': [o.to_dict() for o in paginated.items],
            'total': paginated.total,
            'pages': paginated.pages,
            'current_page': page
        }, 200

    def update_order_status(self, order_id: int, data: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        """Validate and apply order status and tracking updates."""
        order = self.order_repo.get_by_id(order_id)
        if not order:
            return {'success': False, 'message': 'Order not found'}, 404

        if not data:
            return {'success': False, 'message': 'JSON payload required'}, 400

        valid_statuses = ('created', 'paid', 'processing', 'shipped', 'delivered', 'failed', 'cancelled')
        new_status = (data.get('status') or '').strip().lower()

        if new_status and new_status not in valid_statuses:
            return {
                'success': False,
                'message': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
            }, 400

        updated_order = self.order_repo.update_status(
            order=order,
            status=new_status if new_status else None,
            tracking_carrier=data.get('tracking_carrier'),
            tracking_number=data.get('tracking_number'),
            notes=data.get('notes')
        )

        return {
            'success': True,
            'order': updated_order.to_dict(),
            'message': f'Order #SS-{updated_order.id} updated to "{updated_order.status}" successfully!'
        }, 200
