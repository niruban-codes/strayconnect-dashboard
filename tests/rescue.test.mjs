import test from 'node:test';
import assert from 'node:assert/strict';
import { database } from './transactionHarness.mjs';
import { transitionRescue } from '../src/utils/rescueTransition.js';
const ref = { id: 'report' };
test('simultaneous rescue claims produce exactly one assignee', async () => {
  const db = database({ report: { status: 'pending' } });
  const results = await Promise.allSettled(['a', 'b'].map(uid => db.run(tx => transitionRescue(tx, ref, 'claim', { uid }, 'now'))));
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(db.docs.report.status, 'in_progress');
  assert.ok(['a', 'b'].includes(db.docs.report.helperId));
});
test('dispatch requires an assignee and records who is responsible', async () => {
  const db = database({ report: { status: 'pending' } });
  await assert.rejects(db.run(tx => transitionRescue(tx, ref, 'claim', {}, 'now')), /select a responder/);
  assert.equal(db.docs.report.status, 'pending');
  await db.run(tx => transitionRescue(tx, ref, 'claim', { uid: 'helper', name: 'Alex' }, 'now'));
  assert.equal(db.docs.report.helperName, 'Alex');
});
test('late proof cannot reopen resolved rescue or overwrite another helper', async () => {
  for (const report of [{ status: 'resolved', helperId: 'a' }, { status: 'in_progress', helperId: 'b' }]) {
    const db = database({ report });
    await assert.rejects(db.run(tx => transitionRescue(tx, ref, 'proof', { uid: 'a' }, 'now', 'photo')), /no longer assigned/);
    assert.deepEqual(db.docs.report, report);
  }
});
test('stale dashboard action cannot resolve a newly claimed report', async () => {
  const db = database({ report: { status: 'in_progress', helperId: 'a' } });
  await assert.rejects(db.run(tx => transitionRescue(tx, ref, 'resolve', { uid: 'admin' }, 'now', undefined, { status: 'pending' })), /report changed/);
});
test('proof review can reopen then safely assign another responder', async () => {
  const db = database({ report: { status: 'in_progress', helperId: 'a' } });
  await db.run(tx => transitionRescue(tx, ref, 'proof', { uid: 'a' }, 'now', 'photo'));
  await db.run(tx => transitionRescue(tx, ref, 'reject', { uid: 'admin' }, 'now'));
  await db.run(tx => transitionRescue(tx, ref, 'claim', { uid: 'b' }, 'now'));
  assert.equal(db.docs.report.helperId, 'b');
  assert.equal(db.docs.report.proofImageUrl, null);
});

test('admin can repair an old unassigned dispatch without taking another helpers rescue', async () => {
  const db = database({ report: { status: 'in_progress' } });
  await db.run(tx => transitionRescue(tx, ref, 'claim', { uid: 'a', dispatchedBy: 'admin' }, 'now'));
  assert.equal(db.docs.report.helperId, 'a');
  await assert.rejects(db.run(tx => transitionRescue(tx, ref, 'claim', { uid: 'b', dispatchedBy: 'admin' }, 'now')), /already assigned/);
});
