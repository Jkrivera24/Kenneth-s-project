import { getDay, todayKey } from './storage.js';

export function setSteps(state, count, dateKey) {
  const day = getDay(state, dateKey);
  day.steps = Math.max(0, Math.floor(count));
  return day.steps;
}

export function addSteps(state, delta, dateKey) {
  const day = getDay(state, dateKey);
  day.steps = Math.max(0, day.steps + delta);
  return day.steps;
}

export function parseZeppCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { error: 'File is empty or invalid.' };

  const header = lines[0].toLowerCase();
  const rows = lines.slice(1).filter(Boolean);

  const dailySteps = {};

  if (header.includes('step') && (header.includes('date') || header.includes('time'))) {
    const cols = lines[0].split(',').map((c) => c.trim().toLowerCase());
    const dateIdx = cols.findIndex((c) => c.includes('date') || c === 'time' || c === 'day');
    const stepIdx = cols.findIndex((c) => c.includes('step'));

    for (const row of rows) {
      const parts = row.split(',');
      const dateRaw = parts[dateIdx]?.trim();
      const steps = parseInt(parts[stepIdx], 10);
      if (!dateRaw || isNaN(steps)) continue;
      const key = normalizeDate(dateRaw);
      if (key) dailySteps[key] = (dailySteps[key] || 0) + steps;
    }
  } else if (header.includes('hour') || header.includes('time')) {
    const cols = lines[0].split(',').map((c) => c.trim().toLowerCase());
    const dateIdx = cols.findIndex((c) => c.includes('date') || c === 'day');
    const stepIdx = cols.findIndex((c) => c.includes('step'));
    const timeIdx = cols.findIndex((c) => c.includes('time') || c.includes('hour'));

    for (const row of rows) {
      const parts = row.split(',');
      let dateRaw = parts[dateIdx]?.trim() || parts[timeIdx]?.trim();
      const steps = parseInt(parts[stepIdx], 10);
      if (!dateRaw || isNaN(steps)) continue;
      const key = normalizeDate(dateRaw);
      if (key) dailySteps[key] = (dailySteps[key] || 0) + steps;
    }
  } else {
    for (const row of rows) {
      const parts = row.split(',');
      for (let i = 0; i < parts.length; i++) {
        const key = normalizeDate(parts[i]?.trim());
        if (key && i + 1 < parts.length) {
          const steps = parseInt(parts[i + 1], 10);
          if (!isNaN(steps)) {
            dailySteps[key] = (dailySteps[key] || 0) + steps;
            break;
          }
        }
      }
    }
  }

  const entries = Object.entries(dailySteps);
  if (entries.length === 0) return { error: 'No step data found. Try exporting from Zepp Life.' };

  return { dailySteps, count: entries.length };
}

function normalizeDate(raw) {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  const m = raw.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  return null;
}

export function importStepsFromCsv(state, text, timezone) {
  const result = parseZeppCsv(text);
  if (result.error) return result;

  const today = todayKey(timezone);
  let imported = 0;

  for (const [key, steps] of Object.entries(result.dailySteps)) {
    const day = getDay(state, key);
    if (steps > day.steps) {
      day.steps = steps;
      imported++;
    }
  }

  return {
    ok: true,
    imported,
    todaySteps: getDay(state, today).steps,
    message: `Imported steps for ${imported} day(s).`,
  };
}
