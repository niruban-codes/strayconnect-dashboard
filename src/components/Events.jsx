import { useFeedStatus } from '../hooks/useFeedStatus';
import FeedError from './FeedError';
// src/components/Events.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
// 🚀 NEW: Imported deleteDoc
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, runTransaction, serverTimestamp } from 'firebase/firestore';

import { reviewEvent } from '../utils/eventReview';
import { eventDateLabel } from '../utils/eventDate';

function Events() {
  const { error: feedError, fail: failFeed, retry, retryKey } = useFeedStatus();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
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
    }, error => { setLoading(false); failFeed(error); });

    return () => unsubscribe();
  }, [retryKey, failFeed]);

  const handleApprove = async event => {
    if (!window.confirm(`Approve "${event.title}"?`)) return;
    try {
      await runTransaction(db, tx => reviewEvent(tx, doc(db, 'events', event.id),
        doc(db, 'notifications', `event-${event.id}`), 'approved', '', serverTimestamp()));
    } catch (error) { alert(error.message); }
  };
  const handleReject = async event => {
    const reason = window.prompt('Why is this event being rejected?');
    if (reason === null) return;
    if (!reason.trim()) { alert('Please give the organizer a reason.'); return; }
    try {
      await runTransaction(db, tx => reviewEvent(tx, doc(db, 'events', event.id),
        doc(db, 'notifications', `event-${event.id}`), 'rejected', reason, serverTimestamp()));
    } catch (error) { alert(error.message); }
  };

  // 🚀 NEW: Logic to delete an already live event
  const handleDeleteLiveEvent = async (eventId, eventTitle) => {
    if (window.confirm(`Are you sure you want to permanently delete "${eventTitle}"? This cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'events', eventId));
      } catch (error) {
        console.error("Error deleting event:", error);
        alert("Failed to delete the event.");
      }
    }
  };

  const pendingEvents = events.filter(e => e.status === 'pending');
  const liveEvents = events.filter(e => e.status === 'approved' || e.status === 'upcoming');

  const displayEvents = activeTab === 'pending' ? pendingEvents : liveEvents;

  if (feedError) return <FeedError message={feedError} onRetry={retry} />;

  return (
    <div className="space-y-6 font-body">

      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-4">
          <span className="w-12 h-12 rounded-none bg-arcade-blue-light flex items-center justify-center text-[#2455FF] flex-shrink-0">
            <span className="material-symbols-outlined text-[26px]">event</span>
          </span>
          <h2 className="text-3xl font-black text-[#111111] font-headline tracking-tight">Community Events</h2>
        </div>
      </div>

      <div className="flex gap-6 border-b border-ink pb-2 mb-8">
        <button
          onClick={() => setActiveTab('live')}
          className={`pb-3 font-extrabold uppercase tracking-wider text-sm transition-colors ${activeTab === 'live' ? 'text-[#111111] border-b-2 border-[#111111]' : 'text-[#454545] hover:text-[#111111]'}`}
        >
          Live Events ({liveEvents.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 font-extrabold uppercase tracking-wider text-sm transition-colors flex items-center gap-2 ${activeTab === 'pending' ? 'text-[#8F4500] border-b-2 border-ink' : 'text-[#454545] hover:text-[#8F4500]'}`}
        >
          Pending Review
          {pendingEvents.length > 0 && (
            <span className="bg-arcade-yellow text-amber-700 text-[10px] px-2 py-0.5 rounded-none">{pendingEvents.length}</span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <div className="flex items-center gap-3 text-[#454545]">
            <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
            <span className="text-sm font-bold">Loading calendar...</span>
          </div>
        </div>
      ) : displayEvents.length === 0 ? (
        <div className="bg-paper border-2 border-dashed border-ink rounded-none p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <span className="material-symbols-outlined text-6xl text-muted mb-4">
            {activeTab === 'pending' ? 'task' : 'event_busy'}
          </span>
          <p className="text-[#454545] font-bold text-lg">
            {activeTab === 'pending' ? "You're all caught up! No pending applications." : "No live events scheduled at the moment."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {displayEvents.map((event) => {
            const displayDate = eventDateLabel(event);

            return (
              <div key={event.id} className="bg-paper p-6 rounded-none border border-ink shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">

                <div className="event-summary flex gap-5">
                  {event.imageUrl ? (
                    <img src={event.imageUrl} alt="Event Poster" className="w-24 h-24 flex-shrink-0 object-cover rounded-none border border-ink shadow-sm" />
                  ) : (
                    <div className="w-24 h-24 flex-shrink-0 bg-paper rounded-none flex items-center justify-center border border-ink text-muted">
                      <span className="material-symbols-outlined text-4xl">image</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex flex-col items-start gap-2 mb-1.5">
                      <h3 className="font-black font-headline text-[#111111] text-xl break-words pr-2">{event.title}</h3>
                      <span className="px-2.5 py-1 bg-paper text-[#111111] rounded-none text-[10px] font-extrabold uppercase tracking-wider max-w-full break-words">
                        {event.type}
                      </span>
                    </div>

                    <div className="space-y-1.5 mt-1">
                      <p className="text-sm text-[#454545] font-semibold flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-muted">calendar_today</span>
                        <span className="truncate">{displayDate}</span>
                      </p>
                      <p className="text-sm text-[#454545] font-semibold flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-muted">location_on</span>
                        <span className="truncate">{event.location}</span>
                      </p>
                      <p className="text-sm text-[#454545] font-semibold flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-muted">person</span>
                        <span className="truncate">By {event.organizer}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {event.description && (
                  <div className="bg-paper p-4 rounded-none border border-ink mt-2">
                    <p className="text-sm text-[#111111] font-medium leading-relaxed line-clamp-2">{event.description}</p>
                  </div>
                )}

                {/* ── ADMIN ACTIONS ── */}
                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-ink">
                  {activeTab === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleApprove(event)}
                        className="flex-1 bg-[#111111] text-white font-extrabold py-3 rounded-none flex justify-center items-center gap-2 hover:bg-[#2455FF] transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        Approve & Publish
                      </button>
                      <button
                        onClick={() => handleReject(event)}
                        className="flex-1 bg-arcade-pink text-ink font-extrabold py-3 rounded-none flex justify-center items-center gap-2 hover:bg-[#D92532] hover:text-white transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">cancel</span>
                        Reject
                      </button>
                    </>
                  ) : (
                    // 🚀 NEW: Delete Button for Live Events
                    <button
                      onClick={() => handleDeleteLiveEvent(event.id, event.title)}
                      className="w-full bg-arcade-pink text-ink font-extrabold py-3 rounded-none flex justify-center items-center gap-2 hover:bg-[#D92532] hover:text-white transition-all shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                      Remove Event
                    </button>
                  )}
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
