// src/components/AddAnimal.jsx
import { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { passportId } from '../utils/passport';
import { registerRescueAnimal } from '../utils/rescueIntake';
import axios from 'axios';

function AddAnimal({ onSuccess, report }) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState(report?.animalType?.toLowerCase() || '');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('unknown');

  // Defaulting to stray for the admin dashboard
  const [ownershipStatus, setOwnershipStatus] = useState('stray');
  const [location, setLocation] = useState(report?.location || '');
  const [shelterName, setShelterName] = useState('');
  const [shelterContact, setShelterContact] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!species) { alert("Please select a species."); return; }
    if (submitting) return;
    if (files.length === 0 && !report?.imageUrl) { alert("Please select at least one image."); return; }
    setSubmitting(true);
    try {
      if (!auth.currentUser) throw new Error('Please sign in again.');
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
      const uploadedUrls = responses.length ? responses.map((res) => res.data.secure_url) : [report.imageUrl];
      const animalRef = report ? doc(db, 'animals', `rescue-${report.id}`) : doc(collection(db, 'animals'));
      const animalId = passportId(animalRef.id);

      const data = {
        animalId, name, species,
        breed: breed || 'Unknown',
        age: age ? Number(age) : null,
        sex, location: location || 'Unknown',
        status: ownershipStatus, // stray or sheltered
        isVerified: false,
        createdBy: auth.currentUser.uid, addedAt: serverTimestamp(),
        imageUrl: uploadedUrls[0], imageUrls: uploadedUrls,
        // Only save shelter info if it is actually sheltered
        shelter: ownershipStatus === 'sheltered' ? { name: shelterName || '', contactNumber: shelterContact || '' } : null,
        vaccinations: [], medicalHistory: [],
      };
      let registeredId = animalRef.id;
      if (report) registeredId = await runTransaction(db, tx => registerRescueAnimal(tx, doc(db, 'reports', report.id), animalRef, data, auth.currentUser.uid, serverTimestamp()));
      else await setDoc(animalRef, data);

      setName(''); setSpecies(''); setBreed(''); setAge('');
      setSex('unknown'); setOwnershipStatus('stray'); setLocation('');
      setShelterName(''); setShelterContact(''); setFiles([]);
      e.target.reset();
      alert(registeredId === animalRef.id ? `Animal registered! ID: ${animalId}` : 'This report already has an animal passport. Open it from the report.');
      if (onSuccess) onSuccess();
    } catch (error) {
      alert('Failed to add animal: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full bg-paper border border-ink rounded-none p-4 focus:ring-2 focus:ring-[#2455FF]/30 text-[#111111] font-body font-semibold placeholder:text-muted transition-all outline-none text-sm";
  const labelCls = "text-sm font-extrabold text-[#111111] font-body ml-1 block mb-2 tracking-wide";
  const sectionIconCls = "w-10 h-10 rounded-none bg-arcade-blue-light flex items-center justify-center text-[#2455FF] flex-shrink-0";

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {report && <p className="p-4 bg-paper rounded-none">Registering from a rescue report. Location, species and the report photo are prefilled; you can replace the photo.</p>}
      {/* Basic Info */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <span className={sectionIconCls}>
            <span className="material-symbols-outlined text-[22px]">info</span>
          </span>
          <h3 className="text-xl font-black text-[#111111] font-headline tracking-tight">Basic Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelCls}>Animal Name <span className="text-[#454545] font-medium ml-1">(Optional)</span></label>
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

          {/* Ownership Status - Admin specific */}
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
        <div className="flex items-center gap-4 mb-8">
          <span className={sectionIconCls}>
            <span className="material-symbols-outlined text-[22px]">location_on</span>
          </span>
          <h3 className="text-xl font-black text-[#111111] font-headline tracking-tight">Rescue Location</h3>
        </div>
        <div>
          <label className={labelCls}>Area / City</label>
          <input className={inputCls} type="text" placeholder="e.g. Colombo 07 or Kandy Road"
            value={location} onChange={e => setLocation(e.target.value)} />
        </div>
      </section>

      {/* Photos */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <span className={sectionIconCls}>
            <span className="material-symbols-outlined text-[22px]">photo_camera</span>
          </span>
          <h3 className="text-xl font-black text-[#111111] font-headline tracking-tight">Gallery & Identification</h3>
        </div>
        <label className="border-2 border-dashed border-ink rounded-none p-10 flex flex-col items-center justify-center bg-paper hover:bg-paper transition-colors cursor-pointer group">
          <span className="material-symbols-outlined text-4xl text-muted group-hover:text-[#2455FF] transition-colors mb-2">cloud_upload</span>
          <p className="text-[#111111] font-body font-bold">Choose animal photos</p>
          <p className="text-[#454545] font-body font-semibold text-xs mt-1 uppercase tracking-widest">Select one or more clear images</p>
          <input type="file" accept="image/*" multiple className="hidden"
            onChange={e => setFiles(e.target.files)} required={!report?.imageUrl} />
        </label>
        {report?.imageUrl && files.length === 0 && <img src={report.imageUrl} alt="Photo from rescue report" className="mt-4 w-32 h-32 object-cover rounded-none" />}
        {files.length > 0 && (
          <div className="mt-4 flex gap-3 flex-wrap">
            {Array.from(files).map((file, i) => (
              <div key={i} className="w-16 h-16 rounded-none overflow-hidden border-2 border-[#111111]">
                <img src={URL.createObjectURL(file)} alt=""
                  className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Conditionally Render Shelter Info */}
      {ownershipStatus === 'sheltered' && (
        <section className="bg-paper rounded-none p-6 border border-ink animate-in fade-in slide-in-from-top-4 duration-300">
          <details className="group" open>
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-none bg-arcade-yellow flex items-center justify-center text-[#8F4500]">
                  <span className="material-symbols-outlined text-[22px]">home_health</span>
                </span>
                <h3 className="text-lg font-black text-[#111111] font-headline tracking-tight">Shelter Information</h3>
              </div>
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-ink">
              <div>
                <label className={labelCls}>Shelter Name</label>
                <input className="w-full bg-paper border border-ink rounded-none p-3 focus:ring-2 focus:ring-[#2455FF]/30 text-[#111111] font-body font-semibold transition-all outline-none text-sm"
                  type="text" value={shelterName} onChange={e => setShelterName(e.target.value)} required={ownershipStatus === 'sheltered'} />
              </div>
              <div>
                <label className={labelCls}>Contact Number</label>
                <input className="w-full bg-paper border border-ink rounded-none p-3 focus:ring-2 focus:ring-[#2455FF]/30 text-[#111111] font-body font-semibold placeholder:text-muted transition-all outline-none text-sm"
                  type="tel" placeholder="+94 XX XXX XXXX"
                  value={shelterContact} onChange={e => setShelterContact(e.target.value)} />
              </div>
            </div>
          </details>
        </section>
      )}

      {/* Submit */}
      <div className="pt-4">
        <button type="submit" disabled={submitting}
          className="w-full py-5 px-8 rounded-none bg-[#111111] text-white font-body font-extrabold text-lg shadow-lg  hover:brightness-110 active:translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed tracking-wide">
          <span className="material-symbols-outlined">app_registration</span>
          {submitting ? 'Registering...' : 'Register Animal'}
        </button>
      </div>

    </form>
  );
}

export default AddAnimal;
