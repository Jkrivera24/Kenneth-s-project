# Alarm & troubleshooting log

Field knowledge for alarms and fixes **not fully covered** in the instruction manual. The official manual stays the authority; this log records what actually worked on board.

**New to GitHub?** See **[HOW-TO-EDIT.md](HOW-TO-EDIT.md)** — edit on phone or laptop without Git commands.

**Spreadsheet first?** See **[SPREADSHEET-GUIDE.md](SPREADSHEET-GUIDE.md)** — use Google Sheets/Excel, then upload CSV to auto-update markdown on GitHub.

## Workflow status labels

Use these for **your** log only. Do not confuse them with HMI states (e.g. Aconis `ERR`).

| Status | Meaning |
|--------|---------|
| **IN PROGRESS** | Alarm active or troubleshooting not finished |
| **CLEARED** | Condition gone; no operator reset required |
| **RESET** | Cleared on HMI after acknowledge/reset; root cause may still be unknown |
| **DONE** | Resolved and verified stable (e.g. one watch or 24 h) |
| **RECURRING** | Same fault returned; link to previous `id` |

```text
Alarm occurs → IN PROGRESS
       ↓
Gone without reset → CLEARED
Reset on panel only → RESET
Verified stable + documented → DONE → move file to resolved/
```

## Folder layout

```text
alarms/
  README.md                 # this file
  active/                   # open incidents (IN PROGRESS, sometimes RESET)
  resolved/                 # DONE (and worth keeping CLEARED/RESET lessons)
  templates/
    incident-template.md
    incident-log.csv        # optional spreadsheet import
```

When an incident is **DONE**, move its file from `active/` to `resolved/<system>/` (e.g. `icms/`, `fuel/`, `lube/`).

**Spreadsheet + CSV upload:** set `status` to **DONE** and sync — the file moves to `resolved/icms/` automatically (see [SPREADSHEET-GUIDE.md](SPREADSHEET-GUIDE.md)).

## Spreadsheet columns (optional daily log)

Same field names as the Markdown frontmatter where possible:

| Column | Description |
|--------|-------------|
| `id` | Unique id, e.g. `ALM-2026-0602-001` |
| `status` | IN PROGRESS \| CLEARED \| RESET \| DONE \| RECURRING |
| `date_time` | When alarm first appeared (HMI timestamp) |
| `system` | Fuel, lube, ICMS, etc. |
| `equipment` | Plant or station name |
| `alarm_tags` | HMI tag(s), semicolon-separated if grouped |
| `as_shown_on_hmi` | Verbatim alarm text |
| `alarm_code` | OEM code if shown (e.g. `14`) |
| `hmi_status` | OEM status if shown (e.g. `ERR`) — not your workflow status |
| `manual_ref` | Book + chapter/page only |
| `manual_says` | One-line summary from manual |
| `not_in_manual` | What worked but was not in the book |
| `steps_tried` | Numbered troubleshooting steps |
| `root_cause` | `unknown` until proven |
| `verified_by` | Initials |
| `related_id` | Prior incident if RECURRING |
| `notes` | Diagram context, load, watch, etc. |

## Markdown incident file

Copy `templates/incident-template.md` for new events. One file per **incident** (one occurrence); group related HMI lines in one file when they share one root cause.

## ICMS note (Aconis / Mariner Systems)

| On HMI | In this log |
|--------|-------------|
| Red active alarm | `status: IN PROGRESS` |
| Tag column (e.g. `PCMECR_6_M`) | `alarm_tags` / table |
| Description text | `as_shown_on_hmi` |
| Code `14`, status `ERR` | `alarm_code`, `hmi_status` |
