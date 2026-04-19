// src/components/Events.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, Timestamp } from 'firebase/firestore';

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Real-time listener for events
  useEffect(() => {
    // Ordering by date so the soonest events show up first
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(fetchedEvents);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🧪 TEST FUNCTION: Generate a fake upcoming event
  const generateTestEvent = async () => {
    setIsAdding(true);
    try {
      const eventTypes = [
        { type: 'vaccination', title: 'Community Rabies Vaccination Drive', color: 'bg-sky-100 text-sky-800' },
        { type: 'rescue', title: 'Beach Stray Rescue Operation', color: 'bg-emerald-100 text-emerald-800' },
        { type: 'awareness', title: 'School Awareness Program', color: 'bg-amber-100 text-amber-800' }
      ];
      const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      // Generate a random date within the next 30 days
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30) + 1);

      await addDoc(collection(db, 'events'), {
        title: randomEvent.title,
        type: randomEvent.type,
        location: 'Dehiwala Beach / Mount Lavinia',
        organizer: 'Rotaract Club of Sabaragamuwa',
        date: Timestamp.fromDate(futureDate), // Save as Firebase Timestamp
        status: 'upcoming',
        volunteersNeeded: Math.floor(Math.random() * 10) + 5
      });
    } catch (error) {
      console.error("Error generating test event:", error);
      alert("Failed to create test event.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined">event</span>
          </span>
          <h2 className="text-2xl font-bold text-primary font-headline">Community Events</h2>
        </div>
        
        {/* 🧪 TEST BUTTON */}
        <button 
          onClick={generateTestEvent}
          disabled={isAdding}
          className="flex items-center gap-2 px-4 py-2 bg-sky-100 text-sky-800 font-bold rounded-full text-sm hover:bg-sky-200 transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-sm">science</span>
          {isAdding ? 'Scheduling...' : 'Schedule Test Event'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <div className="flex items-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            <span className="text-sm font-medium">Loading calendar...</span>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-surface/50 border border-outline-variant/20 rounded-2xl p-10 text-center">
          <span className="material-symbols-outlined text-4xl text-stone-400 mb-2">event_busy</span>
          <p className="text-on-surface-variant">No events scheduled at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {events.map((event) => {
            // Format the Firebase Timestamp back into a readable date
            const eventDate = event.date?.toDate ? event.date.toDate() : new Date();
            const month = eventDate.toLocaleString('default', { month: 'short' });
            const day = eventDate.getDate();

            return (
              <div key={event.id} className="bg-white p-5 rounded-2xl border border-outline-variant/20 shadow-sm flex items-start gap-5 hover:shadow-md transition-shadow group">
                
                {/* Calendar Date Block */}
                <div className="bg-surface-variant rounded-xl w-16 h-16 flex flex-col items-center justify-center flex-shrink-0 border border-outline-variant/10">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{month}</span>
                  <span className="text-2xl font-headline font-extrabold text-primary leading-none">{day}</span>
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-on-surface text-lg truncate pr-2">{event.title}</h3>
                    <span className="px-2 py-1 bg-surface-variant text-on-surface-variant rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {event.type}
                    </span>
                  </div>
                  
                  <div className="space-y-1 mt-2">
                    <p className="text-sm text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      <span className="truncate">{event.location}</span>
                    </p>
                    <p className="text-sm text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]">diversity_3</span>
                      <span className="truncate">By {event.organizer}</span>
                    </p>
                  </div>

                  {/* Action row */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-outline-variant/10">
                    <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full">
                      <span className="material-symbols-outlined text-[14px] text-primary">group_add</span>
                      <span className="text-xs font-bold text-primary">{event.volunteersNeeded} spots open</span>
                    </div>
                    <button className="text-xs font-bold text-primary hover:underline ml-auto">
                      Manage Event
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Events;