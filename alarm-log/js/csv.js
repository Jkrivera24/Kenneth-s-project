import { CSV_COLUMNS } from './storage.js';

function esc(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function alarmsToCsv(alarms) {
  const lines = [CSV_COLUMNS.join(',')];
  for (const alarm of alarms) {
    lines.push(CSV_COLUMNS.map((col) => esc(alarm[col] ?? '')).join(','));
  }
  return lines.join('\n') + '\n';
}

export function downloadCsv(alarms, filename = 'incident-log.csv') {
  const blob = new Blob([alarmsToCsv(alarms)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && next === '\n') i++;
      row.push(cell);
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((c) => c.trim())) rows.push(row);
  }
  if (!rows.length) return [];

  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cells) => {
    const alarm = {};
    headers.forEach((h, idx) => {
      alarm[h] = cells[idx] ?? '';
    });
    return alarm;
  }).filter((a) => a.id);
}
