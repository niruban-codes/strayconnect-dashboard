import { useFeedStatus } from '../hooks/useFeedStatus';
import FeedError from './FeedError';
// src/components/AnimalList.jsx
import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, runTransaction, serverTimestamp } from 'firebase/firestore';

import { archivePassport } from '../utils/passport';
import { formatAnimalAge } from '../utils/animalAge';

// UPDATE 1: Added onNavigate to the props
function AnimalList({ onSelectAnimal, onNavigate }) {
  const { error: feedError, fail: failFeed, retry, retryKey } = useFeedStatus();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'animals'), orderBy('addedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAnimals(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
      setLoading(false);
    }, error => { setLoading(false); failFeed(error); });
    return () => unsubscribe();
  }, [retryKey, failFeed]);

  const handleArchive = async (e, animalId) => {
    e.stopPropagation();
    if (!window.confirm('Archive this animal? Its passport and medical history will be preserved.')) return;
    try {
      if (!auth.currentUser) throw new Error('Please sign in again.');
      await runTransaction(db, tx => archivePassport(tx, doc(db, 'animals', animalId), auth.currentUser.uid, serverTimestamp()));
    } catch (error) { alert(error.message || 'Could not archive animal.'); }
  };

  const statusStyle = (status) => {
    switch (status) {
      case 'adopted': return 'bg-arcade-mint text-emerald-700';
      case 'sheltered': return 'bg-arcade-blue-light text-[#2455FF]';
      case 'owned': return 'bg-arcade-purple text-ink'; // NEW: Owned badge
      default: return 'bg-arcade-yellow text-[#8F4500]'; // Stray
    }
  };

  const filtered = animals.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.animalId?.toLowerCase().includes(search.toLowerCase())
  );

  if (feedError) return <FeedError message={feedError} onRetry={retry} />;

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-[#454545] font-body font-bold">
      <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
      Loading animals...
    </div>
  );

  return (
    <div className="font-body">
      {/* Search Bar */}
      <div className="relative max-w-2xl group mb-12">
        <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-muted group-focus-within:text-[#2455FF] transition-colors">search</span>
        <input
          className="w-full pl-14 pr-6 py-4 bg-paper border border-ink rounded-none shadow-sm focus:ring-2 focus:ring-[#2455FF]/30 text-[#111111] font-bold placeholder:text-muted transition-all outline-none"
          placeholder="Search by name or SC ID (e.g., SC-0001)..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div className="animal-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(animal => (
          <div key={animal.id}
            className="animal-card bg-paper rounded-none border border-ink overflow-hidden group hover:shadow-xl  transition-all duration-500 cursor-pointer flex flex-col"
            onClick={() => onSelectAnimal(animal)}
          >
            {/* Photo */}
            <div className="relative h-44 overflow-hidden bg-paper border-b border-ink">
              {animal.imageUrl ? (
                <img src={animal.imageUrl} alt={animal.name}
                  className="w-full h-full object-cover  transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted">
                  <span className="material-symbols-outlined text-6xl">pets</span>
                </div>
              )}

              {/* Floating Badges */}
              <div className="absolute top-3 left-3 right-3 flex flex-col items-start gap-2">
                <span title={animal.animalId} className="max-w-full truncate px-2 py-1 bg-[#111111] text-white text-[9px] font-extrabold tracking-wide rounded-none shadow-sm">
                  {animal.animalId || 'No ID'}
                </span>
                {animal.isVerified ? (
                  <span className="px-3 py-1.5 bg-emerald-700 text-white text-[10px] font-extrabold tracking-wider rounded-none  shadow-sm flex items-center gap-1 uppercase">
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    Verified
                  </span>
                ) : (
                  <span className="px-3 py-1.5 bg-arcade-yellow text-ink text-[10px] font-extrabold tracking-wider rounded-none  shadow-sm flex items-center gap-1 uppercase">
                    <span className="material-symbols-outlined text-[14px]">pending</span>
                    Unverified
                  </span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col flex-1">
              <div className="flex flex-wrap gap-2 items-start mb-3">
                <h3 className="w-full font-headline font-black text-lg text-[#111111] leading-snug">{animal.name || 'Unnamed Pet'}</h3>
                <span className={`px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide rounded-none ${statusStyle(animal.status)}`}>
                  {animal.status}
                </span>
              </div>

              <div className="space-y-2 text-[#454545] font-semibold text-xs mb-4 flex-1 break-words">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-lg text-muted">pets</span>
                  <span className="capitalize text-[#111111]">{animal.species} · {animal.breed || 'Unknown breed'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-lg text-muted">info</span>
                  <span className="capitalize text-[#111111]">{animal.sex} · {formatAnimalAge(animal)}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-lg text-muted">location_on</span>
                  <span className="text-[#111111] truncate">{animal.location || 'Location unknown'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-ink mt-auto">
                <button
                  onClick={() => onSelectAnimal(animal)}
                  className="flex-1 min-h-11 py-2 text-xs bg-[#111111] text-white font-extrabold rounded-none hover:bg-[#2455FF] transition-all shadow-sm"
                >
                  View Profile
                </button>
                <button
                  onClick={(e) => handleArchive(e, animal.id)}
                  className="p-2 min-h-11 min-w-11 bg-arcade-pink text-ink rounded-none hover:bg-[#D92532] hover:text-white transition-all shadow-sm"
                  title="Archive Record" disabled={animal.status === 'archived'}
                >
                  <span className="material-symbols-outlined block text-[20px]">archive</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Placeholder */}
        <div
          // UPDATE 2: Wired up the onClick handler
          onClick={() => onNavigate('add')}
          className="bg-paper border-2 border-dashed border-ink rounded-none flex flex-col items-center justify-center p-5 text-center group cursor-pointer hover:bg-paper hover:border-ink hover:shadow-md transition-all duration-300 min-h-[320px]"
        >
          <div className="w-16 h-16 rounded-none bg-paper flex items-center justify-center mb-5  group-hover:bg-arcade-blue-light group-hover:text-[#2455FF] transition-all duration-300">
            <span className="material-symbols-outlined text-[#111111] group-hover:text-[#2455FF] text-3xl transition-colors">add</span>
          </div>
          <h4 className="font-headline font-bold text-base text-[#111111] mb-2">Register New Animal</h4>
          <p className="text-[#454545] font-semibold text-xs max-w-[200px]">Add a new rescue to the sanctuary registry.</p>
        </div>
      </div>
    </div>
  );
}

export default AnimalList;
