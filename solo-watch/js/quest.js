import { targetsForLevel, xpToNextLevel, EXERCISES } from './ramp.js';
import { getDay, todayKey } from './storage.js';

const ACHIEVEMENTS = [
  { id: 'first_quest', name: '⚓ First Watch', check: (s) => s.player.totalQuests >= 1 },
  { id: 'streak_7', name: '🔥 7-Day Streak', check: (s) => s.player.bestStreak >= 7 },
  { id: 'streak_30', name: '🌊 30-Day Streak', check: (s) => s.player.bestStreak >= 30 },
  { id: 'level_10', name: '⭐ Level 10', check: (s) => s.player.level >= 10 },
  { id: 'level_25', name: '💎 Level 25', check: (s) => s.player.level >= 25 },
  { id: 'full_quest', name: '🏆 Full Daily Quest', check: (s) => s.player.level >= 50 },
  { id: 'steps_10k', name: '👟 10K Steps', check: (s) => Object.values(s.days).some((d) => d.steps >= 10000) },
  { id: 'penalty_survivor', name: '💀 Penalty Survivor', check: (s) => s.player.achievements.includes('penalty_survivor') },
];

export function getTargets(state) {
  return targetsForLevel(state.player.level, state.settings.stepsGoalOverride);
}

export function questProgress(state, dateKey) {
  const day = getDay(state, dateKey);
  const targets = getTargets(state);
  const items = EXERCISES.map((ex) => ({
    ...ex,
    current: day[ex.key] ?? 0,
    target: targets[ex.key],
    done: (day[ex.key] ?? 0) >= targets[ex.key],
  }));
  const allDone = items.every((i) => i.done) && !day.restDay;
  return { day, targets, items, allDone };
}

export function isQuestComplete(state, dateKey) {
  const { allDone, day } = questProgress(state, dateKey);
  return allDone || day.completed;
}

export function applyPenaltyCheck(state) {
  const tz = state.settings.timezone;
  const today = todayKey(tz);
  const yesterday = offsetDateKey(today, -1);
  const yDay = state.days[yesterday];
  if (yDay && !yDay.restDay && !yDay.completed && hasAnyProgress(yDay)) {
    const { allDone } = questProgressForDay(state, yesterday, yDay);
    if (!allDone) state.penaltyActive = true;
  }
  if (yDay && !yDay.restDay && !yDay.completed && !hasAnyProgress(yDay)) {
    state.player.streak = 0;
  }
}

function hasAnyProgress(day) {
  return EXERCISES.some((ex) => (day[ex.key] ?? 0) > 0);
}

function questProgressForDay(state, dateKey, day) {
  const targets = getTargets(state);
  const items = EXERCISES.map((ex) => ({
    ...ex,
    current: day[ex.key] ?? 0,
    target: targets[ex.key],
    done: (day[ex.key] ?? 0) >= targets[ex.key],
  }));
  return { items, allDone: items.every((i) => i.done) };
}

function offsetDateKey(key, days) {
  const d = new Date(key + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function completeQuest(state, dateKey) {
  const { day, allDone } = questProgress(state, dateKey);
  if (!allDone || day.completed) return { ok: false, message: 'Quest not finished yet.' };

  let xp = 50;
  xp += Math.floor(day.pushups * 0.5 + day.situps * 0.5 + day.squats * 0.5);
  xp += Math.floor(day.runKm * 10);
  xp += Math.floor(day.steps / 200);
  if (state.penaltyActive) xp = Math.floor(xp * 0.5);
  if (state.player.xpBonusTomorrow > 0) {
    xp = Math.floor(xp * (1 + state.player.xpBonusTomorrow));
    state.player.xpBonusTomorrow = 0;
  }

  const hadPenalty = state.penaltyActive;
  day.completed = true;
  day.xpEarned = xp;
  state.player.xp += xp;
  state.player.totalQuests += 1;
  state.player.streak += 1;
  state.player.bestStreak = Math.max(state.player.bestStreak, state.player.streak);
  state.penaltyActive = false;

  applyStatGains(state, day);
  levelUpLoop(state);
  checkAchievements(state);
  if (hadPenalty) unlockAchievement(state, 'penalty_survivor');

  return { ok: true, xp, leveled: state._leveled };
}

export function markRestDay(state, dateKey) {
  const day = getDay(state, dateKey);
  if (day.completed) return { ok: false, message: 'Quest already completed today.' };
  day.restDay = true;
  state.player.xpBonusTomorrow = 0.25;
  return { ok: true, message: 'Rest day logged. +25% XP bonus tomorrow.' };
}

function applyStatGains(state, day) {
  state.player.stats.STR += Math.min(3, Math.floor(day.pushups / 30));
  state.player.stats.VIT += Math.min(3, Math.floor((day.situps + day.steps / 2000) / 20));
  state.player.stats.AGI += Math.min(3, Math.floor((day.squats + day.runKm * 10) / 15));
  state.player.stats.INT += 1;
  state.player.stats.SEN += 1;
}

function levelUpLoop(state) {
  state._leveled = false;
  let needed = xpToNextLevel(state.player.level);
  while (state.player.xp >= needed) {
    state.player.xp -= needed;
    state.player.level += 1;
    state._leveled = true;
    needed = xpToNextLevel(state.player.level);
  }
}

function checkAchievements(state) {
  for (const ach of ACHIEVEMENTS) {
    if (!state.player.achievements.includes(ach.id) && ach.check(state)) {
      state.player.achievements.push(ach.id);
    }
  }
}

function unlockAchievement(state, id) {
  if (!state.player.achievements.includes(id)) {
    state.player.achievements.push(id);
  }
}

export function getAchievements(state) {
  return ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: state.player.achievements.includes(a.id),
  }));
}

export function getWeeklyData(state, timezone) {
  const today = todayKey(timezone);
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const key = offsetDateKey(today, -i);
    const day = state.days[key];
    days.push({
      key,
      label: new Date(key + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }),
      completed: day?.completed ?? false,
      restDay: day?.restDay ?? false,
      xp: day?.xpEarned ?? 0,
      steps: day?.steps ?? 0,
      hasData: !!day,
    });
  }
  const completed = days.filter((d) => d.completed).length;
  const totalXp = days.reduce((s, d) => s + d.xp, 0);
  const totalSteps = days.reduce((s, d) => s + d.steps, 0);
  return { days, completed, totalXp, totalSteps };
}

export function getHistory(state, limit = 14) {
  return Object.entries(state.days)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, limit)
    .map(([key, day]) => ({
      key,
      day,
      status: day.restDay ? 'rest' : day.completed ? 'complete' : hasAnyProgress(day) ? 'partial' : 'miss',
    }));
}
