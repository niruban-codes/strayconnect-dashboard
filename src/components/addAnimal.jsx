// src/components/AddAnimal.jsx
import { useState } from 'react';
import { db } from '../firebase';
import { collection, doc, updateDoc, arrayUnion, getDocs, query, orderBy, limit, addDoc } from 'firebase/firestore';
import axios from 'axios';
function AddAnimal({ onSuccess }) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('unknown');

  // Defaulting to stray for the admin dashboard
  const [ownershipStatus, setOwnershipStatus] = useState('stray');
  const [location, setLocation] = useState('');
  const [shelterName, setShelterName] = useState('');
  const [shelterContact, setShelterContact] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const generateScId = async () => {
    // 1. Query Firestore for the single animal with the highest animalId
    const q = query(
      collection(db, 'animals'),
      orderBy('animalId', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);

    // 2. If the database has no IDs at all yet, start at 1
    if (snapshot.empty) {
      return 'SC-0001';
    }

    // 3. Extract the highest ID (e.g., "SC-0005")
    const highestAnimal = snapshot.docs[0].data();
    const highestId = highestAnimal.animalId;

    // 4. Safety check: If for some reason the ID is missing, default to 1
    if (!highestId || !highestId.includes('SC-')) {
      return 'SC-0001';
    }

    // 5. Isolate the number "0005", turn it into the integer 5, and add 1
    const currentNumber = parseInt(highestId.split('-')[1], 10);
    const nextNumber = currentNumber + 1;

    // 6. Format it back with the leading zeros!
    return `SC-${String(nextNumber).padStart(4, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!species) { alert("Please select a species."); return; }
    if (files.length === 0) { alert("Please select at least one image."); return; }
    setSubmitting(true);
    try {
      const cloudName = "dorhbk11x";
      const uploadPreset = "strayconnect_uploads";
      const uploadURL = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const uploadPromises = Array.from(files).map((file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        return axios.post(uploadURL, formData);
      });
      const responses = await Promise.all(uploadPromises);
      const uploadedUrls = responses.map((res) => res.data.secure_url);
      const animalId = await generateScId();

      await addDoc(collection(db, 'animals'), {
        animalId, name, species,
        breed: breed || 'Unknown',
        age: age ? Number(age) : null,
        sex, location: location || 'Unknown',
        status: ownershipStatus, // stray or sheltered
        isVerified: false,
        createdBy: 'dashboard', addedAt: new Date(),
        imageUrl: uploadedUrls[0], imageUrls: uploadedUrls,
        // Only save shelter info if it is actually sheltered
        shelter: ownershipStatus === 'sheltered' ? { name: shelterName || '', contactNumber: shelterContact || '' } : null,
        vaccinations: [], medicalHistory: [],
      });

      setName(''); setSpecies(''); setBreed(''); setAge('');
      setSex('unknown'); setOwnershipStatus('stray'); setLocation('');
      setShelterName(''); setShelterContact(''); setFiles([]);
      e.target.reset();
      alert(`Animal registered! ID: ${animalId}`);
      if (onSuccess) onSuccess();
    } catch (error) {
      alert('Failed to add animal: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full bg-surface/50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-stone-400 transition-all outline-none text-sm";
  const labelCls = "text-sm font-semibold text-on-surface-variant ml-1 block mb-2";
  const sectionIconCls = "w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-primary flex-shrink-0";

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Basic Info */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <span className={sectionIconCls}>
            <span className="material-symbols-outlined text-sm">info</span>
          </span>
          <h3 className="text-xl font-bold text-primary font-headline">Basic Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelCls}>Animal Name <span className="text-stone-400 font-normal">(Optional)</span></label>
            <input className={inputCls} type="text" placeholder="e.g. Bella"
              value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>Species</label>
            <select className={inputCls} value={species} onChange={e => setSpecies(e.target.value)} required>
              <option value="" disabled>Select Species...</option>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="bird">Bird</option>
              <option value="rabbit">Rabbit</option>
              <option value="reptile">Reptile</option>
              <option value="livestock">Livestock</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Breed / Mix</label>
            <input className={inputCls} type="text" placeholder="e.g. Sri Lankan Hound"
              value={breed} onChange={e => setBreed(e.target.value)} />
          </div>

          {/* UPDATED: Ownership Status - Admin specific */}
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={ownershipStatus} onChange={e => setOwnershipStatus(e.target.value)}>
              <option value="stray">Stray / Unowned</option>
              <option value="sheltered">In Shelter Care</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 md:col-span-2">
            <div>
              <label className={labelCls}>Estimated Age (yrs)</label>
              <input className={inputCls} type="number" placeholder="e.g. 2"
                min="0" max="30" value={age} onChange={e => setAge(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Sex</label>
              <select className={inputCls} value={sex} onChange={e => setSex(e.target.value)}>
                <option value="unknown">Unknown</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Location */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <span className={sectionIconCls}>
            <span className="material-symbols-outlined text-sm">location_on</span>
          </span>
          <h3 className="text-xl font-bold text-primary font-headline">Rescue Location</h3>
        </div>
        <div>
          <label className={labelCls}>Area / City</label>
          <input className={inputCls} type="text" placeholder="e.g. Colombo 07 or Kandy Road"
            value={location} onChange={e => setLocation(e.target.value)} />
        </div>
      </section>

      {/* Photos */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <span className={sectionIconCls}>
            <span className="material-symbols-outlined text-sm">photo_camera</span>
          </span>
          <h3 className="text-xl font-bold text-primary font-headline">Gallery & Identification</h3>
        </div>
        <label className="border-2 border-dashed border-outline-variant/40 rounded-[1.5rem] p-10 flex flex-col items-center justify-center bg-surface/30 hover:bg-emerald-50/30 transition-colors cursor-pointer group">
          <span className="material-symbols-outlined text-4xl text-stone-400 group-hover:text-primary transition-colors mb-2">cloud_upload</span>
          <p className="text-on-surface font-medium">Drag and drop photos here</p>
          <p className="text-stone-400 text-xs mt-1 uppercase tracking-widest">Supports JPG, PNG up to 10MB</p>
          <input type="file" accept="image/*" multiple className="hidden"
            onChange={e => setFiles(e.target.files)} required />
        </label>
        {files.length > 0 && (
          <div className="mt-4 flex gap-3 flex-wrap">
            {Array.from(files).map((file, i) => (
              <div key={i} className="w-16 h-16 rounded-xl overflow-hidden border-2 border-primary">
                <img src={URL.createObjectURL(file)} alt=""
                  className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* UPDATED: Conditionally Render Shelter Info */}
      {ownershipStatus === 'sheltered' && (
        <section className="bg-surface-container-low/50 rounded-2xl p-6 border border-outline-variant/10 animate-in fade-in slide-in-from-top-4 duration-300">
          <details className="group" open>
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-sm">home_health</span>
                </span>
                <h3 className="text-lg font-bold text-primary font-headline">Shelter Information</h3>
              </div>
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-outline-variant/10">
              <div>
                <label className={labelCls}>Shelter Name</label>
                <input className="w-full bg-white border-none rounded-xl p-3 focus:ring-2 focus:ring-primary/20 text-on-surface transition-all outline-none text-sm"
                  type="text" value={shelterName} onChange={e => setShelterName(e.target.value)} required={ownershipStatus === 'sheltered'} />
              </div>
              <div>
                <label className={labelCls}>Contact Number</label>
                <input className="w-full bg-white border-none rounded-xl p-3 focus:ring-2 focus:ring-primary/20 text-on-surface transition-all outline-none text-sm"
                  type="tel" placeholder="+94 XX XXX XXXX"
                  value={shelterContact} onChange={e => setShelterContact(e.target.value)} />
              </div>
            </div>
          </details>
        </section>
      )}

      {/* Submit */}
      <div className="pt-2">
        <button type="submit" disabled={submitting}
          className="w-full py-5 px-8 rounded-full bg-gradient-to-r from-primary to-primary-container text-white font-bold text-lg shadow-xl shadow-emerald-900/10 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed">
          <span className="material-symbols-outlined">app_registration</span>
          {submitting ? 'Registering...' : 'Register Animal'}
        </button>
        <p className="text-center text-stone-400 text-xs mt-4 tracking-widest uppercase">
          Saving one life at a time since 2024
        </p>
      </div>

    </form>
  );
}

export default AddAnimal;