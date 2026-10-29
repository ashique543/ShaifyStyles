from typing import Optional
from sqlalchemy import or_
from .base_repository import BaseRepository
from ..models import db, Admin

class AdminRepository(BaseRepository[Admin]):
    """
    SQLAlchemy repository handling Admin user database operations.
    """
    def __init__(self):
        super().__init__(Admin)

    def get_by_username(self, username: str) -> Optional[Admin]:
        """Fetch admin by unique username."""
        return Admin.query.filter_by(username=username.strip()).first()

    def get_by_email(self, email: str) -> Optional[Admin]:
        """Fetch admin by email address."""
        return Admin.query.filter_by(email=email.strip().lower()).first()

    def get_by_username_or_email(self, username: str, email: str) -> Optional[Admin]:
        """Check if an admin exists matching either username or email."""
        return Admin.query.filter(
            or_(Admin.username == username.strip(), Admin.email == email.strip().lower())
        ).first()

    def create(self, username: str, email: str, password: str) -> Admin:
        """Create, hash password, and persist a new Admin."""
        admin = Admin.create_admin(username=username.strip(), email=email.strip().lower(), password=password)
        self.add(admin)
        self.commit()
        return admin
