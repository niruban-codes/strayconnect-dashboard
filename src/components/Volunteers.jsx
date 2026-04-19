// src/components/Volunteers.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';

function Volunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Real-time listener for volunteers
  useEffect(() => {
    const q = query(collection(db, 'volunteers'), orderBy('joinedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedVolunteers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVolunteers(fetchedVolunteers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🧪 TEST FUNCTION: Generate a fake volunteer or organization
  const generateTestVolunteer = async () => {
    setIsAdding(true);
    try {
      const isOrg = Math.random() > 0.5;
      
      const testData = isOrg ? {
        type: 'organization',
        name: 'Rotaract Club of Colombo Central',
        contact: 'colombocentral@example.com',
        phone: '077 987 6543',
        status: 'active',
        skills: ['Event Organizing', 'Fundraising', 'Transport'],
        joinedAt: serverTimestamp()
      } : {
        type: 'individual',
        name: 'Kasun Perera',
        contact: 'kasun.p@example.com',
        phone: '071 234 5678',
        status: 'active',
        skills: ['Fostering', 'Dog Handling'],
        joinedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'volunteers'), testData);
    } catch (error) {
      console.error("Error generating test volunteer:", error);
      alert("Failed to create test volunteer.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined">diversity_1</span>
          </span>
          <h2 className="text-2xl font-bold text-primary font-headline">Volunteer Network</h2>
        </div>
        
        {/* 🧪 TEST BUTTON */}
        <button 
          onClick={generateTestVolunteer}
          disabled={isAdding}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 font-bold rounded-full text-sm hover:bg-emerald-200 transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-sm">science</span>
          {isAdding ? 'Adding...' : 'Add Test Volunteer'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <div className="flex items-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            <span className="text-sm font-medium">Loading volunteer network...</span>
          </div>
        </div>
      ) : volunteers.length === 0 ? (
        <div className="bg-surface/50 border border-outline-variant/20 rounded-2xl p-10 text-center">
          <span className="material-symbols-outlined text-4xl text-stone-400 mb-2">group_add</span>
          <p className="text-on-surface-variant">No volunteers or organizations registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {volunteers.map((vol) => (
            <div key={vol.id} className="bg-white rounded-[1.5rem] p-6 border border-outline-variant/20 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              
              {/* Type Badge (Top Right) */}
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1
                  ${vol.type === 'organization' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'}`}>
                  <span className="material-symbols-outlined text-[12px]">
                    {vol.type === 'organization' ? 'corporate_fare' : 'person'}
                  </span>
                  {vol.type}
                </span>
              </div>

              {/* Main Info */}
              <div className="flex items-center gap-4 mb-5">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-2xl font-bold text-white
                  ${vol.type === 'organization' ? 'bg-primary' : 'bg-emerald-400'}`}>
                  {vol.name.charAt(0)}
                </div>
                <div className="pr-16"> {/* Padding right to avoid overlapping badge */}
                  <h3 className="font-bold text-on-surface text-lg leading-tight">{vol.name}</h3>
                  <p className="text-sm text-on-surface-variant mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">call</span>
                    {vol.phone}
                  </p>
                </div>
              </div>

              {/* Skills/Tags */}
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-outline-variant mb-2">Areas of Help</p>
                <div className="flex flex-wrap gap-2">
                  {vol.skills?.map((skill, idx) => (
                    <span key={idx} className="px-2 py-1 bg-surface text-on-surface-variant text-xs rounded-md border border-outline-variant/20">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between border-t border-outline-variant/10 pt-4 mt-auto">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${vol.status === 'active' ? 'bg-emerald-500' : 'bg-stone-300'}`}></span>
                  <span className="text-xs text-on-surface-variant capitalize">{vol.status}</span>
                </div>
                <button className="text-primary hover:bg-emerald-50 p-2 rounded-full transition-colors" title="Send Email">
                  <span className="material-symbols-outlined text-sm">mail</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Volunteers;