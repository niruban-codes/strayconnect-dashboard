// src/components/Events.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, Timestamp, doc, updateDoc } from 'firebase/firestore';

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // 🚀 NEW: Tab state to switch between Live and Pending events
  const [activeTab, setActiveTab] = useState('live');

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
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

  // 🚀 NEW: Helper to send notifications to the mobile app
  const notifyUser = async (userId, title, message) => {
    if (!userId) return; // Skip if it's a test event without a user

    try {
      await addDoc(collection(db, 'notifications'), {
        userId: userId,
        title: title,
        message: message,
        isRead: false,
        type: 'event_update',
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  // 🚀 NEW: Approve Logic
  const handleApprove = async (event) => {
    if (window.confirm(`Are you sure you want to approve "${event.title}"? It will go live immediately.`)) {
      try {
        await updateDoc(doc(db, 'events', event.id), { status: 'approved' });
        await notifyUser(
          event.userId,
          "Event Approved! 🎉",
          `Great news! Your event "${event.title}" has been approved by the sanctuary and is now live on the community feed.`
        );
      } catch (error) {
        alert("Error approving event.");
      }
    }
  };

  // 🚀 NEW: Reject Logic
  const handleReject = async (event) => {
    const reason = window.prompt("Why is this event being rejected? (The user will see this reason)");

    if (reason !== null) { // If they didn't click Cancel
      try {
        await updateDoc(doc(db, 'events', event.id), {
          status: 'rejected',
          rejectReason: reason
        });
        await notifyUser(
          event.userId,
          "Event Application Update",
          `Unfortunately, your event "${event.title}" was not approved. Reason: ${reason || 'Does not meet community guidelines.'}`
        );
      } catch (error) {
        alert("Error rejecting event.");
      }
    }
  };

  // Filter events based on the active tab
  const pendingEvents = events.filter(e => e.status === 'pending');
  // Include 'upcoming' to support your old test events, and 'approved' for new ones
  const liveEvents = events.filter(e => e.status === 'approved' || e.status === 'upcoming');

  const displayEvents = activeTab === 'pending' ? pendingEvents : liveEvents;

  return (
    <div className="space-y-6 font-['Urbanist']">

      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-4">
          <span className="w-12 h-12 rounded-xl bg-[#00A7E7]/10 flex items-center justify-center text-[#00A7E7] flex-shrink-0">
            <span className="material-symbols-outlined text-[26px]">event</span>
          </span>
          <h2 className="text-3xl font-black text-[#003459] font-['Poppins'] tracking-tight">Community Events</h2>
        </div>
      </div>

      {/* 🚀 NEW: Tabs Navigation */}
      <div className="flex gap-6 border-b border-[#003459]/10 pb-2 mb-8">
        <button
          onClick={() => setActiveTab('live')}
          className={`pb-3 font-extrabold uppercase tracking-wider text-sm transition-colors ${activeTab === 'live' ? 'text-[#003459] border-b-2 border-[#003459]' : 'text-[#52616B] hover:text-[#003459]'}`}
        >
          Live Events ({liveEvents.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 font-extrabold uppercase tracking-wider text-sm transition-colors flex items-center gap-2 ${activeTab === 'pending' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-[#52616B] hover:text-amber-500'}`}
        >
          Pending Review
          {pendingEvents.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full">{pendingEvents.length}</span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <div className="flex items-center gap-3 text-[#52616B]">
            <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
            <span className="text-sm font-bold">Loading calendar...</span>
          </div>
        </div>
      ) : displayEvents.length === 0 ? (
        <div className="bg-white/50 border-2 border-dashed border-[#003459]/10 rounded-[2rem] p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <span className="material-symbols-outlined text-6xl text-[#52616B]/30 mb-4">
            {activeTab === 'pending' ? 'task' : 'event_busy'}
          </span>
          <p className="text-[#52616B] font-bold text-lg">
            {activeTab === 'pending' ? "You're all caught up! No pending applications." : "No live events scheduled at the moment."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {displayEvents.map((event) => {
            // Handle dates safely whether it's a string from the app or a Firestore Timestamp
            const displayDate = event.dateString || (event.date?.toDate ? event.date.toDate().toLocaleDateString() : 'Unknown Date');

            return (
              <div key={event.id} className="bg-white p-6 rounded-[2rem] border border-[#003459]/10 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">

                <div className="flex gap-5">
                  {/* Poster Image or Placeholder */}
                  {event.imageUrl ? (
                    <img src={event.imageUrl} alt="Event Poster" className="w-28 h-28 object-cover rounded-2xl border border-[#003459]/5 shadow-sm" />
                  ) : (
                    <div className="w-28 h-28 bg-stone-50 rounded-2xl flex items-center justify-center border border-[#003459]/5 text-[#52616B]/40">
                      <span className="material-symbols-outlined text-4xl">image</span>
                    </div>
                  )}

                  {/* Event Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-1.5">
                      <h3 className="font-black font-['Poppins'] text-[#003459] text-xl truncate pr-2">{event.title}</h3>
                      <span className="px-2.5 py-1 bg-[#003459]/5 text-[#003459] rounded-md text-[10px] font-extrabold uppercase tracking-wider flex-shrink-0">
                        {event.type}
                      </span>
                    </div>

                    <div className="space-y-1.5 mt-1">
                      <p className="text-sm text-[#52616B] font-semibold flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-[#52616B]/70">calendar_today</span>
                        <span className="truncate">{displayDate}</span>
                      </p>
                      <p className="text-sm text-[#52616B] font-semibold flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-[#52616B]/70">location_on</span>
                        <span className="truncate">{event.location}</span>
                      </p>
                      <p className="text-sm text-[#52616B] font-semibold flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-[#52616B]/70">person</span>
                        <span className="truncate">By {event.organizer}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description Snippet */}
                {event.description && (
                  <div className="bg-stone-50 p-4 rounded-2xl border border-[#003459]/5 mt-2">
                    <p className="text-sm text-[#00171F] font-medium leading-relaxed line-clamp-2">{event.description}</p>
                  </div>
                )}

                {/* 🚀 NEW: Admin Action Buttons (Only show if pending) */}
                {activeTab === 'pending' && (
                  <div className="flex items-center gap-3 mt-auto pt-4 border-t border-[#003459]/5">
                    <button
                      onClick={() => handleApprove(event)}
                      className="flex-1 bg-[#003459] text-white font-extrabold py-3 rounded-xl flex justify-center items-center gap-2 hover:bg-[#00A7E7] transition-all shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      Approve & Publish
                    </button>
                    <button
                      onClick={() => handleReject(event)}
                      className="flex-1 bg-[#FF564F]/10 text-[#FF564F] font-extrabold py-3 rounded-xl flex justify-center items-center gap-2 hover:bg-[#FF564F] hover:text-white transition-all shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                      Reject
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Events;