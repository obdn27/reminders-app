from sqlalchemy import Boolean, Column, Date, DateTime, Integer, String, func

from app.db import Base


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)
    timezone = Column(String(128), nullable=False, default='UTC')
    goal_context = Column(String(64), nullable=True)

    tone_preference = Column(String(32), nullable=False, default='direct')
    sprint_mode_enabled = Column(Boolean, nullable=False, default=False)
    sprint_start_date = Column(Date, nullable=True)
    sprint_end_date = Column(Date, nullable=True)
    has_completed_onboarding = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
