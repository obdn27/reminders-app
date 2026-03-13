from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, UniqueConstraint, func

from app.db import Base


class DailyAnchorProgress(Base):
    __tablename__ = 'daily_anchor_progress'
    __table_args__ = (UniqueConstraint('anchor_id', 'date', name='uq_daily_anchor_progress_anchor_date'),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    anchor_id = Column(Integer, ForeignKey('daily_anchors.id', ondelete='CASCADE'), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    progress_value = Column(Integer, nullable=False, default=0)
    completed = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
