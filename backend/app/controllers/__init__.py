from .product_controller import products_bp
from .order_controller import orders_bp
from .auth_controller import auth_bp
from .admin_controller import admin_bp
from .category_controller import category_bp
from .coupon_controller import coupon_bp

__all__ = [
    'products_bp',
    'orders_bp',
    'auth_bp',
    'admin_bp',
    'category_bp',
    'coupon_bp',
]

