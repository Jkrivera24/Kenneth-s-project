const STORAGE_KEY = 'alarm-log-v1';

export const CSV_COLUMNS = [
  'id', 'status', 'date_time', 'system', 'equipment', 'alarm_tags',
  'as_shown_on_hmi', 'alarm_code', 'hmi_status', 'manual_ref', 'manual_says',
  'not_in_manual', 'steps_tried', 'root_cause', 'verified_by', 'related_id', 'notes',
];

export const STATUSES = ['IN PROGRESS', 'CLEARED', 'RESET', 'DONE', 'RECURRING'];

export const SAMPLE_ALARM = {
  id: 'ALM-2026-0602-001',
  status: 'CLEARED',
  date_time: '2026-06-02 13:11:48',
  system: 'ICMS / PCMECR',
  equipment: 'PCMECR ST.6 [M], ST.6M [ML/RL], Extension alarm',
  alarm_tags: 'PCMECR_6_M; PCMECR_6M_ML; PCMECR_6M_RL',
  as_shown_on_hmi:
    'PCMECR ST.6 [M] NO REPLY | PCMECR ST.6M [ML] COMM ERR | PCMECR ST.6M [RL] COMM ERR | EXT ALARM SYSTEM PWR FAIL',
  alarm_code: '14',
  hmi_status: 'ERR',
  manual_ref: 'Integrated Control and Monitoring System — Ch.__ p.__',
  manual_says: 'Check station power and Ethernet for ST.6.',
  not_in_manual: '',
  steps_tried:
    '1. Powered off HISCM1 ~1 min restarted - not cleared | 2. Switched off AMS No.1 and No.2 together ~1 min | 3. After restart all alarms cleared',
  root_cause: 'unknown',
  verified_by: '',
  related_id: '',
  notes:
    'ST.6: PMS G/E WECS SHAFT PWR. Servers/EPCM green. EXT ALARM SYSTEM PWR FAIL active. Cleared June 02 2026.',
};

export function emptyAlarm() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const date =
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  return {
    id: nextId(now),
    status: 'IN PROGRESS',
    date_time: date,
    system: 'ICMS / PCMECR',
    equipment: '',
    alarm_tags: '',
    as_shown_on_hmi: '',
    alarm_code: '',
    hmi_status: 'ERR',
    manual_ref: '',
    manual_says: '',
    not_in_manual: '',
    steps_tried: '',
    root_cause: 'unknown',
    verified_by: '',
    related_id: '',
    notes: '',
  };
}

export function nextId(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const prefix = `ALM-${date.getFullYear()}-${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const alarms = loadAlarms();
  const sameDay = alarms.filter((a) => a.id.startsWith(prefix));
  const n = sameDay.length + 1;
  return `${prefix}-${String(n).padStart(3, '0')}`;
}

export function loadAlarms() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [structuredClone(SAMPLE_ALARM)];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [structuredClone(SAMPLE_ALARM)];
  } catch {
    return [structuredClone(SAMPLE_ALARM)];
  }
}

export function saveAlarms(alarms) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
}

export function getAlarm(id) {
  return loadAlarms().find((a) => a.id === id) || null;
}

export function upsertAlarm(alarm) {
  const alarms = loadAlarms();
  const i = alarms.findIndex((a) => a.id === alarm.id);
  if (i >= 0) alarms[i] = alarm;
  else alarms.unshift(alarm);
  saveAlarms(alarms);
  return alarms;
}

export function deleteAlarm(id) {
  const alarms = loadAlarms().filter((a) => a.id !== id);
  saveAlarms(alarms.length ? alarms : [structuredClone(SAMPLE_ALARM)]);
  return alarms;
}
