from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, func

from app.db import Base


class DailyGoalSetting(Base):
    __tablename__ = 'daily_goal_settings'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)

    job_work_minutes_goal = Column(Integer, nullable=False, default=60)
    movement_minutes_goal = Column(Integer, nullable=False, default=20)
    daily_job_task_goal = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
