import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, jumpRun, stepRun, retryRun, PUDDLES, RUN_LENGTH } from '../src/utils/rescueRun.js';

test('rescue run waits for play, pauses, and does not jump in midair', () => {
  const idle = createRun();
  assert.equal(stepRun(idle, 1), idle);
  let run = jumpRun({ ...idle, status: 'running' });
  run = stepRun(run, .02);
  assert.ok(run.height > 0);
  assert.equal(jumpRun(run), run);
  const paused = { ...run, status: 'paused' };
  assert.equal(stepRun(paused, 1), paused);
});

test('missed puddle pauses the run and retry preserves rescued companions', () => {
  const collision = stepRun({ ...createRun(), distance: 999, rescued: 1, status: 'running' }, .02);
  assert.equal(collision.status, 'retry');
  const retry = retryRun(collision);
  assert.equal(retry.status, 'running');
  assert.equal(retry.rescued, 1);
  assert.ok(retry.distance < 1000);
});

test('three timed jumps rescue all animals and finish at the shelter across frame rates', () => {
  for (const dt of [1 / 30, 1 / 60, 1 / 120]) {
    let run = { ...createRun(), status: 'running' };
    const jumped = new Set();
    for (let frame = 0; frame < 4000 && run.status === 'running'; frame++) {
      for (const puddle of PUDDLES) {
        if (!jumped.has(puddle) && run.distance >= puddle - 30) { run = jumpRun(run); jumped.add(puddle); }
      }
      run = stepRun(run, dt);
    }
    assert.equal(run.status, 'won');
    assert.equal(run.rescued, 3);
    assert.equal(run.distance, RUN_LENGTH);
  }
});

test('a delayed frame cannot teleport past hazards', () => {
  const run = stepRun({ ...createRun(), status: 'running' }, 20);
  assert.equal(run.distance, 4);
});
