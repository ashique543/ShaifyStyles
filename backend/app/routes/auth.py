import os
import random
import json
import base64
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from ..models import db, User, OTPStore, Order

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


# ─── Helper: Send SMS OTP ───────────────────────────────────────────────────
def send_sms_otp(phone: str, otp_code: str) -> dict:
    """Dispatches SMS OTP via configured gateway (simulation, Fast2SMS, or Twilio)."""
    gateway = current_app.config.get('SMS_GATEWAY', 'simulation')

    if gateway == 'simulation' or not current_app.config.get('is_sms_configured'):
        print(f"\n=======================================================")
        print(f"[DEMO SMS OTP] To: +91-{phone} | Code: {otp_code}")
        print(f"=======================================================\n")
        return {'success': True, 'mode': 'simulation', 'demo_otp': otp_code}

    if gateway == 'fast2sms':
        try:
            import urllib.request
            api_key = current_app.config.get('FAST2SMS_API_KEY')
            url = f"https://www.fast2sms.com/dev/bulkV2?authorization={api_key}&variables_values={otp_code}&route=otp&numbers={phone}"
            req = urllib.request.Request(url, headers={'cache-control': 'no-cache'})
            with urllib.request.urlopen(req, timeout=5) as resp:
                result = json.loads(resp.read().decode('utf-8'))
                return {'success': result.get('return', False), 'mode': 'fast2sms'}
        except Exception as e:
            current_app.logger.warning(f"Fast2SMS error: {e}")
            return {'success': False, 'error': str(e), 'demo_otp': otp_code}

    if gateway == 'twilio':
        try:
            import urllib.request
            account_sid = current_app.config.get('TWILIO_ACCOUNT_SID')
            auth_token = current_app.config.get('TWILIO_AUTH_TOKEN')
            from_phone = current_app.config.get('TWILIO_PHONE_NUMBER')

            url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
            to_phone = f"+91{phone}" if not phone.startswith('+') else phone
            body_msg = f"Your Shaify Styles boutique verification code is: {otp_code}. Valid for 10 minutes."

            data = f"To={urllib.parse.quote(to_phone)}&From={urllib.parse.quote(from_phone)}&Body={urllib.parse.quote(body_msg)}"
            req = urllib.request.Request(url, data=data.encode('utf-8'), method='POST')
            auth_str = base64.b64encode(f"{account_sid}:{auth_token}".encode('utf-8')).decode('utf-8')
            req.add_header('Authorization', f"Basic {auth_str}")
            req.add_header('Content-Type', 'application/x-www-form-urlencoded')

            with urllib.request.urlopen(req, timeout=5) as resp:
                return {'success': resp.status in (200, 201), 'mode': 'twilio'}
        except Exception as e:
            current_app.logger.warning(f"Twilio error: {e}")
            return {'success': False, 'error': str(e), 'demo_otp': otp_code}

    return {'success': True, 'mode': 'simulation', 'demo_otp': otp_code}


# ─── 1. Google Sign-In ───────────────────────────────────────────────────────
@auth_bp.route('/google', methods=['POST'])
def google_login():
    """Authenticates or signs up a customer using Google Sign-In."""
    data = request.get_json() or {}
    
    email = (data.get('email') or '').strip().lower()
    name = (data.get('name') or '').strip() or 'Boutique Shopper'
    google_id = (data.get('google_id') or '').strip()
    avatar_url = data.get('avatar_url') or data.get('picture')

    # If frontend provided raw JWT credential token, attempt to parse payload safely
    credential = data.get('credential')
    if credential and (not email or not google_id):
        try:
            parts = credential.split('.')
            if len(parts) >= 2:
                payload = json.loads(base64.urlsafe_b64decode(parts[1] + '==').decode('utf-8'))
                email = payload.get('email', email).lower()
                name = payload.get('name', name)
                google_id = payload.get('sub', google_id)
                avatar_url = payload.get('picture', avatar_url)
        except Exception as e:
            current_app.logger.warning(f"Google token decode note: {e}")

    if not email and not google_id:
        return jsonify({'success': False, 'message': 'Google email or user ID is required'}), 400

    # Look up existing user by google_id or email
    user = None
    if google_id:
        user = User.query.filter_by(google_id=google_id).first()
    if not user and email:
        user = User.query.filter_by(email=email).first()

    if user:
        # Update details & last login
        if google_id and not user.google_id:
            user.google_id = google_id
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
        user.last_login = datetime.utcnow()
    else:
        # Create new customer user
        user = User(
            name=name,
            email=email,
            google_id=google_id,
            avatar_url=avatar_url,
            auth_provider='google'
        )
        db.session.add(user)

    db.session.commit()

    # Generate customer JWT token
    token = create_access_token(
        identity=str(user.id),
        additional_claims={'role': 'customer', 'user_id': user.id, 'name': user.name}
    )

    return jsonify({
        'success': True,
        'access_token': token,
        'user': user.to_dict(),
        'message': f"Welcome to Shaify Styles, {user.name}!"
    }), 200


