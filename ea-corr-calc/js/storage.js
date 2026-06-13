import {
  DEFAULT_SETTINGS,
  DEFAULT_TRENDS,
  DEFAULT_PIP_VALUES,
} from './risk.js';

const KEY = 'ea-corr-calc-v1';

function defaults() {
  return {
    settings: { ...DEFAULT_SETTINGS },
    trends: { ...DEFAULT_TRENDS },
    pipValues: JSON.parse(JSON.stringify(DEFAULT_PIP_VALUES)),
    positions: [],
    pendingDrafts: [],
    lastPending: null,
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    return { ...defaults(), ...JSON.parse(raw) };
  } catch {
    return defaults();
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function updateSettings(state, patch) {
  state.settings = { ...state.settings, ...patch };
  saveState(state);
  return state;
}

export function updateTrends(state, trends) {
  state.trends = { ...state.trends, ...trends };
  saveState(state);
  return state;
}

export function setPositions(state, positions) {
  state.positions = positions;
  saveState(state);
  return state;
}

export function addPosition(state, pos) {
  state.positions = [...state.positions, { id: crypto.randomUUID(), ...pos }];
  saveState(state);
  return state;
}

export function removePosition(state, id) {
  state.positions = state.positions.filter((p) => p.id !== id);
  saveState(state);
  return state;
}

export function savePendingDraft(state, draft) {
  const entry = { id: crypto.randomUUID(), savedAt: new Date().toISOString(), ...draft };
  state.pendingDrafts = [entry, ...state.pendingDrafts].slice(0, 20);
  state.lastPending = draft;
  saveState(state);
  return state;
}

export function deletePendingDraft(state, id) {
  state.pendingDrafts = state.pendingDrafts.filter((d) => d.id !== id);
  saveState(state);
  return state;
}
