# Alarm Log (phone app)

Simple **offline** alarm log for your phone — no Google Sheets, no formulas.

## Live app

**https://jkrivera24.github.io/Kenneth-s-project/alarm-log/**

### Install on your phone (one time)

1. Open the link above in **Chrome** on your phone.
2. Menu **⋮** → **Add to Home screen** or **Install app**.
3. Open **Alarm Log** from your home screen like any app.

Works offline. Data stays on your phone until you export CSV.

## Daily use

| Tab | What to do |
|-----|------------|
| **Alarms** | Tap an alarm to edit · tap **+** for new |
| **Sync** | **Download CSV for GitHub** when you want to update the repo |
| **Help** | Short instructions |

### Status buttons (tap one)

`IN PROGRESS` · `CLEARED` · `RESET` · `DONE` · `RECURRING`

Your ST.6 sample alarm is pre-loaded.

## Send to GitHub (laptop, 3 steps)

1. Phone: **Sync** → **Download CSV for GitHub**
2. Transfer file to laptop (email, USB, Google Drive)
3. GitHub → `alarms/data/incident-log.csv` → pencil → paste → **Commit**

When status is **DONE**, GitHub moves the alarm to `resolved/icms/` automatically.

## GitHub Pages setup (one time, laptop)

If the link does not open yet:

1. https://github.com/Jkrivera24/Kenneth-s-project/settings/pages
2. Source: branch **`gh-pages`**, folder **`/ (root)`**
3. **Actions** → **Deploy GitHub Pages apps** → run workflow
4. Wait 1–2 minutes, open the URL above
