from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, func

from app.db import Base


class ReminderEvent(Base):
    __tablename__ = 'reminder_events'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)

    type = Column(String(64), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    body = Column(String(500), nullable=False)

    delivered = Column(Boolean, nullable=False, default=False)
    opened = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
