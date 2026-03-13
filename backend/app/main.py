from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import Base, engine
from app.models import daily_anchor, daily_anchor_progress, daily_goal, daily_progress, discipline_state, reminder_event, session, user, weekly_review  # noqa: F401
from app.routes.anchor_progress import router as anchor_progress_router
from app.routes.anchors import router as anchors_router
from app.routes.auth import router as auth_router
from app.routes.daily_goals import router as daily_goals_router
from app.routes.daily_progress import router as daily_progress_router
from app.routes.discipline import router as discipline_router
from app.routes.dev_rules import router as dev_rules_router
from app.routes.dev_time import router as dev_time_router
from app.routes.reminders import router as reminders_router
from app.routes.sessions import router as sessions_router
from app.routes.users import router as users_router
from app.routes.weekly_review import router as weekly_review_router
from app.services.scheduler_service import start_scheduler, stop_scheduler

app = FastAPI(title=settings.APP_NAME, debug=settings.APP_DEBUG)

origins = [origin.strip() for origin in settings.CORS_ALLOW_ORIGINS.split(',')] if settings.CORS_ALLOW_ORIGINS else ['*']

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.on_event('startup')
def on_startup():
    Base.metadata.create_all(bind=engine)
    if settings.SCHEDULER_ENABLED:
        start_scheduler()


@app.on_event('shutdown')
def on_shutdown():
    stop_scheduler()


@app.get('/health')
def health_check():
    return {'status': 'ok'}


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(anchors_router)
app.include_router(anchor_progress_router)
app.include_router(daily_goals_router)
app.include_router(daily_progress_router)
app.include_router(discipline_router)
app.include_router(sessions_router)
app.include_router(reminders_router)
app.include_router(weekly_review_router)
if settings.APP_DEBUG:
    app.include_router(dev_rules_router)
    app.include_router(dev_time_router)
