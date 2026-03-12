from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, UniqueConstraint, func

from app.db import Base


class DailyProgress(Base):
    __tablename__ = 'daily_progress'
    __table_args__ = (UniqueConstraint('user_id', 'date', name='uq_daily_progress_user_date'),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)

    job_work_minutes_completed = Column(Integer, nullable=False, default=0)
    movement_minutes_completed = Column(Integer, nullable=False, default=0)
    daily_job_task_completed = Column(Boolean, nullable=False, default=False)

    goals_met_count = Column(Integer, nullable=False, default=0)
    total_goals_count = Column(Integer, nullable=False, default=3)
    overall_status = Column(String(32), nullable=False, default='inactive')

    reminder_state = Column(String(32), nullable=True)
    drift_flags = Column(String(255), nullable=True)
    miss_streak = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
