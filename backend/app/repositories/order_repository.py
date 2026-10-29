from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from sqlalchemy import or_, func
from .base_repository import BaseRepository
from ..models import db, Order, OrderItem

class OrderRepository(BaseRepository[Order]):
    """
    SQLAlchemy repository handling all Order and OrderItem database operations.
    """
    def __init__(self):
        super().__init__(Order)

    def get_by_razorpay_order_id(self, rzp_order_id: str) -> Optional[Order]:
        """Fetch order by Razorpay order ID."""
        return Order.query.filter_by(razorpay_order_id=rzp_order_id).first()

    def create_order_with_items(
        self,
        order_fields: Dict[str, Any],
        items_data: List[Dict[str, Any]]
    ) -> Order:
        """
        Creates an Order and associated OrderItem records in a single transaction.
        """
        new_order = Order(
            user_id=order_fields.get('user_id'),
            razorpay_order_id=order_fields.get('razorpay_order_id'),
            customer_name=order_fields['customer_name'],
            customer_email=order_fields['customer_email'],
            customer_phone=order_fields['customer_phone'],
            shipping_address=order_fields['shipping_address'],
            total_amount=round(order_fields['total_amount'], 2),
            status=order_fields.get('status', 'created'),
            notes=order_fields.get('notes')
        )
        self.add(new_order)
        self.flush()  # Populates new_order.id

        for item in items_data:
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=item['product_id'],
                quantity=item['quantity'],
                size=item.get('size', 'Standard'),
                price=item['price']
            )
            db.session.add(order_item)

        self.commit()
        return new_order

    def update_payment(
        self,
        order: Order,
        payment_id: Optional[str] = None,
        signature: Optional[str] = None,
        status: str = 'paid'
    ) -> Order:
        """Update payment confirmation details on order."""
        order.status = status
        if payment_id:
            order.razorpay_payment_id = payment_id
        if signature:
            order.razorpay_signature = signature
        order.updated_at = datetime.utcnow()
        self.commit()
        return order

    def update_status(
        self,
        order: Order,
        status: Optional[str] = None,
        tracking_carrier: Optional[str] = None,
        tracking_number: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Order:
        """Update status, shipment tracking, or notes on an order."""
        if status:
            order.status = status
        if tracking_carrier is not None:
            order.tracking_carrier = tracking_carrier.strip() or None if isinstance(tracking_carrier, str) else None
        if tracking_number is not None:
            order.tracking_number = tracking_number.strip() or None if isinstance(tracking_number, str) else None
        if notes is not None:
            order.notes = notes.strip() or None if isinstance(notes, str) else None

        order.updated_at = datetime.utcnow()
        self.commit()
        return order

    def get_user_orders(
        self,
        user_id: int,
        phone: Optional[str] = None,
        email: Optional[str] = None
    ) -> List[Order]:
        """Fetch past orders matching user ID, phone, or email."""
        query_filters = [Order.user_id == user_id]
        if phone:
            query_filters.append(Order.customer_phone.like(f"%{phone}%"))
        if email:
            query_filters.append(Order.customer_email == email)

        return Order.query.filter(or_(*query_filters)).order_by(Order.created_at.desc()).all()

    def get_paginated(
        self,
        page: int = 1,
        per_page: int = 20,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None
    ):
        """Fetch paginated orders for admin portal with multi-parameter filtering."""
        query = Order.query

        if status_filter:
            query = query.filter(Order.status == status_filter.lower())

        if search:
            q = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Order.customer_name.ilike(q),
                    Order.customer_phone.ilike(q),
                    Order.customer_email.ilike(q),
                    Order.razorpay_payment_id.ilike(q)
                )
            )

        if search and search.startswith('#'):
            try:
                oid = int(search[1:])
                query = Order.query.filter(Order.id == oid)
            except ValueError:
                pass
        elif search and search.isdigit():
            query = query.filter(
                or_(
                    Order.customer_phone.ilike(f"%{search}%"),
                    Order.id == int(search)
                )
            )

        if date_from:
            try:
                query = query.filter(Order.created_at >= datetime.strptime(date_from, '%Y-%m-%d'))
            except ValueError:
                pass
        if date_to:
            try:
                query = query.filter(Order.created_at <= datetime.strptime(date_to, '%Y-%m-%d'))
            except ValueError:
                pass

        return query.order_by(Order.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

    def get_recent(self, limit: int = 10) -> List[Order]:
        """Fetch the most recent orders."""
        return Order.query.order_by(Order.created_at.desc()).limit(limit).all()

    def count(self, status: Optional[str] = None) -> int:
        """Count total orders or orders by specific status."""
        if status:
            return Order.query.filter(Order.status == status).count()
        return Order.query.count()

    def get_status_counts(self) -> Dict[str, int]:
        """Return counts of orders grouped by status."""
        rows = db.session.query(Order.status, func.count(Order.id)).group_by(Order.status).all()
        return dict(rows)

    def get_total_revenue(self, paid_statuses: Tuple[str, ...] = ('paid', 'processing', 'shipped', 'delivered')) -> float:
        """Calculate total revenue from orders with paid/fulfilled statuses."""
        val = db.session.query(func.sum(Order.total_amount)).filter(
            Order.status.in_(paid_statuses)
        ).scalar()
        return float(val or 0.0)
