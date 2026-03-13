from sqlalchemy.orm import Session

from app.models.user import User


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def list_users(db: Session) -> list[User]:
    return db.query(User).all()


def create_user(db: Session, *, email: str, hashed_password: str, name: str | None = None) -> User:
    user = User(
        email=email,
        hashed_password=hashed_password,
        name=name,
        goal_context=None,
        timezone='UTC',
        tone_preference='direct',
        sprint_mode_enabled=False,
        has_completed_onboarding=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user_profile(
    db: Session,
    *,
    user: User,
    name: str | None = None,
    goal_context: str | None = None,
    timezone: str | None = None,
    tone_preference: str | None = None,
    sprint_mode_enabled: bool | None = None,
    sprint_start_date=None,
    sprint_end_date=None,
    has_completed_onboarding: bool | None = None,
) -> User:
    if name is not None:
        user.name = name
    if goal_context is not None:
        user.goal_context = goal_context
    if timezone is not None:
        user.timezone = timezone
    if tone_preference is not None:
        user.tone_preference = tone_preference
    if sprint_mode_enabled is not None:
        user.sprint_mode_enabled = sprint_mode_enabled
    if sprint_start_date is not None:
        user.sprint_start_date = sprint_start_date
    if sprint_end_date is not None:
        user.sprint_end_date = sprint_end_date
    if has_completed_onboarding is not None:
        user.has_completed_onboarding = has_completed_onboarding

    db.add(user)
    db.commit()
    db.refresh(user)
    return user
