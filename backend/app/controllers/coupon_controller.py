from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..services.coupon_service import CouponService

coupon_bp = Blueprint('coupons', __name__, url_prefix='/api')
coupon_service = CouponService()

# ─── Public: coupon validation during checkout ───────────────────────────────

@coupon_bp.route('/coupons/validate', methods=['POST'])
def validate_coupon():
    """Validate a coupon code against the current cart total."""
    data = request.get_json() or {}
    code = (data.get('code') or '').strip()
    order_amount = float(data.get('order_amount', 0))
    result, status_code = coupon_service.validate_coupon(code, order_amount)
    return jsonify(result), status_code

# ─── Admin-only CRUD ─────────────────────────────────────────────────────────

@coupon_bp.route('/admin/coupons', methods=['GET'])
@jwt_required()
def list_coupons():
    """List all coupon codes for admin management."""
    result, status_code = coupon_service.get_all()
    return jsonify(result), status_code

@coupon_bp.route('/admin/coupons', methods=['POST'])
@jwt_required()
def create_coupon():
    """Create a new coupon code."""
    data = request.get_json()
    result, status_code = coupon_service.create_coupon(data)
    return jsonify(result), status_code

@coupon_bp.route('/admin/coupons/<int:coupon_id>', methods=['PUT'])
@jwt_required()
def update_coupon(coupon_id: int):
    """Update a coupon."""
    data = request.get_json()
    result, status_code = coupon_service.update_coupon(coupon_id, data)
    return jsonify(result), status_code

@coupon_bp.route('/admin/coupons/<int:coupon_id>', methods=['DELETE'])
@jwt_required()
def delete_coupon(coupon_id: int):
    """Delete a coupon."""
    result, status_code = coupon_service.delete_coupon(coupon_id)
    return jsonify(result), status_code
