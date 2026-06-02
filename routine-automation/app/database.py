import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "routines.db"


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_connection() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS routines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                period TEXT NOT NULL DEFAULT 'morning',
                enabled INTEGER NOT NULL DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS steps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                routine_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                scheduled_time TEXT,
                duration_minutes INTEGER,
                FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS completions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                step_id INTEGER NOT NULL,
                completed_at TEXT NOT NULL,
                source TEXT NOT NULL DEFAULT 'web',
                FOREIGN KEY (step_id) REFERENCES steps(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS phone_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL,
                payload TEXT,
                received_at TEXT NOT NULL,
                source TEXT NOT NULL DEFAULT 'phone'
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            """
        )
        _seed_defaults(conn)


def _seed_defaults(conn: sqlite3.Connection) -> None:
    count = conn.execute("SELECT COUNT(*) FROM routines").fetchone()[0]
    if count > 0:
        return

    routines = [
        ("Morning", "morning"),
        ("Workday", "day"),
        ("Evening wind-down", "evening"),
    ]
    for name, period in routines:
        cur = conn.execute(
            "INSERT INTO routines (name, period) VALUES (?, ?)",
            (name, period),
        )
        rid = cur.lastrowid
        if period == "morning":
            steps = [
                ("Wake up & hydrate", "06:30", 5),
                ("Stretch or light exercise", "06:40", 15),
                ("Shower & get ready", "07:00", 25),
                ("Breakfast", "07:30", 20),
                ("Review today's plan", "07:50", 10),
            ]
        elif period == "day":
            steps = [
                ("Deep work block", "09:00", 90),
                ("Short break & walk", "10:30", 15),
                ("Lunch", "12:30", 45),
                ("Admin & messages", "14:00", 30),
                ("Afternoon focus", "15:00", 60),
            ]
        else:
            steps = [
                ("Dinner", "19:00", 45),
                ("Prep tomorrow", "20:00", 15),
                ("Screen-off / read", "21:00", 30),
                ("Sleep prep", "22:00", 15),
            ]
        for i, (title, time, mins) in enumerate(steps):
            conn.execute(
                """INSERT INTO steps (routine_id, title, sort_order, scheduled_time, duration_minutes)
                   VALUES (?, ?, ?, ?, ?)""",
                (rid, title, i, time, mins),
            )


@contextmanager
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
