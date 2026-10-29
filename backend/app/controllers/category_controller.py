from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..services.category_service import CategoryService

category_bp = Blueprint('categories', __name__, url_prefix='/api')
category_service = CategoryService()

# ─── Public: Used by the storefront to fetch category pills ──────────────────

@category_bp.route('/categories', methods=['GET'])
def list_categories():
    """Return active categories for the storefront filter bar."""
    active_only = request.args.get('active_only', 'true').lower() == 'true'
    result, status_code = category_service.get_all_categories(active_only=active_only)
    return jsonify(result), status_code

# ─── Admin-only CRUD ─────────────────────────────────────────────────────────

@category_bp.route('/admin/categories', methods=['GET'])
@jwt_required()
def admin_list_categories():
    """Return all categories (including inactive) for admin panel."""
    result, status_code = category_service.get_admin_categories()
    return jsonify(result), status_code

@category_bp.route('/admin/categories', methods=['POST'])
@jwt_required()
def create_category():
    """Create a new product category."""
    data = request.get_json()
    result, status_code = category_service.create_category(data)
    return jsonify(result), status_code

@category_bp.route('/admin/categories/<int:category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id: int):
    """Update an existing category."""
    data = request.get_json()
    result, status_code = category_service.update_category(category_id, data)
    return jsonify(result), status_code

@category_bp.route('/admin/categories/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id: int):
    """Delete a category."""
    result, status_code = category_service.delete_category(category_id)
    return jsonify(result), status_code
