import { createElement } from 'react';
import { useEffect, useRef, useState } from 'react';
import { LayoutDashboard, PawPrint, Plus, Heart, Siren, CalendarDays, LogOut, Menu, X, CircleHelp } from 'lucide-react';
import logo from '../assets/images/sc-logo.png';
const items = [
  ['dashboard', 'Overview', LayoutDashboard], ['animals', 'Animal registry', PawPrint],
  ['add', 'Register animal', Plus], ['adoptions', 'Adoptions', Heart],
  ['reports', 'SOS reports', Siren], ['events', 'Community events', CalendarDays],
];
export default function Sidebar({ activePage, onNavigate, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuButton = useRef(null);
  useEffect(() => {
    if (!open) return;
    const dismiss = event => { if (event.key === 'Escape') { setOpen(false); menuButton.current?.focus(); } };
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, [open]);
  const navigate = page => { onNavigate(page); setOpen(false); };
  return <>
    <div className="mobile-nav"><span className="font-headline">STRAYCONNECT</span><button ref={menuButton} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="dashboard-sidebar" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div>
    {open && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}
    <aside id="dashboard-sidebar" className={`arcade-sidebar ${open ? 'is-open' : ''}`}>
      <a className="brand" href="#main-content" onClick={() => navigate('dashboard')}><img src={logo} alt="" /><span>STRAY<br />CONNECT<span className="brand-sub">CARE OPERATIONS</span></span></a>
      <div className="sidebar-label">YOUR CONTROL ROOM</div>
      <nav aria-label="Main navigation">{items.map(([id, label, Icon], index) => <button key={id} onClick={() => navigate(id)} aria-current={activePage === id ? 'page' : undefined} className={`nav-item ${activePage === id ? 'is-active' : ''}`}>{createElement(Icon, { size: 20, strokeWidth: 2.5 })}<span>{label}</span><small>0{index + 1}</small></button>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><span>SMALL PAWS.<br />BIG MISSION.</span><PawPrint size={30} /><p>A safer world for every stray.</p></div>
        <button className="nav-item" onClick={() => navigate('help')} aria-current={activePage === 'help' ? 'page' : undefined}><CircleHelp size={20} />Help & guidance</button>
        <button className="nav-item" onClick={onLogout}><LogOut size={20} />Sign out</button>
      </div>
    </aside>
  </>;
}
