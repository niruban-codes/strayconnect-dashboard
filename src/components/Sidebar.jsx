// src/components/Sidebar.jsx
import logo from '../assets/images/sc-logo.png';

function Sidebar({ activePage, onNavigate, onLogout }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'animals', label: 'Animals', icon: 'pets' },
    { id: 'add', label: 'Add Animal', icon: 'add_circle' },
    { id: 'adoptions', label: 'Adoptions', icon: 'favorite' },
    { id: 'reports', label: 'Reports', icon: 'analytics' },
    { id: 'events', label: 'Events', icon: 'event' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white/80 backdrop-blur-xl border-r border-[#003459]/10 flex flex-col py-8 px-4 gap-2 z-40 text-sm tracking-wide font-['Urbanist'] text-[#00171F]">

      {/* ── BRANDING ── */}
      <div className="mb-10 px-4">
        <div className="flex items-center gap-3 mb-1">
          <img
            src={logo}
            alt="StrayConnect Logo"
            className="w-8 h-8 rounded-md object-contain"
          />
          <h1 className="text-[#003459] font-['Poppins'] font-black text-xl tracking-tight">
            StrayConnect
          </h1>
        </div>
        <p className="text-[#52616B] text-xs ml-11 font-bold">Vet Dashboard</p>
      </div>

      {/* ── MAIN NAVIGATION ── */}
      <nav className="flex-1 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left
              ${activePage === item.id
                ? 'bg-[#003459]/10 text-[#003459] font-extrabold'
                : 'text-[#52616B] hover:text-[#003459] hover:bg-[#003459]/5 hover:translate-x-1 font-semibold'
              }`}
          >
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ── BOTTOM ACTIONS ── */}
      <div className="mt-auto space-y-4">

        {/* Emergency Rescue Button */}
        <button
          onClick={() => onNavigate('emergency')}
          className="w-full bg-[#FF564F] text-white py-3 px-4 rounded-full font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-[#FF564F]/30 hover:brightness-105 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">emergency</span>
          Emergency Rescue
        </button>

        <div className="space-y-1">
          {/* Help Center Button */}
          <button
            onClick={() => onNavigate('help')}
            className={`w-full text-left flex items-center gap-3 px-4 py-2 text-xs uppercase tracking-widest transition-all
              ${activePage === 'help' ? 'text-[#003459] font-extrabold' : 'text-[#52616B] font-bold hover:text-[#003459]'}`}
          >
            <span className="material-symbols-outlined text-base">help</span>
            Help Center
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-full text-left flex items-center gap-3 px-4 py-2 text-[#52616B] hover:text-[#FF564F] hover:bg-[#FF564F]/10 rounded-lg text-xs uppercase tracking-widest font-bold transition-all"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;