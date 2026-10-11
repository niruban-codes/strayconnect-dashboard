import { useEffect, useRef, useState } from 'react';
import { createRun, jumpRun, stepRun, retryRun, RUN_LENGTH, RESCUES, PUDDLES } from '../utils/rescueRun';
import './RescueRun.css';

const palette = { x: '#172B24', b: '#B8773D', t: '#EAB77B', w: '#FFFDF4', p: '#FF82BF', g: '#8B97B4', n: '#2455FF' };
const sprites = {
  dog: ['..xx......xx....', '..xbx....xbx....', '..xtxxxxxxbx....', '..xttttttttx....', '..xtxwttxwtx....', '..xttxttxttx....', '...xttxxxtx.....', '....xttttx......', 'xx..xbttbxxx....', 'xbxxbbbbbbbx....', '.xbbbbbbbbbx....', '..xbxbxxbxbx....', '..xxtx..xtxx....'],
  cat: ['..xx......xx....', '..xgx....xgx....', '..xpgxxxxgpx....', '..xggggggggx....', '..xgwxggxwgx....', '..xggggpgggx....', '...xggxxxgx.....', '....xggggx......', '....xggggx..xx..', '...xggggggxxgx..', '...xggggggggx...', '...xgxggxgxx....', '...xxx..xxx.....'],
  bunny: ['...xxx..xxx.....', '...xpx..xpx.....', '...xpx..xpx.....', '...xwx..xwx.....', '..xwwwwwwwwx....', '..xwxwwwwxwx....', '..xwwwwpwwwx....', '...xwwwwwwx.....', '....xwwwwx......', '...xwwwwwwx.....', '..xwwwwwwwwxx...', '..xwwxwwxwwwx...', '...xxx..xxxx....'],
  ranger: ['.....xxxxx......', '....xnnnnnx.....', '...xnnnnnnnx....', '..xxxxxxxxxxx...', '....xtttttx.....', '....xtxtxtx.....', '....xtttttx.....', '.....xxxxx......', '...xxnnwnnxx....', '..xtxnnwnnxtx...', '..xxxnnnnnxxx...', '....xxxxxxx.....', '....xnx.xnx.....', '....xxx.xxx.....'],
};

function sprite(ctx, name, x, y, scale = 2) {
  sprites[name].forEach((row, iy) => [...row].forEach((pixel, ix) => {
    if (palette[pixel]) { ctx.fillStyle = palette[pixel]; ctx.fillRect(Math.round(x + ix * scale), Math.round(y + iy * scale), scale, scale); }
  }));
}

function paint(canvas, run) {
  const c = canvas.getContext('2d');
  const { distance, height, rescued, status } = run;
  c.imageSmoothingEnabled = false;
  c.fillStyle = '#DCEFE8'; c.fillRect(0, 0, 480, 210);
  // A hand-built pixel landscape, drawn at a fixed low resolution.
  c.fillStyle = '#FFE335'; c.fillRect(382, 18, 24, 24); c.fillRect(376, 24, 36, 12);
  for (let i = 0; i < 4; i++) {
    const x = ((i * 155 + 40 - distance * .12) % 620 + 620) % 620 - 70;
    c.fillStyle = '#FFFDF4'; c.fillRect(x, 38 + i % 2 * 17, 52, 8); c.fillRect(x + 10, 30 + i % 2 * 17, 26, 8);
  }
  c.fillStyle = '#91C98E';
  for (let i = 0; i < 10; i++) { const x = i * 64 - distance * .2 % 64; c.fillRect(x, 120 - i % 3 * 8, 48, 45); c.fillRect(x + 8, 112 - i % 3 * 8, 24, 10); }
  c.fillStyle = '#36754C'; c.fillRect(0, 154, 480, 9);
  c.fillStyle = '#A9DA87'; c.fillRect(0, 163, 480, 47);
  c.fillStyle = '#EACBA1'; c.fillRect(0, 169, 480, 27);
  for (let i = 0; i < 34; i++) {
    const x = i * 18 - distance % 18;
    c.fillStyle = i % 2 ? '#36754C' : '#5A9C51'; c.fillRect(x, 151, 3, 7); c.fillRect(x + 3, 147, 3, 7);
    c.fillStyle = '#BD9B75'; c.fillRect(x, 184 + i % 3 * 3, 3, 2);
  }
  const shelterX = 82 + RUN_LENGTH - distance;
  if (shelterX < 480) {
    c.fillStyle = '#172B24'; c.fillRect(shelterX - 20, 103, 75, 54); c.fillRect(shelterX - 27, 98, 89, 8); c.fillRect(shelterX - 17, 90, 69, 8);
    c.fillStyle = '#FF82BF'; c.fillRect(shelterX - 16, 107, 67, 47);
    c.fillStyle = '#172B24'; c.fillRect(shelterX + 6, 126, 22, 28);
    c.fillStyle = '#FFFDF4'; c.fillRect(shelterX + 13, 108, 8, 15); c.fillRect(shelterX + 9, 112, 16, 6);
  }
  PUDDLES.forEach(pos => {
    const x = 82 + pos - distance;
    c.fillStyle = '#172B24'; c.fillRect(x - 16, 159, 34, 8);
    c.fillStyle = '#2455FF'; c.fillRect(x - 13, 159, 28, 5);
    c.fillStyle = '#B7E4FF'; c.fillRect(x - 7, 159, 12, 2);
  });
  RESCUES.forEach((pos, i) => { if (i >= rescued) {
    const x = 82 + pos - distance;
    sprite(c, ['dog', 'cat', 'bunny'][i], x - 12, 133);
    c.fillStyle = '#172B24'; c.fillRect(x + 3, 115, 3, 8); c.fillRect(x + 3, 126, 3, 3);
  }});
  for (let i = rescued - 1; i >= 0; i--) sprite(c, ['dog', 'cat', 'bunny'][i], 44 - i * 22, 137 - (height ? Math.min(10, height * .25) : 0), 1.5);
  sprite(c, 'ranger', 68, 128 - height + (status === 'running' && !height ? Math.floor(distance / 12) % 2 * 2 : 0));
  if (status === 'won') {
    c.fillStyle = '#D92560';
    [45, 85, 122].forEach(x => { c.fillRect(x, 80, 5, 5); c.fillRect(x + 8, 80, 5, 5); c.fillRect(x, 85, 13, 5); c.fillRect(x + 4, 90, 5, 5); });
  }
}

