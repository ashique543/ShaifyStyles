import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'shaify_styles_boutique_secret_key_2025')
    
    # Database URL with fallback to local SQLite
    db_url = os.getenv('DATABASE_URL', 'sqlite:///shaifystyles.db')
    # Render and some providers provide postgres:// instead of postgresql://
    if db_url and db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)
    
    SQLALCHEMY_DATABASE_URI = db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Razorpay Keys
    RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID', 'rzp_test_ShaifyTestKey123')
    RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET', 'ShaifySecretKeyMock2025')
    
    # Brand Information
    BRAND_NAME = "Shaify Styles"
    BRAND_INSTAGRAM = os.getenv('BRAND_INSTAGRAM', "@shaifystyles_")
    WHATSAPP_PHONE = os.getenv('WHATSAPP_PHONE', "919876543210")

    # --- JWT Authentication ---
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'shaify_admin_jwt_super_secret_2025_change_in_prod')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES_HOURS', '720')) * 3600  # 30 days for customer/admin convenience

    # --- Google Sign-In OAuth ---
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', '')

    # --- Mobile Phone OTP Configuration ---
    SMS_GATEWAY = os.getenv('SMS_GATEWAY', 'simulation') # 'simulation', 'fast2sms', 'twilio'
    FAST2SMS_API_KEY = os.getenv('FAST2SMS_API_KEY', '')
    TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
    TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
    TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER', '')
    OTP_EXPIRY_MINUTES = int(os.getenv('OTP_EXPIRY_MINUTES', '10'))
    DEMO_OTP = os.getenv('DEMO_OTP', '123456')

    # --- Image Upload Configuration ---
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'uploads')
    MAX_CONTENT_LENGTH = 8 * 1024 * 1024  # 8 MB max upload size
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

    # Cloudinary (optional – set these env vars to use cloud storage instead of local disk)
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME', '')
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY', '')
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET', '')

    @property
    def is_google_configured(self):
        return bool(self.GOOGLE_CLIENT_ID and not 'YourGoogle' in self.GOOGLE_CLIENT_ID)

    @property
    def is_sms_configured(self):
        if self.SMS_GATEWAY == 'fast2sms':
            return bool(self.FAST2SMS_API_KEY)
        elif self.SMS_GATEWAY == 'twilio':
            return bool(self.TWILIO_ACCOUNT_SID and self.TWILIO_AUTH_TOKEN and self.TWILIO_PHONE_NUMBER)
        return False

    @property
    def use_cloudinary(self):
        return bool(self.CLOUDINARY_CLOUD_NAME and self.CLOUDINARY_API_KEY and self.CLOUDINARY_API_SECRET)

    @property
    def is_mock_razorpay(self):
        return (
            not self.RAZORPAY_KEY_ID
            or 'YourRazorpay' in self.RAZORPAY_KEY_ID
            or 'ShaifyTestKey' in self.RAZORPAY_KEY_ID
        )

    @property
    def is_postgres(self):
        return bool(self.SQLALCHEMY_DATABASE_URI and 'postgresql' in self.SQLALCHEMY_DATABASE_URI)
