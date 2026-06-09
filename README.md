# Solo Watch

**Level up at sea** — a free, offline-first fitness PWA for seafarers, inspired by the daily quest system from Solo Leveling.

No subscriptions. No server. Your data stays on your phone.

## Features

- **Daily Quest** with gradual ramp: 10→100 push-ups, sit-ups, squats; 1→10 km run; 3,000→10,000 steps
- **Mi Band 6 steps** — manual entry or Zepp Life CSV import
- **XP, levels, and stats** (STR, AGI, VIT, INT, SEN)
- **Streaks** and Penalty Zone warning for missed quests
- **Rest days** with +25% XP bonus the next day
- **Custom quests** (planks, pull-ups, deck laps, etc.)
- **Weekly stats** and history
- **Watch schedule reminders** — set your off-watch reminder time
- **Works offline** at sea (install as PWA)

## Quick start

### Live app (GitHub Pages)

**URL:** https://jkrivera24.github.io/Kenneth-s-project/

**One-time setup (use a desktop browser, not the GitHub phone app):**

1. Open: https://github.com/Jkrivera24/Kenneth-s-project/settings/pages
2. Under **Branch** (or **Build and deployment → Source**), choose:
   - Branch: **`gh-pages`**
   - Folder: **`/ (root)`**
3. Click **Save**
4. Go to **Actions** → **Deploy Solo Watch to GitHub Pages** → **Run workflow** (if it has not run yet)
5. Wait 1–2 minutes, then open the URL above on your phone → **Add to Home Screen**

### Run locally

```bash
cd solo-watch
python3 -m http.server 8080
```

Open `http://localhost:8080` (same device) or `http://YOUR-PC-IP:8080` (phone on same Wi‑Fi).

## Mi Band 6 sync

1. Open **Zepp Life** and note today's steps, **or**
2. Export data: Profile → Settings → Account → **Export data**
3. In Solo Watch → **Steps** tab → **Import Zepp Life CSV**

## Seafarer notes

- Bodyweight exercises work in cabin, gym, or on deck
- Timezone setting ensures daily reset matches your ship's time
- Set watch schedule so reminders fire during off-watch hours
- Export backup before signing off a contract

## Tech

Vanilla JS PWA — no build step, no dependencies, $0/month to run.

## Disclaimer

Fan-inspired fitness tracker. Not affiliated with Solo Leveling or Zepp/Xiaomi.
