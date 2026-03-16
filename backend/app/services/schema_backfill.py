from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def _column_exists(inspector, table_name: str, column_name: str) -> bool:
    return any(column['name'] == column_name for column in inspector.get_columns(table_name))


def ensure_runtime_schema(engine: Engine) -> None:
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    if 'daily_anchors' not in table_names:
        return

    statements: list[str] = []
    if not _column_exists(inspector, 'daily_anchors', 'category'):
        statements.append("ALTER TABLE daily_anchors ADD COLUMN category VARCHAR(64)")
    if not _column_exists(inspector, 'daily_anchors', 'label'):
        statements.append("ALTER TABLE daily_anchors ADD COLUMN label VARCHAR(120)")
    if not _column_exists(inspector, 'daily_anchors', 'next_anchor_id'):
        statements.append("ALTER TABLE daily_anchors ADD COLUMN next_anchor_id INTEGER")

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))

        connection.execute(text("UPDATE daily_anchors SET category = anchor_type WHERE category IS NULL"))
        connection.execute(
            text(
                """
                UPDATE daily_anchors
                SET label = CASE anchor_type
                    WHEN 'deep_work' THEN 'Deep work'
                    WHEN 'job_applications' THEN 'Job applications'
                    WHEN 'upskilling' THEN 'Upskilling'
                    WHEN 'movement' THEN 'Movement'
                    WHEN 'chores_admin' THEN 'Chores / Admin'
                    WHEN 'meals_cooking' THEN 'Meals / Cooking'
                    WHEN 'planning' THEN 'Planning'
                    ELSE anchor_type
                END
                WHERE label IS NULL
                """
            )
        )

        if 'user_discipline_state' in table_names:
            if not _column_exists(inspector, 'user_discipline_state', 'consistency_streak'):
                connection.execute(text("ALTER TABLE user_discipline_state ADD COLUMN consistency_streak INTEGER DEFAULT 0"))
            if not _column_exists(inspector, 'user_discipline_state', 'longest_streak'):
                connection.execute(text("ALTER TABLE user_discipline_state ADD COLUMN longest_streak INTEGER DEFAULT 0"))
            if not _column_exists(inspector, 'user_discipline_state', 'last_active_date'):
                connection.execute(text("ALTER TABLE user_discipline_state ADD COLUMN last_active_date DATE"))
            if not _column_exists(inspector, 'user_discipline_state', 'retention_state'):
                connection.execute(text("ALTER TABLE user_discipline_state ADD COLUMN retention_state VARCHAR(32) DEFAULT 'steady'"))

            connection.execute(text("UPDATE user_discipline_state SET consistency_streak = COALESCE(consistency_streak, 0)"))
            connection.execute(text("UPDATE user_discipline_state SET longest_streak = COALESCE(longest_streak, 0)"))
            connection.execute(text("UPDATE user_discipline_state SET retention_state = COALESCE(retention_state, 'steady')"))
