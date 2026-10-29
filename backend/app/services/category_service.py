from typing import Optional, Dict, Any, Tuple, List
from ..repositories.category_repository import CategoryRepository


class CategoryService:
    """Business logic for admin-managed product categories."""

    def __init__(self, category_repo: Optional[CategoryRepository] = None):
        self.category_repo = category_repo or CategoryRepository()

    def get_all_categories(self, active_only: bool = False) -> Tuple[Dict[str, Any], int]:
        """Return all categories for the admin or storefront."""
        cats = self.category_repo.get_all(active_only=active_only)
        # Prepend a virtual "All" entry for the storefront
        result = [{'id': 'all', 'name': 'All', 'slug': 'all', 'icon': '✨',
                   'description': 'Browse complete collection', 'sort_order': 0,
                   'is_active': True, 'created_at': None}]
        result += [c.to_dict() for c in cats]
        return {'success': True, 'categories': result}, 200

    def get_admin_categories(self) -> Tuple[Dict[str, Any], int]:
        """Return all categories (including inactive) for admin management."""
        cats = self.category_repo.get_all(active_only=False)
        return {'success': True, 'categories': [c.to_dict() for c in cats]}, 200

    def create_category(self, data: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        if not data:
            return {'success': False, 'message': 'JSON payload required'}, 400
        if not data.get('name', '').strip():
            return {'success': False, 'message': 'Category name is required'}, 400

        existing = self.category_repo.get_by_name(data['name'])
        if existing:
            return {'success': False, 'message': f'Category "{data["name"]}" already exists'}, 409

        cat = self.category_repo.create(data)
        return {'success': True, 'category': cat.to_dict(),
                'message': f'Category "{cat.name}" created successfully!'}, 201

    def update_category(self, category_id: int, data: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        if not data:
            return {'success': False, 'message': 'JSON payload required'}, 400

        cat = self.category_repo.get_by_id(category_id)
        if not cat:
            return {'success': False, 'message': 'Category not found'}, 404

        updated = self.category_repo.update(cat, data)
        return {'success': True, 'category': updated.to_dict(),
                'message': f'Category "{updated.name}" updated successfully!'}, 200

    def delete_category(self, category_id: int) -> Tuple[Dict[str, Any], int]:
        cat = self.category_repo.get_by_id(category_id)
        if not cat:
            return {'success': False, 'message': 'Category not found'}, 404

        name = cat.name
        self.category_repo.delete(cat)
        return {'success': True, 'message': f'Category "{name}" deleted successfully.'}, 200
