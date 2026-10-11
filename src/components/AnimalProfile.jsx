// src/components/AnimalProfile.jsx
import { useState, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { verifyPassport } from '../utils/passport';
import { saveMedicalRecord } from '../utils/medicalRecord';
import { sendHealthPush } from '../services/healthNotifications';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import AnimalPhotoViewer from './AnimalPhotoViewer';
import { formatAnimalAge } from '../utils/animalAge';

function AnimalProfile({ animal, onClose }) {
  const [activeTab, setActiveTab] = useState('vaccinations');
  const [addingVaccine, setAddingVaccine] = useState(false);
  const [addingMedical, setAddingMedical] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(null);
  const photos = [...new Set([animal.imageUrl, ...(Array.isArray(animal.imageUrls) ? animal.imageUrls : [])].filter(url => typeof url === 'string' && url.trim()))];

  // Password Modal State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const [vaccine, setVaccine] = useState('');
  const [vaccineDate, setVaccineDate] = useState('');
  const [vaccineNextDue, setVaccineNextDue] = useState('');
  const [vaccineGivenBy, setVaccineGivenBy] = useState('');

  const [condition, setCondition] = useState('');
  const [treatedOn, setTreatedOn] = useState('');
  const [medNotes, setMedNotes] = useState('');
  const [treatedBy, setTreatedBy] = useState('');

  const animalRef = doc(db, 'animals', animal.id);

  const [savingRecord, setSavingRecord] = useState(false);
  const recordLock = useRef(false);
  const pendingRecordIds = useRef({});

  const saveRecord = async (field, fields, title, message, onSuccess) => {
    if (recordLock.current) return;
    recordLock.current = true;
    setSavingRecord(true);
    try {
      if (!auth.currentUser) throw new Error('Please sign in again.');
      const id = pendingRecordIds.current[field] ||= doc(collection(db, 'notifications')).id;
      const record = { ...fields, id, addedAt: new Date().toISOString(), enteredBy: auth.currentUser.uid };
      const notification = await runTransaction(db, tx => saveMedicalRecord(tx, animalRef,
        doc(db, 'notifications', id), field, record, title, message, serverTimestamp()));
      delete pendingRecordIds.current[field];
      onSuccess();
      // Push is best-effort after the record and in-app notification commit together.
      sendHealthPush(notification).catch(error => console.error('Push delivery failed:', error));
    } catch (error) {
      alert(`Record save could not be confirmed. Retry to safely check/save this entry. ${error.message}`);
    } finally { recordLock.current = false; setSavingRecord(false); }
  };
  const handleAddVaccine = async e => {
    e.preventDefault();
    await saveRecord('vaccinations', { vaccine, date: vaccineDate, nextDue: vaccineNextDue, givenBy: vaccineGivenBy },
      `Vaccination Update: ${animal.name}`, `${animal.name} received ${vaccine}.` + (vaccineNextDue ? ` Next due on ${vaccineNextDue}.` : ''), () => {
        setVaccine(''); setVaccineDate(''); setVaccineNextDue(''); setVaccineGivenBy(''); setAddingVaccine(false);
      });
  };
  const handleAddMedical = async e => {
    e.preventDefault();
    await saveRecord('medicalHistory', { condition, treatedOn, notes: medNotes, treatedBy },
      `Medical Update: ${animal.name}`, `A clinical observation for "${condition}" was added to ${animal.name}'s passport.`, () => {
        setCondition(''); setTreatedOn(''); setMedNotes(''); setTreatedBy(''); setAddingMedical(false);
      });
  };

  // Secure Verification Logic
  const handleConfirmVerification = async (e) => {
    e.preventDefault();
    if (!adminPassword) {
      setVerifyError('Please enter your password.');
      return;
    }

    setIsVerifying(true);
    setVerifyError('');

    try {
      const user = auth.currentUser;

      const credential = EmailAuthProvider.credential(user.email, adminPassword);
      await reauthenticateWithCredential(user, credential);

      await runTransaction(db, tx => verifyPassport(tx, animalRef, user.uid, serverTimestamp()));

      setShowVerifyModal(false);
      setAdminPassword('');

    } catch (err) {
      console.error("Verification error:", err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setVerifyError('Incorrect password. Access denied.');
      } else {
        setVerifyError('Too many attempts or server error. Please try again later.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const inputCls = "w-full bg-paper border border-ink rounded-none p-3 text-sm focus:ring-2 focus:ring-[#2455FF]/30 outline-none text-[#111111] font-body font-semibold placeholder:text-muted transition-all";
  const labelCls = "text-[10px] uppercase font-extrabold text-[#454545] ml-1 block mb-1 tracking-widest";

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose}
        className="fixed inset-0 z-[60] bg-[#111111]/40 " />

      {/* Main Profile Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8 pointer-events-none font-body">
        <div className="passport-modal border border-ink bg-paper relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-none shadow-2xl flex flex-col md:flex-row pointer-events-auto">

          {/* Close */}
          <button onClick={onClose} aria-label="Close animal profile"
            className="absolute top-6 right-6 z-[80] w-10 h-10 flex items-center justify-center rounded-none bg-paper  hover:bg-paper text-[#111111] shadow-sm transition-all  border border-ink">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>

          {/* Left — Photo Gallery */}
          <div className="passport-gallery w-full md:w-5/12 bg-arcade-purple p-6 flex flex-col gap-4 border-r border-ink">
            {photos.length > 0 ? (
              <button type="button" className="passport-photo-trigger" onClick={() => setPhotoIndex(0)} aria-label={`Open full photo of ${animal.name || 'animal'}`}>
                <img src={photos[0]} alt={animal.name || 'Animal'} />
                <span>VIEW FULL PHOTO ↗</span>
              </button>
            ) : (
                <div className="aspect-square w-full bg-paper flex items-center justify-center border border-ink">
                  <span className="material-symbols-outlined text-6xl text-muted">pets</span>
                </div>
            )}
            <div className="passport-counters"><p className="eyebrow">CARE LOG / RECORD COUNTS</p>{[
              ['Vaccinations', animal.vaccinations?.length || 0], ['Medical notes', animal.medicalHistory?.length || 0],
            ].map(([label, count]) => <div key={label}><span>{label}</span><strong>{count}</strong></div>)}<small>Records on file, not a health assessment.</small></div>
            {/* Thumbnails */}
            {photos.length > 1 && (
              <div className="passport-photo-thumbs">
                {photos.map((url, i) => (
                  <button type="button" key={url} className="passport-photo-thumb" onClick={() => setPhotoIndex(i)} aria-label={`Open photo ${i + 1} of ${animal.name || 'animal'}`}>
                    <img src={url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right — Details */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="p-8 pb-4">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {animal.isVerified ? (
                  <div className="bg-arcade-mint text-emerald-700 text-[10px] font-extrabold px-3 py-1.5 rounded-none flex items-center gap-1 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    Verified
                  </div>
                ) : null}
                <div className="bg-paper text-[#111111] text-[10px] font-extrabold px-3 py-1.5 rounded-none uppercase tracking-wider">
                  SC ID: {animal.animalId || 'N/A'}
                </div>
              </div>

              {/* Name + Verify button */}
              <div className="flex flex-wrap gap-4 justify-between items-start mb-6">
                <div>
                  <h2 className="font-headline text-3xl font-black text-[#111111] mb-1 tracking-tight">{animal.name}</h2>
                  <p className="font-semibold text-lg text-[#454545] flex items-center gap-2 capitalize">
                    {animal.species} {animal.breed ? `· ${animal.breed}` : ''} · {animal.sex}
                  </p>
                </div>
                {!animal.isVerified && (
                  <button onClick={() => {
                    setShowVerifyModal(true);
                    setVerifyError('');
                    setAdminPassword('');
                  }}
                    className="bg-arcade-blue-light hover:bg-[#2455FF] text-[#2455FF] hover:text-white font-extrabold px-6 py-3 rounded-none shadow-sm transition-all  flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl">shield</span>
                    Mark as Verified
                  </button>
                )}
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { label: 'Age', value: formatAnimalAge(animal) },
                  { label: 'Location', value: animal.location || 'Unknown' },
                  { label: 'Status', value: animal.status },
                  { label: 'Passport', value: animal.isVerified ? 'Verified' : 'Pending', highlight: true },
                ].map(item => (
                  <div key={item.label} className="bg-paper p-4 rounded-none border border-ink shadow-sm">
                    <p className="text-[10px] uppercase font-extrabold text-muted mb-1 tracking-widest">{item.label}</p>
                    <p className={`font-bold text-lg capitalize ${item.highlight ? 'text-[#2455FF]' : 'text-[#111111]'}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="px-8 pb-8">
              <div className="flex flex-wrap gap-4 border-b border-ink mb-8">
                {[
                  { id: 'vaccinations', label: 'Vaccination History' },
                  { id: 'medical', label: 'Medical History' },
                  { id: 'shelter', label: 'Shelter Info' },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`pb-4 text-sm font-bold transition-colors uppercase tracking-wider ${activeTab === tab.id
                      ? 'text-[#111111] border-b-2 border-[#111111]'
                      : 'text-[#454545] hover:text-[#111111]'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Vaccinations Tab */}
              {activeTab === 'vaccinations' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-headline text-xl font-black text-[#111111]">Immunization Records</h3>
                    <button disabled={savingRecord || animal.status === 'archived'} onClick={() => setAddingVaccine(!addingVaccine)}
                      className="text-[#2455FF] hover:bg-arcade-blue-light px-4 py-2 rounded-none text-sm font-extrabold flex items-center gap-2 transition-colors">
                      <span className="material-symbols-outlined text-lg">add_circle</span>
                      Add Vaccine
                    </button>
                  </div>

                  {addingVaccine && (
                    <form onSubmit={handleAddVaccine}
                      className="bg-paper border-2 border-dashed border-ink p-6 rounded-none">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className={labelCls}>Vaccine Name</label>
                          <input className={inputCls} placeholder="e.g. Rabies" value={vaccine}
                            onChange={e => setVaccine(e.target.value)} required />
                        </div>
                        <div>
                          <label className={labelCls}>Date Administered</label>
                          <input className={inputCls} type="date" value={vaccineDate}
                            onChange={e => setVaccineDate(e.target.value)} required />
                        </div>
                        <div>
                          <label className={labelCls}>Next Due Date</label>
                          <input className={inputCls} type="date" value={vaccineNextDue}
                            onChange={e => setVaccineNextDue(e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>Administered By</label>
                          <input className={inputCls} placeholder="Dr. Name" value={vaccineGivenBy}
                            onChange={e => setVaccineGivenBy(e.target.value)} />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setAddingVaccine(false)}
                          className="px-4 py-2 text-sm font-bold text-[#454545] hover:text-[#D92532] transition-colors">
                          Cancel
                        </button>
                        <button type="submit" disabled={savingRecord || isVerifying || animal.status === 'archived'}
                          className="bg-[#111111] text-white px-6 py-2.5 rounded-none text-sm font-extrabold shadow-md hover:bg-[#2455FF] transition-all ">
                          Save Record
                        </button>
                      </div>
                    </form>
                  )}


                  <div className="space-y-3">
                    {animal.vaccinations?.length > 0 ? animal.vaccinations.map((v, i) => (
                      <div key={i} className="bg-paper p-4 rounded-none flex flex-wrap items-center justify-between gap-4 shadow-sm border border-ink hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-paper rounded-none flex items-center justify-center text-[#111111]">
                            <span className="material-symbols-outlined">vaccines</span>
                          </div>
                          <div>
                            <p className="font-extrabold text-[#111111]">{v.vaccine}</p>
                            <p className="text-xs text-[#454545] font-medium">Administered by {v.givenBy || 'Unknown'}</p>
                          </div>
                        </div>
                        <div className="flex gap-8 text-right">
                          <div>
                            <p className="text-[10px] uppercase font-extrabold text-muted mb-0.5 tracking-widest">Given On</p>
                            <p className="text-sm font-bold text-[#111111]">{v.date}</p>
                          </div>
                          {v.nextDue && (
                            <div>
                              <p className="text-[10px] uppercase font-extrabold text-muted mb-0.5 tracking-widest">Next Due</p>
                              <p className="text-sm font-black text-[#8F4500]">{v.nextDue}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )) : (
                      <p className="text-[#454545] font-semibold text-sm py-4">No vaccination records yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Medical Tab */}
              {activeTab === 'medical' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-headline text-xl font-black text-[#111111]">Clinical Observations</h3>
                    <button disabled={savingRecord || animal.status === 'archived'} onClick={() => setAddingMedical(!addingMedical)}
                      className="text-[#2455FF] hover:bg-arcade-blue-light px-4 py-2 rounded-none text-sm font-extrabold flex items-center gap-2 transition-colors">
                      <span className="material-symbols-outlined text-lg">add_circle</span>
                      Add Medical Record
                    </button>
                  </div>

                  {addingMedical && (
                    <form onSubmit={handleAddMedical}
                      className="bg-paper border-2 border-dashed border-ink p-6 rounded-none">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className={labelCls}>Condition</label>
                          <input className={inputCls} value={condition}
                            onChange={e => setCondition(e.target.value)} required />
                        </div>
                        <div>
                          <label className={labelCls}>Treated On</label>
                          <input className={inputCls} type="date" value={treatedOn}
                            onChange={e => setTreatedOn(e.target.value)} required />
                        </div>
                        <div>
                          <label className={labelCls}>Treated By</label>
                          <input className={inputCls} placeholder="Dr. Name" value={treatedBy}
                            onChange={e => setTreatedBy(e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>Notes</label>
                          <input className={inputCls} value={medNotes}
                            onChange={e => setMedNotes(e.target.value)} />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setAddingMedical(false)}
                          className="px-4 py-2 text-sm font-bold text-[#454545] hover:text-[#D92532] transition-colors">Cancel</button>
                        <button type="submit" disabled={savingRecord || isVerifying || animal.status === 'archived'}
                          className="bg-[#111111] text-white px-6 py-2.5 rounded-none text-sm font-extrabold shadow-md hover:bg-[#2455FF]  transition-all">
                          Save Record
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-3">
                    {animal.medicalHistory?.length > 0 ? animal.medicalHistory.map((m, i) => (
                      <div key={i} className="bg-paper p-4 rounded-none flex items-center gap-4 shadow-sm border border-ink hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-arcade-blue-light rounded-none flex items-center justify-center flex-shrink-0 text-[#2455FF]">
                          <span className="material-symbols-outlined">medical_information</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-extrabold text-[#111111]">{m.condition}</p>
                          {m.notes && <p className="text-xs text-[#454545] font-medium mt-0.5">{m.notes}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] uppercase font-extrabold text-muted mb-0.5 tracking-widest">Treated By</p>
                          <p className="text-sm font-bold text-[#111111]">{m.treatedBy || 'Unknown'}</p>
                          <p className="text-[10px] text-[#454545] font-semibold mt-1">{m.treatedOn}</p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-[#454545] font-semibold text-sm py-4">No medical records yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Shelter Tab */}
              {activeTab === 'shelter' && (
                <div className="space-y-4">
                  <h3 className="font-headline text-xl font-black text-[#111111] mb-6">Shelter Information</h3>
                  {animal.shelter?.name ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-paper p-4 rounded-none border border-ink shadow-sm">
                        <p className="text-[10px] uppercase font-extrabold text-muted mb-1 tracking-widest">Shelter Name</p>
                        <p className="font-bold text-lg text-[#111111]">{animal.shelter.name}</p>
                      </div>
                      <div className="bg-paper p-4 rounded-none border border-ink shadow-sm">
                        <p className="text-[10px] uppercase font-extrabold text-muted mb-1 tracking-widest">Contact</p>
                        <p className="font-bold text-lg text-[#111111]">{animal.shelter.contactNumber || 'N/A'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[#454545] font-semibold text-sm">No shelter information recorded.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {photoIndex !== null && photos.length > 0 && <AnimalPhotoViewer photos={photos} initialIndex={photoIndex} name={animal.name} onClose={() => setPhotoIndex(null)} />}

      {/* The Password Verification Modal overlay */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#111111]/60  p-4 font-body">
          <form onSubmit={handleConfirmVerification} className="bg-paper rounded-none p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">

            <button type="button" onClick={() => setShowVerifyModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-none hover:bg-paper text-[#111111] transition-colors">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div className="w-16 h-16 bg-arcade-pink text-ink rounded-none flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
            </div>

            <h3 className="text-2xl font-headline font-black text-[#111111] mb-2 tracking-tight">Admin Override</h3>
            <p className="text-[#454545] font-medium text-sm mb-6 leading-relaxed">
              You are about to securely verify <strong className="text-[#111111] font-bold">{animal.name}</strong> and assign an official SC ID. Please confirm your admin password to proceed.
            </p>

            <div className="mb-6">
              <label className={labelCls}>Password</label>
              <input
                type="password"
                className={inputCls}
                placeholder="Enter your password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                autoFocus
              />
              {verifyError && (
                <p className="text-[#D92532] text-xs mt-2 flex items-center gap-1 font-bold">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {verifyError}
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button type="button" onClick={() => setShowVerifyModal(false)} disabled={isVerifying}
                className="flex-1 py-3.5 font-bold text-[#454545] bg-paper rounded-none hover:bg-stone-200 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={savingRecord || isVerifying || animal.status === 'archived'}
                className="flex-1 py-3.5 font-extrabold text-white bg-[#111111] rounded-none hover:bg-[#2455FF]  transition-all flex items-center justify-center gap-2">
                {isVerifying ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    Verifying...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default AnimalProfile;
