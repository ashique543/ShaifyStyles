import re
from typing import List, Optional
from ..models import db, Category


def _slugify(text: str) -> str:
    """Convert a category name to a URL-safe slug."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text.strip('-')


class CategoryRepository:
    """Data access layer for boutique product categories."""

    def get_all(self, active_only: bool = False) -> List[Category]:
        """Return all categories ordered by sort_order."""
        q = Category.query
        if active_only:
            q = q.filter_by(is_active=True)
        return q.order_by(Category.sort_order.asc(), Category.name.asc()).all()

    def get_by_id(self, category_id: int) -> Optional[Category]:
        return Category.query.get(category_id)

    def get_by_slug(self, slug: str) -> Optional[Category]:
        return Category.query.filter_by(slug=slug).first()

    def get_by_name(self, name: str) -> Optional[Category]:
        return Category.query.filter(
            db.func.lower(Category.name) == name.lower()
        ).first()

    def create(self, data: dict) -> Category:
        """Create a new category from payload dict."""
        name = data['name'].strip()
        base_slug = _slugify(name)
        slug = base_slug
        # Ensure slug uniqueness
        counter = 1
        while Category.query.filter_by(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1

        cat = Category(
            name=name,
            slug=slug,
            description=data.get('description', ''),
            icon=data.get('icon', ''),
            sort_order=int(data.get('sort_order', 0)),
            is_active=bool(data.get('is_active', True))
        )
        db.session.add(cat)
        db.session.commit()
        return cat

    def update(self, category: Category, data: dict) -> Category:
        """Update existing category with provided fields."""
        if 'name' in data and data['name']:
            new_name = data['name'].strip()
            if new_name != category.name:
                new_slug = _slugify(new_name)
                # Check slug uniqueness (excluding self)
                existing = Category.query.filter(
                    Category.slug == new_slug,
                    Category.id != category.id
                ).first()
                if not existing:
                    category.slug = new_slug
            category.name = new_name

        if 'description' in data:
            category.description = data['description']
        if 'icon' in data:
            category.icon = data['icon']
        if 'sort_order' in data:
            category.sort_order = int(data['sort_order'])
        if 'is_active' in data:
            category.is_active = bool(data['is_active'])

        db.session.commit()
        return category

    def delete(self, category: Category) -> None:
        """Hard-delete a category record."""
        db.session.delete(category)
        db.session.commit()

    def seed_defaults(self) -> None:
        """Seed the three default Shaify Styles categories if the table is empty."""
        if Category.query.count() > 0:
            return
        defaults = [
            {'name': 'Suits & Kurtis', 'slug': 'suits-kurtis', 'description': 'Lawn suits, farshi ghararas & daily kurtis', 'icon': '👗', 'sort_order': 1},
            {'name': 'Hijab Bouquets', 'slug': 'hijab-bouquets', 'description': 'Handcrafted rose & silk hijab floral bouquets', 'icon': '🌹', 'sort_order': 2},
            {'name': 'Custom Hampers', 'slug': 'custom-hampers', 'description': 'Personalised bridal, Eid & gift trunks', 'icon': '🎁', 'sort_order': 3},
        ]
        for d in defaults:
            cat = Category(**d, is_active=True)
            db.session.add(cat)
        db.session.commit()
