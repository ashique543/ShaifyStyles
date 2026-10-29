from typing import Optional
from datetime import datetime
from .base_repository import BaseRepository
from ..models import db, OTPStore

class OTPRepository(BaseRepository[OTPStore]):
    """
    SQLAlchemy repository handling OTP verification store records.
    """
    def __init__(self):
        super().__init__(OTPStore)

    def get_latest_unverified(self, phone: str) -> Optional[OTPStore]:
        """Fetch latest active OTP record for a phone number."""
        return OTPStore.query.filter_by(
            phone=phone, verified=False
        ).order_by(OTPStore.id.desc()).first()

    def invalidate_pending(self, phone: str) -> int:
        """Delete or invalidate prior unverified OTPs for this phone number."""
        count = OTPStore.query.filter_by(phone=phone, verified=False).delete()
        self.commit()
        return count

    def create_otp(self, phone: str, otp_code: str, expires_at: datetime) -> OTPStore:
        """Create and persist a new OTP record."""
        record = OTPStore(phone=phone, otp_code=otp_code, expires_at=expires_at)
        self.add(record)
        self.commit()
        return record

    def mark_verified(self, record: OTPStore) -> OTPStore:
        """Mark an OTP record as verified."""
        record.verified = True
        self.commit()
        return record
