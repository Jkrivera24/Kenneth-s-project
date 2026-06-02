import base64
import io
import json
from datetime import datetime
from pathlib import Path

import qrcode
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.database import get_connection, init_db
from app.models import CompleteStep, PhoneEvent, PhoneImport, RoutineCreate, StepCreate
from app.scheduler import start_scheduler, stop_scheduler

STATIC_DIR = Path(__file__).resolve().parent / "static"

app = FastAPI(title="Daily Routine Automator", version="1.0.0")


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    start_scheduler()


@app.on_event("shutdown")
def on_shutdown() -> None:
    stop_scheduler()


def _today_completions(conn) -> set[int]:
    rows = conn.execute(
        "SELECT step_id FROM completions WHERE date(completed_at) = date('now', 'localtime')"
    ).fetchall()
    return {r["step_id"] for r in rows}


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "time": datetime.now().isoformat()}


@app.get("/api/dashboard")
def dashboard() -> dict:
    with get_connection() as conn:
        done = _today_completions(conn)
        routines = conn.execute(
            "SELECT * FROM routines WHERE enabled = 1 ORDER BY period, id"
        ).fetchall()
        result = []
        for r in routines:
            steps = conn.execute(
                "SELECT * FROM steps WHERE routine_id = ? ORDER BY sort_order",
                (r["id"],),
            ).fetchall()
            result.append(
                {
                    "id": r["id"],
                    "name": r["name"],
                    "period": r["period"],
                    "steps": [
                        {
                            "id": s["id"],
                            "title": s["title"],
                            "scheduled_time": s["scheduled_time"],
                            "duration_minutes": s["duration_minutes"],
                            "completed": s["id"] in done,
                        }
                        for s in steps
                    ],
                }
            )
        pending = conn.execute(
            "SELECT key, value FROM settings WHERE key LIKE 'pending:%'"
        ).fetchall()
        events = conn.execute(
            "SELECT * FROM phone_events ORDER BY id DESC LIMIT 10"
        ).fetchall()
    return {
        "routines": result,
        "pending_reminders": [json.loads(p["value"]) for p in pending],
        "recent_phone_events": [dict(e) for e in events],
    }


@app.get("/api/routines")
def list_routines() -> list:
    with get_connection() as conn:
        return [dict(r) for r in conn.execute("SELECT * FROM routines ORDER BY id")]


@app.post("/api/routines")
def create_routine(body: RoutineCreate) -> dict:
    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO routines (name, period) VALUES (?, ?)",
            (body.name, body.period),
        )
        return {"id": cur.lastrowid, **body.model_dump()}


@app.post("/api/routines/{routine_id}/steps")
def add_step(routine_id: int, body: StepCreate) -> dict:
    with get_connection() as conn:
        cur = conn.execute(
            """INSERT INTO steps (routine_id, title, sort_order, scheduled_time, duration_minutes)
               VALUES (?, ?, ?, ?, ?)""",
            (
                routine_id,
                body.title,
                body.sort_order,
                body.scheduled_time,
                body.duration_minutes,
            ),
        )
        return {"id": cur.lastrowid, "routine_id": routine_id, **body.model_dump()}


@app.post("/api/steps/{step_id}/complete")
def complete_step(step_id: int, body: CompleteStep | None = None) -> dict:
    source = body.source if body else "web"
    with get_connection() as conn:
        step = conn.execute("SELECT * FROM steps WHERE id = ?", (step_id,)).fetchone()
        if not step:
            raise HTTPException(404, "Step not found")
        conn.execute(
            "INSERT INTO completions (step_id, completed_at, source) VALUES (?, ?, ?)",
            (step_id, datetime.now().isoformat(), source),
        )
        conn.execute("DELETE FROM settings WHERE key = ?", (f"pending:{step_id}",))
    return {"ok": True, "step_id": step_id, "source": source}


