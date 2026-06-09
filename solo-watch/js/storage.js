const STORAGE_KEY = 'solo-watch-v1';

export const DEFAULT_STATE = {
  player: {
    name: 'Hunter',
    level: 1,
    xp: 0,
    stats: { STR: 10, AGI: 10, VIT: 10, INT: 10, SEN: 10 },
    streak: 0,
    bestStreak: 0,
    totalQuests: 0,
    achievements: [],
    xpBonusTomorrow: 0,
  },
  settings: {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    watchStart: '00:00',
    watchEnd: '04:00',
    reminders: false,
    reminderTime: '10:00',
    stepsGoalOverride: 0,
  },
  days: {},
  customQuests: [],
  penaltyActive: false,
};

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return mergeDeep(structuredClone(DEFAULT_STATE), parsed);
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportState(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `solo-watch-backup-${todayKey()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function mergeDeep(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      mergeDeep(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

export function todayKey(timezone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function getDay(state, dateKey) {
  if (!state.days[dateKey]) {
    state.days[dateKey] = {
      pushups: 0,
      situps: 0,
      squats: 0,
      runKm: 0,
      steps: 0,
      restDay: false,
      completed: false,
      customDone: {},
      xpEarned: 0,
    };
  }
  return state.days[dateKey];
}
