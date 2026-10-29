import os
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.admin_service import AdminService
from ..services.product_service import ProductService
from ..services.order_service import OrderService

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')
admin_service = AdminService()
product_service = ProductService()
order_service = OrderService()

# ─── Authentication ───────────────────────────────────────────────────────────

@admin_bp.route('/login', methods=['POST'])
def admin_login():
    """Authenticate admin and issue JWT."""
    data = request.get_json()
    result, status_code = admin_service.authenticate_admin(data)
    return jsonify(result), status_code

@admin_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_admin():
    """Get authenticated admin profile."""
    admin_id = int(get_jwt_identity())
    result, status_code = admin_service.get_admin_profile(admin_id)
    return jsonify(result), status_code

# ─── Dashboard Metrics ────────────────────────────────────────────────────────

@admin_bp.route('/metrics', methods=['GET'])
@jwt_required()
def get_metrics():
    """Return KPI metrics for admin dashboard."""
    result, status_code = admin_service.get_dashboard_metrics()
    return jsonify(result), status_code

# ─── Product Management ───────────────────────────────────────────────────────

@admin_bp.route('/products', methods=['GET'])
@jwt_required()
def list_products():
    """List paginated products for admin management."""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    search = request.args.get('search', '').strip()
    category = request.args.get('category', '').strip()
    result, status_code = product_service.list_admin_products(
        page=page, per_page=per_page, search=search, category=category
    )
    return jsonify(result), status_code

@admin_bp.route('/products', methods=['POST'])
@jwt_required()
def create_product():
    """Create a new product."""
    data = request.get_json()
    result, status_code = product_service.create_product(data)
    return jsonify(result), status_code

@admin_bp.route('/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id: int):
    """Update an existing product."""
    data = request.get_json()
    result, status_code = product_service.update_product(product_id, data)
    return jsonify(result), status_code

@admin_bp.route('/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id: int):
    """Delete a product."""
    result, status_code = product_service.delete_product(product_id)
    return jsonify(result), status_code

# ─── Image Upload ─────────────────────────────────────────────────────────────

@admin_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_image():
    """Upload product image to Cloudinary or local storage."""
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file field in request. Use key "file".'}), 400

    file = request.files['file']
    result, status_code = admin_service.upload_image(file, current_app.config)
    return jsonify(result), status_code

@admin_bp.route('/uploads/<path:filename>', methods=['GET'])
def serve_upload(filename: str):
    """Serve locally uploaded image files."""
    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    return send_from_directory(os.path.abspath(upload_dir), filename)

# ─── Order Management ─────────────────────────────────────────────────────────

@admin_bp.route('/orders', methods=['GET'])
@jwt_required()
def list_orders():
    """List orders with filtering and pagination."""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    status_filter = request.args.get('status', '').strip().lower()
    search = request.args.get('search', '').strip()
    date_from = request.args.get('date_from', '').strip()
    date_to = request.args.get('date_to', '').strip()

    result, status_code = order_service.get_admin_orders(
        page=page,
        per_page=per_page,
        status=status_filter,
        search=search,
        date_from=date_from,
        date_to=date_to
    )
    return jsonify(result), status_code

@admin_bp.route('/orders/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id: int):
    """Get full order details."""
    result, status_code = order_service.get_order(order_id)
    return jsonify(result), status_code

@admin_bp.route('/orders/<int:order_id>/status', methods=['PATCH'])
@jwt_required()
def update_order_status(order_id: int):
    """Update order fulfillment status or tracking."""
    data = request.get_json()
    result, status_code = order_service.update_order_status(order_id, data)
    return jsonify(result), status_code

# ─── Deployment & Infrastructure Status ───────────────────────────────────────

@admin_bp.route('/deployment-status', methods=['GET'])
@jwt_required()
def get_deployment_status():
    """Inspect backend infrastructure and external services status."""
    result, status_code = admin_service.get_system_status(current_app.config)
    return jsonify(result), status_code
