from flask import Blueprint, request, jsonify
from ..services.product_service import ProductService

products_bp = Blueprint('products', __name__, url_prefix='/api/products')
product_service = ProductService()

@products_bp.route('', methods=['GET'])
def get_products():
    """List all products with optional category, search, and sorting filters."""
    category = request.args.get('category')
    search = request.args.get('search', '').strip()
    sort = request.args.get('sort', 'default')
    
    result, status_code = product_service.list_products(category=category, search=search, sort=sort)
    return jsonify(result), status_code

@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id: int):
    """Retrieve detailed information for a specific product."""
    result, status_code = product_service.get_product_detail(product_id)
    return jsonify(result), status_code

@products_bp.route('/categories', methods=['GET'])
def get_categories():
    """Return available product categories."""
    result, status_code = product_service.get_categories()
    return jsonify(result), status_code
