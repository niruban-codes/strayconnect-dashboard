// src/components/Dashboard.jsx
import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import Sidebar from './Sidebar';
import AnimalList from './AnimalList';
import AddAnimal from './addAnimal';
import AnimalProfile from './AnimalProfile';
import Reports from './Reports';
import Volunteers from './Volunteers';
import Events from './Events';

function useAnimatedCount(target) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let start = 0;
    const duration = 800;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return count;
}

function Dashboard() {
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'animals'), orderBy('addedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setAnimals(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      setStatsLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogout = () => signOut(auth);

  // Derived stats
  const totalRegistered = animals.length;
  const verifiedHealthy = animals.filter(a => a.isVerified).length;
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const adoptionsThisWeek = animals.filter(a => {
    if (a.status !== 'adopted') return false;
    const added = a.addedAt?.toDate ? a.addedAt.toDate() : new Date(a.addedAt);
    return added >= oneWeekAgo;
  }).length;
  const pendingUnverified = animals.filter(a => !a.isVerified).length;

  const dogs = animals.filter(a => a.species === 'dog').length;
  const cats = animals.filter(a => a.species === 'cat').length;
  const others = animals.filter(a => a.species !== 'dog' && a.species !== 'cat').length;
  const recentAnimals = animals.slice(0, 5);

  // Animated counts
  const animTotal = useAnimatedCount(totalRegistered);
  const animVerified = useAnimatedCount(verifiedHealthy);
  const animAdoptions = useAnimatedCount(adoptionsThisWeek);
  const animPending = useAnimatedCount(pendingUnverified);

  const handleNavigate = (page) => {
    setActivePage(page);
    setSelectedAnimal(null);
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} onLogout={handleLogout} />

      <main className="ml-64 flex-1 p-8 lg:p-12">

        {/* ── DASHBOARD PAGE ── */}
        {activePage === 'dashboard' && (
          <>
            <header className="flex justify-between items-center mb-10">
              <div>
                <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">Overview</h2>
                <p className="text-on-surface-variant font-medium">Welcome back, Dr. Silva.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 glass-card rounded-full outline outline-1 outline-outline-variant/20">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-sm font-semibold text-emerald-900">Live · {totalRegistered} Animals</span>
                </div>
                <button className="p-2 glass-card rounded-full text-primary hover:bg-emerald-50 transition-all">
                  <span className="material-symbols-outlined">notifications</span>
                </button>
                <button onClick={handleLogout} title="Logout" className="p-2 glass-card rounded-full text-primary hover:bg-red-50 hover:text-red-600 transition-all">
                  <span className="material-symbols-outlined">logout</span>
                </button>
              </div>
            </header>

            {/* ── STATS GRID ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

              {/* Live Stats Card */}
              <div className="md:col-span-2 glass-card rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-between border border-emerald-900/5 min-h-[360px]">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800/60 block mb-2">Live Statistics</span>
                      <h3 className="text-2xl font-headline font-bold text-primary">Regional Sanctuary Impact</h3>
                    </div>
                    <span className="material-symbols-outlined text-4xl text-emerald-900/20">analytics</span>
                  </div>
                  {statsLoading ? (
                    <div className="flex items-center gap-3 text-on-surface-variant">
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      <span className="text-sm">Loading live data...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-8">
                      {[
                        { icon: 'pets', bg: 'bg-emerald-100', label: 'Total Registered', value: animTotal },
                        { icon: 'verified', bg: 'bg-primary-fixed', label: 'Verified Healthy', value: animVerified },
                        { icon: 'favorite', bg: 'bg-secondary-container', label: 'Adoptions (Week)', value: animAdoptions },
                        { icon: 'report_problem', bg: 'bg-tertiary-container', label: 'Unverified / Pending', value: animPending },
                      ].map((stat) => (
                        <div key={stat.label} className="group">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center text-primary group-hover:scale-110 transition-transform`}>
                              <span className="material-symbols-outlined text-lg">{stat.icon}</span>
                            </div>
                            <span className="text-sm font-semibold text-on-surface-variant">{stat.label}</span>
                          </div>
                          <p className="text-4xl font-headline font-extrabold text-primary">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-[-20%] right-[-5%] opacity-10 pointer-events-none">
                  <span className="material-symbols-outlined text-[12rem]" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                </div>
              </div>

              {/* Species Breakdown Card */}
              <div className="bg-primary-container text-on-primary-container rounded-[2rem] p-8 flex flex-col justify-between shadow-2xl min-h-[360px]">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-2xl text-white">donut_small</span>
                  </div>
                  <h3 className="text-xl font-headline font-bold mb-2">Species Breakdown</h3>
                  <p className="text-white/70 text-sm mb-6">Registry composition across all {totalRegistered} animals.</p>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Dogs', count: dogs, emoji: '🐕', color: 'bg-emerald-300' },
                    { label: 'Cats', count: cats, emoji: '🐈', color: 'bg-amber-300' },
                    { label: 'Others', count: others, emoji: '🐾', color: 'bg-sky-300' },
                  ].map(({ label, count, emoji, color }) => {
                    const pct = totalRegistered > 0 ? Math.round((count / totalRegistered) * 100) : 0;
                    return (
                      <div key={label}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-semibold text-white/90">{emoji} {label}</span>
                          <span className="text-xs font-bold text-white/60">{count} · {pct}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── SECOND ROW: Recent Activity + Quick Stats ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Recent Activity Feed */}
              <div className="md:col-span-2 glass-card rounded-[2rem] p-8 border border-emerald-900/5">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800/60 block mb-1">Activity</span>
                    <h3 className="text-xl font-headline font-bold text-primary">Recently Registered</h3>
                  </div>
                  <button onClick={() => handleNavigate('animals')}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                    View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
                {statsLoading ? (
                  <div className="flex items-center gap-3 text-on-surface-variant py-8 justify-center">
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  </div>
                ) : recentAnimals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <span className="material-symbols-outlined text-5xl text-outline-variant mb-3">pets</span>
                    <p className="text-on-surface-variant text-sm">No animals registered yet.</p>
                    <button onClick={() => handleNavigate('add')}
                      className="mt-4 px-5 py-2 bg-primary text-white text-sm font-bold rounded-full hover:brightness-110 transition-all">
                      Register the first one
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentAnimals.map((animal) => {
                      const added = animal.addedAt?.toDate ? animal.addedAt.toDate() : new Date(animal.addedAt);
                      const daysAgo = Math.floor((Date.now() - added) / (1000 * 60 * 60 * 24));
                      const timeLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;
                      return (
                        <div key={animal.id}
                          onClick={() => setSelectedAnimal(animal)}
                          className="flex items-center gap-4 p-3 rounded-2xl hover:bg-emerald-50/50 transition-colors cursor-pointer group">
                          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container-high">
                            {animal.imageUrl
                              ? <img src={animal.imageUrl} alt={animal.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-outline-variant">pets</span></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-on-surface truncate">{animal.name}</p>
                            <p className="text-xs text-on-surface-variant capitalize">{animal.species} · {animal.location || 'No location'}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={`px-2 py-1 text-[10px] font-bold rounded-full capitalize
                              ${animal.status === 'adopted' ? 'bg-primary-fixed text-on-primary-fixed'
                                : animal.status === 'sheltered' ? 'bg-secondary-container text-on-secondary-container'
                                  : 'bg-tertiary-container text-on-tertiary-fixed'}`}>
                              {animal.status}
                            </span>
                            <p className="text-[10px] text-on-surface-variant mt-1">{timeLabel}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Info Column */}
              <div className="flex flex-col gap-6">
                {/* Coverage */}
                <div className="glass-card rounded-[2rem] p-6 flex flex-col justify-between border border-emerald-900/5 group hover:shadow-xl transition-all">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-800/40 block mb-1">Coverage Area</span>
                    <h4 className="text-lg font-bold text-primary">Sri Lanka 🇱🇰</h4>
                    <p className="text-xs text-on-surface-variant mt-1">All 9 provinces</p>
                  </div>
                  <div className="flex justify-end mt-4">
                    <div className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center shadow-md">
                      <span className="material-symbols-outlined">public</span>
                    </div>
                  </div>
                </div>

                {/* Status summary */}
                <div className="glass-card rounded-[2rem] p-6 border border-emerald-900/5 flex-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-800/40 block mb-4">Status Split</span>
                  {['stray', 'sheltered', 'adopted'].map(status => {
                    const count = animals.filter(a => a.status === status).length;
                    const pct = totalRegistered > 0 ? Math.round((count / totalRegistered) * 100) : 0;
                    const colors = { stray: 'text-amber-600 bg-amber-100', sheltered: 'text-sky-700 bg-sky-100', adopted: 'text-emerald-700 bg-emerald-100' };
                    return (
                      <div key={status} className="flex items-center justify-between mb-3 last:mb-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full capitalize ${colors[status]}`}>{status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-primary">{count}</span>
                          <span className="text-xs text-on-surface-variant">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </>
        )}

        {/* ── ANIMALS PAGE ── */}
        {activePage === 'animals' && (
          <>
            <header className="sticky top-0 w-full h-20 bg-white/60 backdrop-blur-md z-30 flex justify-between items-center mb-8 -mx-8 px-8 -mt-8 pt-8">
              <h1 className="font-headline font-bold text-2xl text-primary tracking-tight">Animal Registry</h1>
              <button className="p-2 text-stone-600 hover:bg-emerald-50/50 rounded-full transition-all">
                <span className="material-symbols-outlined">notifications</span>
              </button>
            </header>
            <AnimalList onSelectAnimal={setSelectedAnimal} onNavigate={handleNavigate} />
          </>
        )}

        {/* ── ADD ANIMAL PAGE ── */}
        {activePage === 'add' && (
          <>
            <header className="mb-10">
              <h2 className="text-4xl font-extrabold text-primary font-headline tracking-tight">Register New Animal</h2>
              <p className="text-on-surface-variant mt-2 text-lg">Adding a new companion to the sanctuary network.</p>
            </header>
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest/60 backdrop-blur-md rounded-[2rem] p-8 shadow-sm border border-outline-variant/20">
                <AddAnimal onSuccess={() => handleNavigate('animals')} />
              </div>
              <div className="col-span-12 lg:col-span-4 space-y-8">
                <div className="bg-secondary-container/30 rounded-[2rem] p-8 border border-secondary-fixed/50">
                  <h4 className="font-headline font-bold text-primary text-xl mb-4">Registration Tips</h4>
                  <ul className="space-y-4">
                    {[
                      'High-quality photos significantly increase adoption rates.',
                      'Be specific about the rescue location for tracking trends.',
                      'Shelter info helps adopters contact the right person directly.',
                    ].map((tip) => (
                      <li key={tip} className="flex gap-3">
                        <span className="material-symbols-outlined text-primary text-lg"
                          style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <p className="text-sm text-on-secondary-fixed-variant leading-relaxed">{tip}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
        {/* ── REPORTS PAGE ── */}
        {activePage === 'reports' && (
          <Reports />
        )}
        {/* ── VOLUNTEERS PAGE ── */}
        {activePage === 'volunteers' && (
          <Volunteers />
        )}
        {/* ── EVENTS PAGE ── */}
        {activePage === 'events' && (
          <Events />
        )}
        {/* ── PLACEHOLDER PAGES ── */}
        {['help', 'emergency'].includes(activePage) && (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">construction</span>
            <h2 className="font-headline text-2xl font-bold text-primary mb-2 capitalize">{activePage}</h2>
            <p className="text-on-surface-variant">This section is coming soon.</p>
          </div>
        )}

      </main>

      {/* Animal Profile Modal */}
      {selectedAnimal && (
        <AnimalProfile
          animal={selectedAnimal}
          onClose={() => setSelectedAnimal(null)}
        />
      )}
    </div>
  );
}

export default Dashboard;