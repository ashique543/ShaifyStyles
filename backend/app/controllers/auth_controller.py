from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.auth_service import AuthService

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
auth_service = AuthService()

@auth_bp.route('/google', methods=['POST'])
def google_login():
    """Authenticate or register customer via Google OAuth."""
    data = request.get_json() or {}
    result, status_code = auth_service.google_login(data)
    return jsonify(result), status_code

@auth_bp.route('/otp/send', methods=['POST'])
def send_otp():
    """Send SMS OTP code to mobile phone number."""
    data = request.get_json() or {}
    raw_phone = str(data.get('phone') or '').strip()
    result, status_code = auth_service.send_otp(raw_phone, current_app.config)
    return jsonify(result), status_code

@auth_bp.route('/otp/verify', methods=['POST'])
def verify_otp():
    """Verify 6-digit OTP code and issue JWT."""
    data = request.get_json() or {}
    raw_phone = str(data.get('phone') or '').strip()
    otp_code = str(data.get('otp') or '').strip()
    customer_name = (data.get('name') or '').strip()
    result, status_code = auth_service.verify_otp(raw_phone, otp_code, customer_name, current_app.config)
    return jsonify(result), status_code

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Fetch profile of current authenticated customer."""
    user_id = int(get_jwt_identity())
    result, status_code = auth_service.get_user_profile(user_id)
    return jsonify(result), status_code

@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_current_user():
    """Update profile details of current customer."""
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    result, status_code = auth_service.update_user_profile(user_id, data)
    return jsonify(result), status_code

@auth_bp.route('/orders', methods=['GET'])
@jwt_required()
def get_user_orders():
    """Fetch order history for authenticated customer."""
    user_id = int(get_jwt_identity())
    result, status_code = auth_service.get_user_orders(user_id)
    return jsonify(result), status_code
