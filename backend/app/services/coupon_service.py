from typing import Optional, Dict, Any, Tuple
from datetime import datetime
from ..repositories.coupon_repository import CouponRepository


class CouponService:
    """Business logic for promo codes and discount coupons."""

    def __init__(self, coupon_repo: Optional[CouponRepository] = None):
        self.coupon_repo = coupon_repo or CouponRepository()

    def get_all(self) -> Tuple[Dict[str, Any], int]:
        coupons = self.coupon_repo.get_all()
        return {'success': True, 'coupons': [c.to_dict() for c in coupons]}, 200

    def validate_coupon(self, code: str, order_amount: float) -> Tuple[Dict[str, Any], int]:
        """Validate a coupon code and compute the discount to apply."""
        if not code:
            return {'success': False, 'message': 'Coupon code is required'}, 400

        coupon = self.coupon_repo.get_by_code(code)
        if not coupon:
            return {'success': False, 'message': 'Invalid coupon code'}, 404

        if not coupon.is_active:
            return {'success': False, 'message': 'This coupon is no longer active'}, 400

        if coupon.expires_at and coupon.expires_at < datetime.utcnow():
            return {'success': False, 'message': 'This coupon has expired'}, 400

        if coupon.max_uses is not None and coupon.used_count >= coupon.max_uses:
            return {'success': False, 'message': 'This coupon has reached its usage limit'}, 400

        if order_amount < (coupon.min_order_amount or 0):
            return {
                'success': False,
                'message': f'Minimum order of ₹{coupon.min_order_amount:.0f} required for this coupon'
            }, 400

        # Compute discount
        if coupon.discount_type == 'percentage':
            discount = round(order_amount * coupon.discount_value / 100, 2)
        else:
            discount = min(coupon.discount_value, order_amount)

        return {
            'success': True,
            'coupon': coupon.to_dict(),
            'discount_amount': discount,
            'final_amount': round(order_amount - discount, 2),
            'message': f'Coupon "{coupon.code}" applied! You save ₹{discount:.0f}'
        }, 200

    def create_coupon(self, data: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        if not data:
            return {'success': False, 'message': 'JSON payload required'}, 400
        if not data.get('code', '').strip():
            return {'success': False, 'message': 'Coupon code is required'}, 400
        if not data.get('discount_value'):
            return {'success': False, 'message': 'discount_value is required'}, 400

        existing = self.coupon_repo.get_by_code(data['code'])
        if existing:
            return {'success': False, 'message': f'Coupon code "{data["code"].upper()}" already exists'}, 409

        coupon = self.coupon_repo.create(data)
        return {'success': True, 'coupon': coupon.to_dict(),
                'message': f'Coupon "{coupon.code}" created successfully!'}, 201

    def update_coupon(self, coupon_id: int, data: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        if not data:
            return {'success': False, 'message': 'JSON payload required'}, 400
        coupon = self.coupon_repo.get_by_id(coupon_id)
        if not coupon:
            return {'success': False, 'message': 'Coupon not found'}, 404

        updated = self.coupon_repo.update(coupon, data)
        return {'success': True, 'coupon': updated.to_dict(),
                'message': f'Coupon "{updated.code}" updated successfully!'}, 200

    def delete_coupon(self, coupon_id: int) -> Tuple[Dict[str, Any], int]:
        coupon = self.coupon_repo.get_by_id(coupon_id)
        if not coupon:
            return {'success': False, 'message': 'Coupon not found'}, 404
        code = coupon.code
        self.coupon_repo.delete(coupon)
        return {'success': True, 'message': f'Coupon "{code}" deleted successfully.'}, 200
