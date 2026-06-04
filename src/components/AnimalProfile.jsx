// src/components/AnimalProfile.jsx
import { useState } from 'react';
import { db, auth } from '../firebase';
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

      // 2. Native Push Notification via Expo
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

      // 2. Native Push Notification via Expo
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

  const inputCls = "w-full bg-white border border-[#003459]/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00A7E7]/30 outline-none text-[#00171F] font-['Urbanist'] font-semibold placeholder:text-[#52616B]/50 transition-all";
  const labelCls = "text-[10px] uppercase font-extrabold text-[#52616B] ml-1 block mb-1 tracking-widest";

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose}
        className="fixed inset-0 z-[60] bg-[#00171F]/40 backdrop-blur-sm" />

      {/* Main Profile Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8 pointer-events-none font-['Urbanist']">
        <div className="bg-white relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[2rem] shadow-2xl flex flex-col md:flex-row pointer-events-auto">

          {/* Close */}
          <button onClick={onClose}
            className="absolute top-6 right-6 z-[80] w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-[#00171F] shadow-sm transition-all active:scale-95 border border-[#003459]/5">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>

          {/* Left — Photo Gallery */}
          <div className="w-full md:w-5/12 bg-stone-50 p-6 flex flex-col gap-4 border-r border-[#003459]/5">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl shadow-inner border border-[#003459]/5">
              {animal.imageUrl ? (
                <img src={animal.imageUrl} alt={animal.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-[#52616B]/20">pets</span>
                </div>
              )}
              <div className="absolute bottom-4 left-4">
                <span className="bg-[#FF912C] text-white text-[10px] px-3 py-1 rounded-full font-extrabold tracking-widest uppercase shadow-md">
                  Featured
                </span>
              </div>
            </div>
            {/* Thumbnails */}
            {animal.imageUrls?.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {animal.imageUrls.slice(0, 3).map((url, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden border border-[#003459]/10">
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
                  <div className="bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    Verified
                  </div>
                ) : null}
                <div className="bg-[#003459]/5 text-[#003459] text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider">
                  SC ID: {animal.animalId || 'N/A'}
                </div>
              </div>

              {/* Name + Verify button */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="font-['Poppins'] text-5xl font-black text-[#003459] mb-1 tracking-tight">{animal.name}</h2>
                  <p className="font-semibold text-lg text-[#52616B] flex items-center gap-2 capitalize">
                    {animal.species} {animal.breed ? `· ${animal.breed}` : ''} · {animal.sex}
                  </p>
                </div>
                {!animal.isVerified && (
                  <button onClick={() => {
                    setShowVerifyModal(true);
                    setVerifyError('');
                    setAdminPassword('');
                  }}
                    className="bg-[#00A7E7]/10 hover:bg-[#00A7E7] text-[#00A7E7] hover:text-white font-extrabold px-6 py-3 rounded-full shadow-sm transition-all active:scale-95 flex items-center gap-2">
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
                  <div key={item.label} className="bg-white p-4 rounded-2xl border border-[#003459]/10 shadow-sm">
                    <p className="text-[10px] uppercase font-extrabold text-[#52616B]/70 mb-1 tracking-widest">{item.label}</p>
                    <p className={`font-bold text-lg capitalize ${item.highlight ? 'text-[#00A7E7]' : 'text-[#00171F]'}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="px-8 pb-8">
              <div className="flex gap-8 border-b border-[#003459]/10 mb-8">
                {[
                  { id: 'vaccinations', label: 'Vaccination History' },
                  { id: 'medical', label: 'Medical History' },
                  { id: 'shelter', label: 'Shelter Info' },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`pb-4 text-sm font-bold transition-colors uppercase tracking-wider ${activeTab === tab.id
                      ? 'text-[#003459] border-b-2 border-[#003459]'
                      : 'text-[#52616B] hover:text-[#003459]'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Vaccinations Tab */}
              {activeTab === 'vaccinations' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-['Poppins'] text-xl font-black text-[#003459]">Immunization Records</h3>
                    <button onClick={() => setAddingVaccine(!addingVaccine)}
                      className="text-[#00A7E7] hover:bg-[#00A7E7]/10 px-4 py-2 rounded-xl text-sm font-extrabold flex items-center gap-2 transition-colors">
                      <span className="material-symbols-outlined text-lg">add_circle</span>
                      Add Vaccine
                    </button>
                  </div>

                  {addingVaccine && (
                    <form onSubmit={handleAddVaccine}
                      className="bg-stone-50 border-2 border-dashed border-[#003459]/20 p-6 rounded-[2rem]">
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
                          className="px-4 py-2 text-sm font-bold text-[#52616B] hover:text-[#FF564F] transition-colors">
                          Cancel
                        </button>
                        <button type="submit"
                          className="bg-[#003459] text-white px-6 py-2.5 rounded-full text-sm font-extrabold shadow-md hover:bg-[#00A7E7] transition-all active:scale-95">
                          Save Record
                        </button>
                      </div>
                    </form>
                  )}


                  <div className="space-y-3">
                    {animal.vaccinations?.length > 0 ? animal.vaccinations.map((v, i) => (
                      <div key={i} className="bg-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm border border-[#003459]/10 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#003459]/5 rounded-xl flex items-center justify-center text-[#003459]">
                            <span className="material-symbols-outlined">vaccines</span>
                          </div>
                          <div>
                            <p className="font-extrabold text-[#00171F]">{v.vaccine}</p>
                            <p className="text-xs text-[#52616B] font-medium">Administered by {v.givenBy || 'Unknown'}</p>
                          </div>
                        </div>
                        <div className="flex gap-8 text-right">
                          <div>
                            <p className="text-[10px] uppercase font-extrabold text-[#52616B]/70 mb-0.5 tracking-widest">Given On</p>
                            <p className="text-sm font-bold text-[#00171F]">{v.date}</p>
                          </div>
                          {v.nextDue && (
                            <div>
                              <p className="text-[10px] uppercase font-extrabold text-[#52616B]/70 mb-0.5 tracking-widest">Next Due</p>
                              <p className="text-sm font-black text-[#FF912C]">{v.nextDue}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )) : (
                      <p className="text-[#52616B] font-semibold text-sm py-4">No vaccination records yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Medical Tab */}
              {activeTab === 'medical' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-['Poppins'] text-xl font-black text-[#003459]">Clinical Observations</h3>
                    <button onClick={() => setAddingMedical(!addingMedical)}
                      className="text-[#00A7E7] hover:bg-[#00A7E7]/10 px-4 py-2 rounded-xl text-sm font-extrabold flex items-center gap-2 transition-colors">
                      <span className="material-symbols-outlined text-lg">add_circle</span>
                      Add Medical Record
                    </button>
                  </div>

                  {addingMedical && (
                    <form onSubmit={handleAddMedical}
                      className="bg-stone-50 border-2 border-dashed border-[#003459]/20 p-6 rounded-[2rem]">
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
                          className="px-4 py-2 text-sm font-bold text-[#52616B] hover:text-[#FF564F] transition-colors">Cancel</button>
                        <button type="submit"
                          className="bg-[#003459] text-white px-6 py-2.5 rounded-full text-sm font-extrabold shadow-md hover:bg-[#00A7E7] active:scale-95 transition-all">
                          Save Record
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-3">
                    {animal.medicalHistory?.length > 0 ? animal.medicalHistory.map((m, i) => (
                      <div key={i} className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-[#003459]/10 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-[#00A7E7]/10 rounded-xl flex items-center justify-center flex-shrink-0 text-[#00A7E7]">
                          <span className="material-symbols-outlined">medical_information</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-extrabold text-[#00171F]">{m.condition}</p>
                          {m.notes && <p className="text-xs text-[#52616B] font-medium mt-0.5">{m.notes}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] uppercase font-extrabold text-[#52616B]/70 mb-0.5 tracking-widest">Treated By</p>
                          <p className="text-sm font-bold text-[#00171F]">{m.treatedBy || 'Unknown'}</p>
                          <p className="text-[10px] text-[#52616B] font-semibold mt-1">{m.treatedOn}</p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-[#52616B] font-semibold text-sm py-4">No medical records yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Shelter Tab */}
              {activeTab === 'shelter' && (
                <div className="space-y-4">
                  <h3 className="font-['Poppins'] text-xl font-black text-[#003459] mb-6">Shelter Information</h3>
                  {animal.shelter?.name ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-[#003459]/10 shadow-sm">
                        <p className="text-[10px] uppercase font-extrabold text-[#52616B]/70 mb-1 tracking-widest">Shelter Name</p>
                        <p className="font-bold text-lg text-[#00171F]">{animal.shelter.name}</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-[#003459]/10 shadow-sm">
                        <p className="text-[10px] uppercase font-extrabold text-[#52616B]/70 mb-1 tracking-widest">Contact</p>
                        <p className="font-bold text-lg text-[#00171F]">{animal.shelter.contactNumber || 'N/A'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[#52616B] font-semibold text-sm">No shelter information recorded.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* The Password Verification Modal overlay */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#00171F]/60 backdrop-blur-sm p-4 font-['Urbanist']">
          <form onSubmit={handleConfirmVerification} className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">

            <button type="button" onClick={() => setShowVerifyModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-[#00171F] transition-colors">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div className="w-16 h-16 bg-[#FF564F]/10 text-[#FF564F] rounded-2xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
            </div>

            <h3 className="text-2xl font-['Poppins'] font-black text-[#003459] mb-2 tracking-tight">Admin Override</h3>
            <p className="text-[#52616B] font-medium text-sm mb-6 leading-relaxed">
              You are about to securely verify <strong className="text-[#00171F] font-bold">{animal.name}</strong> and assign an official SC ID. Please confirm your admin password to proceed.
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
                <p className="text-[#FF564F] text-xs mt-2 flex items-center gap-1 font-bold">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {verifyError}
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button type="button" onClick={() => setShowVerifyModal(false)} disabled={isVerifying}
                className="flex-1 py-3.5 font-bold text-[#52616B] bg-stone-100 rounded-full hover:bg-stone-200 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={isVerifying}
                className="flex-1 py-3.5 font-extrabold text-white bg-[#003459] rounded-full hover:bg-[#00A7E7] active:scale-95 transition-all flex items-center justify-center gap-2">
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