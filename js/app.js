import { loadState, saveState, exportState, todayKey, getDay, DEFAULT_STATE } from './storage.js';
import { xpToNextLevel, rampProgress, EXERCISES } from './ramp.js';
import {
  questProgress,
  completeQuest,
  markRestDay,
  applyPenaltyCheck,
  getAchievements,
  getWeeklyData,
  getHistory,
  getTargets,
} from './quest.js';
import { setSteps, addSteps, importStepsFromCsv } from './steps.js';

let state = loadState();

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function init() {
  registerSW();
  applyPenaltyCheck(state);
  bindTabs();
  bindQuest();
  bindSteps();
  bindSettings();
  scheduleReminders();
  renderAll();
}

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

function dateKey() {
  return todayKey(state.settings.timezone);
}

function persist() {
  saveState(state);
  renderAll();
}

function renderAll() {
  renderPlayer();
  renderQuest();
  renderSteps();
  renderStats();
  renderWeekly();
}

function renderPlayer() {
  const { player } = state;
  const next = xpToNextLevel(player.level);
  $('#player-name').textContent = player.name;
  $('#player-level').textContent = player.level;
  $('#player-xp').textContent = player.xp;
  $('#player-xp-next').textContent = next;
  $('#xp-bar').style.width = `${Math.min(100, (player.xp / next) * 100)}%`;
  $('#streak-display').textContent = `🔥 ${player.streak}`;
}

function renderQuest() {
  const key = dateKey();
  const { day, items, allDone } = questProgress(state, key);

  $('#quest-date').textContent = new Date(key + 'T12:00:00').toLocaleDateString('en', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: state.settings.timezone,
  });

  const greetings = [
    'The System has issued today\'s quest, Hunter.',
    'Daily quest available. Complete it before the Penalty Zone.',
    'Train on deck or in the gym — the quest awaits.',
    'Another watch, another chance to level up.',
  ];
  $('#system-greeting').textContent = greetings[day.completed ? 0 : (new Date().getDate() % greetings.length)];

  $('#rest-day-banner').classList.toggle('hidden', !day.restDay);
  $('#penalty-banner').classList.toggle('hidden', !state.penaltyActive);

  const list = $('#quest-list');
  list.innerHTML = items
    .filter((ex) => ex.key !== 'steps')
    .map(
      (ex) => `
    <div class="quest-item ${ex.done ? 'done' : ''}" data-key="${ex.key}">
      <div>
        <div class="quest-label">${ex.label}</div>
        <div class="quest-target">Target: ${ex.target} ${ex.unit}</div>
        <div class="quest-progress-text">${formatVal(ex.current, ex.key)} / ${formatVal(ex.target, ex.key)}</div>
      </div>
      <div class="quest-controls">
        <button type="button" data-action="dec" data-key="${ex.key}" aria-label="Decrease">−</button>
        <span class="quest-value">${formatVal(ex.current, ex.key)}</span>
        <button type="button" data-action="inc" data-key="${ex.key}" aria-label="Increase">+</button>
      </div>
    </div>`
    )
    .join('');

  const stepsEx = items.find((e) => e.key === 'steps');
  if (stepsEx) {
    list.innerHTML += `
    <div class="quest-item ${stepsEx.done ? 'done' : ''}" data-key="steps">
      <div>
        <div class="quest-label">${stepsEx.label} <span style="font-size:0.7rem;color:var(--text-dim)">(Mi Band)</span></div>
        <div class="quest-target">Target: ${stepsEx.target} steps</div>
        <div class="quest-progress-text">${stepsEx.current.toLocaleString()} / ${stepsEx.target.toLocaleString()}</div>
      </div>
      <div class="quest-controls">
        <button type="button" onclick="document.querySelector('[data-tab=steps]').click()">Track</button>
      </div>
    </div>`;
  }

  list.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (day.restDay || day.completed) return;
      const ex = EXERCISES.find((e) => e.key === btn.dataset.key);
      const d = getDay(state, key);
      const delta = btn.dataset.action === 'inc' ? ex.step : -ex.step;
      d[ex.key] = Math.max(0, Math.round((d[ex.key] + delta) * 10) / 10);
      persist();
    });
  });

  const btnComplete = $('#btn-complete-quest');
  btnComplete.disabled = !allDone || day.completed || day.restDay;
  btnComplete.textContent = day.completed ? 'Quest Completed ✓' : 'Complete Quest';

  renderCustomQuests(day);
}

