from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, UniqueConstraint, func

from app.db import Base


class WeeklyReview(Base):
    __tablename__ = 'weekly_reviews'
    __table_args__ = (UniqueConstraint('user_id', 'week_start_date', 'week_end_date', name='uq_weekly_review_user_range'),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)

    week_start_date = Column(Date, nullable=False, index=True)
    week_end_date = Column(Date, nullable=False, index=True)

    days_goals_met = Column(Integer, nullable=False, default=0)
    longest_streak = Column(Integer, nullable=False, default=0)
    most_missed_area = Column(String(64), nullable=False, default='none')
    drift_detected = Column(Boolean, nullable=False, default=False)
    summary_text = Column(String(1000), nullable=False)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
