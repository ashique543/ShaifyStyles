from typing import Optional, Dict, Any
from datetime import datetime
from .base_repository import BaseRepository
from ..models import User

class UserRepository(BaseRepository[User]):
    """
    SQLAlchemy repository handling customer user database operations.
    """
    def __init__(self):
        super().__init__(User)

    def get_by_google_id(self, google_id: str) -> Optional[User]:
        """Fetch user by Google account ID."""
        return User.query.filter_by(google_id=google_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        """Fetch user by email address."""
        return User.query.filter_by(email=email.lower().strip()).first()

    def get_by_phone(self, phone: str) -> Optional[User]:
        """Fetch user by 10-digit mobile phone number."""
        return User.query.filter_by(phone=phone.strip()).first()

    def create(self, user_data: Dict[str, Any]) -> User:
        """Create and persist a new customer user."""
        user = User(
            name=user_data.get('name', 'Boutique Shopper'),
            email=user_data.get('email').lower().strip() if user_data.get('email') else None,
            phone=user_data.get('phone').strip() if user_data.get('phone') else None,
            avatar_url=user_data.get('avatar_url'),
            google_id=user_data.get('google_id'),
            auth_provider=user_data.get('auth_provider', 'phone'),
            default_address=user_data.get('default_address')
        )
        self.add(user)
        self.commit()
        return user

    def update(self, user: User, update_data: Dict[str, Any]) -> User:
        """Update user profile fields and commit."""
        if 'name' in update_data and update_data['name']:
            user.name = update_data['name'].strip()
        if 'email' in update_data:
            user.email = update_data['email'].strip().lower() if update_data['email'] else None
        if 'default_address' in update_data:
            user.default_address = update_data['default_address'].strip() if update_data['default_address'] else None
        if 'avatar_url' in update_data and update_data['avatar_url']:
            user.avatar_url = update_data['avatar_url']
        if 'google_id' in update_data and update_data['google_id']:
            user.google_id = update_data['google_id']

        self.commit()
        return user

    def update_last_login(self, user: User) -> User:
        """Refresh user's last login timestamp."""
        user.last_login = datetime.utcnow()
        self.commit()
        return user
