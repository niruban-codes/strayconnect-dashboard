// src/components/AnimalList.jsx
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';

function AnimalList({ onSelectAnimal }) {
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
      case 'adopted':    return 'bg-primary-fixed text-on-primary-fixed';
      case 'sheltered':  return 'bg-secondary-container text-on-secondary-container';
      default:           return 'bg-tertiary-container text-on-tertiary-fixed';
    }
  };

  const filtered = animals.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.animalId?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-on-surface-variant">
      <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
      Loading animals...
    </div>
  );

  return (
    <div>
      {/* Search Bar */}
      <div className="relative max-w-2xl group mb-12">
        <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400 group-focus-within:text-primary transition-colors">search</span>
        <input
          className="w-full pl-14 pr-6 py-4 bg-surface-container-lowest border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-stone-400 transition-all outline-none"
          placeholder="Search by name or SC ID (e.g., SC-0001)..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map(animal => (
          <div key={animal.id}
            className="glass-card rounded-[1.5rem] overflow-hidden group hover:shadow-[0_20px_40px_0_rgba(21,66,18,0.08)] transition-all duration-500 cursor-pointer"
            onClick={() => onSelectAnimal(animal)}
          >
            {/* Photo */}
            <div className="relative h-64 overflow-hidden">
              {animal.imageUrl ? (
                <img src={animal.imageUrl} alt={animal.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-outline-variant">pets</span>
                </div>
              )}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="px-3 py-1 bg-blue-500/90 text-white text-xs font-bold rounded-full backdrop-blur-md">
                  {animal.animalId || 'No ID'}
                </span>
                {animal.isVerified ? (
                  <span className="px-3 py-1 bg-emerald-500/90 text-white text-xs font-bold rounded-full backdrop-blur-md flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    Verified
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-500/90 text-white text-xs font-bold rounded-full backdrop-blur-md flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">pending</span>
                    Unverified
                  </span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-headline font-bold text-2xl text-primary">{animal.name}</h3>
                <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${statusStyle(animal.status)}`}>
                  {animal.status}
                </span>
              </div>
              <div className="space-y-3 text-on-surface-variant text-sm mb-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-stone-400">pets</span>
                  <span>{animal.species} · {animal.breed || 'Unknown breed'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-stone-400">info</span>
                  <span className="capitalize">{animal.sex} · {animal.age ? `${animal.age} yrs` : 'Age unknown'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-stone-400">location_on</span>
                  <span>{animal.location || 'Location unknown'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectAnimal(animal)}
                  className="flex-1 py-3 bg-primary text-white font-bold rounded-full shadow-lg shadow-primary/10 hover:brightness-110 transition-all"
                >
                  View Profile
                </button>
                <button
                  onClick={(e) => handleDelete(e, animal.id)}
                  className="p-3 bg-error-container text-on-error-container rounded-full hover:bg-error hover:text-white transition-all"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Placeholder */}
        <div
          onClick={() => {}}
          className="border-2 border-dashed border-outline-variant/30 rounded-[1.5rem] flex flex-col items-center justify-center p-12 text-center group cursor-pointer hover:bg-emerald-50/30 transition-all"
        >
          <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-primary text-3xl">add</span>
          </div>
          <h4 className="font-headline font-bold text-primary mb-2">Register New Animal</h4>
          <p className="text-on-surface-variant text-sm max-w-[200px]">Add a new rescue to the sanctuary registry.</p>
        </div>
      </div>
    </div>
  );
}

export default AnimalList;