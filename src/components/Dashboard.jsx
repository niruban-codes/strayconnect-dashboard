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
import Events from './Events';
import AdoptionRequests from './AdoptionRequests';

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
    <div className="flex min-h-screen bg-[#F7DBA7] font-['Urbanist'] text-[#00171F]">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} onLogout={handleLogout} />

      <main className="ml-64 flex-1 p-8 lg:p-12 relative">

        {/* ── DASHBOARD PAGE ── */}
        {activePage === 'dashboard' && (
          <>
            <header className="flex justify-between items-center mb-10">
              <div>
                <h2 className="font-['Poppins'] font-black text-3xl text-[#003459] tracking-tight">Overview</h2>
                <p className="text-[#52616B] font-semibold capitalize mt-1">
                  Welcome back, {auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Admin'}.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md rounded-full border border-[#003459]/10 shadow-sm">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-sm font-bold text-[#003459]">Live · {totalRegistered} Animals</span>
                </div>
                <button onClick={handleLogout} title="Logout" className="p-2.5 bg-white/60 backdrop-blur-md border border-[#003459]/10 rounded-full text-[#003459] hover:bg-[#FF564F]/10 hover:text-[#FF564F] transition-all shadow-sm">
                  <span className="material-symbols-outlined block text-xl">logout</span>
                </button>
              </div>
            </header>

            {/* ── STATS GRID ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

              {/* Live Stats Card */}
              <div className="md:col-span-2 bg-white rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-between border border-[#003459]/10 shadow-sm min-h-[360px]">
                <div className="relative z-10 w-full">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#52616B] block mb-2">Live Statistics</span>
                      <h3 className="text-2xl font-['Poppins'] font-black text-[#003459]">Regional Sanctuary Impact</h3>
                    </div>
                    <span className="material-symbols-outlined text-4xl text-[#003459]/20">analytics</span>
                  </div>

                  {statsLoading ? (
                    <div className="flex items-center gap-3 text-[#52616B]">
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      <span className="text-sm font-semibold">Loading live data...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-8">
                      {[
                        { icon: 'pets', bg: 'bg-[#003459]/10 text-[#003459]', label: 'Total Registered', value: animTotal },
                        { icon: 'verified', bg: 'bg-emerald-100 text-emerald-700', label: 'Verified Healthy', value: animVerified },
                        { icon: 'favorite', bg: 'bg-[#00A7E7]/10 text-[#00A7E7]', label: 'Adoptions (Week)', value: animAdoptions },
                        { icon: 'report_problem', bg: 'bg-[#FF564F]/10 text-[#FF564F]', label: 'Unverified / Pending', value: animPending },
                      ].map((stat) => (
                        <div key={stat.label} className="group">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                              <span className="material-symbols-outlined text-lg">{stat.icon}</span>
                            </div>
                            <span className="text-sm font-bold text-[#52616B]">{stat.label}</span>
                          </div>
                          <p className="text-4xl font-['Poppins'] font-black text-[#003459]">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Species Breakdown Card */}
              <div className="bg-[#003459] text-white rounded-[2rem] p-8 flex flex-col justify-between shadow-lg min-h-[360px]">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-2xl text-[#F7DBA7]">donut_small</span>
                  </div>
                  <h3 className="text-xl font-['Poppins'] font-bold mb-1">Species Breakdown</h3>
                  <p className="text-white/60 text-sm mb-6">Registry composition across all {totalRegistered} animals.</p>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Dogs', count: dogs, emoji: '🐕', color: 'bg-[#F7DBA7]' },
                    { label: 'Cats', count: cats, emoji: '🐈', color: 'bg-[#00A7E7]' },
                    { label: 'Others', count: others, emoji: '🐾', color: 'bg-[#FF564F]' },
                  ].map(({ label, count, emoji, color }) => {
                    const pct = totalRegistered > 0 ? Math.round((count / totalRegistered) * 100) : 0;
                    return (
                      <div key={label}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm font-bold text-white/90">{emoji} {label}</span>
                          <span className="text-xs font-extrabold text-white/60">{count} · {pct}%</span>
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
              <div className="md:col-span-2 bg-white rounded-[2rem] p-8 border border-[#003459]/10 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#52616B] block mb-1">Activity</span>
                    <h3 className="text-xl font-['Poppins'] font-bold text-[#003459]">Recently Registered</h3>
                  </div>
                  <button onClick={() => handleNavigate('animals')}
                    className="text-xs font-extrabold text-[#003459] hover:text-[#00A7E7] flex items-center gap-1 transition-colors">
                    View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>

                {statsLoading ? (
                  <div className="flex items-center gap-3 text-[#52616B] py-8 justify-center">
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  </div>
                ) : recentAnimals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <span className="material-symbols-outlined text-5xl text-[#52616B]/30 mb-3">pets</span>
                    <p className="text-[#52616B] text-sm font-medium">No animals registered yet.</p>
                    <button onClick={() => handleNavigate('add')}
                      className="mt-4 px-5 py-2.5 bg-[#003459] text-white text-sm font-bold rounded-full hover:bg-[#00A7E7] transition-all shadow-sm">
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
                          className="flex items-center gap-4 p-3 rounded-2xl hover:bg-[#F7DBA7]/20 transition-colors cursor-pointer group border border-transparent hover:border-[#003459]/5">
                          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100 border border-stone-200">
                            {animal.imageUrl
                              ? <img src={animal.imageUrl} alt={animal.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center bg-stone-100 text-[#52616B]"><span className="material-symbols-outlined text-xl">pets</span></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#00171F] truncate group-hover:text-[#003459] transition-colors">{animal.name}</p>
                            <p className="text-xs text-[#52616B] font-semibold capitalize mt-0.5">{animal.species} · {animal.location || 'No location'}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={`px-3 py-1 text-[10px] font-extrabold rounded-full capitalize tracking-wider
                              ${animal.status === 'adopted' ? 'bg-emerald-100 text-emerald-700'
                                : animal.status === 'sheltered' ? 'bg-[#00A7E7]/10 text-[#00A7E7]'
                                  : 'bg-[#FF912C]/10 text-[#FF912C]'}`}>
                              {animal.status}
                            </span>
                            <p className="text-[10px] text-[#52616B] font-bold mt-1.5">{timeLabel}</p>
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
                <div className="bg-white rounded-[2rem] p-6 flex flex-col justify-between border border-[#003459]/10 shadow-sm group hover:shadow-md transition-all">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-widest text-[#52616B] block mb-1">Coverage Area</span>
                    <h4 className="text-lg font-['Poppins'] font-bold text-[#003459]">Sri Lanka 🇱🇰</h4>
                    <p className="text-xs text-[#52616B] font-semibold mt-0.5">All 9 provinces</p>
                  </div>
                  <div className="flex justify-end mt-4">
                    <div className="w-10 h-10 rounded-full bg-[#003459]/5 text-[#003459] flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">public</span>
                    </div>
                  </div>
                </div>

                {/* Status summary */}
                <div className="bg-white rounded-[2rem] p-6 border border-[#003459]/10 shadow-sm flex-1">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-[#52616B] block mb-4">Status Split</span>
                  {['stray', 'owned', 'sheltered', 'adopted'].map(status => {
                    const count = animals.filter(a => a.status === status).length;
                    const pct = totalRegistered > 0 ? Math.round((count / totalRegistered) * 100) : 0;

                    const colors = {
                      stray: 'text-[#FF912C] bg-[#FF912C]/10',
                      owned: 'text-purple-700 bg-purple-100',
                      sheltered: 'text-[#00A7E7] bg-[#00A7E7]/10',
                      adopted: 'text-emerald-700 bg-emerald-100'
                    };

                    return (
                      <div key={status} className="flex items-center justify-between mb-3 last:mb-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full capitalize tracking-wider ${colors[status]}`}>{status}</span>
                        </div>
                        <div className="flex items-center gap-2 font-['Poppins']">
                          <span className="text-sm font-black text-[#003459]">{count}</span>
                          <span className="text-xs font-bold text-[#52616B]">({pct}%)</span>
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
            <header className="sticky top-0 w-full h-20 bg-[#F7DBA7]/80 backdrop-blur-md z-30 flex justify-between items-center mb-8 -mx-8 px-8 -mt-8 pt-8">
              <h1 className="font-['Poppins'] font-black text-2xl text-[#003459] tracking-tight">Animal Registry</h1>

            </header>
            <AnimalList onSelectAnimal={setSelectedAnimal} onNavigate={handleNavigate} />
          </>
        )}

        {/* ── ADD ANIMAL PAGE ── */}
        {activePage === 'add' && (
          <>
            <header className="mb-10">
              <h2 className="text-3xl font-black text-[#003459] font-['Poppins'] tracking-tight">Register New Animal</h2>
              <p className="text-[#52616B] font-semibold mt-1">Adding a new companion to the sanctuary network.</p>
            </header>
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 lg:col-span-8 bg-white rounded-[2rem] p-8 shadow-sm border border-[#003459]/10">
                <AddAnimal onSuccess={() => handleNavigate('animals')} />
              </div>
              <div className="col-span-12 lg:col-span-4 space-y-8">
                <div className="bg-[#003459] text-white rounded-[2rem] p-8 shadow-md">
                  <h4 className="font-['Poppins'] font-bold text-[#F7DBA7] text-xl mb-4">Registration Tips</h4>
                  <ul className="space-y-4">
                    {[
                      'High-quality photos significantly increase adoption rates.',
                      'Be specific about the rescue location for tracking trends.',
                      'Shelter info helps adopters contact the right person directly.',
                    ].map((tip) => (
                      <li key={tip} className="flex gap-3 items-start">
                        <span className="material-symbols-outlined text-[#F7DBA7] text-xl">check_circle</span>
                        <p className="text-sm text-white/80 font-medium leading-relaxed">{tip}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── REPORTS PAGE ── */}
        {activePage === 'reports' && <Reports />}
        {/* ── VOLUNTEERS PAGE ── */}
        {activePage === 'volunteers' && <Volunteers />}
        {/* ── EVENTS PAGE ── */}
        {activePage === 'events' && <Events />}
        {/* ── ADOPTIONS PAGE ── */}
        {activePage === 'adoptions' && <AdoptionRequests />}

        {/* ── PLACEHOLDER PAGES ── */}
        {['help', 'emergency'].includes(activePage) && (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <span className="material-symbols-outlined text-6xl text-[#003459]/20 mb-4">construction</span>
            <h2 className="font-['Poppins'] text-2xl font-black text-[#003459] mb-1 capitalize">{activePage}</h2>
            <p className="text-[#52616B] font-semibold">This section is coming soon.</p>
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