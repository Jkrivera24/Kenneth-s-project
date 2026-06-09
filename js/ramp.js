const MAX = { pushups: 100, situps: 100, squats: 100, runKm: 10, steps: 10000 };
const START = { pushups: 10, situps: 10, squats: 10, runKm: 1, steps: 3000 };
const MAX_LEVEL = 50;

export function targetsForLevel(level, stepsOverride = 0) {
  const t = Math.min((level - 1) / (MAX_LEVEL - 1), 1);
  const ease = t * t * (3 - 2 * t);
  const targets = {
    pushups: Math.round(START.pushups + (MAX.pushups - START.pushups) * ease),
    situps: Math.round(START.situps + (MAX.situps - START.situps) * ease),
    squats: Math.round(START.squats + (MAX.squats - START.squats) * ease),
    runKm: Math.round((START.runKm + (MAX.runKm - START.runKm) * ease) * 10) / 10,
    steps: stepsOverride > 0
      ? stepsOverride
      : Math.round(START.steps + (MAX.steps - START.steps) * ease),
  };
  return targets;
}

export function xpToNextLevel(level) {
  return Math.floor(100 * Math.pow(1.12, level - 1));
}

export function rampProgress(level) {
  const current = targetsForLevel(level);
  return [
    { label: 'Push-ups', current: current.pushups, max: MAX.pushups },
    { label: 'Sit-ups', current: current.situps, max: MAX.situps },
    { label: 'Squats', current: current.squats, max: MAX.squats },
    { label: 'Run', current: `${current.runKm} km`, max: `${MAX.runKm} km` },
    { label: 'Steps', current: current.steps, max: MAX.steps },
  ];
}

export const EXERCISES = [
  { key: 'pushups', label: 'Push-ups', unit: 'reps', stat: 'STR', step: 1 },
  { key: 'situps', label: 'Sit-ups', unit: 'reps', stat: 'VIT', step: 1 },
  { key: 'squats', label: 'Squats', unit: 'reps', stat: 'AGI', step: 1 },
  { key: 'runKm', label: 'Run', unit: 'km', stat: 'AGI', step: 0.1 },
  { key: 'steps', label: 'Steps', unit: 'steps', stat: 'VIT', step: 100 },
];
