export function parseEventDate(input, now = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/.exec(input.trim());
  if (!match) throw new Error('Use YYYY-MM-DD HH:mm, for example 2026-12-20 10:00 (Sri Lanka time).');
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const wall = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (year < 2000 || wall.getUTCFullYear() !== year || wall.getUTCMonth() !== month - 1 || wall.getUTCDate() !== day || hour > 23 || minute > 59) throw new Error('Enter a real calendar date and time.');
  const result = new Date(wall.getTime() - 330 * 60000);
  if (result <= now) throw new Error('The event must start in the future.');
  return result;
}
export function eventStart(event) {
  const value = event.date?.toDate ? event.date.toDate() : event.date instanceof Date ? event.date : null;
  if (value && Number.isFinite(value.getTime())) return value;
  if (typeof event.dateString === 'string') {
    try { return parseEventDate(event.dateString, new Date(0)); } catch { return null; }
  }
  return null;
}
export function upcomingEvents(events, now = new Date()) {
  const sriLankaDay = Math.floor((now.getTime() + 330 * 60000) / 86400000) * 86400000 - 330 * 60000;
  return events.filter(event => eventStart(event)?.getTime() >= sriLankaDay)
    .sort((a, b) => eventStart(a) - eventStart(b));
}
export function eventDateLabel(event) {
  const date = eventStart(event);
  return date && Number.isFinite(date.getTime())
    ? date.toLocaleString('en-GB', { timeZone: 'Asia/Colombo', dateStyle: 'medium', timeStyle: 'short' }) + ' (Sri Lanka)'
    : event.dateString || 'Date needs correction';
}
