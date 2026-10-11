export default function MeadowDivider() {
  return <div className="meadow-divider" aria-hidden="true">
    <svg className="meadow-grass" width="64" height="100%" shapeRendering="crispEdges"><defs><pattern id="meadow-tufts" width="64" height="96" patternUnits="userSpaceOnUse">
      <path fill="#183F2B" d="M25 0h14v96H25zM9 0h4v8h6v8h6v12H13V16H9zM1 16h4v8h8v8h12v8H13v-4H9v-8H1zM43 8h4v12h8v-4h4v12h-8v8H39V20h4zM51 36h8v4h-4v8h-8v8h-8V44h8v-4h4zM5 48h4v8h8v8h8v12H13V64H9v-4H5zM17 40h4v12h4v12h-8zM47 64h4v12h8v-4h4v12H51v8H39V80h8zM5 80h8v4h4v4h8v8H13v-4H5z"/>
      <path fill="#5B9E4B" d="M28 0h8v96h-8zM13 8h4v12h8v8h-8v-4h-4zM5 24h4v4h8v8h8v4h-8v-4h-4v-4H5zM43 20h4v8h8v4h-8v8h-8V28h4zM47 44h8v4h-8v8h-8v-4h8zM9 56h4v8h8v8h4v8h-8V68h-4v-4H9zM47 76h4v8h8v4H47v8h-8V84h8zM9 84h4v4h8v8h-4v-4H9z"/>
      <path fill="#9ACD66" d="M30 6h3v18h-3zM33 38h3v16h-3zM28 68h3v20h-3zM17 20h4v8h-4zM43 28h4v8h-4zM17 68h4v8h-4zM43 84h4v8h-4z"/>
      <path fill="#FFFDF4" d="M5 39h4v-4h4v4h4v4h-4v4H9v-4H5zM49 57h4v-4h4v4h4v4h-4v4h-4v-4h-4z"/><path fill="#FFE335" d="M9 39h4v4H9zM53 57h4v4h-4z"/>
    </pattern></defs><rect width="64" height="100%" fill="url(#meadow-tufts)"/></svg>
    {[0, 1, 2, 3].map(i => <div key={i} className={`meadow-traveler traveler-${i}`}><svg className={i % 2 ? 'meadow-bug' : 'meadow-butterfly'} viewBox="0 0 20 20" shapeRendering="crispEdges">{i % 2 ? <><path fill="#172B24" d="M7 2h6v3h3v10h-3v3H7v-3H4V5h3zM1 6h3v2H1zM16 6h3v2h-3zM1 12h3v2H1zM16 12h3v2h-3z"/><path fill="#FF625D" d="M6 6h3v9H6zM11 6h3v9h-3z"/><path fill="#172B24" d="M6 8h3v3H6zM11 11h3v3h-3z"/></> : <><path fill="#172B24" d="M1 3h6v3h6V3h6v9h-3v5h-4v-3H8v3H4v-5H1z"/><path fill={i ? '#BB9AFF' : '#FF82BF'} d="M2 4h4v3h2v5H4V9H2zM14 4h4v5h-2v3h-4V7h2zM5 12h3v3H5zM12 12h3v3h-3z"/><path fill="#FFE335" d="M9 6h2v9H9z"/></>}</svg></div>)}
  </div>;
}
