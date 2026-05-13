// src/components/Sidebar.jsx
function Sidebar({ activePage, onNavigate, onLogout }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'animals', label: 'Animals', icon: 'pets' },
    { id: 'add', label: 'Add Animal', icon: 'add_circle' },
    // NEW: Added the Adoptions tab right here!
    { id: 'adoptions', label: 'Adoptions', icon: 'favorite' },
    { id: 'reports', label: 'Reports', icon: 'analytics' },
    { id: 'events', label: 'Events', icon: 'event' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-stone-50/80 backdrop-blur-xl flex flex-col py-8 px-4 gap-2 z-40 text-sm tracking-wide font-body">
      <div className="mb-10 px-4">
        <div className="flex items-center gap-3 mb-1">
          <span className="material-symbols-outlined text-primary text-3xl"
            style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
          <h1 className="text-emerald-900 font-extrabold text-xl font-headline">StrayConnect</h1>
        </div>
        <p className="text-stone-500 text-xs ml-11">Vet Dashboard</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left
              ${activePage === item.id
                ? 'bg-emerald-100/50 text-emerald-900 font-semibold'
                : 'text-stone-500 hover:text-emerald-800 hover:translate-x-1'
              }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ── BOTTOM ACTIONS ── */}
      <div className="mt-auto space-y-4">

        {/* Emergency Rescue Button */}
        <button
          onClick={() => onNavigate('emergency')}
          className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-3 px-4 rounded-full font-semibold flex items-center justify-center gap-2 shadow-lg hover:brightness-105 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">emergency</span>
          Emergency Rescue
        </button>

        <div className="space-y-1">
          {/* Help Center Button */}
          <button
            onClick={() => onNavigate('help')}
            className={`w-full text-left flex items-center gap-3 px-4 py-2 text-xs uppercase tracking-widest font-semibold transition-all
              ${activePage === 'help' ? 'text-emerald-800' : 'text-stone-500 hover:text-emerald-800'}`}
          >
            <span className="material-symbols-outlined text-base">help</span>
            Help Center
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-full text-left flex items-center gap-3 px-4 py-2 text-stone-500 hover:text-red-600 text-xs uppercase tracking-widest font-semibold transition-all"
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