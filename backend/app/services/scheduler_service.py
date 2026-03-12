from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.crud.daily_progress import get_recent_daily_progress
from app.crud.users import list_users
from app.db import SessionLocal
from app.services.daily_progress_service import evaluate_progress_for_date
from app.services.reminder_service import create_reminder_if_needed, create_weekly_review_ready_event
from app.services.weekly_review_service import generate_weekly_review_for_user
from app.utils.time import user_local_date

scheduler = BackgroundScheduler(timezone='UTC')


def _with_db(fn):
    db: Session = SessionLocal()
    try:
        fn(db)
    finally:
        db.close()


def _normalize_reminder_type(rule_state: str | None) -> str | None:
    if not rule_state:
        return None
    if rule_state == 'cooldown':
        return 'cooldown_notice'
    return rule_state


def daily_evaluation_job():
    def _run(db: Session):
        users = list_users(db)
        for user in users:
            target_date = user_local_date(user.timezone)
            result = evaluate_progress_for_date(db, user=user, target_date=target_date)
            reminder_state = result['ruleState'].get('reminderState')
            reminder_type = _normalize_reminder_type(reminder_state)
            if reminder_type:
                create_reminder_if_needed(
                    db,
                    user=user,
                    reminder_type=reminder_type,
                    target_date=target_date,
                )

    _with_db(_run)


def inactivity_recommit_job():
    def _run(db: Session):
        users = list_users(db)
        for user in users:
            recent = get_recent_daily_progress(db, user.id, days=8)
            if len(recent) < 7:
                continue

            last_seven = recent[:7]
            inactive = all(
                row.job_work_minutes_completed == 0
                and row.movement_minutes_completed == 0
                and not row.daily_job_task_completed
                for row in last_seven
            )
            if not inactive:
                continue

            target_date = user_local_date(user.timezone)
            create_reminder_if_needed(
                db,
                user=user,
                reminder_type='recommit_prompt',
                target_date=target_date,
            )

    _with_db(_run)


def weekly_review_generation_job():
    def _run(db: Session):
        users = list_users(db)
        for user in users:
            review = generate_weekly_review_for_user(db, user=user)
            if review:
                create_weekly_review_ready_event(
                    db,
                    user=user,
                    target_date=user_local_date(user.timezone),
                )

    _with_db(_run)


def start_scheduler():
    if scheduler.running:
        return

    scheduler.add_job(daily_evaluation_job, 'cron', hour=0, minute=15, id='daily_evaluation', replace_existing=True)
    scheduler.add_job(inactivity_recommit_job, 'cron', hour=0, minute=45, id='inactivity_recommit', replace_existing=True)
    scheduler.add_job(weekly_review_generation_job, 'cron', day_of_week='mon', hour=1, minute=0, id='weekly_review_generation', replace_existing=True)

    scheduler.start()


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
