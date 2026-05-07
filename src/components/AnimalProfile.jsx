// src/components/AnimalProfile.jsx
import { useState } from 'react';
import { db, auth } from '../firebase';
// 🚀 NEW: Added getDoc to the imports below!
import { collection, doc, updateDoc, arrayUnion, getDocs, query, orderBy, limit, addDoc, getDoc } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

function AnimalProfile({ animal, onClose }) {
  const [activeTab, setActiveTab] = useState('vaccinations');
  const [addingVaccine, setAddingVaccine] = useState(false);
  const [addingMedical, setAddingMedical] = useState(false);

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

  const generateScId = async () => {
    const q = query(
      collection(db, 'animals'),
      orderBy('animalId', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return 'SC-0001';
    }

    const highestAnimal = snapshot.docs[0].data();
    const highestId = highestAnimal.animalId;

    if (!highestId || !highestId.includes('SC-')) {
      return 'SC-0001';
    }

    const currentNumber = parseInt(highestId.split('-')[1], 10);
    const nextNumber = currentNumber + 1;

    return `SC-${String(nextNumber).padStart(4, '0')}`;
  };

  const handleAddVaccine = async (e) => {
    e.preventDefault();
    await updateDoc(animalRef, {
      vaccinations: arrayUnion({ vaccine, date: vaccineDate, nextDue: vaccineNextDue, givenBy: vaccineGivenBy, addedAt: new Date().toISOString() })
    });

    if (animal.ownerId) {
      // 1. In-App Notification (Database)
      await addDoc(collection(db, 'notifications'), {
        userId: animal.ownerId,
        type: 'health_update',
        title: `Vaccination Update: ${animal.name} 💉`,
        message: `${animal.name} received the ${vaccine} vaccine.` + (vaccineNextDue ? ` Next due on ${vaccineNextDue}.` : ''),
        animalId: animal.id,
        isRead: false,
        createdAt: new Date()
      });

      // 2. 🚀 NEW: Native Push Notification via Expo
      try {
        const userDoc = await getDoc(doc(db, 'users', animal.ownerId));
        if (userDoc.exists() && userDoc.data().expoPushToken) {
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: userDoc.data().expoPushToken,
              sound: 'default',
              title: `Vaccination Update: ${animal.name} 💉`,
              body: `${animal.name} received the ${vaccine} vaccine.`,
            }),
          });
        }
      } catch (err) {
        console.error("Push Notification Error:", err);
      }
    }

    setVaccine(''); setVaccineDate(''); setVaccineNextDue(''); setVaccineGivenBy('');
    setAddingVaccine(false);
  };

  const handleAddMedical = async (e) => {
    e.preventDefault();
    await updateDoc(animalRef, {
      medicalHistory: arrayUnion({ condition, treatedOn, notes: medNotes, treatedBy, addedAt: new Date().toISOString() })
    });

    if (animal.ownerId) {
      // 1. In-App Notification (Database)
      await addDoc(collection(db, 'notifications'), {
        userId: animal.ownerId,
        type: 'health_update',
        title: `Medical Update: ${animal.name} 🏥`,
        message: `${animal.name}'s clinical observation for "${condition}" has been logged by the vet.`,
        animalId: animal.id,
        isRead: false,
        createdAt: new Date()
      });

      // 2. 🚀 NEW: Native Push Notification via Expo
      try {
        const userDoc = await getDoc(doc(db, 'users', animal.ownerId));
        if (userDoc.exists() && userDoc.data().expoPushToken) {
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: userDoc.data().expoPushToken,
              sound: 'default',
              title: `Medical Update: ${animal.name} 🏥`,
              body: `A clinical observation for "${condition}" was just added to your pet's passport.`,
            }),
          });
        }
      } catch (err) {
        console.error("Push Notification Error:", err);
      }
    }

    setCondition(''); setTreatedOn(''); setMedNotes(''); setTreatedBy('');
    setAddingMedical(false);
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

      const newScId = await generateScId();

      await updateDoc(animalRef, {
        isVerified: true,
        animalId: newScId,
        verifiedAt: new Date().toISOString(),
        verifiedBy: user.uid
      });

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

  const inputCls = "w-full bg-white border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none";
  const labelCls = "text-[10px] uppercase font-bold text-on-surface-variant ml-1 block mb-1";

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose}
        className="fixed inset-0 z-[60] bg-on-surface/40 backdrop-blur-sm" />

      {/* Main Profile Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8 pointer-events-none">
        <div className="bg-surface relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[2rem] shadow-[0_24px_48px_-12px_rgba(21,66,18,0.15)] flex flex-col md:flex-row pointer-events-auto">

          {/* Close */}
          <button onClick={onClose}
            className="absolute top-6 right-6 z-[80] w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-on-surface shadow-sm transition-all active:scale-95">
            <span className="material-symbols-outlined">close</span>
          </button>

          {/* Left — Photo Gallery */}
          <div className="w-full md:w-5/12 bg-surface-container-low p-6 flex flex-col gap-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl shadow-inner">
              {animal.imageUrl ? (
                <img src={animal.imageUrl} alt={animal.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-outline-variant">pets</span>
                </div>
              )}
              <div className="absolute bottom-4 left-4">
                <span className="bg-primary/90 text-white text-[10px] px-3 py-1 rounded-full font-bold tracking-widest uppercase backdrop-blur-sm">
                  Featured
                </span>
              </div>
            </div>
            {/* Thumbnails */}
            {animal.imageUrls?.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {animal.imageUrls.slice(0, 3).map((url, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
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
                  <div className="bg-primary-fixed text-on-primary-fixed text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    Verified
                  </div>
                ) : null}
                <div className="bg-surface-container-high text-on-surface-variant text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider">
                  SC ID: {animal.animalId || 'N/A'}
                </div>
              </div>

              {/* Name + Verify button */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="font-headline text-5xl font-extrabold text-primary mb-1">{animal.name}</h2>
                  <p className="font-body text-lg text-secondary flex items-center gap-2">
                    {animal.species} {animal.breed ? `· ${animal.breed}` : ''} · {animal.sex}
                  </p>
                </div>
                {!animal.isVerified && (
                  <button onClick={() => {
                    setShowVerifyModal(true);
                    setVerifyError('');
                    setAdminPassword('');
                  }}
                    className="bg-tertiary-container hover:bg-tertiary-fixed text-on-tertiary-fixed font-bold px-6 py-3 rounded-full shadow-sm transition-all active:scale-95 flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl">shield</span>
                    Mark as Verified
                  </button>
                )}
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Age', value: animal.age ? `${animal.age} Years` : 'Unknown' },
                  { label: 'Location', value: animal.location || 'Unknown' },
                  { label: 'Status', value: animal.status },
                  { label: 'Health', value: 'Stable', highlight: true },
                ].map(item => (
                  <div key={item.label} className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/10">
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 tracking-wider">{item.label}</p>
                    <p className={`font-semibold text-lg capitalize ${item.highlight ? 'text-primary' : 'text-on-surface'}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="px-8 pb-8">
              <div className="flex gap-8 border-b border-outline-variant/20 mb-8">
                {[
                  { id: 'vaccinations', label: 'Vaccination History' },
                  { id: 'medical', label: 'Medical History' },
                  { id: 'shelter', label: 'Shelter Info' },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`pb-4 text-sm font-medium transition-colors ${activeTab === tab.id
                      ? 'text-primary font-bold border-b-2 border-primary'
                      : 'text-on-surface-variant hover:text-primary'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Vaccinations Tab */}
              {activeTab === 'vaccinations' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-headline text-xl font-bold text-primary">Immunization Records</h3>
                    <button onClick={() => setAddingVaccine(!addingVaccine)}
                      className="text-primary hover:bg-primary/5 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                      <span className="material-symbols-outlined text-lg">add_circle</span>
                      Add Vaccine
                    </button>
                  </div>

                  {addingVaccine && (
                    <form onSubmit={handleAddVaccine}

                      className="bg-secondary-fixed/20 border-2 border-dashed border-secondary-fixed p-6 rounded-2xl">
                      <div className="grid grid-cols-2 gap-4 mb-4">
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
                          className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface">
                          Cancel
                        </button>
                        <button type="submit"
                          className="bg-primary text-white px-6 py-2 rounded-full text-sm font-bold shadow-md hover:brightness-110 transition-all active:scale-95">
                          Save Record
                        </button>
                      </div>
                    </form>
                  )}


                  <div className="space-y-3">
                    {animal.vaccinations?.length > 0 ? animal.vaccinations.map((v, i) => (
                      <div key={i} className="bg-white/60 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm border border-outline-variant/5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary-fixed/30 rounded-xl flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">vaccines</span>
                          </div>
                          <div>
                            <p className="font-bold text-on-surface">{v.vaccine}</p>
                            <p className="text-xs text-on-surface-variant">Administered by {v.givenBy || 'Unknown'}</p>
                          </div>
                        </div>
                        <div className="flex gap-8 text-right">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-0.5">Given On</p>
                            <p className="text-sm font-medium">{v.date}</p>
                          </div>
                          {v.nextDue && (
                            <div>
                              <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-0.5">Next Due</p>
                              <p className="text-sm font-bold text-tertiary">{v.nextDue}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )) : (
                      <p className="text-on-surface-variant text-sm py-4">No vaccination records yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Medical Tab */}
              {activeTab === 'medical' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-headline text-xl font-bold text-primary">Clinical Observations</h3>
                    <button onClick={() => setAddingMedical(!addingMedical)}
                      className="text-primary hover:bg-primary/5 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                      <span className="material-symbols-outlined text-lg">add_circle</span>
                      Add Medical Record
                    </button>
                  </div>

                  {addingMedical && (
                    <form onSubmit={handleAddMedical}
                      className="bg-secondary-fixed/20 border-2 border-dashed border-secondary-fixed p-6 rounded-2xl">
                      <div className="grid grid-cols-2 gap-4 mb-4">
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
                          className="px-4 py-2 text-sm font-semibold text-on-surface-variant">Cancel</button>
                        <button type="submit"
                          className="bg-primary text-white px-6 py-2 rounded-full text-sm font-bold shadow-md hover:brightness-110 active:scale-95 transition-all">
                          Save Record
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-3">
                    {animal.medicalHistory?.length > 0 ? animal.medicalHistory.map((m, i) => (
                      <div key={i} className="bg-white/40 p-4 rounded-2xl flex items-center gap-4 border border-outline-variant/5">
                        <div className="w-12 h-12 bg-on-surface/5 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined">medical_information</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-bold">{m.condition}</p>
                          {m.notes && <p className="text-xs text-on-surface-variant">{m.notes}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-0.5">Treated By</p>
                          <p className="text-sm font-medium">{m.treatedBy || 'Unknown'}</p>
                          <p className="text-xs text-on-surface-variant">{m.treatedOn}</p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-on-surface-variant text-sm py-4">No medical records yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Shelter Tab */}
              {activeTab === 'shelter' && (
                <div className="space-y-4">
                  <h3 className="font-headline text-xl font-bold text-primary mb-6">Shelter Information</h3>
                  {animal.shelter?.name ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/10">
                        <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Shelter Name</p>
                        <p className="font-semibold text-on-surface">{animal.shelter.name}</p>
                      </div>
                      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/10">
                        <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Contact</p>
                        <p className="font-semibold text-on-surface">{animal.shelter.contactNumber || 'N/A'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-on-surface-variant text-sm">No shelter information recorded.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* The Password Verification Modal overlay */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleConfirmVerification} className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">

            <button type="button" onClick={() => setShowVerifyModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div className="w-16 h-16 bg-tertiary-container text-on-tertiary-fixed rounded-2xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
            </div>

            <h3 className="text-2xl font-headline font-extrabold text-primary mb-2">Admin Override</h3>
            <p className="text-on-surface-variant text-sm mb-6">
              You are about to securely verify <strong className="text-on-surface">{animal.name}</strong> and assign an official SC ID. Please confirm your admin password to proceed.
            </p>

            <div className="mb-6">
              <label className={labelCls}>Password</label>
              <input
                type="password"
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="Enter your password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                autoFocus
              />
              {verifyError && (
                <p className="text-red-500 text-xs mt-2 flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {verifyError}
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button type="button" onClick={() => setShowVerifyModal(false)} disabled={isVerifying}
                className="flex-1 py-3 font-bold text-on-surface-variant bg-surface-container-high rounded-full hover:brightness-95 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={isVerifying}
                className="flex-1 py-3 font-bold text-white bg-primary rounded-full hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2">
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