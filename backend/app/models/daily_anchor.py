from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Time, func

from app.db import Base


class DailyAnchor(Base):
    __tablename__ = 'daily_anchors'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    category = Column(String(64), nullable=False)
    label = Column(String(120), nullable=False)
    anchor_type = Column(String(64), nullable=False)
    target_value = Column(Integer, nullable=False)
    target_unit = Column(String(32), nullable=False)
    tracking_type = Column(String(32), nullable=False)
    reminder_time = Column(Time, nullable=True)
    next_anchor_id = Column(Integer, ForeignKey('daily_anchors.id', ondelete='SET NULL'), nullable=True)
    display_order = Column(Integer, nullable=False, default=0)
    active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
