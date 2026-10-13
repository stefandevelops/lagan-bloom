import { HOURS } from './data.js';

// A Date whose local fields read as the current wall-clock time in Belfast.
export function belfastNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/London' }));
}

export const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const minutesOf = (d) => d.getHours() * 60 + d.getMinutes();

export function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, '0')}${suffix}` : `${h12}${suffix}`;
}

export function openStatus(now = belfastNow()) {
  const today = HOURS[now.getDay()];
  const mins = minutesOf(now);
  if (mins >= toMinutes(today.open) && mins < toMinutes(today.close)) {
    const left = toMinutes(today.close) - mins;
    return { open: true, text: left <= 60 ? `Open now · closing soon (${formatTime(today.close)})` : `Open now · closes ${formatTime(today.close)}` };
  }
  if (mins < toMinutes(today.open)) return { open: false, text: `Closed · opens today at ${formatTime(today.open)}` };
  const next = HOURS[(now.getDay() + 1) % 7];
  return { open: false, text: `Closed · opens tomorrow at ${formatTime(next.open)}` };
}

export function formatCountdown(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m} minutes`;
}

export function dayLabel(date, now = belfastNow()) {
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((b - a) / 86400000);
  const base = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  if (diff === 0) return `Today, ${base}`;
  if (diff === 1) return `Tomorrow, ${base}`;
  return base;
}

export function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
