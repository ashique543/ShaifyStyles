from .product_controller import products_bp
from .order_controller import orders_bp
from .auth_controller import auth_bp
from .admin_controller import admin_bp

__all__ = [
    'products_bp',
    'orders_bp',
    'auth_bp',
    'admin_bp',
]
