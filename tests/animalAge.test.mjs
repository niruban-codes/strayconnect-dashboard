import test from 'node:test';
import assert from 'node:assert/strict';
import { ageFromBirthDate, formatAnimalAge } from '../src/utils/animalAge.js';

test('age uses completed calendar years and months, not rounded years', () => {
  assert.deepEqual(ageFromBirthDate('2024-06-12', '2026-10-11'), { years: 2, months: 3 });
  assert.equal(formatAnimalAge({ dateOfBirth: '2024-06-11' }, '2026-10-11'), '2 years 4 months');
  assert.equal(formatAnimalAge({ dateOfBirth: '2026-10-11' }, '2026-10-11'), 'Less than 1 month');
  assert.equal(formatAnimalAge({ dateOfBirth: '2026-09-11' }, '2026-10-11'), '1 month');
});

test('leap days and month-end birthdays use the last day of shorter months', () => {
  assert.deepEqual(ageFromBirthDate('2024-02-29', '2025-02-28'), { years: 1, months: 0 });
  assert.deepEqual(ageFromBirthDate('2026-01-31', '2026-02-28'), { years: 0, months: 1 });
  assert.deepEqual(ageFromBirthDate('2026-01-31', '2026-02-27'), { years: 0, months: 0 });
});

test('invalid dates, future dates and missing ages remain unknown', () => {
  for (const value of ['2025-02-29', '2026-13-01', '2026-10-12', 'invalid', '']) assert.equal(ageFromBirthDate(value, '2026-10-11'), null);
  assert.equal(formatAnimalAge({ age: null }), 'Age unknown');
  assert.equal(formatAnimalAge({ dateOfBirth: 'bad', age: 3 }), 'Age unknown');
});

test('estimated dates and legacy numeric ages retain their uncertainty', () => {
  assert.equal(formatAnimalAge({ dateOfBirth: '2025-09-11', dateOfBirthEstimated: true }, '2026-10-11'), 'About 1 year 1 month');
  assert.equal(formatAnimalAge({ age: 2.5 }), 'About 2 years 6 months');
  assert.equal(formatAnimalAge({ age: 0 }), 'About less than 1 month');
  assert.equal(formatAnimalAge({ dateOfBirth: '2025-10-11', age: 0 }, '2026-10-11'), '1 year');
});
