export const RUN_LENGTH = 2400;
export const RESCUES = [620, 1300, 2000];
export const PUDDLES = [350, 1000, 1670];
export const createRun = () => ({ distance: 0, height: 0, velocity: 0, rescued: 0, status: 'ready', stumble: 0 });

export function jumpRun(run) {
  return run.status === 'running' && run.height === 0 ? { ...run, velocity: 290 } : run;
}

// Small bounded steps keep the game consistent across frame rates and tab changes.
export function stepRun(run, seconds) {
  if (run.status !== 'running') return run;
  const dt = Math.min(Math.max(seconds, 0), 0.04);
  const next = { ...run, distance: run.distance + 100 * dt, stumble: Math.max(0, run.stumble - dt) };
  next.height = Math.max(0, run.height + run.velocity * dt - 440 * dt * dt);
  next.velocity = next.height > 0 ? run.velocity - 880 * dt : 0;
  const hit = PUDDLES.some(x => run.distance < x && next.distance >= x && next.height < 18);
  if (hit) return { ...next, status: 'retry', stumble: 1 };
  next.rescued = RESCUES.filter(x => next.distance >= x).length;
  if (next.distance >= RUN_LENGTH) { next.distance = RUN_LENGTH; next.status = 'won'; }
  return next;
}

export function retryRun(run) {
  return { ...run, distance: Math.max(0, run.distance - 140), height: 0, velocity: 0, stumble: 0, status: 'running' };
}
