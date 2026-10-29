from typing import TypeVar, Generic, Type, Optional, List
from ..models import db

T = TypeVar('T')

class BaseRepository(Generic[T]):
    """
    Base repository providing core SQLAlchemy CRUD operations.
    """
    def __init__(self, model_class: Type[T]):
        self.model_class = model_class

    def get_by_id(self, entity_id: int) -> Optional[T]:
        return db.session.get(self.model_class, entity_id)

    def get_all(self) -> List[T]:
        return self.model_class.query.all()

    def add(self, entity: T) -> T:
        db.session.add(entity)
        return entity

    def delete(self, entity: T) -> None:
        db.session.delete(entity)

    def commit(self) -> None:
        db.session.commit()

    def flush(self) -> None:
        db.session.flush()

    def rollback(self) -> None:
        db.session.rollback()