@app.post("/api/phone/event")
async def phone_event(body: PhoneEvent, request: Request) -> dict:
    """Webhook for iOS Shortcuts, Android Tasker, or other phone automations."""
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO phone_events (event_type, payload, received_at, source) VALUES (?, ?, ?, ?)",
            (
                body.event_type,
                json.dumps(body.payload or {}),
                datetime.now().isoformat(),
                body.source,
            ),
        )
        _apply_phone_event(conn, body.event_type, body.payload or {})

    return {"ok": True, "event": body.event_type}


def _apply_phone_event(conn, event_type: str, payload: dict) -> None:
    mapping = {
        "wake": ("Morning", "Wake up & hydrate"),
        "left_home": ("Workday", "Deep work block"),
        "arrived_home": ("Evening wind-down", "Dinner"),
        "focus_on": ("Workday", "Deep work block"),
        "focus_off": ("Workday", "Short break & walk"),
        "bedtime": ("Evening wind-down", "Sleep prep"),
    }
    if event_type in mapping:
        routine_name, step_title = mapping[event_type]
        row = conn.execute(
            """
            SELECT s.id FROM steps s
            JOIN routines r ON r.id = s.routine_id
            WHERE r.name = ? AND s.title = ?
            """,
            (routine_name, step_title),
        ).fetchone()
        if row:
            conn.execute(
                "INSERT INTO completions (step_id, completed_at, source) VALUES (?, ?, ?)",
                (row["id"], datetime.now().isoformat(), "phone_auto"),
            )


@app.post("/api/phone/import")
def phone_import(body: PhoneImport) -> dict:
    """Import routines or calendar snippets exported from your phone."""
    imported = 0
    with get_connection() as conn:
        if body.routines:
            for routine in body.routines:
                cur = conn.execute(
                    "INSERT INTO routines (name, period) VALUES (?, ?)",
                    (
                        routine.get("name", "Imported"),
                        routine.get("period", "day"),
                    ),
                )
                rid = cur.lastrowid
                for i, step in enumerate(routine.get("steps", [])):
                    conn.execute(
                        """INSERT INTO steps (routine_id, title, sort_order, scheduled_time, duration_minutes)
                           VALUES (?, ?, ?, ?, ?)""",
                        (
                            rid,
                            step.get("title", "Step"),
                            i,
                            step.get("time"),
                            step.get("duration_minutes"),
                        ),
                    )
                    imported += 1
        if body.calendar_events:
            row = conn.execute(
                "SELECT id FROM routines WHERE name = 'Imported calendar' LIMIT 1"
            ).fetchone()
            if not row:
                ins = conn.execute(
                    "INSERT INTO routines (name, period) VALUES ('Imported calendar', 'day')"
                )
                cal_routine_id = ins.lastrowid
            else:
                cal_routine_id = row["id"]
            for ev in body.calendar_events:
                title = ev.get("title", "Calendar block")
                time_str = ev.get("start", "")[:5] if ev.get("start") else None
                rid = cal_routine_id
                conn.execute(
                    """INSERT INTO steps (routine_id, title, sort_order, scheduled_time)
                       VALUES (?, ?, 99, ?)""",
                    (rid, title, time_str),
                )
                imported += 1
        conn.execute(
            "INSERT INTO phone_events (event_type, payload, received_at, source) VALUES (?, ?, ?, ?)",
            (
                "import",
                json.dumps({"imported_steps": imported}),
                datetime.now().isoformat(),
                body.source,
            ),
        )
    return {"ok": True, "imported_steps": imported}


@app.get("/api/steps/{step_id}/qr")
def step_qr(step_id: int, request: Request) -> dict:
    base = str(request.base_url).rstrip("/")
    payload = f"{base}/scan?step={step_id}"
    img = qrcode.make(payload)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    return {"step_id": step_id, "url": payload, "qr_png_base64": b64}


@app.get("/scan", response_class=HTMLResponse)
def scan_page(step: int | None = None) -> HTMLResponse:
    return FileResponse(STATIC_DIR / "scan.html")


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
