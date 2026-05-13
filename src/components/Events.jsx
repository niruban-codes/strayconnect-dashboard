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
    <div className="space-y-6">

      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined">event</span>
          </span>
          <h2 className="text-2xl font-bold text-primary font-headline">Community Events</h2>
        </div>
      </div>

      {/* 🚀 NEW: Tabs Navigation */}
      <div className="flex gap-4 border-b border-outline-variant/20 pb-2 mb-6">
        <button
          onClick={() => setActiveTab('live')}
          className={`pb-2 font-bold transition-colors ${activeTab === 'live' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          Live Events ({liveEvents.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-2 font-bold transition-colors flex items-center gap-2 ${activeTab === 'pending' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-on-surface-variant hover:text-amber-600'}`}
        >
          Pending Review
          {pendingEvents.length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full">{pendingEvents.length}</span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <div className="flex items-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            <span className="text-sm font-medium">Loading calendar...</span>
          </div>
        </div>
      ) : displayEvents.length === 0 ? (
        <div className="bg-surface/50 border border-outline-variant/20 rounded-2xl p-10 text-center">
          <span className="material-symbols-outlined text-4xl text-stone-400 mb-2">
            {activeTab === 'pending' ? 'task' : 'event_busy'}
          </span>
          <p className="text-on-surface-variant">
            {activeTab === 'pending' ? "You're all caught up! No pending applications." : "No live events scheduled at the moment."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {displayEvents.map((event) => {
            // Handle dates safely whether it's a string from the app or a Firestore Timestamp
            const displayDate = event.dateString || (event.date?.toDate ? event.date.toDate().toLocaleDateString() : 'Unknown Date');

            return (
              <div key={event.id} className="bg-white p-5 rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">

                <div className="flex gap-4">
                  {/* Poster Image or Placeholder */}
                  {event.imageUrl ? (
                    <img src={event.imageUrl} alt="Event Poster" className="w-24 h-24 object-cover rounded-xl border border-outline-variant/20" />
                  ) : (
                    <div className="w-24 h-24 bg-surface-variant rounded-xl flex items-center justify-center border border-outline-variant/10 text-stone-400">
                      <span className="material-symbols-outlined text-3xl">image</span>
                    </div>
                  )}

                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-on-surface text-lg truncate pr-2">{event.title}</h3>
                      <span className="px-2 py-1 bg-surface-variant text-on-surface-variant rounded-md text-[10px] font-bold uppercase tracking-wider">
                        {event.type}
                      </span>
                    </div>

                    <div className="space-y-1 mt-1">
                      <p className="text-sm text-on-surface-variant flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        <span className="truncate">{displayDate}</span>
                      </p>
                      <p className="text-sm text-on-surface-variant flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        <span className="truncate">{event.location}</span>
                      </p>
                      <p className="text-sm text-on-surface-variant flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">person</span>
                        <span className="truncate">By {event.organizer}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description Snippet */}
                {event.description && (
                  <div className="bg-surface/50 p-3 rounded-xl border border-outline-variant/10">
                    <p className="text-sm text-on-surface-variant line-clamp-2">{event.description}</p>
                  </div>
                )}

                {/* 🚀 NEW: Admin Action Buttons (Only show if pending) */}
                {activeTab === 'pending' && (
                  <div className="flex items-center gap-3 mt-2 pt-4 border-t border-outline-variant/10">
                    <button
                      onClick={() => handleApprove(event)}
                      className="flex-1 bg-emerald-600 text-white font-bold py-2 rounded-xl flex justify-center items-center gap-2 hover:bg-emerald-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Approve & Publish
                    </button>
                    <button
                      onClick={() => handleReject(event)}
                      className="flex-1 bg-red-50 text-red-600 font-bold py-2 rounded-xl flex justify-center items-center gap-2 hover:bg-red-100 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">cancel</span>
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