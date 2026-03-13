from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.db import Base


class SessionRecord(Base):
    __tablename__ = 'sessions'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    session_type = Column(String(32), nullable=False)  # focus | movement
    anchor_type = Column(String(64), nullable=True)
    category = Column(String(64), nullable=False)
    planned_minutes = Column(Integer, nullable=False)
    completed_minutes = Column(Integer, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship('User', backref='sessions')
