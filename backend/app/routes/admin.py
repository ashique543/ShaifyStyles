import os
import click
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity
)
from werkzeug.utils import secure_filename
from datetime import datetime
from sqlalchemy import func
from ..models import db, Admin, Product, Order, OrderItem, bcrypt

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# ─── Helper Utilities ────────────────────────────────────────────────────────

def allowed_file(filename: str) -> bool:
    allowed = current_app.config.get('ALLOWED_EXTENSIONS', {'png', 'jpg', 'jpeg', 'gif', 'webp'})
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed


# ─── Authentication ───────────────────────────────────────────────────────────

@admin_bp.route('/login', methods=['POST'])
def admin_login():
    """Authenticate an admin user and return a signed JWT access token."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Request body must be JSON'}), 400

    username = (data.get('username') or '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password are required'}), 400

    admin = Admin.query.filter_by(username=username).first()
    if not admin or not admin.check_password(password):
        return jsonify({'success': False, 'message': 'Invalid username or password'}), 401

    token = create_access_token(identity=str(admin.id))
    return jsonify({
        'success': True,
        'access_token': token,
        'admin': admin.to_dict(),
        'message': f'Welcome back, {admin.username}!'
    }), 200


@admin_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_admin():
    """Get the currently logged-in admin's profile."""
    admin_id = int(get_jwt_identity())
    admin = db.session.get(Admin, admin_id)
    if not admin:
        return jsonify({'success': False, 'message': 'Admin not found'}), 404
    return jsonify({'success': True, 'admin': admin.to_dict()}), 200


# ─── Dashboard Metrics ────────────────────────────────────────────────────────

@admin_bp.route('/metrics', methods=['GET'])
@jwt_required()
def get_metrics():
    """Return KPI metrics for the admin dashboard."""
    # Revenue: sum of all paid/delivered/shipped orders
    paid_statuses = ('paid', 'processing', 'shipped', 'delivered')

    total_revenue = db.session.query(func.sum(Order.total_amount)).filter(
        Order.status.in_(paid_statuses)
    ).scalar() or 0.0

    # Order counts by status
    status_counts = dict(
        db.session.query(Order.status, func.count(Order.id)).group_by(Order.status).all()
    )

    total_orders = Order.query.count()
    pending_orders = Order.query.filter(Order.status == 'paid').count()

    # Low-stock products (stock < 5)
    low_stock = Product.query.filter(Product.stock < 5).order_by(Product.stock.asc()).all()

    # Recent 10 orders
    recent_orders = (
        Order.query
        .order_by(Order.created_at.desc())
        .limit(10)
        .all()
    )

    return jsonify({
        'success': True,
        'metrics': {
            'total_revenue': round(total_revenue, 2),
            'total_orders': total_orders,
            'orders_by_status': status_counts,
            'pending_dispatch': pending_orders,
            'low_stock_count': len(low_stock),
            'low_stock_products': [p.to_dict() for p in low_stock],
        },
        'recent_orders': [o.to_dict() for o in recent_orders]
    }), 200


# ─── Product Management ───────────────────────────────────────────────────────

@admin_bp.route('/products', methods=['GET'])
@jwt_required()
def list_products():
    """List all products with optional search, category filter, and pagination."""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    search = request.args.get('search', '').strip()
    category = request.args.get('category', '').strip()

    query = Product.query

    if search:
        q = f'%{search}%'
        query = query.filter(db.or_(Product.title.ilike(q), Product.description.ilike(q)))
    if category and category != 'all':
        query = query.filter(Product.category.ilike(f'%{category}%'))

    paginated = query.order_by(Product.id.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'success': True,
        'products': [p.to_dict() for p in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200


@admin_bp.route('/products', methods=['POST'])
@jwt_required()
def create_product():
    """Create a new product."""
    import json as _json
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'JSON payload required'}), 400

    required = ['title', 'category', 'price', 'image_url']
    for field in required:
        if not data.get(field):
            return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400

    sizes = data.get('sizes', ['Standard'])
    if isinstance(sizes, str):
        sizes = [s.strip() for s in sizes.split(',') if s.strip()]

    product = Product(
        title=data['title'].strip(),
        description=data.get('description', '').strip(),
        category=data['category'].strip(),
        price=float(data['price']),
        discounted_price=float(data['discounted_price']) if data.get('discounted_price') else None,
        image_url=data['image_url'].strip(),
        stock=int(data.get('stock', 10)),
        sizes=_json.dumps(sizes),
        badge=data.get('badge', '').strip() or None,
        fabric=data.get('fabric', '').strip() or None,
    )
    db.session.add(product)
    db.session.commit()

    return jsonify({
        'success': True,
        'product': product.to_dict(),
        'message': f'Product "{product.title}" created successfully!'
    }), 201


