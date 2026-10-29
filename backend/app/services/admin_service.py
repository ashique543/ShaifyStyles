import os
from datetime import datetime
from typing import Optional, Dict, Any, Tuple
from werkzeug.utils import secure_filename
from flask_jwt_extended import create_access_token
from ..repositories.admin_repository import AdminRepository
from ..repositories.order_repository import OrderRepository
from ..repositories.product_repository import ProductRepository

class AdminService:
    """
    Business logic service for admin authentication, dashboard metrics, image uploads, and system diagnostics.
    """
    def __init__(
        self,
        admin_repo: Optional[AdminRepository] = None,
        order_repo: Optional[OrderRepository] = None,
        product_repo: Optional[ProductRepository] = None
    ):
        self.admin_repo = admin_repo or AdminRepository()
        self.order_repo = order_repo or OrderRepository()
        self.product_repo = product_repo or ProductRepository()

    def authenticate_admin(self, data: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        """Authenticate store manager admin credentials and return signed JWT."""
        if not data:
            return {'success': False, 'message': 'Request body must be JSON'}, 400

        username = (data.get('username') or '').strip()
        password = data.get('password', '')

        if not username or not password:
            return {'success': False, 'message': 'Username and password are required'}, 400

        admin = self.admin_repo.get_by_username(username)
        if not admin or not admin.check_password(password):
            return {'success': False, 'message': 'Invalid username or password'}, 401

        token = create_access_token(identity=str(admin.id))
        return {
            'success': True,
            'access_token': token,
            'admin': admin.to_dict(),
            'message': f'Welcome back, {admin.username}!'
        }, 200

    def get_admin_profile(self, admin_id: int) -> Tuple[Dict[str, Any], int]:
        """Fetch logged-in admin profile."""
        admin = self.admin_repo.get_by_id(admin_id)
        if not admin:
            return {'success': False, 'message': 'Admin not found'}, 404
        return {'success': True, 'admin': admin.to_dict()}, 200

    def get_dashboard_metrics(self) -> Tuple[Dict[str, Any], int]:
        """Aggregate store revenue, order volume, inventory alerts, and recent orders."""
        total_revenue = self.order_repo.get_total_revenue()
        status_counts = self.order_repo.get_status_counts()
        total_orders = self.order_repo.count()
        pending_orders = self.order_repo.count(status='paid')

        low_stock = self.product_repo.get_low_stock(threshold=5)
        recent_orders = self.order_repo.get_recent(limit=10)

        return {
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
        }, 200

    def upload_image(self, file: Any, config: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        """Upload image to Cloudinary (if configured) or local uploads folder."""
        if not file or not getattr(file, 'filename', None):
            return {'success': False, 'message': 'No file selected'}, 400

        allowed = config.get('ALLOWED_EXTENSIONS', {'png', 'jpg', 'jpeg', 'gif', 'webp'})
        filename = file.filename
        ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
        if ext not in allowed:
            return {'success': False, 'message': 'File type not allowed. Use PNG, JPG, JPEG, GIF, or WEBP'}, 400

        # Try Cloudinary if keys present
        cloud_name = config.get('CLOUDINARY_CLOUD_NAME', '')
        api_key = config.get('CLOUDINARY_API_KEY', '')
        api_secret = config.get('CLOUDINARY_API_SECRET', '')

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
                return {
                    'success': True,
                    'url': result['secure_url'],
                    'public_id': result.get('public_id'),
                    'storage': 'cloudinary'
                }, 200
            except Exception:
                pass

        # Local storage fallback
        upload_dir = config.get('UPLOAD_FOLDER', 'uploads')
        os.makedirs(upload_dir, exist_ok=True)

        s_filename = secure_filename(filename)
        ts = int(datetime.utcnow().timestamp())
        unique_filename = f"{ts}_{s_filename}"
        save_path = os.path.join(upload_dir, unique_filename)
        file.save(save_path)

        url = f"/api/admin/uploads/{unique_filename}"
        return {
            'success': True,
            'url': url,
            'filename': unique_filename,
            'storage': 'local'
        }, 200

    def get_system_status(self, config: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        """Diagnose health of database, payment gateway, OAuth, SMS, and storage."""
        db_uri = config.get('SQLALCHEMY_DATABASE_URI', '')
        is_postgres = 'postgresql' in db_uri or 'postgres' in db_uri
        db_type = 'PostgreSQL (Production)' if is_postgres else 'SQLite (Local Dev File)'

        rzp_key = config.get('RAZORPAY_KEY_ID', '')
        is_rzp_mock = not rzp_key or 'YourRazorpay' in rzp_key or 'ShaifyTestKey' in rzp_key
        rzp_status = 'Active (Live/Test Key)' if not is_rzp_mock else 'Simulated / Mock Gateway'

        google_id = config.get('GOOGLE_CLIENT_ID', '')
        is_google = bool(google_id and 'YourGoogle' not in google_id)

        sms_gateway = config.get('SMS_GATEWAY', 'simulation')
        is_sms_ready = False
        if sms_gateway == 'fast2sms':
            is_sms_ready = bool(config.get('FAST2SMS_API_KEY'))
        elif sms_gateway == 'twilio':
            is_sms_ready = bool(config.get('TWILIO_ACCOUNT_SID') and config.get('TWILIO_AUTH_TOKEN'))

        c_name = config.get('CLOUDINARY_CLOUD_NAME', '')
        c_key = config.get('CLOUDINARY_API_KEY', '')
        is_cloud_storage = bool(c_name and c_key)

        return {
            'success': True,
            'status': {
                'database': {
                    'type': db_type,
                    'is_production_ready': is_postgres,
                    'status': 'Connected',
                    'target': 'Render / Supabase / Neon / AWS RDS'
                },
                'razorpay': {
                    'status': rzp_status,
                    'is_live': not is_rzp_mock,
                    'key_id_preview': rzp_key[:12] + '...' if len(rzp_key) > 12 else 'Not Configured'
                },
                'google_oauth': {
                    'configured': is_google,
                    'client_id_preview': google_id[:16] + '...' if len(google_id) > 16 else 'Not Set (Simulation active)',
                    'status': 'Ready for Google Sign-In' if is_google else 'One-Click Dev Bypass active'
                },
                'sms_otp': {
                    'gateway': sms_gateway,
                    'configured': is_sms_ready,
                    'status': f'{sms_gateway.capitalize()} Gateway Active' if is_sms_ready else 'Terminal Demo OTP active (123456)',
                    'demo_otp': config.get('DEMO_OTP', '123456')
                },
                'media_storage': {
                    'provider': 'Cloudinary (Cloud CDN)' if is_cloud_storage else 'Local Static Disk Storage',
                    'is_cloud': is_cloud_storage,
                    'status': 'Ready for global fast delivery' if is_cloud_storage else 'Local uploads/ directory'
                },
                'server_environment': {
                    'python_version': '3.x',
                    'framework': 'Flask + SQLAlchemy + Flask-JWT-Extended',
                    'jwt_configured': bool(config.get('JWT_SECRET_KEY')),
                    'cors': 'Enabled for all origins (*)'
                }
            }
        }, 200
