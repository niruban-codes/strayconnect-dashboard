import { useState } from 'react';
import { Pause, Play, ArrowRight } from 'lucide-react';
import './CareMessageBoard.css';

const messages = [
  'A safer world starts with the life you help today.',
  'Every careful record helps protect a little life.',
  'Show up. Follow through. Give every animal a chance.',
  'Responsible care turns a rescue into a fresh start.',
  'Small acts of kindness make the world better for every paw.',
];

// Original 5 × 7 dot-matrix alphabet: individual LEDs, not a blurred text effect.
const glyphs = {
  A: ['01110','10001','10001','11111','10001','10001','10001'],
  B: ['11110','10001','10001','11110','10001','10001','11110'],
  C: ['01111','10000','10000','10000','10000','10000','01111'],
  D: ['11110','10001','10001','10001','10001','10001','11110'],
  E: ['11111','10000','10000','11110','10000','10000','11111'],
  F: ['11111','10000','10000','11110','10000','10000','10000'],
  G: ['01111','10000','10000','10111','10001','10001','01111'],
  H: ['10001','10001','10001','11111','10001','10001','10001'],
  I: ['11111','00100','00100','00100','00100','00100','11111'],
  J: ['00111','00010','00010','00010','10010','10010','01100'],
  K: ['10001','10010','10100','11000','10100','10010','10001'],
  L: ['10000','10000','10000','10000','10000','10000','11111'],
  M: ['10001','11011','10101','10101','10001','10001','10001'],
  N: ['10001','11001','10101','10011','10001','10001','10001'],
  O: ['01110','10001','10001','10001','10001','10001','01110'],
  P: ['11110','10001','10001','11110','10000','10000','10000'],
  Q: ['01110','10001','10001','10001','10101','10010','01101'],
  R: ['11110','10001','10001','11110','10100','10010','10001'],
  S: ['01111','10000','10000','01110','00001','00001','11110'],
  T: ['11111','00100','00100','00100','00100','00100','00100'],
  U: ['10001','10001','10001','10001','10001','10001','01110'],
  V: ['10001','10001','10001','10001','10001','01010','00100'],
  W: ['10001','10001','10001','10101','10101','11011','10001'],
  X: ['10001','10001','01010','00100','01010','10001','10001'],
  Y: ['10001','10001','01010','00100','00100','00100','00100'],
  Z: ['11111','00001','00010','00100','01000','10000','11111'],
  '.': ['00000','00000','00000','00000','00000','00110','00110'],
};

function LedText({ text }) {
  const width = text.length * 6;
  return <svg viewBox={`0 0 ${width} 9`} width={width * 5} height="45" aria-hidden="true">
    {[...text.toUpperCase()].flatMap((letter, index) => (glyphs[letter] || []).flatMap((row, y) =>
      [...row].map((lit, x) => lit === '1' && <circle key={`${index}-${x}-${y}`} cx={index * 6 + x + .5} cy={y + 1.5} r=".37" fill="#111111" />)
    ))}
  </svg>;
}

export default function CareMessageBoard() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const next = () => setIndex(current => (current + 1) % messages.length);
  return <section className="care-board" aria-label="Care team message board">
    <div className="care-board-heading"><span className="care-board-light" aria-hidden="true" /><span>A LITTLE REMINDER</span><span>{String(index + 1).padStart(2, '0')} / 05</span></div>
    <div className="care-board-display" aria-hidden="true">
      <div key={index} className="care-board-marquee" style={{ animationDuration: `${messages[index].length * .25 + 4}s`, animationPlayState: paused ? 'paused' : 'running' }} onAnimationEnd={next}><LedText text={messages[index]} /></div>
      <span className="care-board-still">CARE FOR EVERY PAW.</span>
    </div>
    <div className="care-board-caption"><span className="care-board-label">THE WORK YOU DO MATTERS.</span><p>{messages[index]}</p></div>
    <div className="care-board-controls"><button className="care-board-pause" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Play scrolling message' : 'Pause scrolling message'}>{paused ? <Play size={13} /> : <Pause size={13} />}{paused ? 'PLAY' : 'PAUSE'}</button><button onClick={() => { next(); setPaused(false); }} aria-label="Next care message">NEXT NOTE <ArrowRight size={14} /></button></div>
  </section>;
}


