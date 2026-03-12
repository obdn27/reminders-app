const state = {
  debugEnabled: false,
  offsetMs: 0,
  timerSpeed: 1,
};

const listeners = new Set();

function emit() {
  const snapshot = getDebugSnapshot();
  listeners.forEach((listener) => {
    listener(snapshot);
  });
}

function clampTimerSpeed(value) {
  const num = Number(value) || 1;
  return Math.min(120, Math.max(1, num));
}

export function getDebugSnapshot() {
  return {
    debugEnabled: state.debugEnabled,
    offsetMs: state.offsetMs,
    timerSpeed: state.timerSpeed,
  };
}

export function subscribeTimeMachine(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setDebugEnabled(enabled) {
  state.debugEnabled = Boolean(enabled);
  emit();
}

export function setTimerSpeed(speed) {
  state.timerSpeed = clampTimerSpeed(speed);
  emit();
}

export function resetTimeDebug() {
  state.offsetMs = 0;
  state.timerSpeed = 1;
  state.debugEnabled = false;
  emit();
}

export function advanceTime({ minutes = 0, hours = 0, days = 0 } = {}) {
  const deltaMs =
    (Number(minutes) || 0) * 60 * 1000 +
    (Number(hours) || 0) * 60 * 60 * 1000 +
    (Number(days) || 0) * 24 * 60 * 60 * 1000;

  state.offsetMs += deltaMs;
  emit();
}

export function getNowMs() {
  const offset = state.debugEnabled ? state.offsetMs : 0;
  return Date.now() + offset;
}

export function getNowDate() {
  return new Date(getNowMs());
}

export function getNowIso() {
  return new Date(getNowMs()).toISOString();
}

export function getTimerSpeed() {
  return state.debugEnabled ? state.timerSpeed : 1;
}

export function getAsOfDateParam() {
  if (!state.debugEnabled) {
    return null;
  }
  return getNowIso().slice(0, 10);
}
