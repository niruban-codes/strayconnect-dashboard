import test from 'node:test';
import assert from 'node:assert/strict';
import { database } from './transactionHarness.mjs';
import { passportId, verifyPassport, archivePassport } from '../src/utils/passport.js';
import { saveMedicalRecord } from '../src/utils/medicalRecord.js';
import { reviewAdoption } from '../src/utils/adoptionReview.js';
const ref = { id: 'pet' };
const notification = { id: 'notice' };
const record = { id: 'entry', condition: 'Injury', addedAt: 'now', enteredBy: 'vet' };
const save = tx => saveMedicalRecord(tx, ref, notification, 'medicalHistory', record, 'Update', 'Treated', 'now');
test('passport IDs remain stable and distinct without sequence sorting', () => {
  assert.equal(passportId('a', 'SC-0001'), 'SC-0001');
  assert.notEqual(passportId('a'), passportId('b'));
});
test('verification preserves an existing permanent passport ID', async () => {
  const db = database({ pet: { animalId: 'SC-0001', status: 'owned' } });
  await db.run(tx => verifyPassport(tx, ref, 'vet', 'now'));
  assert.equal(db.docs.pet.animalId, 'SC-0001');
});
test('concurrent verification of a missing ID assigns the same stable identity', async () => {
  const db = database({ pet: { status: 'owned' } });
  await Promise.all(['vet-a', 'vet-b'].map(uid => db.run(tx => verifyPassport(tx, ref, uid, 'now'))));
  assert.equal(db.docs.pet.animalId, 'SC-pet');
});
test('failed medical/notification commit saves neither; retry writes both once', async () => {
  const db = database({ pet: { ownerId: 'owner', medicalHistory: [] } });
  await assert.rejects(db.run(save, true), /permission-denied/);
  assert.deepEqual(db.docs.pet.medicalHistory, []);
  assert.equal(db.docs.notice, undefined);
  await db.run(save);
  await db.run(save); // Lost acknowledgement followed by retry.
  assert.equal(db.docs.pet.medicalHistory.length, 1);
  assert.equal(db.docs.notice.userId, 'owner');
});
test('concurrent medical entries are preserved and duplicate submission is ignored', async () => {
  const db = database({ pet: { ownerId: 'owner' } });
  await Promise.all([db.run(save), db.run(save), db.run(tx => saveMedicalRecord(tx, ref, { id: 'second' }, 'medicalHistory', { ...record, id: 'entry-2' }, 'Update', 'Other', 'now'))]);
  assert.equal(db.docs.pet.medicalHistory.length, 2);
});
test('archive preserves history and ownership and blocks adoption and clinical edits', async () => {
  const db = database({ pet: { status: 'sheltered', ownerId: 'owner', medicalHistory: [record] }, request: { status: 'pending', animalId: 'pet', userId: 'adopter' } });
  await db.run(tx => archivePassport(tx, ref, 'admin', 'now'));
  await db.run(tx => archivePassport(tx, ref, 'admin', 'later'));
  assert.equal(db.docs.pet.previousStatus, 'sheltered');
  assert.equal(db.docs.pet.ownerId, 'owner');
  assert.deepEqual(db.docs.pet.medicalHistory, [record]);
  await assert.rejects(db.run(save), /read-only/);
  await assert.rejects(db.run(tx => reviewAdoption(tx, { id: 'request' }, id => ({ id }), 'approved', 'now')), /no longer available/);
  assert.equal(db.docs.request.status, 'pending');
});
