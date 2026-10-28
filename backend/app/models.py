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
    sizes = db.Column(db.Text, default='["Standard"]') # Stored as JSON string for broad SQLite/PostgreSQL compatibility
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


class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    items = db.relationship('OrderItem', back_populates='order', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
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
