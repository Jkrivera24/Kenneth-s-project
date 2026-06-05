# Set up “Alarm log - Kenneth” in 3 steps

You already made the spreadsheet. **You do not need to import a file.**

---

## Easiest way (one formula)

1. Open your sheet **Alarm log - Kenneth** in Chrome.
2. Click cell **A1** (top-left).
3. Copy this **entire line**, paste into A1, press **Enter**:

```text
=IMPORTDATA("https://raw.githubusercontent.com/Jkrivera24/Kenneth-s-project/main/alarms/data/incident-log.csv")
```

4. Wait 5–10 seconds. Row 1 = headers, row 2 = your ST.6 alarm.

Done.

---

## Status dropdown (column B)

1. Click the letter **B** at the top (whole column).
2. Menu **Data** → **Data validation**.
3. **Criteria:** Dropdown  
   Paste this list:

```text
IN PROGRESS,CLEARED,RESET,DONE,RECURRING
```

4. **Save**.

---

## If the formula shows an error

Use **File → Import** instead:

1. **File** → **Import**
2. Tab **URL**
3. Paste:

```text
https://raw.githubusercontent.com/Jkrivera24/Kenneth-s-project/main/alarms/data/incident-log.csv
```

4. **Import location:** Replace current sheet (or “Insert new sheet” if you prefer)
5. **Separator type:** Comma  
6. Click **Import data**

---

## After it works

- Edit cells like a normal spreadsheet.
- When you want GitHub updated: **File → Download → CSV**, then upload to `alarms/data/incident-log.csv` on GitHub (see [SPREADSHEET-GUIDE.md](SPREADSHEET-GUIDE.md)).
