from flask import Blueprint, request, jsonify, current_app
from ..services.order_service import OrderService

orders_bp = Blueprint('orders', __name__, url_prefix='/api/orders')
order_service = OrderService()

@orders_bp.route('/create', methods=['POST'])
def create_order():
    """Accept cart items, initialize payment intent, and record pending order."""
    data = request.get_json()
    result, status_code = order_service.create_order(data, current_app.config)
    return jsonify(result), status_code

@orders_bp.route('/verify', methods=['POST'])
def verify_payment():
    """Verify payment signature and update order status to paid."""
    data = request.get_json()
    result, status_code = order_service.verify_payment(data, current_app.config)
    return jsonify(result), status_code

@orders_bp.route('/<int:order_id>', methods=['GET'])
def get_order(order_id: int):
    """Retrieve receipt details for an order."""
    result, status_code = order_service.get_order(order_id)
    return jsonify(result), status_code