export default function RescueRun() {
  const canvas = useRef(null);
  const controls = useRef(null);
  const game = useRef(createRun());
  const [view, setView] = useState(game.current);
  const sync = next => { game.current = next; setView({ ...next }); };

  useEffect(() => {
    if (view.status === 'running') controls.current?.focus({ preventScroll: true });
    let frame;
    let last = 0;
    let lastBucket = -1;
    const tick = time => {
      const previous = game.current;
      const next = stepRun(previous, last ? (time - last) / 1000 : 0);
      last = time;
      game.current = next;
      paint(canvas.current, next);
      const bucket = Math.floor(next.distance / 50);
      if (next.status !== previous.status || next.rescued !== previous.rescued || bucket !== lastBucket) { setView({ ...next }); lastBucket = bucket; }
      if (next.status === 'running') frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const pause = () => { if (document.hidden && game.current.status === 'running') sync({ ...game.current, status: 'paused' }); };
    document.addEventListener('visibilitychange', pause);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', pause); };
  }, [view.status]);

  const jump = () => { game.current = jumpRun(game.current); };
  const start = () => sync({ ...createRun(), status: 'running' });
  const statusText = view.status === 'won' ? 'Three little lives. One safe home.' : view.status === 'retry' ? 'A puddle! Take a breath, then try that jump again.' : view.rescued ? `${['Dog', 'Cat', 'Bunny'][view.rescued - 1]} rescued! ${view.rescued === 3 ? 'Next stop: the shelter.' : 'Keep going — someone else needs you.'}` : 'Hop over puddles. Bring three friends to safety.';
  return <section className="rescue-game" aria-label="Optional animal rescue mini-game">
    <div className="rescue-game-header"><span>01 / LITTLE RESCUE RUN</span><span aria-label={`${view.rescued} of 3 animals rescued`}>{view.rescued} / 3 SAFE</span></div>
    <div className="rescue-game-stage">
      <canvas ref={canvas} width="480" height="210" aria-label="A pixel ranger leads rescued animals along a meadow path to a shelter" role="img" />
      {view.status === 'running' && <button ref={controls} className="rescue-tap-zone" aria-label="Jump over puddle" onPointerDown={e => { if (e.pointerType !== 'mouse') e.preventDefault(); jump(); }} onClick={e => { if (e.detail === 0) jump(); }} onKeyDown={e => { if ([' ', 'ArrowUp'].includes(e.key)) { e.preventDefault(); if (!e.repeat) jump(); } }} />}
      {view.status !== 'running' && <div className="rescue-game-overlay"><div><strong>{view.status === 'won' ? 'EVERY PAW HOME.' : view.status === 'retry' ? 'ONE MORE HOP?' : view.status === 'paused' ? 'TAKE A BREATHER.' : 'BE THEIR WAY HOME.'}</strong><span>{view.status === 'ready' ? 'A tiny adventure. A kinder world.' : view.status === 'won' ? 'Rescue. Care. A fresh start.' : 'Your little rescue crew is waiting.'}</span><button className="arcade-button" onClick={() => { if (view.status === 'retry') sync(retryRun(game.current)); else if (view.status === 'paused') sync({ ...game.current, status: 'running' }); else start(); }}>{view.status === 'won' ? 'PLAY AGAIN' : view.status === 'retry' ? 'TRY AGAIN' : view.status === 'paused' ? 'RESUME' : 'START RESCUE'}</button></div></div>}
    </div>
    <div className="rescue-progress" role="progressbar" aria-label="Journey to shelter" aria-valuenow={Math.round(view.distance / RUN_LENGTH * 100)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${view.distance / RUN_LENGTH * 100}%` }} /></div>
    <div className="rescue-game-footer"><p role="status">{statusText}</p><div><span>SPACE / ↑ / TAP TO HOP</span>{['running', 'paused'].includes(view.status) && <button onClick={() => sync({ ...game.current, status: view.status === 'running' ? 'paused' : 'running' })}>{view.status === 'running' ? 'PAUSE' : 'RESUME'}</button>}</div></div>
    {view.status === 'running' && <button className="rescue-jump arcade-button" onClick={jump} onKeyDown={e => { if (e.key === 'ArrowUp') { e.preventDefault(); jump(); } }}>HOP ↑</button>}
  </section>;
}
