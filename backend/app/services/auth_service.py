import base64
import json
import random
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from flask_jwt_extended import create_access_token
from ..repositories.user_repository import UserRepository
from ..repositories.otp_repository import OTPRepository
from ..repositories.order_repository import OrderRepository

class AuthService:
    """
    Business logic service for customer authentication, SMS OTP verification, and profile management.
    """
    def __init__(
        self,
        user_repo: Optional[UserRepository] = None,
        otp_repo: Optional[OTPRepository] = None,
        order_repo: Optional[OrderRepository] = None
    ):
        self.user_repo = user_repo or UserRepository()
        self.otp_repo = otp_repo or OTPRepository()
        self.order_repo = order_repo or OrderRepository()

    def _dispatch_sms_otp(self, phone: str, otp_code: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Dispatches SMS OTP via configured gateway (simulation, Fast2SMS, or Twilio)."""
        gateway = config.get('SMS_GATEWAY', 'simulation')
        is_sms_configured = config.get('is_sms_configured', False)

        if gateway == 'simulation' or not is_sms_configured:
            print("\n=======================================================")
            print(f"[DEMO SMS OTP] To: +91-{phone} | Code: {otp_code}")
            print("=======================================================\n")
            return {'success': True, 'mode': 'simulation', 'demo_otp': otp_code}

        if gateway == 'fast2sms':
            try:
                import urllib.request
                api_key = config.get('FAST2SMS_API_KEY')
                url = f"https://www.fast2sms.com/dev/bulkV2?authorization={api_key}&variables_values={otp_code}&route=otp&numbers={phone}"
                req = urllib.request.Request(url, headers={'cache-control': 'no-cache'})
                with urllib.request.urlopen(req, timeout=5) as resp:
                    result = json.loads(resp.read().decode('utf-8'))
                    return {'success': result.get('return', False), 'mode': 'fast2sms'}
            except Exception as e:
                return {'success': False, 'error': str(e), 'demo_otp': otp_code}

        if gateway == 'twilio':
            try:
                import urllib.request
                import urllib.parse
                account_sid = config.get('TWILIO_ACCOUNT_SID')
                auth_token = config.get('TWILIO_AUTH_TOKEN')
                from_phone = config.get('TWILIO_PHONE_NUMBER')

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
                return {'success': False, 'error': str(e), 'demo_otp': otp_code}

        return {'success': True, 'mode': 'simulation', 'demo_otp': otp_code}

    def google_login(self, data: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        """Authenticate or register a customer using Google OAuth credential or payload."""
        email = (data.get('email') or '').strip().lower()
        name = (data.get('name') or '').strip() or 'Boutique Shopper'
        google_id = (data.get('google_id') or '').strip()
        avatar_url = data.get('avatar_url') or data.get('picture')

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
            except Exception:
                pass

        if not email and not google_id:
            return {'success': False, 'message': 'Google email or user ID is required'}, 400

        user = None
        if google_id:
            user = self.user_repo.get_by_google_id(google_id)
        if not user and email:
            user = self.user_repo.get_by_email(email)

        if user:
            update_fields = {}
            if google_id and not user.google_id:
                update_fields['google_id'] = google_id
            if avatar_url and not user.avatar_url:
                update_fields['avatar_url'] = avatar_url
            if update_fields:
                self.user_repo.update(user, update_fields)
            self.user_repo.update_last_login(user)
        else:
            user = self.user_repo.create({
                'name': name,
                'email': email,
                'google_id': google_id,
                'avatar_url': avatar_url,
                'auth_provider': 'google'
            })

        token = create_access_token(
            identity=str(user.id),
            additional_claims={'role': 'customer', 'user_id': user.id, 'name': user.name}
        )

        return {
            'success': True,
            'access_token': token,
            'user': user.to_dict(),
            'message': f"Welcome to Shaify Styles, {user.name}!"
        }, 200

    def send_otp(self, raw_phone: str, config: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        """Generate, store, and dispatch SMS OTP code to customer phone."""
        phone_digits = ''.join(c for c in str(raw_phone or '') if c.isdigit())
        if len(phone_digits) >= 10:
            phone = phone_digits[-10:]
        else:
            return {'success': False, 'message': 'Please enter a valid 10-digit mobile number'}, 400

        is_sms_configured = config.get('is_sms_configured', False)
        demo_otp = config.get('DEMO_OTP', '123456')

        if is_sms_configured:
            otp_code = str(random.randint(100000, 999999))
        else:
            otp_code = demo_otp

        expiry_mins = config.get('OTP_EXPIRY_MINUTES', 10)
        expires_at = datetime.utcnow() + timedelta(minutes=expiry_mins)

        # Invalidate old OTPs
        self.otp_repo.invalidate_pending(phone)

        # Store new record
        self.otp_repo.create_otp(phone=phone, otp_code=otp_code, expires_at=expires_at)

        # Dispatch via gateway
        self._dispatch_sms_otp(phone, otp_code, config)

        return {
            'success': True,
            'message': f"Verification code sent to +91-{phone}",
            'phone': phone,
            'expires_in_seconds': expiry_mins * 60,
            'is_simulation': not is_sms_configured,
            'demo_otp': otp_code if (not is_sms_configured or config.get('SMS_GATEWAY') == 'simulation') else None
        }, 200

    def verify_otp(
        self,
        raw_phone: str,
        otp_code: str,
        customer_name: str,
        config: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], int]:
        """Verify OTP, authenticate or register customer, and issue JWT."""
        phone_digits = ''.join(c for c in str(raw_phone or '') if c.isdigit())
        if len(phone_digits) >= 10:
            phone = phone_digits[-10:]
        else:
            return {'success': False, 'message': 'Invalid phone number format'}, 400

        otp_code = str(otp_code or '').strip()
        if not otp_code:
            return {'success': False, 'message': 'Please enter the 6-digit OTP'}, 400

        is_master_demo = (otp_code == config.get('DEMO_OTP', '123456'))
        record = self.otp_repo.get_latest_unverified(phone)

        is_valid = False
        if record and record.otp_code == otp_code and record.expires_at > datetime.utcnow():
            is_valid = True
            self.otp_repo.mark_verified(record)
        elif is_master_demo:
            is_valid = True
            if record:
                self.otp_repo.mark_verified(record)

        if not is_valid:
            return {'success': False, 'message': 'Incorrect or expired OTP code. Please try again.'}, 400

        user = self.user_repo.get_by_phone(phone)
        if not user:
            user = self.user_repo.create({
                'name': customer_name or f"Shopper +91-{phone[-4:]}",
                'phone': phone,
                'auth_provider': 'phone'
            })
        else:
            if customer_name and user.name.startswith('Shopper +91-'):
                self.user_repo.update(user, {'name': customer_name})
            self.user_repo.update_last_login(user)

        token = create_access_token(
            identity=str(user.id),
            additional_claims={'role': 'customer', 'user_id': user.id, 'name': user.name}
        )

        return {
            'success': True,
            'access_token': token,
            'user': user.to_dict(),
            'message': f"Welcome back, {user.name}!"
        }, 200

    def get_user_profile(self, user_id: int) -> Tuple[Dict[str, Any], int]:
        """Retrieve customer profile."""
        user = self.user_repo.get_by_id(user_id)
        if not user:
            return {'success': False, 'message': 'User profile not found'}, 404
        return {'success': True, 'user': user.to_dict()}, 200

    def update_user_profile(self, user_id: int, data: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        """Update customer personal profile."""
        user = self.user_repo.get_by_id(user_id)
        if not user:
            return {'success': False, 'message': 'User not found'}, 404

        update_fields = {}
        if 'name' in data and data['name'].strip():
            update_fields['name'] = data['name'].strip()
        if 'email' in data:
            update_fields['email'] = data['email'].strip().lower() or None
        if 'default_address' in data:
            update_fields['default_address'] = data['default_address'].strip()

        updated_user = self.user_repo.update(user, update_fields)
        return {
            'success': True,
            'user': updated_user.to_dict(),
            'message': 'Profile updated successfully'
        }, 200

    def get_user_orders(self, user_id: int) -> Tuple[Dict[str, Any], int]:
        """Retrieve all previous orders placed by this customer."""
        user = self.user_repo.get_by_id(user_id)
        if not user:
            return {'success': False, 'message': 'User not found'}, 404

        orders = self.order_repo.get_user_orders(user.id, user.phone, user.email)
        return {
            'success': True,
            'orders': [o.to_dict() for o in orders],
            'total': len(orders)
        }, 200
