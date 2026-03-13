from __future__ import annotations

import argparse

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy.engine import make_url

from app.config import settings
from app.db import Base, engine
from app.models import daily_anchor, daily_anchor_progress, daily_goal, daily_progress, discipline_state, reminder_event, session, user, weekly_review  # noqa: F401
from scripts.seed_demo_accounts import main as seed_demo_accounts


def _parse_args():
    parser = argparse.ArgumentParser(description='Reset the local development database.')
    parser.add_argument(
        '--no-seed',
        action='store_true',
        help='Recreate the database and schema without reseeding demo accounts.',
    )
    return parser.parse_args()


def _maintenance_dsn(database_url: str) -> tuple[str, str]:
    url = make_url(database_url)
    database_name = url.database
    if not database_name:
        raise RuntimeError('DATABASE_URL is missing a database name')

    maintenance_url = url.set(drivername='postgresql', database='postgres')
    return maintenance_url.render_as_string(hide_password=False), database_name


def _drop_and_create_database(database_url: str):
    maintenance_dsn, database_name = _maintenance_dsn(database_url)
    connection = psycopg2.connect(maintenance_dsn)
    connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE datname = %s AND pid <> pg_backend_pid()
                """,
                (database_name,),
            )
            cursor.execute(f'DROP DATABASE IF EXISTS "{database_name}"')
            cursor.execute(f'CREATE DATABASE "{database_name}"')
    finally:
        connection.close()


def reset_database(*, with_seed: bool = True):
    print(f'Resetting database from DATABASE_URL={settings.DATABASE_URL}')
    _drop_and_create_database(settings.DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    print('Schema created.')

    if with_seed:
        seed_demo_accounts()
    else:
        print('Skipping seed step.')


def main():
    args = _parse_args()
    reset_database(with_seed=not args.no_seed)


if __name__ == '__main__':
    main()
