// Original sprite shared visually with the mobile companion console.
const rows = [
  '            KK      ', '           KTTK     ', '          KTTTK     ',
  '         KTTTTKKKK  ', '         KTTTKTTTTK ', ' K       KTTTKWKT TK',
  'KTK      KTTTTTTTTKK', 'KTTKKKKKKKTTTTTTKKKK', ' KTTTTTTTTTTTTTTTK  ',
  '  KTTTTTTTTTTTBBK   ', '  KTTTTTTTTTTTTK    ', '  KTTTTTTTTTTTTK    ',
  '  KTTTKKKKKTTTTK    ', '  KTTK    KTTTK     ', '  KTTK    KTTK      ',
  '  KKKKK   KKKKK     ',
];
const colors = { K: '#111111', T: '#C99156', W: '#FFFDF4', B: '#2455FF' };
export default function PixelMascot() {
  return <svg viewBox="0 0 20 16" shapeRendering="crispEdges" className="pixel-mascot" role="img" aria-label="Pixel dog companion">
    {rows.flatMap((row, y) => [...row].map((pixel, x) => colors[pixel] && <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={colors[pixel]} />))}
  </svg>;
}