function formatVal(v, key) {
  if (key === 'runKm') return Number(v).toFixed(1);
  return Math.floor(v);
}

function renderCustomQuests(day) {
  const list = $('#custom-quest-list');
  if (state.customQuests.length === 0) {
    list.innerHTML = '<p class="hint">Add ship-friendly extras: planks, pull-ups, deck laps…</p>';
    return;
  }
  list.innerHTML = state.customQuests
    .map(
      (q, i) => `
    <div class="custom-quest-item">
      <label><input type="checkbox" data-custom="${i}" ${day.customDone[i] ? 'checked' : ''} ${day.restDay || day.completed ? 'disabled' : ''}> ${escapeHtml(q.name)}</label>
      <button type="button" class="btn small secondary" data-remove-custom="${i}">×</button>
    </div>`
    )
    .join('');

  list.querySelectorAll('[data-custom]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const d = getDay(state, dateKey());
      d.customDone[cb.dataset.custom] = cb.checked;
      persist();
    });
  });

  list.querySelectorAll('[data-remove-custom]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.removeCustom, 10);
      state.customQuests.splice(i, 1);
      persist();
    });
  });
}

function renderSteps() {
  const key = dateKey();
  const day = getDay(state, key);
  const targets = getTargets(state);
  const goal = targets.steps;
  const pct = Math.min(100, (day.steps / goal) * 100);

  $('#steps-today').textContent = day.steps.toLocaleString();
  $('#steps-goal').textContent = goal.toLocaleString();
  $('#steps-bar').style.width = `${pct}%`;
  $('#steps-input').value = day.steps || '';
}

function renderStats() {
  const { stats } = state.player;
  const maxStat = Math.max(...Object.values(stats), 50);
  const labels = { STR: 'Strength', AGI: 'Agility', VIT: 'Vitality', INT: 'Intelligence', SEN: 'Sense' };

  $('#stats-grid').innerHTML = Object.entries(stats)
    .map(
      ([k, v]) => `
    <div class="stat-row">
      <span class="stat-name">${k}</span>
      <div class="stat-bar-wrap"><div class="stat-bar" style="width:${(v / maxStat) * 100}%"></div></div>
      <span class="stat-val" title="${labels[k]}">${v}</span>
    </div>`
    )
    .join('');

  $('#achievements-list').innerHTML = getAchievements(state)
    .map((a) => `<span class="achievement ${a.unlocked ? 'unlocked' : 'locked'}">${a.name}</span>`)
    .join('');

  $('#ramp-progress').innerHTML = rampProgress(state.player.level)
    .map((r) => `<div class="ramp-row"><span>${r.label}</span><span>${r.current} → ${r.max}</span></div>`)
    .join('');
}

function renderWeekly() {
  const { days, completed, totalXp, totalSteps } = getWeeklyData(state, state.settings.timezone);

  $('#weekly-summary').innerHTML = `
    <div class="summary-card"><div class="val">${completed}/7</div><div class="lbl">Quests done</div></div>
    <div class="summary-card"><div class="val">${totalXp}</div><div class="lbl">XP this week</div></div>
    <div class="summary-card"><div class="val">${totalSteps.toLocaleString()}</div><div class="lbl">Steps</div></div>
    <div class="summary-card"><div class="val">${state.player.streak}</div><div class="lbl">Streak</div></div>`;

  const maxXp = Math.max(...days.map((d) => d.xp), 1);
  $('#weekly-chart').innerHTML = days
    .map((d) => {
      const h = d.completed ? Math.max(8, (d.xp / maxXp) * 100) : d.restDay ? 20 : 8;
      const cls = d.completed ? '' : d.restDay ? 'rest' : d.hasData ? 'miss' : '';
      return `
      <div class="chart-bar-wrap">
        <div class="chart-bar ${cls}" style="height:${h}%"></div>
        <span class="chart-label">${d.label}</span>
      </div>`;
    })
    .join('');

  $('#history-list').innerHTML =
    getHistory(state)
      .map(({ key, day, status }) => {
        const labels = { complete: '✓ Complete', rest: '⚓ Rest', partial: '◐ Partial', miss: '✗ Missed' };
        return `
      <div class="history-item">
        <span>${key}</span>
        <span class="status-${status}">${labels[status]}${day.xpEarned ? ` +${day.xpEarned} XP` : ''}</span>
      </div>`;
      })
      .join('') || '<p class="hint">No history yet. Complete your first quest!</p>';
}

