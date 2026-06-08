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

Serve the folder locally or open via any static host:

```bash
cd solo-watch
python3 -m http.server 8080
```

Open `http://localhost:8080` on your phone (or use GitHub Pages / Netlify for a permanent URL).

**Install on phone:** Chrome/Safari → Share → **Add to Home Screen**.

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
