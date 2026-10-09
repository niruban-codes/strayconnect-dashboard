import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEventDate, eventDateLabel, upcomingEvents } from '../src/utils/eventDate.js';
const now = new Date('2026-01-01T00:00:00Z');
test('event parser respects Sri Lanka time and real calendar dates', () => {
  assert.equal(parseEventDate('2028-02-29 10:30', now).toISOString(), '2028-02-29T05:00:00.000Z');
  for (const value of ['tomorrow', '2026-02-29 10:30', '2026-04-31 12:00', '2026-12-01 24:00', '2026-12-01 10:60', '2026-13-01 10:00', '2026-01-01 05:29']) assert.throws(() => parseEventDate(value, now));
});
test('event display uses stored timestamp rather than conflicting old text', () => {
  const label = eventDateLabel({ date: new Date('2026-12-20T04:30:00Z'), dateString: 'tomorrow' });
  assert.match(label, /10:00/);
  assert.doesNotMatch(label, /tomorrow/);
});

test('event feed excludes malformed dates and rolls over at Sri Lanka midnight', () => {
  const events = [{ id: 'old', date: new Date('2026-10-08T05:00:00Z') },
    { id: 'today', date: new Date('2026-10-09T05:00:00Z') }, { id: 'bad', dateString: 'nonsense' }];
  assert.deepEqual(upcomingEvents(events, new Date('2026-10-09T18:29:59Z')).map(item => item.id), ['today']);
  assert.deepEqual(upcomingEvents(events, new Date('2026-10-09T18:30:00Z')), []);
});
