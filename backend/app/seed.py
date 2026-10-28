import json
from .models import db, Product

INITIAL_PRODUCTS = [
    {
        "title": "Shaify Crimson Rose Lawn Suit",
        "description": "Luxurious 3-piece designer lawn suit featuring intricate floral thread embroidery along the neckline and daman. Comes paired with a digital printed pure chiffon dupatta and tailored dyed cambric cotton trousers.",
        "category": "Suits & Kurtis",
        "price": 3899.00,
        "discounted_price": 3299.00,
        "image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
        "stock": 14,
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "badge": "Bestseller",
        "fabric": "Premium Swiss Lawn & Pure Chiffon"
    },
    {
        "title": "Noor Regal Farshi Gharara Suit",
        "description": "Exquisite bridal & festive farshi gharara ensemble. Adorned with heritage zari, gota patti, and delicate sitara hand-embroidery. Sweeping trail farshi silhouette crafted for royal celebrations.",
        "category": "Suits & Kurtis",
        "price": 8999.00,
        "discounted_price": 7499.00,
        "image_url": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
        "stock": 6,
        "sizes": ["S", "M", "L", "XL"],
        "badge": "Festive Exclusive",
        "fabric": "Pure Tissue Silk & Heavy Organza"
    },
    {
        "title": "Gul-e-Maryam Handcrafted Hijab Bouquet",
        "description": "Shaify Styles signature gift bouquet featuring 3 premium georgette and Turkish modal hijabs folded into lifelike blooming roses, embellished with fresh-touch dried baby's breath, faux pearls, and magnetic pins.",
        "category": "Hijab Bouquets",
        "price": 1899.00,
        "discounted_price": 1599.00,
        "image_url": "/assets/images/hijab_bouquet.jpg",
        "stock": 25,
        "sizes": ["Standard (3 Hijabs)", "Deluxe (5 Hijabs)"],
        "badge": "Handmade with Love",
        "fabric": "Georgette & Premium Modal Hijabs"
    },
    {
        "title": "Blush Rose & Silk Hijab Floral Bouquet",
        "description": "A stunning handcrafted bouquet of soft blush pink and ivory silk hijabs formed into rosebuds, nestled amongst artificial silk tea roses, golden leaf sprigs, and wrapped in premium Korean waterproof floral paper with satin ribbons.",
        "category": "Hijab Bouquets",
        "price": 2299.00,
        "discounted_price": 1999.00,
        "image_url": "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80",
        "stock": 18,
        "sizes": ["Standard (3 Hijabs)", "Luxury (6 Hijabs)"],
        "badge": "Instagram Favorite",
        "fabric": "Silk Satin Crepe & Modal Hijabs"
    },
    {
        "title": "Shaify Bespoke Modest Bride Gift Hamper",
        "description": "The ultimate celebratory keepsake hamper for the bride-to-be. Includes a bespoke embroidered kurti, scented French vanilla soy candle, alcohol-free artisanal oud perfume, two luxury shimmer hijabs, gold-plated hijab pins, and Belgian chocolates in a reusable velvet trunk.",
        "category": "Custom Hampers",
        "price": 4999.00,
        "discounted_price": 4299.00,
        "image_url": "/assets/images/gift_hamper.jpg",
        "stock": 10,
        "sizes": ["Curated Gift Box", "Luxury Velvet Trunk (+Rs.600)"],
        "badge": "Customized",
        "fabric": "Multi-item Keepsake Hamper"
    },
    {
        "title": "Lucknowi Chikankari Mint Cotton Kurti",
        "description": "Breathable 100% cambric cotton kurti in soothing mint pastel, hand-embroidered with authentic Lucknowi shadow work and keel kangan stitches. Perfect for everyday modest elegance and college/office wear.",
        "category": "Suits & Kurtis",
        "price": 1999.00,
        "discounted_price": 1499.00,
        "image_url": "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
        "stock": 20,
        "sizes": ["XS", "S", "M", "L", "XL", "XXL"],
        "badge": "Daily Modest",
        "fabric": "100% Breathable Malmal Cotton"
    },
    {
        "title": "Lavender & Eid Celebration Gift Hamper",
        "description": "A joyous gift box designed to commemorate Eid, Nikah, or milestone celebrations. Features Ajwa medjool dates, an artisan brass prayer counter, lavender-hued chiffon hijab, crystal brooches, and custom calligraphy greeting note.",
        "category": "Custom Hampers",
        "price": 2799.00,
        "discounted_price": 2399.00,
        "image_url": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
        "stock": 12,
        "sizes": ["Standard Box", "Premium Keepsake Box"],
        "badge": "Personalized Note Included",
        "fabric": "Curated Gift Curation"
    },
    {
        "title": "Emerald Zardozi Velvet Farshi Suit",
        "description": "Heavy ceremonial 3-piece farshi suit crafted in rich royal emerald micro-velvet. Embellished with antique gold zardozi needlework, dabka, and pearls. Includes trailing farshi trousers and a scalloped embroidered organza veil.",
        "category": "Suits & Kurtis",
        "price": 9999.00,
        "discounted_price": 8499.00,
        "image_url": "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=800&q=80",
        "stock": 5,
        "sizes": ["S", "M", "L", "XL"],
        "badge": "Signature Royal",
        "fabric": "Pure Micro-Velvet & Zari Organza"
    },
    {
        "title": "Pastel Blossom Mini Hijab Flower Posy",
        "description": "Charming and adorable budget-friendly mini hijab posy. Contains 2 soft everyday modal hijabs crafted into rosebuds with delicate foliage, tied with a customized satin name ribbon.",
        "category": "Hijab Bouquets",
        "price": 1299.00,
        "discounted_price": 999.00,
        "image_url": "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80",
        "stock": 30,
        "sizes": ["Standard (2 Hijabs)"],
        "badge": "Pocket Friendly",
        "fabric": "Ultra-soft Modal Fabric"
    },
    {
        "title": "Shaify Self-Care & Modest Elegance Hamper",
        "description": "Spoil your loved ones with hand-poured jasmine soy candle, gold-finish snag-free magnetic hijab clips, rosewater face mist, and 2 premium crinkle georgette hijabs neatly packaged in a magnetic keepsake gift box.",
        "category": "Custom Hampers",
        "price": 3199.00,
        "discounted_price": 2699.00,
        "image_url": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
        "stock": 15,
        "sizes": ["Luxury Gift Box"],
        "badge": "Self-Care Favorite",
        "fabric": "Luxury Gift Curation"
    }
]

def seed_database():
    """Seeds the database with initial Shaify Styles products if table is empty."""
    existing_count = Product.query.count()
    if existing_count > 0:
        print(f"Database already contains {existing_count} products. Skipping initial seed.")
        return existing_count
    
    print("Seeding initial Shaify Styles boutique catalog...")
    for item in INITIAL_PRODUCTS:
        product = Product(
            title=item["title"],
            description=item["description"],
            category=item["category"],
            price=item["price"],
            discounted_price=item.get("discounted_price"),
            image_url=item["image_url"],
            stock=item.get("stock", 10),
            sizes=json.dumps(item.get("sizes", ["Standard"])),
            badge=item.get("badge"),
            fabric=item.get("fabric")
        )
        db.session.add(product)
    
    db.session.commit()
    print(f"Successfully seeded {len(INITIAL_PRODUCTS)} products.")
    return len(INITIAL_PRODUCTS)
