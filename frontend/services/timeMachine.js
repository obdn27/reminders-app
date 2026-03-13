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

export function setAbsoluteDebugTime(dateLike) {
  const nextDate = new Date(dateLike);
  state.offsetMs = nextDate.getTime() - Date.now();
  state.debugEnabled = true;
  emit();
}

export function applyRemoteDebugSnapshot(snapshot) {
  if (!snapshot?.effectiveNow) {
    return;
  }
  state.debugEnabled = Boolean(snapshot.fakeEnabled);
  state.offsetMs = new Date(snapshot.effectiveNow).getTime() - Date.now();
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

export function advanceTime({ minutes = 0, hours = 0, days = 0, seconds = 0 } = {}) {
  const deltaMs =
    (Number(seconds) || 0) * 1000 +
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

export function formatDateParam(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTimerSpeed() {
  return state.debugEnabled ? state.timerSpeed : 1;
}

export function getAsOfDateParam() {
  if (!state.debugEnabled) {
    return null;
  }
  return formatDateParam(getNowDate());
}
