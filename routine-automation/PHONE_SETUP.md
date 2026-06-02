# Connect your phone to Daily Routine

This app cannot access your phone directly. You connect it with **QR scan**, **webhooks**, or **JSON import**.

## 1. Quick start (any phone)

1. Run the server (see README).
2. Open the dashboard on your phone’s browser (same Wi‑Fi or a public URL).
3. Tap **Open QR scanner** or add `/scan` to your home screen.
4. Tap **QR** next to any step to print/show a code — scan it to mark the step done.

## 2. iOS Shortcuts (automate from your phone)

Create a Shortcut that runs when something happens (alarm, Focus mode, leaving home, etc.):

1. Add action **Get Contents of URL**
2. Method: **POST**
3. URL: `https://YOUR-SERVER/api/phone/event`
4. Headers: `Content-Type` = `application/json`
5. Request body (JSON):

```json
{
  "event_type": "wake",
  "source": "ios_shortcuts"
}
```

Replace `event_type` with one of:

| Event | When to fire |
|-------|----------------|
| `wake` | Alarm dismissed or first unlock in the morning |
| `left_home` | Automation: When I leave home |
| `arrived_home` | When I arrive home |
| `focus_on` | Focus mode turned on |
| `focus_off` | Focus mode turned off |
| `bedtime` | Wind Down / Sleep schedule |

Each event can auto-complete a mapped routine step (see app code) or you can extend mappings in `app/main.py`.

### Complete a specific step from Shortcuts

```json
POST /api/steps/STEP_ID/complete
{"source": "ios_shortcuts"}
```

## 3. Android (Tasker)

**Tasker → HTTP Request**

- Method: POST  
- URL: `https://YOUR-SERVER/api/phone/event`  
- Body / Headers: `Content-Type: application/json`  
- Body example: `{"event_type":"arrived_home","source":"tasker"}`  

Trigger examples: geofence exit/enter, DND on/off, bedtime alarm.

## 4. Import calendar or custom routines

Export or copy JSON from a notes app, then use the **Import** tab or:

```bash
curl -X POST https://YOUR-SERVER/api/phone/import \
  -H "Content-Type: application/json" \
  -d '{"routines":[{"name":"Weekday","period":"day","steps":[{"title":"Standup","time":"09:00"}]}]}'
```

## 5. Security note

If you expose this on the internet, put it behind a VPN, reverse proxy with auth, or add an API key check. The default build is for personal use on a trusted network.
