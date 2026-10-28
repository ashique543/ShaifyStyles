from flask import Blueprint, request, jsonify
from ..models import db, Product

products_bp = Blueprint('products', __name__, url_prefix='/api/products')

@products_bp.route('', methods=['GET'])
def get_products():
    """List all products with optional category, search, and sorting filters."""
    category = request.args.get('category')
    search = request.args.get('search', '').strip()
    sort = request.args.get('sort', 'default')
    
    query = Product.query

    # Category filter
    if category and category.lower() not in ['all', '']:
        # Support case-insensitive or exact match
        query = query.filter(Product.category.ilike(f"%{category}%"))
    
    # Search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            db.or_(
                Product.title.ilike(search_term),
                Product.description.ilike(search_term),
                Product.fabric.ilike(search_term),
                Product.category.ilike(search_term)
            )
        )
    
    # Sort filter
    if sort == 'price_asc':
        # Using effective price (discounted_price or price)
        query = query.order_by(db.func.coalesce(Product.discounted_price, Product.price).asc())
    elif sort == 'price_desc':
        query = query.order_by(db.func.coalesce(Product.discounted_price, Product.price).desc())
    elif sort == 'newest':
        query = query.order_by(Product.created_at.desc())
    else:
        query = query.order_by(Product.id.asc())

    products = query.all()
    return jsonify({
        'success': True,
        'count': len(products),
        'products': [p.to_dict() for p in products]
    }), 200


@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Retrieve detailed information for a specific product."""
    product = Product.query.get(product_id)
    if not product:
        return jsonify({
            'success': False,
            'message': f"Product with ID {product_id} not found"
        }), 404
        
    return jsonify({
        'success': True,
        'product': product.to_dict()
    }), 200


@products_bp.route('/categories', methods=['GET'])
def get_categories():
    """Return available categories with counts."""
    categories = [
        {"id": "all", "name": "All", "description": "Browse complete modest collection"},
        {"id": "Suits & Kurtis", "name": "Suits & Kurtis", "description": "Lawn suits, farshi ghararas & daily kurtis"},
        {"id": "Hijab Bouquets", "name": "Hijab Bouquets", "description": "Handcrafted rose & silk hijab floral bouquets"},
        {"id": "Custom Hampers", "name": "Custom Hampers", "description": "Personalized bridal, Eid & gift trunks"}
    ]
    return jsonify({
        'success': True,
        'categories': categories
    }), 200
