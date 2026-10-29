from typing import List, Optional
from ..models import db, Coupon
from datetime import datetime


class CouponRepository:
    """Data access layer for promo coupon codes."""

    def get_all(self) -> List[Coupon]:
        return Coupon.query.order_by(Coupon.created_at.desc()).all()

    def get_by_id(self, coupon_id: int) -> Optional[Coupon]:
        return Coupon.query.get(coupon_id)

    def get_by_code(self, code: str) -> Optional[Coupon]:
        return Coupon.query.filter(
            db.func.upper(Coupon.code) == code.upper().strip()
        ).first()

    def create(self, data: dict) -> Coupon:
        expires_at = None
        if data.get('expires_at'):
            try:
                expires_at = datetime.fromisoformat(data['expires_at'])
            except Exception:
                expires_at = None

        coupon = Coupon(
            code=data['code'].upper().strip(),
            description=data.get('description', ''),
            discount_type=data.get('discount_type', 'percentage'),
            discount_value=float(data['discount_value']),
            min_order_amount=float(data.get('min_order_amount', 0)),
            max_uses=data.get('max_uses'),
            is_active=bool(data.get('is_active', True)),
            expires_at=expires_at
        )
        db.session.add(coupon)
        db.session.commit()
        return coupon

    def update(self, coupon: Coupon, data: dict) -> Coupon:
        for field in ('description', 'discount_type'):
            if field in data:
                setattr(coupon, field, data[field])
        if 'discount_value' in data:
            coupon.discount_value = float(data['discount_value'])
        if 'min_order_amount' in data:
            coupon.min_order_amount = float(data['min_order_amount'])
        if 'max_uses' in data:
            coupon.max_uses = data['max_uses']
        if 'is_active' in data:
            coupon.is_active = bool(data['is_active'])
        if 'expires_at' in data:
            try:
                coupon.expires_at = datetime.fromisoformat(data['expires_at']) if data['expires_at'] else None
            except Exception:
                pass
        db.session.commit()
        return coupon

    def increment_usage(self, coupon: Coupon) -> Coupon:
        coupon.used_count += 1
        db.session.commit()
        return coupon

    def delete(self, coupon: Coupon) -> None:
        db.session.delete(coupon)
        db.session.commit()
