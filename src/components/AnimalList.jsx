// src/components/AnimalList.jsx
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';

// UPDATE 1: Added onNavigate to the props
function AnimalList({ onSelectAnimal, onNavigate }) {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'animals'), orderBy('addedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAnimals(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (e, animalId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this animal?')) return;
    await deleteDoc(doc(db, 'animals', animalId));
  };

  const statusStyle = (status) => {
    switch (status) {
      case 'adopted': return 'bg-emerald-100 text-emerald-700';
      case 'sheltered': return 'bg-[#00A7E7]/10 text-[#00A7E7]';
      case 'owned': return 'bg-purple-100 text-purple-700'; // NEW: Owned badge
      default: return 'bg-[#FF912C]/10 text-[#FF912C]'; // Stray
    }
  };

  const filtered = animals.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.animalId?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-[#52616B] font-['Urbanist'] font-bold">
      <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
      Loading animals...
    </div>
  );

  return (
    <div className="font-['Urbanist']">
      {/* Search Bar */}
      <div className="relative max-w-2xl group mb-12">
        <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#52616B]/60 group-focus-within:text-[#00A7E7] transition-colors">search</span>
        <input
          className="w-full pl-14 pr-6 py-4 bg-white border border-[#003459]/10 rounded-2xl shadow-sm focus:ring-2 focus:ring-[#00A7E7]/30 text-[#00171F] font-bold placeholder:text-[#52616B]/50 transition-all outline-none"
          placeholder="Search by name or SC ID (e.g., SC-0001)..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map(animal => (
          <div key={animal.id}
            className="bg-white rounded-[2rem] border border-[#003459]/10 overflow-hidden group hover:shadow-xl hover:shadow-[#003459]/5 transition-all duration-500 cursor-pointer flex flex-col"
            onClick={() => onSelectAnimal(animal)}
          >
            {/* Photo */}
            <div className="relative h-64 overflow-hidden bg-stone-100 border-b border-[#003459]/5">
              {animal.imageUrl ? (
                <img src={animal.imageUrl} alt={animal.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#52616B]/20">
                  <span className="material-symbols-outlined text-6xl">pets</span>
                </div>
              )}

              {/* Floating Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="px-3.5 py-1.5 bg-[#003459]/90 text-white text-[10px] font-extrabold tracking-wider rounded-full backdrop-blur-md shadow-sm">
                  {animal.animalId || 'No ID'}
                </span>
                {animal.isVerified ? (
                  <span className="px-3 py-1.5 bg-emerald-500/90 text-white text-[10px] font-extrabold tracking-wider rounded-full backdrop-blur-md shadow-sm flex items-center gap-1 uppercase">
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    Verified
                  </span>
                ) : (
                  <span className="px-3 py-1.5 bg-[#FF912C]/90 text-white text-[10px] font-extrabold tracking-wider rounded-full backdrop-blur-md shadow-sm flex items-center gap-1 uppercase">
                    <span className="material-symbols-outlined text-[14px]">pending</span>
                    Unverified
                  </span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="p-6 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-['Poppins'] font-black text-2xl text-[#003459] truncate pr-2">{animal.name || 'Unnamed Pet'}</h3>
                <span className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full flex-shrink-0 ${statusStyle(animal.status)}`}>
                  {animal.status}
                </span>
              </div>

              <div className="space-y-3 text-[#52616B] font-semibold text-sm mb-8 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-lg text-[#52616B]/60">pets</span>
                  <span className="capitalize text-[#00171F]">{animal.species} · {animal.breed || 'Unknown breed'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-lg text-[#52616B]/60">info</span>
                  <span className="capitalize text-[#00171F]">{animal.sex} · {animal.age ? `${animal.age} yrs` : 'Age unknown'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-lg text-[#52616B]/60">location_on</span>
                  <span className="text-[#00171F] truncate">{animal.location || 'Location unknown'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-[#003459]/5 mt-auto">
                <button
                  onClick={() => onSelectAnimal(animal)}
                  className="flex-1 py-3 bg-[#003459] text-white font-extrabold rounded-xl hover:bg-[#00A7E7] transition-all shadow-sm"
                >
                  View Profile
                </button>
                <button
                  onClick={(e) => handleDelete(e, animal.id)}
                  className="p-3 bg-[#FF564F]/10 text-[#FF564F] rounded-xl hover:bg-[#FF564F] hover:text-white transition-all shadow-sm"
                  title="Delete Record"
                >
                  <span className="material-symbols-outlined block text-[20px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Placeholder */}
        <div
          // UPDATE 2: Wired up the onClick handler
          onClick={() => onNavigate('add')}
          className="bg-white/50 border-2 border-dashed border-[#003459]/20 rounded-[2rem] flex flex-col items-center justify-center p-12 text-center group cursor-pointer hover:bg-white hover:border-[#003459]/40 hover:shadow-md transition-all duration-300 min-h-[400px]"
        >
          <div className="w-16 h-16 rounded-full bg-[#003459]/5 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#00A7E7]/10 group-hover:text-[#00A7E7] transition-all duration-300">
            <span className="material-symbols-outlined text-[#003459] group-hover:text-[#00A7E7] text-3xl transition-colors">add</span>
          </div>
          <h4 className="font-['Poppins'] font-bold text-xl text-[#003459] mb-2">Register New Animal</h4>
          <p className="text-[#52616B] font-semibold text-sm max-w-[200px]">Add a new rescue to the sanctuary registry.</p>
        </div>
      </div>
    </div>
  );
}

export default AnimalList;