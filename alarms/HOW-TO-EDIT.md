# How to edit the alarm log (phone + laptop)

No Git commands required. You only need a **free GitHub account** and access to this repo.

**Repo:** https://github.com/Jkrivera24/Kenneth-s-project

---

## One-time setup (5 minutes)

### 1. Create or sign in to GitHub

- Website: https://github.com
- On phone: install the **GitHub** app (iOS / Android)

### 2. Open this project

- In browser or app, go to **Kenneth-s-project**
- Bookmark it on your phone and laptop

### 3. Know these two folders

| Folder | Use |
|--------|-----|
| `alarms/active/` | Open alarms — edit here while troubleshooting |
| `alarms/templates/incident-template.md` | Copy this when a **new** alarm starts |

---

## Edit on your phone

### Option A — GitHub app (easiest on phone)

1. Open the **GitHub** app → your repo **Kenneth-s-project**
2. Tap **Code** (or browse files)
3. Go to `alarms` → `active` → tap `ALM-2026-0602-001.md` (or your file)
4. Tap the **pencil** icon (Edit)
5. Change text (e.g. add a line under **Steps tried**)
6. Scroll down → **Commit changes**
7. Short message, e.g. `Update ST.6 steps tried`
8. Choose **Commit directly to the `main` branch** (simplest while learning)
9. Tap **Commit changes**

Your edit is saved online. You will see it on your laptop too.

### Option B — Phone browser (Safari / Chrome)

1. Go to https://github.com/Jkrivera24/Kenneth-s-project
2. Open `alarms/active/ALM-2026-0602-001.md`
3. Tap the **pencil** (top right) → edit → **Commit changes** (same as above)

**Tip:** Use the app if the pencil is hard to find in the browser.

---

## Edit on your laptop

### Option A — GitHub in browser (same as phone, bigger screen)

1. Open https://github.com/Jkrivera24/Kenneth-s-project
2. Click `alarms` → `active` → your `.md` file
3. Click the **pencil** → edit
4. **Commit changes** → message → **Commit directly to `main`**

### Option B — Cursor on laptop (if you use Cursor)

1. Open the **Kenneth-s-project** folder in Cursor
2. Open `alarms/active/ALM-2026-0602-001.md`
3. Edit and save (`Ctrl+S` / `Cmd+S`)
4. Use Cursor’s **Source Control** to commit and push, or use GitHub website to paste changes

*Until you learn Git, Option A (browser) is enough.*

---

## Start a new alarm (phone or laptop)

1. Open `alarms/templates/incident-template.md`
2. Tap/click **Raw** or select all text → **Copy**
3. In `alarms/active/`, create a **new file**:
   - GitHub: **Add file** → **Create new file**
   - Name: `ALM-2026-0603-001.md` (use today’s date)
4. Paste the template → fill in tag, HMI text, set `status: IN PROGRESS`
5. **Commit changes**

---

## What to type when you troubleshoot

Open your active file and only change these at first:

```markdown
## Steps tried

1. Checked ST.6 power — normal
2. Reset Ethernet switch port 6 — alarm still IN PROGRESS
```

When the alarm clears, change the top line:

```yaml
status: CLEARED
```

or `RESET` or `DONE` (see [README.md](README.md)).

When **DONE**, on laptop or phone: edit the file in GitHub, or ask someone to **move** it to `alarms/resolved/icms/` (moving folders is easier on laptop browser).

---

## Phone + laptop together (no confusion)

| Rule | Why |
|------|-----|
| **Always open the same file name** | e.g. only `ALM-2026-0602-001.md` for that event |
| **After editing on phone, refresh on laptop** | F5 or reload the GitHub page |
| **One incident = one file** | Do not create two files for the same alarm |
| **Commit after each watch** if you can | So you do not lose text if the app closes |

You do **not** need to “sync” manually — GitHub keeps one online copy.

---

## Words on GitHub you can ignore at first

| Term | Meaning for you |
|------|------------------|
| **Commit** | Save my edit |
| **Branch** | Use **main** only while learning |
| **Pull request** | Optional review before merge — you can skip until later |
| **Clone** | Download folder to laptop — optional |

---

## If edit fails on phone

- Make sure you are **signed in** to GitHub
- You need **write access** to Kenneth-s-project (your account or invited collaborator)
- If there is no pencil icon, use the **GitHub app** or a laptop browser

---

## Prefer a spreadsheet?

Use Google Sheets or Excel first — see **[SPREADSHEET-GUIDE.md](SPREADSHEET-GUIDE.md)**. Upload `alarms/data/incident-log.csv` to GitHub when you want markdown updated automatically.

---

## Quick checklist when an alarm sounds

1. [ ] Open `alarms/active/` (existing file or new from template)
2. [ ] `status: IN PROGRESS`
3. [ ] Copy alarm text from ICMS into the table
4. [ ] Add **Steps tried** as you work
5. [ ] Change status when cleared → **DONE** → move to `resolved/icms/`