function bindTabs() {
  $$('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.tab').forEach((t) => t.classList.remove('active'));
      $$('.tab-panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      $(`#tab-${tab.dataset.tab}`).classList.add('active');
    });
  });
}

function bindQuest() {
  $('#btn-complete-quest').addEventListener('click', () => {
    const result = completeQuest(state, dateKey());
    if (result.ok) {
      showToast(result.leveled ? `Quest complete! +${result.xp} XP — LEVEL UP!` : `Quest complete! +${result.xp} XP`);
      persist();
    } else {
      showToast(result.message);
    }
  });

  $('#btn-rest-day').addEventListener('click', () => {
    const result = markRestDay(state, dateKey());
    showToast(result.ok ? result.message : result.message);
    persist();
  });

  $('#custom-quest-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#custom-quest-name');
    const name = input.value.trim();
    if (!name) return;
    state.customQuests.push({ name, created: Date.now() });
    input.value = '';
    persist();
  });
}

function bindSteps() {
  $('#btn-set-steps').addEventListener('click', () => {
    const val = parseInt($('#steps-input').value, 10);
    if (isNaN(val)) return;
    setSteps(state, val, dateKey());
    showToast(`Steps set to ${val.toLocaleString()}`);
    persist();
  });

  $$('[data-steps]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const delta = parseInt(btn.dataset.steps, 10);
      const total = addSteps(state, delta, dateKey());
      showToast(`Steps: ${total.toLocaleString()}`);
      persist();
    });
  });

  $('#csv-import').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const result = importStepsFromCsv(state, text, state.settings.timezone);
    showToast(result.error || result.message);
    if (result.ok) persist();
    e.target.value = '';
  });
}

function bindSettings() {
  const dialog = $('#settings-dialog');
  $('#btn-settings').addEventListener('click', () => {
    populateTimezoneSelect();
    $('#setting-name').value = state.player.name;
    $('#setting-timezone').value = state.settings.timezone;
    $('#setting-watch-start').value = state.settings.watchStart;
    $('#setting-watch-end').value = state.settings.watchEnd;
    $('#setting-reminders').checked = state.settings.reminders;
    $('#setting-reminder-time').value = state.settings.reminderTime;
    $('#setting-steps-override').value = state.settings.stepsGoalOverride;
    dialog.showModal();
  });

  $('#settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.player.name = $('#setting-name').value.trim() || 'Hunter';
    state.settings.timezone = $('#setting-timezone').value;
    state.settings.watchStart = $('#setting-watch-start').value;
    state.settings.watchEnd = $('#setting-watch-end').value;
    state.settings.reminders = $('#setting-reminders').checked;
    state.settings.reminderTime = $('#setting-reminder-time').value;
    state.settings.stepsGoalOverride = parseInt($('#setting-steps-override').value, 10) || 0;
    dialog.close();
    scheduleReminders();
    persist();
    showToast('Settings saved.');
  });

  $('#btn-export').addEventListener('click', () => {
    exportState(state);
    showToast('Backup downloaded.');
  });

  $('#btn-reset').addEventListener('click', () => {
    if (confirm('Reset all progress? This cannot be undone.')) {
      state = structuredClone(DEFAULT_STATE);
      persist();
      showToast('Progress reset.');
      dialog.close();
    }
  });
}

function populateTimezoneSelect() {
  const sel = $('#setting-timezone');
  if (sel.options.length > 0) return;
  const zones = Intl.supportedValuesOf('timeZone');
  for (const z of zones) {
    const opt = document.createElement('option');
    opt.value = z;
    opt.textContent = z.replace(/_/g, ' ');
    sel.appendChild(opt);
  }
}

async function scheduleReminders() {
  if (!state.settings.reminders || !('Notification' in window)) return;

  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
  if (Notification.permission !== 'granted') return;

  const [rh, rm] = state.settings.reminderTime.split(':').map(Number);
  const now = new Date();
  const next = new Date(now);
  next.setHours(rh, rm, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);

  const delay = next.getTime() - now.getTime();
  setTimeout(() => {
    const key = dateKey();
    const { day, allDone } = questProgress(state, key);
    if (!day.completed && !day.restDay && !allDone) {
      new Notification('Solo Watch — Daily Quest', {
        body: 'Your daily quest awaits, Hunter. Train before the Penalty Zone.',
        icon: './icons/icon.svg',
        tag: 'solo-watch-reminder',
      });
    }
    scheduleReminders();
  }, Math.min(delay, 2147483647));
}

function showToast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.add('hidden'), 3000);
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
