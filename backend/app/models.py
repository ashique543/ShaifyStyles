import json
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

db = SQLAlchemy()
bcrypt = Bcrypt()



class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(100), nullable=False, index=True) # "Modest Fashion", "Bouquets", "Hampers"
    price = db.Column(db.Float, nullable=False)
    discounted_price = db.Column(db.Float, nullable=True)
    image_url = db.Column(db.Text, nullable=False)
    stock = db.Column(db.Integer, default=10, nullable=False)
    sizes = db.Column(db.Text, default='["Standard"]') # Stored as JSON string
    badge = db.Column(db.String(50), nullable=True) # e.g. "Bestseller", "New Launch", "Handmade"
    fabric = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship to order items
    order_items = db.relationship('OrderItem', back_populates='product', cascade='all, delete-orphan')

    @property
    def sizes_list(self):
        if not self.sizes:
            return ["Standard"]
        try:
            return json.loads(self.sizes)
        except Exception:
            return [s.strip() for s in self.sizes.split(',') if s.strip()]

    @sizes_list.setter
    def sizes_list(self, val):
        if isinstance(val, list):
            self.sizes = json.dumps(val)
        elif isinstance(val, str):
            self.sizes = json.dumps([val])

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'price': self.price,
            'discounted_price': self.discounted_price,
            'image_url': self.image_url,
            'stock': self.stock,
            'sizes': self.sizes_list,
            'badge': self.badge,
            'fabric': self.fabric,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class User(db.Model):
    """Customer user account for boutique shoppers supporting Google & Mobile OTP login."""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, default='Boutique Shopper')
    email = db.Column(db.String(200), unique=True, nullable=True, index=True)
    phone = db.Column(db.String(50), unique=True, nullable=True, index=True)
    avatar_url = db.Column(db.Text, nullable=True)
    google_id = db.Column(db.String(255), unique=True, nullable=True, index=True)
    auth_provider = db.Column(db.String(50), default='phone', nullable=False) # 'google', 'phone'
    default_address = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, default=datetime.utcnow)

    # Orders relationship
    orders = db.relationship('Order', back_populates='user', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'avatar_url': self.avatar_url,
            'auth_provider': self.auth_provider,
            'default_address': self.default_address,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }


class OTPStore(db.Model):
    """Store for mobile phone OTP verification codes with expiry."""
    __tablename__ = 'otp_store'

    id = db.Column(db.Integer, primary_key=True)
    phone = db.Column(db.String(50), nullable=False, index=True)
    otp_code = db.Column(db.String(10), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    verified = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    razorpay_order_id = db.Column(db.String(100), nullable=True, index=True)
    razorpay_payment_id = db.Column(db.String(100), nullable=True)
    razorpay_signature = db.Column(db.String(255), nullable=True)
    customer_name = db.Column(db.String(200), nullable=False)
    customer_email = db.Column(db.String(200), nullable=False)
    customer_phone = db.Column(db.String(50), nullable=False)
    shipping_address = db.Column(db.Text, nullable=False)
    total_amount = db.Column(db.Float, nullable=False) # INR
    status = db.Column(db.String(50), default='created', nullable=False) # created, paid, processing, shipped, delivered, cancelled
    notes = db.Column(db.Text, nullable=True)
    tracking_carrier = db.Column(db.String(100), nullable=True)
    tracking_number = db.Column(db.String(200), nullable=True)
    coupon_code = db.Column(db.String(50), nullable=True)
    discount_amount = db.Column(db.Float, default=0.0, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', back_populates='orders')
    items = db.relationship('OrderItem', back_populates='order', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'razorpay_order_id': self.razorpay_order_id,
            'razorpay_payment_id': self.razorpay_payment_id,
            'customer_name': self.customer_name,
            'customer_email': self.customer_email,
            'customer_phone': self.customer_phone,
            'shipping_address': self.shipping_address,
            'total_amount': self.total_amount,
            'status': self.status,
            'notes': self.notes,
            'tracking_carrier': self.tracking_carrier,
            'tracking_number': self.tracking_number,
            'coupon_code': self.coupon_code,
            'discount_amount': self.discount_amount or 0.0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'items': [item.to_dict() for item in self.items]
        }


class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1, nullable=False)
    size = db.Column(db.String(50), default='Standard', nullable=True)
    price = db.Column(db.Float, nullable=False) # price at the time of purchase

    # Relationships
    order = db.relationship('Order', back_populates='items')
    product = db.relationship('Product', back_populates='order_items')

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'product_id': self.product_id,
            'product_title': self.product.title if self.product else 'Product',
            'product_image': self.product.image_url if self.product else '',
            'quantity': self.quantity,
            'size': self.size,
            'price': self.price,
            'subtotal': round(self.price * self.quantity, 2)
        }


class Admin(db.Model):
    """Admin user model for the Shaify Styles store owner panel."""
    __tablename__ = 'admins'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(200), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password: str) -> None:
        """Hash and store the password."""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password: str) -> bool:
        """Verify a plaintext password against the stored hash."""
        return bcrypt.check_password_hash(self.password_hash, password)

    @classmethod
    def create_admin(cls, username: str, email: str, password: str) -> 'Admin':
        """Factory method: creates, hashes, and returns an Admin instance (not yet committed)."""
        admin = cls(username=username, email=email)
        admin.set_password(password)
        return admin

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Category(db.Model):
    """Dynamic product categories managed from the admin panel."""
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    icon = db.Column(db.String(10), nullable=True)   # emoji icon e.g. 🌹
    sort_order = db.Column(db.Integer, default=0, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'icon': self.icon,
            'sort_order': self.sort_order,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Coupon(db.Model):
    """Discount coupons and promo codes for the boutique store."""
    __tablename__ = 'coupons'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    description = db.Column(db.String(255), nullable=True)
    discount_type = db.Column(db.String(20), nullable=False, default='percentage')  # 'percentage' | 'flat'
    discount_value = db.Column(db.Float, nullable=False)  # e.g. 10 (10%) or 100 (₹100 off)
    min_order_amount = db.Column(db.Float, default=0.0, nullable=True)
    max_uses = db.Column(db.Integer, nullable=True)       # None = unlimited
    used_count = db.Column(db.Integer, default=0, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'description': self.description,
            'discount_type': self.discount_type,
            'discount_value': self.discount_value,
            'min_order_amount': self.min_order_amount or 0.0,
            'max_uses': self.max_uses,
            'used_count': self.used_count,
            'is_active': self.is_active,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
