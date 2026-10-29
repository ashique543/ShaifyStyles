"""
Routes package backwards-compatibility alias.
Imports and re-exports blueprints from app.controllers.
"""
from ..controllers import products_bp, orders_bp, auth_bp, admin_bp

__all__ = ['products_bp', 'orders_bp', 'auth_bp', 'admin_bp']
