from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, func

from app.db import Base


class UserDisciplineState(Base):
    __tablename__ = 'user_discipline_state'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)

    reminder_state = Column(String(32), nullable=True)
    miss_streak = Column(Integer, nullable=False, default=0)
    drift_flags = Column(String(255), nullable=True)
    consistency_streak = Column(Integer, nullable=False, default=0)
    longest_streak = Column(Integer, nullable=False, default=0)
    last_active_date = Column(Date, nullable=True)
    retention_state = Column(String(32), nullable=False, default='steady')

    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
