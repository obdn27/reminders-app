export const REMINDER_HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => index);
export const REMINDER_MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => index);
export const REMINDER_SECOND_OPTIONS = Array.from({ length: 60 }, (_, index) => index);

export function padTimePart(value) {
  return String(value).padStart(2, '0');
}

export function normalizeReminderTime(value) {
  if (!value) {
    return '09:30:00';
  }

  const parts = String(value).split(':');
  const hours = Number(parts[0] || 0);
  const minutes = Number(parts[1] || 0);
  const seconds = Number(parts[2] || 0);

  return `${padTimePart(hours)}:${padTimePart(minutes)}:${padTimePart(seconds)}`;
}

export function parseReminderTimeParts(value) {
  const normalized = normalizeReminderTime(value);
  const [hoursText, minutesText, secondsText] = normalized.split(':');
  return {
    hour: Number(hoursText),
    minute: Number(minutesText),
    second: Number(secondsText),
  };
}

export function buildReminderTime({ hour = 0, minute = 0, second = 0 }) {
  return `${padTimePart(hour)}:${padTimePart(minute)}:${padTimePart(second)}`;
}

export function formatReminderTime(value) {
  if (!value) return 'Not set';
  const { hour, minute, second } = parseReminderTimeParts(value);
  const date = new Date(2026, 0, 1, hour, minute, second);

  const includesSeconds = second > 0;
  return date.toLocaleTimeString([], includesSeconds
    ? { hour: 'numeric', minute: '2-digit', second: '2-digit' }
    : { hour: 'numeric', minute: '2-digit' });
}
