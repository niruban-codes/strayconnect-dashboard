import Overview from './Overview';
import { useFeedStatus } from '../hooks/useFeedStatus';
import FeedError from './FeedError';
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


function Dashboard() {
  const { error: feedError, fail: failFeed, retry, retryKey } = useFeedStatus();
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [intakeReport, setIntakeReport] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'animals'), orderBy('addedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setAnimals(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      setStatsLoading(false);
    }, error => { setStatsLoading(false); failFeed(error); });
    return () => unsub();
  }, [retryKey, failFeed]);

  const handleLogout = () => signOut(auth);

  const liveSelectedAnimal = animals.find(animal => animal.id === selectedAnimal?.id);

  const handleNavigate = (page) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setIntakeReport(null);
    setActivePage(page);
    setSelectedAnimal(null);
  };

  if (feedError) return <FeedError message={feedError} onRetry={retry} />;

  return (
    <div className="dashboard-shell"><a href="#main-content" className="skip-link">Skip to content</a>
      <Sidebar activePage={activePage} onNavigate={handleNavigate} onLogout={handleLogout} />

      <main id="main-content" className="dashboard-main" tabIndex={-1}>

        {activePage === 'dashboard' && <Overview animals={animals} loading={statsLoading}
          userName={auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'care team'}
          onNavigate={handleNavigate} onSelectAnimal={setSelectedAnimal} />}

        {/* ── ANIMALS PAGE ── */}
        {activePage === 'animals' && (
          <>
            <header className="page-heading">
              <h1 className="font-headline font-black text-2xl text-[#111111] tracking-tight">Animal Registry</h1>

            </header>
            <AnimalList onSelectAnimal={setSelectedAnimal} onNavigate={handleNavigate} />
          </>
        )}

        {/* ── ADD ANIMAL PAGE ── */}
        {activePage === 'add' && (
          <>
            <header className="mb-10">
              <h2 className="text-3xl font-black text-[#111111] font-headline tracking-tight">Register New Animal</h2>
              <p className="text-[#454545] font-semibold mt-1">Adding a new companion to the sanctuary network.</p>
            </header>
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 lg:col-span-8 bg-paper rounded-none p-8 shadow-sm border border-ink">
                <AddAnimal key={intakeReport?.id || 'manual'} report={intakeReport} onSuccess={() => handleNavigate('animals')} />
              </div>
              <div className="col-span-12 lg:col-span-4 space-y-8">
                <div className="bg-[#111111] text-white rounded-none p-8 shadow-md">
                  <h4 className="font-headline font-bold text-[#FFE335] text-xl mb-4">Registration Tips</h4>
                  <ul className="space-y-4">
                    {[
                      'High-quality photos significantly increase adoption rates.',
                      'Be specific about the rescue location for tracking trends.',
                      'Shelter info helps adopters contact the right person directly.',
                    ].map((tip) => (
                      <li key={tip} className="flex gap-3 items-start">
                        <span className="material-symbols-outlined text-[#FFE335] text-xl">check_circle</span>
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
        {activePage === 'reports' && <Reports onRegisterAnimal={report => {
          if (report.linkedAnimalId) {
            const animal = animals.find(item => item.id === report.linkedAnimalId);
            if (animal) setSelectedAnimal(animal);
            else alert('Linked passport is unavailable. Reload and check your access.');
          } else { setIntakeReport(report); setActivePage('add'); }
        }} />}
        {/* ── VOLUNTEERS PAGE ── */}

        {/* ── EVENTS PAGE ── */}
        {activePage === 'events' && <Events />}
        {/* ── ADOPTIONS PAGE ── */}
        {activePage === 'adoptions' && <AdoptionRequests />}

        {activePage === 'help' && <section className="arcade-panel help-panel"><p className="eyebrow">CARE TEAM FIELD GUIDE</p><h1>HOW CAN WE HELP?</h1><div className="help-grid">{[
          ['01 / REGISTER', 'Build their passport', 'Add an identifying photo, animal details and location. Keep the same passport throughout rescue and adoption.'],
          ['02 / CARE', 'Keep records current', 'Open an animal profile to add medical observations and vaccination records. Verification confirms the passport, not a medical diagnosis.'],
          ['03 / RESPOND', 'Coordinate a rescue', 'Review SOS details, assign a responder, and review rescue proof. Register the rescued animal from its report to link the records.'],
          ['04 / CONNECT', 'Review applications', 'Review adopter information and approve or reject applications. Review community event proposals before publishing.'],
        ].map(([step,title,body]) => <article key={step}><p className="eyebrow">{step}</p><h2>{title}</h2><p>{body}</p></article>)}</div></section>}

      </main>

      {/* Animal Profile Modal */}
      {liveSelectedAnimal && (
        <AnimalProfile key={liveSelectedAnimal.id}
          animal={liveSelectedAnimal}
          onClose={() => setSelectedAnimal(null)}
        />
      )}
    </div>
  );
}

export default Dashboard;
