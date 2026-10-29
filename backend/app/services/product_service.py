from typing import Optional, Dict, Any, Tuple
from ..repositories.product_repository import ProductRepository

class ProductService:
    """
    Business logic service for catalog and admin product management.
    """
    def __init__(self, product_repo: Optional[ProductRepository] = None):
        self.product_repo = product_repo or ProductRepository()

    def list_products(
        self,
        category: Optional[str] = None,
        search: Optional[str] = None,
        sort: Optional[str] = 'default'
    ) -> Tuple[Dict[str, Any], int]:
        """Fetch and serialize products matching filters."""
        products = self.product_repo.get_filtered(category=category, search=search, sort=sort)
        return {
            'success': True,
            'count': len(products),
            'products': [p.to_dict() for p in products]
        }, 200

    def get_product_detail(self, product_id: int) -> Tuple[Dict[str, Any], int]:
        """Fetch single product details by ID."""
        product = self.product_repo.get_by_id(product_id)
        if not product:
            return {
                'success': False,
                'message': f"Product with ID {product_id} not found"
            }, 404
        return {
            'success': True,
            'product': product.to_dict()
        }, 200

    def get_categories(self) -> Tuple[Dict[str, Any], int]:
        """Return available boutique product categories."""
        categories = [
            {"id": "all", "name": "All", "description": "Browse complete modest collection"},
            {"id": "Suits & Kurtis", "name": "Suits & Kurtis", "description": "Lawn suits, farshi ghararas & daily kurtis"},
            {"id": "Hijab Bouquets", "name": "Hijab Bouquets", "description": "Handcrafted rose & silk hijab floral bouquets"},
            {"id": "Custom Hampers", "name": "Custom Hampers", "description": "Personalized bridal, Eid & gift trunks"}
        ]
        return {
            'success': True,
            'categories': categories
        }, 200

    def list_admin_products(
        self,
        page: int = 1,
        per_page: int = 20,
        search: str = '',
        category: str = ''
    ) -> Tuple[Dict[str, Any], int]:
        """Paginated product list for admin portal."""
        paginated = self.product_repo.get_paginated(
            page=page, per_page=per_page, search=search, category=category
        )
        return {
            'success': True,
            'products': [p.to_dict() for p in paginated.items],
            'total': paginated.total,
            'pages': paginated.pages,
            'current_page': page
        }, 200

    def create_product(self, data: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        """Validate and create a new product."""
        if not data:
            return {'success': False, 'message': 'JSON payload required'}, 400

        required = ['title', 'category', 'price', 'image_url']
        for field in required:
            if not data.get(field):
                return {'success': False, 'message': f'Missing required field: {field}'}, 400

        try:
            float(data['price'])
        except (ValueError, TypeError):
            return {'success': False, 'message': 'Price must be a valid number'}, 400

        product = self.product_repo.create(data)
        return {
            'success': True,
            'product': product.to_dict(),
            'message': f'Product "{product.title}" created successfully!'
        }, 201

    def update_product(self, product_id: int, data: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        """Validate and update product details."""
        if not data:
            return {'success': False, 'message': 'JSON payload required'}, 400

        product = self.product_repo.get_by_id(product_id)
        if not product:
            return {'success': False, 'message': 'Product not found'}, 404

        if 'price' in data:
            try:
                float(data['price'])
            except (ValueError, TypeError):
                return {'success': False, 'message': 'Price must be a valid number'}, 400

        updated = self.product_repo.update(product, data)
        return {
            'success': True,
            'product': updated.to_dict(),
            'message': f'Product "{updated.title}" updated successfully!'
        }, 200

    def delete_product(self, product_id: int) -> Tuple[Dict[str, Any], int]:
        """Delete an existing product."""
        product = self.product_repo.get_by_id(product_id)
        if not product:
            return {'success': False, 'message': 'Product not found'}, 404

        title = product.title
        self.product_repo.delete_product(product)
        return {'success': True, 'message': f'Product "{title}" deleted successfully.'}, 200
