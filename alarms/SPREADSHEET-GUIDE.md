# Spreadsheet-first alarm log

Use **Google Sheets** or **Excel** as your daily notebook. GitHub markdown files can be updated **automatically** when you upload the CSV to the repo (see [Automatic sync](#automatic-sync-to-github) below).

---

## Quick start (Google Sheets on phone + laptop)

### 1. Create the sheet

1. On laptop or phone browser, open https://sheets.google.com → **Blank spreadsheet**.
2. Name it: `Alarm log – Kenneth`.
3. **File → Import** (laptop) or share CSV to Sheets (phone):
   - Import this file from the repo: `alarms/data/incident-log.csv`
   - Or copy the header row from that file.

### 2. Status column (dropdown)

1. Click column **B** (`status`).
2. **Data → Data validation** (phone: Format → Data validation).
3. **Criteria:** Dropdown list  
   `IN PROGRESS,CLEARED,RESET,DONE,RECURRING`
4. Save.

Always pick from the list — spelling must match exactly for auto-sync.

### 3. Log your first alarm

Copy the example row for `ALM-2026-0602-001` or add a new row:

| Column | What to type |
|--------|----------------|
| `id` | `ALM-2026-0603-001` (date + number) |
| `status` | `IN PROGRESS` |
| `date_time` | From HMI |
| `system` | e.g. `ICMS / PCMECR` |
| `equipment` | ST.6, purifier, etc. |
| `alarm_tags` | `TAG1; TAG2` (semicolon between tags) |
| `as_shown_on_hmi` | `Line one \| Line two` (pipe between lines) |
| `steps_tried` | `Checked power \| Reset switch` or `1. First step` |
| `not_in_manual` | Fill when you learn something new |
| `root_cause` | `unknown` until known |

**One row = one incident** (same as one markdown file).

### 4. While troubleshooting

- Change **status** when the alarm changes.
- Add to **steps_tried** (use ` | ` between steps on one line if easier on phone).
- Put lessons in **not_in_manual**.

---

## Phone tips (Google Sheets app)

| Task | How |
|------|-----|
| Install | **Google Sheets** app, sign in with Google |
| Edit | Open `Alarm log – Kenneth` → tap cell → type |
| Status | Use dropdown in column B |
| New alarm | Insert row at bottom, new `id` |

Same sheet opens on laptop — no extra sync between phone and laptop.

---

## Automatic sync to GitHub

```text
You edit Google Sheet  →  Download CSV  →  Put in GitHub  →  Bot updates .md files
```

There is **no live link** from Google to GitHub by default (that needs extra setup). The repo includes a **sync bot** that runs when `alarms/data/incident-log.csv` is updated on GitHub.

### Steps (after [PR #5](https://github.com/Jkrivera24/Kenneth-s-project/pull/5) is merged)

1. Edit your Google Sheet anytime (phone or laptop).
2. When you want GitHub updated (e.g. end of watch, or status = DONE):
   - **Google Sheets (laptop):** File → **Download → Comma-separated values (.csv)**
   - **Phone:** Share → export, or edit on laptop once to upload
3. On GitHub (website or app):
   - Open `alarms/data/incident-log.csv`
   - Pencil → **delete all** → paste/upload new CSV content (keep header row)
   - **Commit changes** to `main`
4. Within ~1 minute, GitHub Actions updates:
   - `alarms/active/*.md` for IN PROGRESS / CLEARED / RESET
   - `alarms/resolved/<system>/*.md` for DONE / RECURRING

You can still edit `.md` files in the GitHub app by hand; the next CSV upload **overwrites** markdown generated from the sheet for those `id`s.

### What gets updated automatically

| You update in sheet | Bot updates on GitHub |
|---------------------|------------------------|
| `status`, `steps_tried`, `not_in_manual`, etc. | Matching `ALM-....md` file |
| `status` = DONE | File moves to `alarms/resolved/icms/` (folder from `system` column) |

---

## How often to sync?

| Situation | Suggestion |
|-----------|------------|
| Alarm still active | Sheet only — sync optional |
| Handover / end of watch | Export CSV → GitHub |
| Status = DONE | Sync so repo has permanent record |

---

## Excel on laptop (no Google)

1. Open `alarms/data/incident-log.csv` in Excel.
2. Save edits as CSV (UTF-8).
3. Upload to GitHub same as above.

You can keep a copy on your laptop and skip Google Sheets if you prefer.

---

## Fully automatic from Google Sheets (advanced, optional)

To push every edit without manual CSV upload, you need:

- Google **Apps Script** in the spreadsheet
- A GitHub **personal access token** (stored in Script properties)
- Script commits to `alarms/data/incident-log.csv` on a timer or button

This is **not** set up by default (security + setup). If you want it later, say so and we can add a button script template.

**Recommended for now:** sheet daily + CSV upload when you want GitHub updated.

---

## Column reference

Same as [README.md](README.md). Required for sync: **`id`**, **`status`**.

---

## Troubleshooting sync

| Problem | Fix |
|---------|-----|
| Bot did not run | Check **Actions** tab on GitHub repo; CSV must be under `alarms/data/incident-log.csv` |
| Wrong folder | Set `system` column (e.g. `ICMS / PCMECR` → folder `icms-pcmecr`) |
| Status not recognized | Use exact dropdown values |
| Lost manual edits in .md | Edit sheet then re-upload CSV; or edit sheet only |

---

## Two paths summary

| Path | Best for |
|------|----------|
| **Sheet only** | Fast logging on phone, no GitHub yet |
| **Sheet + CSV upload** | Sheet daily + GitHub archive auto-updated |
| **GitHub app edit .md** | Small text changes without sheet |

You can use **sheet first**, then **sync to GitHub** when ready — no need to choose one forever.
