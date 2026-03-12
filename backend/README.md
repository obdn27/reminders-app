# Backend (FastAPI + PostgreSQL)

## Structure
- `app/` FastAPI app code (routes/services/crud/core/models/schemas)
- `migrations/` Alembic migration files
- `requirements.txt` Python dependencies
- `.env` local configuration

## Run locally
1. Create and activate a virtualenv:
   - `python3 -m venv .venv`
   - `source .venv/bin/activate`
2. Install deps:
   - `pip install -r requirements.txt`
3. Ensure PostgreSQL is running and `DATABASE_URL` is valid in `.env`.
4. Start server:
   - `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

Health check:
- `GET http://<your-mac-lan-ip>:8000/health`

## Auth flow implemented
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`
- `POST /auth/logout` (MVP no-op)

## Profile + goals + progress
- `GET /users/me/profile`
- `PATCH /users/me`
- `GET /daily-goals`
- `PUT /daily-goals`
- `GET /daily-progress/today`
- `PATCH /daily-progress/today`
- `POST /daily-progress/complete-job-task`

## Reminders + weekly review
- `GET /reminders/latest`
- `GET /reminders/pending`
- `PATCH /reminders/{id}/opened`
- `GET /weekly-review/latest`
- `GET /weekly-review/history`

## Sessions flow (MVP)
- `POST /sessions`
- Stores a session row and returns:
  - saved session
  - updated daily progress summary
  - current rule state

## Scheduler jobs (APScheduler)
- Daily evaluation job
- Inactivity/recommit job
- Weekly review generation job

Set `SCHEDULER_ENABLED=true/false` in `.env`.

## Notes
- This MVP uses JWT refresh tokens without server-side token revocation table.
- Add Alembic migrations for production schema control.
