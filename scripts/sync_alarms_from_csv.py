#!/usr/bin/env python3
"""Generate alarm markdown files from alarms/data/incident-log.csv."""

from __future__ import annotations

import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "alarms" / "data" / "incident-log.csv"
ACTIVE = ROOT / "alarms" / "active"
RESOLVED = ROOT / "alarms" / "resolved"

ACTIVE_STATUSES = {"IN PROGRESS", "CLEARED", "RESET"}
RESOLVED_STATUSES = {"DONE", "RECURRING"}


def slug_system(system: str) -> str:
    s = system.strip().lower()
    if "icms" in s or "pcmecr" in s or "aconis" in s:
        return "icms"
    if "fuel" in s:
        return "fuel"
    if "lube" in s or "lo " in s:
        return "lube"
    s = re.sub(r"[/\\]+", "-", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "general"


def parse_alarm_table(
    alarm_tags: str, as_shown: str, alarm_code: str, hmi_status: str
) -> str:
    tags = [t.strip() for t in alarm_tags.split(";") if t.strip()]
    lines = [ln.strip() for ln in re.split(r"[|\n]", as_shown) if ln.strip()]

    if not tags and not lines:
        return "| | | | |\n"

    rows: list[tuple[str, str, str, str]] = []
    n = max(len(tags), len(lines), 1)
    for i in range(n):
        tag = tags[i] if i < len(tags) else ""
        desc = lines[i] if i < len(lines) else ""
        rows.append((tag, desc, alarm_code, hmi_status))

    out = ["| Tag | Description | Code | HMI |", "|-----|-------------|------|-----|"]
    for tag, desc, code, hmi in rows:
        out.append(f"| {tag} | {desc} | {code} | {hmi} |")
    return "\n".join(out)


def format_steps(steps: str) -> str:
    text = steps.strip()
    if not text or text == "-":
        return "-\n"
    if re.match(r"^\d+\.", text, re.MULTILINE):
        return text + "\n"
    parts = [p.strip() for p in re.split(r"[|\n]", text) if p.strip()]
    if not parts:
        return "-\n"
    return "\n".join(f"{i}. {p}" for i, p in enumerate(parts, 1)) + "\n"


def build_markdown(row: dict[str, str]) -> str:
    incident_id = row.get("id", "").strip()
    status = row.get("status", "IN PROGRESS").strip().upper()
    steps = format_steps(row.get("steps_tried", ""))
    not_manual = row.get("not_in_manual", "").strip() or "-"
    manual_says = row.get("manual_says", "").strip() or "-"
    root = row.get("root_cause", "").strip() or "unknown"
    notes = row.get("notes", "").strip() or "-"

    table = parse_alarm_table(
        row.get("alarm_tags", ""),
        row.get("as_shown_on_hmi", ""),
        row.get("alarm_code", ""),
        row.get("hmi_status", ""),
    )

    related = row.get("related_id", "").strip()
    related_line = f"\nrelated_id: {related}" if related else ""

    return f"""---
id: {incident_id}
status: {status}
system: {row.get('system', '').strip()}
equipment: {row.get('equipment', '').strip()}
date: {row.get('date_time', '').strip()}
manual_ref: {row.get('manual_ref', '').strip()}
verified_by: {row.get('verified_by', '').strip()}{related_line}
---

## Active alarms (as on HMI)

{table}

## System / network context

{notes}

## Manual (summary only)

{manual_says}

## Not in the manual

{not_manual}

## Steps tried

{steps}
## Root cause

{root}

## Closure notes

- **CLEARED / RESET / DONE** date:
- Auto-synced from spreadsheet (`alarms/data/incident-log.csv`). Edit the sheet, then upload/sync CSV.
"""


def target_path(row: dict[str, str]) -> Path:
    incident_id = row.get("id", "").strip()
    if not incident_id:
        raise ValueError("Row missing id")
    status = row.get("status", "").strip().upper()
    if status in RESOLVED_STATUSES:
        folder = RESOLVED / slug_system(row.get("system", ""))
    else:
        folder = ACTIVE
    folder.mkdir(parents=True, exist_ok=True)
    return folder / f"{incident_id}.md"


def load_rows() -> list[dict[str, str]]:
    if not CSV_PATH.exists():
        raise SystemExit(f"Missing {CSV_PATH}")
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = [r for r in reader if (r.get("id") or "").strip()]
    return rows


def remove_stale_copies(incident_id: str, keep: Path) -> None:
    """Remove duplicate .md files for one id outside the target path."""
    for base in (ACTIVE, RESOLVED):
        if not base.exists():
            continue
        for path in base.rglob(f"{incident_id}.md"):
            if path.resolve() != keep.resolve():
                path.unlink()
                print(f"Removed stale {path.relative_to(ROOT)}")


def main() -> None:
    rows = load_rows()
    if not rows:
        print("No incident rows in CSV (need at least one id).")
        return

    written: list[Path] = []
    for row in rows:
        incident_id = row.get("id", "").strip()
        path = target_path(row)
        path.write_text(build_markdown(row), encoding="utf-8")
        remove_stale_copies(incident_id, path)
        written.append(path)
        print(f"Wrote {path.relative_to(ROOT)}")

    print(f"Synced {len(written)} incident(s) from {CSV_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