@admin_bp.route('/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id: int):
    """Update an existing product's details."""
    import json as _json
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({'success': False, 'message': 'Product not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'JSON payload required'}), 400

    # Update only fields that are provided
    if 'title' in data:
        product.title = data['title'].strip()
    if 'description' in data:
        product.description = data['description'].strip()
    if 'category' in data:
        product.category = data['category'].strip()
    if 'price' in data:
        product.price = float(data['price'])
    if 'discounted_price' in data:
        product.discounted_price = float(data['discounted_price']) if data['discounted_price'] else None
    if 'image_url' in data:
        product.image_url = data['image_url'].strip()
    if 'stock' in data:
        product.stock = int(data['stock'])
    if 'sizes' in data:
        sizes = data['sizes']
        if isinstance(sizes, str):
            sizes = [s.strip() for s in sizes.split(',') if s.strip()]
        product.sizes = _json.dumps(sizes)
    if 'badge' in data:
        product.badge = data['badge'].strip() or None
    if 'fabric' in data:
        product.fabric = data['fabric'].strip() or None

    db.session.commit()
    return jsonify({
        'success': True,
        'product': product.to_dict(),
        'message': f'Product "{product.title}" updated successfully!'
    }), 200


@admin_bp.route('/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id: int):
    """Delete a product (cascades to order_items due to model relationship)."""
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({'success': False, 'message': 'Product not found'}), 404

    title = product.title
    db.session.delete(product)
    db.session.commit()
    return jsonify({'success': True, 'message': f'Product "{title}" deleted successfully.'}), 200


# ─── Image Upload ─────────────────────────────────────────────────────────────

@admin_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_image():
    """Upload a product image. Returns a URL that can be saved to product.image_url.
    Supports local disk storage (default) or Cloudinary if credentials are configured.
    """
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file field in request. Use key "file".'}), 400

    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'success': False, 'message': 'File type not allowed. Use PNG, JPG, JPEG, GIF, or WEBP'}), 400

    # Try Cloudinary first (if configured)
    cloud_name = current_app.config.get('CLOUDINARY_CLOUD_NAME', '')
    api_key = current_app.config.get('CLOUDINARY_API_KEY', '')
    api_secret = current_app.config.get('CLOUDINARY_API_SECRET', '')

    if cloud_name and api_key and api_secret:
        try:
            import cloudinary
            import cloudinary.uploader
            cloudinary.config(cloud_name=cloud_name, api_key=api_key, api_secret=api_secret)
            result = cloudinary.uploader.upload(
                file,
                folder='shaify_styles',
                transformation=[{'quality': 'auto', 'fetch_format': 'auto'}]
            )
            return jsonify({
                'success': True,
                'url': result['secure_url'],
                'public_id': result.get('public_id'),
                'storage': 'cloudinary'
            }), 200
        except Exception as e:
            current_app.logger.warning(f'Cloudinary upload failed ({e}), falling back to local storage.')

    # Fallback: save to local uploads/ directory
    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    os.makedirs(upload_dir, exist_ok=True)

    filename = secure_filename(file.filename)
    # Prefix with a timestamp to avoid collisions
    ts = int(datetime.utcnow().timestamp())
    unique_filename = f"{ts}_{filename}"
    save_path = os.path.join(upload_dir, unique_filename)
    file.save(save_path)

    # Build the URL relative to the API host
    url = f"/api/admin/uploads/{unique_filename}"
    return jsonify({
        'success': True,
        'url': url,
        'filename': unique_filename,
        'storage': 'local'
    }), 200


@admin_bp.route('/uploads/<path:filename>', methods=['GET'])
def serve_upload(filename: str):
    """Serve locally uploaded image files."""
    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    return send_from_directory(os.path.abspath(upload_dir), filename)


# ─── Order Management ─────────────────────────────────────────────────────────

@admin_bp.route('/orders', methods=['GET'])
@jwt_required()
def list_orders():
    """List all orders with filtering by status, date range, and search."""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    status_filter = request.args.get('status', '').strip().lower()
    search = request.args.get('search', '').strip()
    date_from = request.args.get('date_from', '').strip()
    date_to = request.args.get('date_to', '').strip()

    query = Order.query

    if status_filter:
        query = query.filter(Order.status == status_filter)

    if search:
        q = f'%{search}%'
        query = query.filter(
            db.or_(
                Order.customer_name.ilike(q),
                Order.customer_phone.ilike(q),
                Order.customer_email.ilike(q),
                Order.razorpay_payment_id.ilike(q)
            )
        )

    # Order ID search (numeric)
    if search and search.startswith('#'):
        try:
            oid = int(search[1:])
            query = Order.query.filter(Order.id == oid)
        except ValueError:
            pass
    elif search and search.isdigit():
        query = query.filter(
            db.or_(
                Order.customer_phone.ilike(f'%{search}%'),
                Order.id == int(search)
            )
        )

    if date_from:
        try:
            query = query.filter(Order.created_at >= datetime.strptime(date_from, '%Y-%m-%d'))
        except ValueError:
            pass
    if date_to:
        try:
            query = query.filter(Order.created_at <= datetime.strptime(date_to, '%Y-%m-%d'))
        except ValueError:
            pass

    paginated = query.order_by(Order.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'success': True,
        'orders': [o.to_dict() for o in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200


@admin_bp.route('/orders/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id: int):
    """Get full order details including items and tracking info."""
    order = db.session.get(Order, order_id)
    if not order:
        return jsonify({'success': False, 'message': 'Order not found'}), 404
    return jsonify({'success': True, 'order': order.to_dict()}), 200


@admin_bp.route('/orders/<int:order_id>/status', methods=['PATCH'])
@jwt_required()
def update_order_status(order_id: int):
    """Update an order's status and/or tracking details."""
    order = db.session.get(Order, order_id)
    if not order:
        return jsonify({'success': False, 'message': 'Order not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'JSON payload required'}), 400

    valid_statuses = ('created', 'paid', 'processing', 'shipped', 'delivered', 'failed', 'cancelled')
    new_status = data.get('status', '').strip().lower()

    if new_status and new_status not in valid_statuses:
        return jsonify({
            'success': False,
            'message': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
        }), 400

    if new_status:
        order.status = new_status
    if 'tracking_carrier' in data:
        order.tracking_carrier = data['tracking_carrier'].strip() or None
    if 'tracking_number' in data:
        order.tracking_number = data['tracking_number'].strip() or None
    if 'notes' in data:
        order.notes = data['notes'].strip() or None

    order.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'success': True,
        'order': order.to_dict(),
        'message': f'Order #SS-{order.id} updated to "{order.status}" successfully!'
    }), 200
