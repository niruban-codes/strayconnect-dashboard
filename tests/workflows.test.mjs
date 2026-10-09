import test from 'node:test';
import assert from 'node:assert/strict';
import { database } from './transactionHarness.mjs';
import { registerRescueAnimal } from '../src/utils/rescueIntake.js';
import { reviewAdoption } from '../src/utils/adoptionReview.js';
import { reviewEvent } from '../src/utils/eventReview.js';
const options = { requestRefForId: id => ({ id }), notificationRefForId: id => ({ id: `notice-${id}` }) };
const review = (db, decision = 'approved', fail = false) => db.run(tx => reviewAdoption(tx, { id: 'a' }, id => ({ id }), decision, 'now', options), fail);
const initial = () => ({ pet: { status: 'sheltered', isVerified: true, pendingAdoptionRequestIds: ['a', 'b'], ownerId: 'previous' },
  a: { status: 'pending', animalId: 'pet', userId: 'alice', animalName: 'Rex' }, b: { status: 'pending', animalId: 'pet', userId: 'bob', animalName: 'Rex' } });
test('approval transfers ownership, closes competing requests, and notifies every applicant atomically', async () => {
  const db = database(initial());
  await assert.rejects(review(db, 'approved', true));
  assert.equal(db.docs.a.status, 'pending');
  await review(db);
  assert.equal(db.docs.a.status, 'approved'); assert.equal(db.docs.b.status, 'closed');
  assert.equal(db.docs['notice-a'].userId, 'alice'); assert.equal(db.docs['notice-b'].userId, 'bob');
  assert.equal(db.docs.pet.ownerId, 'alice'); assert.equal(db.docs.pet.ownershipHistory[0].previousOwnerId, 'previous');
  assert.deepEqual(db.docs.pet.pendingAdoptionRequestIds, []);
});
test('rejection notifies only the rejected applicant and retains other pending requests', async () => {
  const db = database(initial()); await review(db, 'rejected');
  assert.equal(db.docs.pet.ownerId, 'previous');
  assert.deepEqual(db.docs.pet.pendingAdoptionRequestIds, ['b']);
  assert.equal(db.docs['notice-a'].userId, 'alice'); assert.equal(db.docs['notice-b'], undefined);
});
test('unverified pet approval is rejected without changing any records', async () => {
  const docs = initial(); docs.pet.isVerified = false;
  const db = database(docs); await assert.rejects(review(db), /Verify this pet/); assert.deepEqual(db.docs, docs);
});
test('concurrent intake of one rescue creates exactly one linked passport', async () => {
  const db = database({ report: { status: 'resolved' } });
  const intake = () => db.run(tx => registerRescueAnimal(tx, { id: 'report' }, { id: 'animal' }, { name: 'Rex' }, 'staff', 'now'));
  await Promise.all([intake(), intake()]);
  assert.equal(Object.keys(db.docs).length, 2);
  assert.equal(db.docs.report.linkedAnimalId, 'animal'); assert.equal(db.docs.animal.sourceReportId, 'report');
});
test('failed or premature intake cannot leave an unlinked animal', async () => {
  const db = database({ report: { status: 'pending' } });
  await assert.rejects(db.run(tx => registerRescueAnimal(tx, { id: 'report' }, { id: 'animal' }, {}, 'staff', 'now')));
  assert.equal(db.docs.animal, undefined);
});
test('event decisions and organizer notifications are atomic and cannot overwrite a previous review', async () => {
  const db = database({ event: { status: 'pending', userId: 'organizer', title: 'Rescue day', date: new Date('2030-01-01') } });
  const run = (decision, fail = false) => db.run(tx => reviewEvent(tx, { id: 'event' }, { id: 'notice' }, decision, 'Reason', 'now', new Date('2026-01-01')), fail);
  await assert.rejects(run('approved', true)); assert.equal(db.docs.event.status, 'pending');
  await run('approved'); assert.equal(db.docs.notice.userId, 'organizer');
  await assert.rejects(run('rejected'), /already been reviewed/);
});
test('past or invalid event dates cannot be published', async () => {
  for (const date of [null, new Date('invalid'), new Date('2000-01-01')]) {
    const db = database({ event: { status: 'pending', date } });
    await assert.rejects(db.run(tx => reviewEvent(tx, { id: 'event' }, { id: 'notice' }, 'approved', '', 'now')));
    assert.equal(db.docs.event.status, 'pending');
  }
});

test('approval retries include a competing application registered during review', async () => {
  const db = database(initial());
  await Promise.all([review(db), db.run(async tx => {
    const snapshot = await tx.get({ id: 'pet' });
    if (snapshot.data().status !== 'sheltered') return;
    tx.set({ id: 'c' }, { status: 'pending', animalId: 'pet', userId: 'carol' });
    tx.update({ id: 'pet' }, { pendingAdoptionRequestIds: [...snapshot.data().pendingAdoptionRequestIds, 'c'] });
  })]);
  assert.equal(db.docs.pet.status, 'adopted');
  if (db.docs.c) {
    assert.equal(db.docs.c.status, 'closed');
    assert.equal(db.docs['notice-c'].userId, 'carol');
  }
});
