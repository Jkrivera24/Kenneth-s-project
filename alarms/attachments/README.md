# Photos and videos for alarm incidents

HMI screenshots, panel photos, and short troubleshooting clips belong here — **one folder per incident**.

```text
alarms/attachments/
  ALM-2026-0602-001/
    hmi-network-status.jpg
    st6-panel.mp4
  ALM-2026-0603-001/
    alarm-screen.jpg
```

## Can Cursor or GitHub read my phone camera roll?

**No.** Nothing in this repo can open your phone’s Photos app or access your camera roll automatically.

You choose which files to upload. The workflow is:

1. Take a photo or video on your phone (as you normally would).
2. Upload those files to GitHub under `alarms/attachments/<incident-id>/`.
3. Optionally list filenames in the spreadsheet `attachments` column so the sync bot embeds them in the incident `.md` file.

## Upload from your phone (GitHub app)

1. Open **Kenneth-s-project** in the **GitHub** app.
2. Tap **Code** → browse to `alarms` → `attachments`.
3. Tap **Add file** → **Upload files** (or create folder `ALM-2026-0602-001` first).
4. Select photo(s) or video(s) from your phone.
5. Commit with a short message, e.g. `Add HMI screenshot for ALM-2026-0602-001`.
6. In the incident markdown (or spreadsheet `attachments` column), reference the filenames:
   - `hmi-network-status.jpg`
   - or `hmi-network-status.jpg; st6-panel.mp4` (semicolon between files)

## iPhone HEIC photos

iPhones often save **HEIC** files. GitHub may not preview them in the browser.

**Easiest fix:** Settings → Camera → Formats → **Most Compatible** (JPEG).

Or convert to JPEG before upload (Files app, Photos export, or a converter app).

## Video tips

- Keep clips **short** (under ~25 MB) so upload works on ship Wi‑Fi.
- `.mp4` and `.mov` work well.
- Videos appear as **download links** in the incident file (not inline players).

## Linking without the spreadsheet

Edit the incident `.md` directly and add under **Photos and videos**:

```markdown
![HMI network status](../attachments/ALM-2026-0602-001/hmi-network-status.jpg)
```

From `alarms/resolved/icms/`, use `../../attachments/...` instead of `../attachments/...`.

If you use the CSV sync bot, listing files in the `attachments` column rebuilds this section automatically.