# ─── 2. Send Mobile Phone OTP ───────────────────────────────────────────────
@auth_bp.route('/otp/send', methods=['POST'])
def send_otp():
    """Generates and dispatches a 6-digit OTP code to the provided mobile number."""
    data = request.get_json() or {}
    raw_phone = str(data.get('phone') or '').strip()

    # Clean phone (extract digits, keep last 10 digits for Indian mobiles)
    phone_digits = ''.join(c for c in raw_phone if c.isdigit())
    if len(phone_digits) >= 10:
        phone = phone_digits[-10:]
    else:
        return jsonify({'success': False, 'message': 'Please enter a valid 10-digit mobile number'}), 400

    # Determine OTP code: demo OTP if simulation or not configured, or random 6 digits
    demo_otp = current_app.config.get('DEMO_OTP', '123456')
    if current_app.config.get('is_sms_configured'):
        otp_code = str(random.randint(100000, 999999))
    else:
        otp_code = demo_otp

    expiry_mins = current_app.config.get('OTP_EXPIRY_MINUTES', 10)
    expires_at = datetime.utcnow() + timedelta(minutes=expiry_mins)

    # Invalidate old OTPs for this phone
    OTPStore.query.filter_by(phone=phone, verified=False).delete()

    # Store new OTP
    otp_record = OTPStore(phone=phone, otp_code=otp_code, expires_at=expires_at)
    db.session.add(otp_record)
    db.session.commit()

    # Dispatch via SMS gateway / print to console
    sms_result = send_sms_otp(phone, otp_code)

    return jsonify({
        'success': True,
        'message': f"Verification code sent to +91-{phone}",
        'phone': phone,
        'expires_in_seconds': expiry_mins * 60,
        'is_simulation': not current_app.config.get('is_sms_configured'),
        'demo_otp': otp_code if (not current_app.config.get('is_sms_configured') or current_app.config.get('SMS_GATEWAY') == 'simulation') else None
    }), 200


# ─── 3. Verify Mobile Phone OTP ─────────────────────────────────────────────
@auth_bp.route('/otp/verify', methods=['POST'])
def verify_otp():
    """Verifies the 6-digit OTP code and logs in or registers the customer."""
    data = request.get_json() or {}
    raw_phone = str(data.get('phone') or '').strip()
    otp_code = str(data.get('otp') or '').strip()
    customer_name = (data.get('name') or '').strip()

    phone_digits = ''.join(c for c in raw_phone if c.isdigit())
    if len(phone_digits) >= 10:
        phone = phone_digits[-10:]
    else:
        return jsonify({'success': False, 'message': 'Invalid phone number format'}), 400

    if not otp_code:
        return jsonify({'success': False, 'message': 'Please enter the 6-digit OTP'}), 400

    # Master dev bypass: if demo_otp matches
    is_master_demo = (otp_code == current_app.config.get('DEMO_OTP', '123456'))

    record = OTPStore.query.filter_by(phone=phone, verified=False).order_by(OTPStore.id.desc()).first()

    is_valid = False
    if record and record.otp_code == otp_code and record.expires_at > datetime.utcnow():
        is_valid = True
        record.verified = True
    elif is_master_demo:
        is_valid = True
        if record:
            record.verified = True

    if not is_valid:
        return jsonify({'success': False, 'message': 'Incorrect or expired OTP code. Please try again.'}), 400

    # Find or create User by phone
    user = User.query.filter_by(phone=phone).first()
    if not user:
        user = User(
            name=customer_name or f"Shopper +91-{phone[-4:]}",
            phone=phone,
            auth_provider='phone'
        )
        db.session.add(user)
    else:
        if customer_name and user.name.startswith('Shopper +91-'):
            user.name = customer_name
        user.last_login = datetime.utcnow()

    db.session.commit()

    token = create_access_token(
        identity=str(user.id),
        additional_claims={'role': 'customer', 'user_id': user.id, 'name': user.name}
    )

    return jsonify({
        'success': True,
        'access_token': token,
        'user': user.to_dict(),
        'message': f"Welcome back, {user.name}!"
    }), 200


# ─── 4. Current Customer Profile ─────────────────────────────────────────────
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Fetches the authenticated customer user profile."""
    identity = get_jwt_identity()
    user = db.session.get(User, int(identity))
    if not user:
        return jsonify({'success': False, 'message': 'User profile not found'}), 404
    return jsonify({'success': True, 'user': user.to_dict()}), 200


@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_current_user():
    """Updates the customer's profile info (name, email, default address)."""
    identity = get_jwt_identity()
    user = db.session.get(User, int(identity))
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    data = request.get_json() or {}
    if 'name' in data and data['name'].strip():
        user.name = data['name'].strip()
    if 'email' in data:
        user.email = data['email'].strip().lower() or None
    if 'default_address' in data:
        user.default_address = data['default_address'].strip()

    db.session.commit()
    return jsonify({'success': True, 'user': user.to_dict(), 'message': 'Profile updated successfully'}), 200


# ─── 5. Customer Order History ───────────────────────────────────────────────
@auth_bp.route('/orders', methods=['GET'])
@jwt_required()
def get_user_orders():
    """Fetches past boutique orders placed by this customer."""
    identity = get_jwt_identity()
    user = db.session.get(User, int(identity))
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    # Match orders by user_id OR phone OR email
    query_filters = [Order.user_id == user.id]
    if user.phone:
        query_filters.append(Order.customer_phone.like(f"%{user.phone}%"))
    if user.email:
        query_filters.append(Order.customer_email == user.email)

    orders = Order.query.filter(db.or_(*query_filters)).order_by(Order.created_at.desc()).all()
    return jsonify({
        'success': True,
        'orders': [o.to_dict() for o in orders],
        'total': len(orders)
    }), 200
