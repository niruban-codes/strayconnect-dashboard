import { createElement } from 'react';
import { ArrowUpRight, PawPrint, ShieldCheck, Heart, ClipboardClock, Plus, Siren } from 'lucide-react';
import CareMessageBoard from './CareMessageBoard';
import { countRecentAdoptions } from '../utils/adoptionStats';

export default function Overview({ animals, loading, userName, onNavigate, onSelectAnimal }) {
  const total = animals.length;
  const verified = animals.filter(a => a.isVerified).length;
  const stats = [
    ['Registered animals', total, PawPrint, 'yellow'],
    ['Verified passports', verified, ShieldCheck, 'mint'],
    ['Adoptions this week', countRecentAdoptions(animals), Heart, 'pink'],
    ['Awaiting verification', total - verified, ClipboardClock, 'purple'],
  ];
  const species = ['dog', 'cat', 'other'].map(species => ({ species,
    count: animals.filter(a => species === 'other' ? !['dog','cat'].includes(a.species?.toLowerCase()) : a.species?.toLowerCase() === species).length }));
  return <>
    <header className="overview-header"><div><p className="eyebrow">01 / YOUR DAILY IMPACT</p><h1>CARE STARTS HERE.</h1><p className="text-muted mt-2">Welcome back, {userName}. Let’s make a difference today.</p></div><span className="live-label"><span />{loading ? 'CONNECTING…' : 'LIVE REGISTRY'}</span></header>
    <section className="overview-hero"><div className="hero-message"><p className="eyebrow">THE STRAYCONNECT CONTROL ROOM</p><h2>A LITTLE CARE.<br />A BIG NEXT CHAPTER.</h2><p>Every record, rescue, and adoption brings an animal closer to a safer life.</p><div className="hero-actions"><button className="arcade-button" onClick={() => onNavigate('add')}><Plus size={20} />REGISTER ANIMAL</button><button className="arcade-button coral" onClick={() => onNavigate('reports')}><Siren size={20} />SOS REPORTS</button></div></div><CareMessageBoard /></section>
    <section className="stats-strip" aria-label="Registry statistics">{stats.map(([label, count, Icon, color], i) => <div className={`stat-tile ${color}`} key={label}><div className="stat-top">{createElement(Icon, { size: 22 })}<span>0{i + 1}</span></div><strong>{loading ? '—' : count}</strong><span>{label}</span></div>)}</section>
    <div className="overview-bottom"><section className="arcade-panel recent-panel"><div className="panel-heading"><div><p className="eyebrow">LATEST ARRIVALS</p><h2>NEW TO THE NETWORK</h2></div><button className="text-link" onClick={() => onNavigate('animals')}>View all <ArrowUpRight size={18} /></button></div>
      {loading ? <p role="status" className="empty-copy">Loading animal records…</p> : !total ? <div className="empty-copy"><PawPrint size={40} /><p>Your registry is ready for its first companion.</p><button className="arcade-button" onClick={() => onNavigate('add')}>ADD AN ANIMAL</button></div> : <div className="recent-list">{animals.slice(0,5).map(animal => <button key={animal.id} className="recent-animal" onClick={() => onSelectAnimal(animal)}><div className="recent-photo">{animal.imageUrl ? <img src={animal.imageUrl} alt="" /> : <PawPrint />}</div><div className="recent-name"><strong>{animal.name || 'Unnamed animal'}</strong><span>{animal.animalId || 'ID pending'} · {animal.species || 'Unknown species'}</span></div><span className={`status-chip ${animal.status === 'adopted' ? 'mint' : animal.status === 'lost' ? 'pink' : 'purple'}`}>{animal.status || 'Unspecified'}</span><ArrowUpRight size={18} /></button>)}</div>}
    </section><section className="arcade-panel species-panel"><p className="eyebrow">THE WHOLE PACK</p><h2>REGISTRY MIX</h2><p className="text-sm mb-6">Species across {loading ? '…' : total} registered animals.</p>{species.map(({ species, count }, i) => {
      const pct = total ? Math.round(count / total * 100) : 0;
      return <div className="species-row" key={species}><div><span>{['Dogs', 'Cats', 'Other animals'][i]}</span><strong>{loading ? '—' : `${count} / ${pct}%`}</strong></div><div className="segment-meter" role="meter" aria-label={`${species} share of registry`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>{Array.from({length:12},(_,index) => <span key={index} className={index < Math.round(pct / 100 * 12) ? ['yellow','mint','pink'][i] : ''} />)}</div></div>;
    })}<p className="species-footnote">Registry counts, updated as records change.</p></section></div>
  </>;
}
