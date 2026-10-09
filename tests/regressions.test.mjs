import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewAdoption } from '../src/utils/adoptionReview.js';
import { countRecentAdoptions } from '../src/utils/adoptionStats.js';

function fixture(request = { status: 'pending', animalId: 'pet', userId: 'new-owner' }, animal = { status: 'sheltered', isVerified: true, ownerId: 'old-owner', medicalHistory: ['record'] }) {
  const docs = { request, pet: animal };
  const writes = [];
  const transaction = {
    async get(ref) {
      assert.equal(writes.length, 0, 'all Firestore reads must precede writes');
      return { exists: () => Boolean(docs[ref]), data: () => docs[ref] };
    },
    update(ref, fields) { writes.push([ref, fields]); },
  };
  return { docs, writes, run: decision => reviewAdoption(transaction, 'request', id => id, decision, 'server-time') };
}

test('approval stages request and ownership changes together, preserving the passport', async () => {
  const f = fixture();
  await f.run('approved');
  assert.equal(f.writes.length, 2);
  for (const [ref, fields] of f.writes) Object.assign(f.docs[ref], fields);
  assert.equal(f.docs.request.status, 'approved');
  assert.equal(f.docs.pet.ownerId, 'new-owner');
  assert.equal(f.docs.pet.adoptedAt, 'server-time');
  assert.deepEqual(f.docs.pet.medicalHistory, ['record']);
});

test('a missing animal cannot leave an application falsely approved', async () => {
  const f = fixture(undefined, null);
  await assert.rejects(f.run('approved'), /no longer exists/);
  assert.equal(f.writes.length, 0);
});

test('a competing approval cannot transfer an already adopted animal again', async () => {
  const f = fixture(undefined, { status: 'adopted', ownerId: 'first-adopter' });
  await assert.rejects(f.run('approved'), /no longer available/);
  assert.equal(f.writes.length, 0);
});

test('lost and privately owned animals cannot be approved from old applications', async () => {
  for (const status of ['lost', 'owned']) {
    const f = fixture(undefined, { status });
    await assert.rejects(f.run('approved'), /no longer available/);
    assert.equal(f.writes.length, 0);
  }
});

test('a stale rejection cannot overwrite an approved request', async () => {
  const f = fixture({ status: 'approved' });
  await assert.rejects(f.run('rejected'), /already been processed/);
  assert.equal(f.writes.length, 0);
});

test('rejection leaves animal ownership unchanged', async () => {
  const f = fixture();
  await f.run('rejected');
  assert.deepEqual(f.writes, [['request', { status: 'rejected', processedAt: 'server-time' }]]);
});

test('weekly adoptions use adoption time, including animals registered long ago', () => {
  const now = new Date('2026-10-09T12:00:00Z');
  const animals = [
    { status: 'adopted', addedAt: '2025-01-01', adoptedAt: { toDate: () => new Date('2026-10-08') } },
    { status: 'adopted', addedAt: '2026-10-08', adoptedAt: '2026-09-01' },
    { status: 'adopted', addedAt: '2026-10-08' },
    { status: 'adopted', adoptedAt: 'invalid' },
    { status: 'adopted', adoptedAt: '2026-10-10' },
    { status: 'sheltered', adoptedAt: '2026-10-08' },
  ];
  assert.equal(countRecentAdoptions(animals, now), 1);
});

test('weekly adoption window includes its start and excludes older dates', () => {
  const now = new Date('2026-10-09T12:00:00Z');
  assert.equal(countRecentAdoptions([
    { status: 'adopted', adoptedAt: '2026-10-02T12:00:00Z' },
    { status: 'adopted', adoptedAt: '2026-10-02T11:59:59Z' },
  ], now), 1);
});
