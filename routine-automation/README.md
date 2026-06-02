# Daily Routine Automator

Automate your daily routine and connect it to your phone via QR codes, webhooks (iOS Shortcuts / Android Tasker), and JSON import.

## Features

- **Morning / day / evening** routine templates with scheduled steps
- **Progress dashboard** for today’s checklist
- **QR scan** from your phone camera to complete steps
- **Phone webhooks** — fire events like `wake`, `arrived_home`, `focus_on` to auto-complete steps
- **Import** routines or calendar blocks from phone exports
- **Scheduler** — marks steps as “due now” when their scheduled time hits

## Run locally

```bash
cd routine-automation
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

Open http://localhost:8080 on your computer or phone (use your machine’s LAN IP on mobile).

Phone setup details: [PHONE_SETUP.md](./PHONE_SETUP.md)

## API summary

| Endpoint | Description |
|----------|-------------|
| `GET /api/dashboard` | Today’s routines and progress |
| `POST /api/steps/{id}/complete` | Mark step done |
| `GET /api/steps/{id}/qr` | QR image for step |
| `POST /api/phone/event` | Phone automation webhook |
| `POST /api/phone/import` | Import JSON routines/calendar |
