import json
import logging
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.database import get_connection

logger = logging.getLogger(__name__)
_scheduler: BackgroundScheduler | None = None


def _check_due_steps() -> None:
    now = datetime.now().strftime("%H:%M")
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT s.id, s.title, s.scheduled_time, r.name AS routine_name
            FROM steps s
            JOIN routines r ON r.id = s.routine_id
            WHERE r.enabled = 1
              AND s.scheduled_time = ?
              AND s.id NOT IN (
                SELECT step_id FROM completions
                WHERE date(completed_at) = date('now', 'localtime')
              )
            """,
            (now,),
        ).fetchall()

    for row in rows:
        logger.info(
            "Routine reminder: %s — %s (%s)",
            row["routine_name"],
            row["title"],
            row["scheduled_time"],
        )
        with get_connection() as conn:
            conn.execute(
                "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
                (
                    f"pending:{row['id']}",
                    json.dumps(
                        {
                            "step_id": row["id"],
                            "title": row["title"],
                            "routine": row["routine_name"],
                            "at": datetime.now().isoformat(),
                        }
                    ),
                ),
            )


def start_scheduler() -> BackgroundScheduler:
    global _scheduler
    if _scheduler is not None:
        return _scheduler
    _scheduler = BackgroundScheduler()
    _scheduler.add_job(_check_due_steps, CronTrigger(minute="*"))
    _scheduler.start()
    return _scheduler


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
