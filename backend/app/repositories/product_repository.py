import json
from typing import Optional, List, Dict, Any
from sqlalchemy import or_, func
from .base_repository import BaseRepository
from ..models import db, Product

class ProductRepository(BaseRepository[Product]):
    """
    SQLAlchemy repository handling all product database operations.
    """
    def __init__(self):
        super().__init__(Product)

    def get_filtered(
        self,
        category: Optional[str] = None,
        search: Optional[str] = None,
        sort: Optional[str] = 'default'
    ) -> List[Product]:
        """Fetch products matching category, search, and sorting criteria."""
        query = Product.query

        if category and category.lower() not in ['all', '']:
            query = query.filter(Product.category.ilike(f"%{category}%"))

        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Product.title.ilike(search_term),
                    Product.description.ilike(search_term),
                    Product.fabric.ilike(search_term),
                    Product.category.ilike(search_term)
                )
            )

        if sort == 'price_asc':
            query = query.order_by(func.coalesce(Product.discounted_price, Product.price).asc())
        elif sort == 'price_desc':
            query = query.order_by(func.coalesce(Product.discounted_price, Product.price).desc())
        elif sort == 'newest':
            query = query.order_by(Product.created_at.desc())
        else:
            query = query.order_by(Product.id.asc())

        return query.all()

    def get_paginated(
        self,
        page: int = 1,
        per_page: int = 20,
        search: Optional[str] = None,
        category: Optional[str] = None
    ):
        """Fetch paginated products for admin management."""
        query = Product.query

        if search:
            q = f"%{search.strip()}%"
            query = query.filter(or_(Product.title.ilike(q), Product.description.ilike(q)))

        if category and category.lower() not in ['all', '']:
            query = query.filter(Product.category.ilike(f"%{category.strip()}%"))

        return query.order_by(Product.id.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

    def create(self, product_data: Dict[str, Any]) -> Product:
        """Create and persist a new product."""
        sizes = product_data.get('sizes', ['Standard'])
        if isinstance(sizes, list):
            sizes_json = json.dumps(sizes)
        elif isinstance(sizes, str):
            parsed = [s.strip() for s in sizes.split(',') if s.strip()]
            sizes_json = json.dumps(parsed)
        else:
            sizes_json = json.dumps(['Standard'])

        product = Product(
            title=product_data['title'].strip(),
            description=product_data.get('description', '').strip(),
            category=product_data['category'].strip(),
            price=float(product_data['price']),
            discounted_price=float(product_data['discounted_price']) if product_data.get('discounted_price') else None,
            image_url=product_data['image_url'].strip(),
            stock=int(product_data.get('stock', 10)),
            sizes=sizes_json,
            badge=product_data.get('badge', '').strip() or None if product_data.get('badge') else None,
            fabric=product_data.get('fabric', '').strip() or None if product_data.get('fabric') else None,
        )
        self.add(product)
        self.commit()
        return product

    def update(self, product: Product, update_data: Dict[str, Any]) -> Product:
        """Update existing product fields and commit."""
        if 'title' in update_data:
            product.title = update_data['title'].strip()
        if 'description' in update_data:
            product.description = update_data['description'].strip()
        if 'category' in update_data:
            product.category = update_data['category'].strip()
        if 'price' in update_data:
            product.price = float(update_data['price'])
        if 'discounted_price' in update_data:
            product.discounted_price = float(update_data['discounted_price']) if update_data['discounted_price'] else None
        if 'image_url' in update_data:
            product.image_url = update_data['image_url'].strip()
        if 'stock' in update_data:
            product.stock = int(update_data['stock'])
        if 'sizes' in update_data:
            sizes = update_data['sizes']
            if isinstance(sizes, str):
                sizes = [s.strip() for s in sizes.split(',') if s.strip()]
            product.sizes = json.dumps(sizes)
        if 'badge' in update_data:
            product.badge = update_data['badge'].strip() or None if update_data['badge'] else None
        if 'fabric' in update_data:
            product.fabric = update_data['fabric'].strip() or None if update_data['fabric'] else None

        self.commit()
        return product

    def delete_product(self, product: Product) -> None:
        """Delete product from database."""
        self.delete(product)
        self.commit()

    def get_low_stock(self, threshold: int = 5) -> List[Product]:
        """Retrieve products whose stock is below the threshold."""
        return Product.query.filter(Product.stock < threshold).order_by(Product.stock.asc()).all()

    def count(self) -> int:
        """Return total count of products."""
        return Product.query.count()

    def decrement_stock(self, product_id: int, quantity: int) -> Optional[Product]:
        """Decrement inventory stock for a product."""
        product = self.get_by_id(product_id)
        if product:
            product.stock = max(0, product.stock - quantity)
            self.commit()
        return product
