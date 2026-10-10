import { useFeedStatus } from '../hooks/useFeedStatus';
import FeedError from './FeedError';
// src/components/AdoptionRequests.jsx
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, runTransaction, serverTimestamp, getDocs, where } from 'firebase/firestore';
import { reviewAdoption } from '../utils/adoptionReview';

function AdoptionRequests() {
  const { error: feedError, fail: failFeed, retry, retryKey } = useFeedStatus();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const reviewOptions = { requestRefForId: id => doc(db, 'adoptionRequests', id), notificationRefForId: id => doc(db, 'notifications', `adoption-${id}`) };

    // Listen to the adoptionRequests collection in real-time
    useEffect(() => {
        const q = query(collection(db, 'adoptionRequests'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        }, error => { setLoading(false); failFeed(error); });
        return () => unsubscribe();
    }, [retryKey, failFeed]);

    // 1. Handle Approval
    const handleApprove = async (request) => {
        if (!window.confirm(`Approve adoption of ${request.animalName} by ${request.userName}?`)) return;

        if (processing) return;
        setProcessing(true);
        try {
            const legacy = await getDocs(query(collection(db, 'adoptionRequests'), where('animalId', '==', request.animalId)));
            await runTransaction(db, transaction => reviewAdoption(
                transaction, doc(db, 'adoptionRequests', request.id),
                animalId => doc(db, 'animals', animalId), 'approved', serverTimestamp(), { ...reviewOptions, legacyIds: legacy.docs.filter(item => item.data().status === 'pending').map(item => item.id) }
            ));

            alert('Adoption Approved! The animal status is now updated.');
        } catch (error) {
            console.error("Error approving adoption:", error);
            alert(error.message || 'Failed to approve adoption.');
        } finally { setProcessing(false); }
    };

    // 2. Handle Rejection
    const handleReject = async (requestId) => {
        if (!window.confirm('Are you sure you want to reject this application?')) return;

        if (processing) return;
        setProcessing(true);
        try {
            await runTransaction(db, transaction => reviewAdoption(
                transaction, doc(db, 'adoptionRequests', requestId),
                animalId => doc(db, 'animals', animalId), 'rejected', serverTimestamp(), reviewOptions
            ));
        } catch (error) {
            console.error("Error rejecting adoption:", error);
            alert(error.message || 'Failed to reject adoption.');
        } finally { setProcessing(false); }
    };

    const statusColors = {
        closed: 'bg-paper text-stone-600',
        pending: 'bg-arcade-yellow text-[#8F4500]',
        approved: 'bg-arcade-mint text-emerald-700',
        rejected: 'bg-arcade-pink text-ink'
    };

  if (feedError) return <FeedError message={feedError} onRetry={retry} />;

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-[#454545] font-body font-bold">
            <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
            Loading applications...
        </div>
    );

    return (
        <div className="space-y-6 max-w-5xl font-body">
            <header className="mb-8">
                <h2 className="text-3xl font-black text-[#111111] font-headline tracking-tight">Adoption Pipeline</h2>
                <p className="text-[#454545] font-semibold mt-2">Review and manage adoption inquiries from the mobile app.</p>
            </header>

            {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-paper rounded-none border border-ink shadow-sm">
                    <span className="material-symbols-outlined text-6xl text-muted mb-4">inbox</span>
                    <p className="text-[#454545] font-bold">No adoption applications yet.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {requests.map((req) => (
                        <div key={req.id} className="bg-paper rounded-none p-6 shadow-sm border border-ink flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">

                            {/* Left Column: Animal & Status Info */}
                            <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-ink pb-4 md:pb-0 md:pr-6 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-3 py-1 rounded-none text-[10px] font-extrabold uppercase tracking-wider ${statusColors[req.status]}`}>
                                        {req.status}
                                    </span>
                                    <span className="text-xs text-[#454545] font-bold">
                                        {req.createdAt?.toDate ? new Date(req.createdAt.toDate()).toLocaleDateString() : 'Recent'}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-black text-[#111111] font-headline tracking-tight">{req.animalName}</h3>
                                <p className="text-xs text-[#454545] font-bold mt-1 mb-4">ID: {req.animalSCID}</p>

                                {/* Action Buttons (Only show if pending) */}
                                {req.status === 'pending' && (
                                    <div className="flex gap-2 mt-auto pt-4">
                                        <button disabled={processing} onClick={() => handleApprove(req)} className="flex-1 bg-[#111111] text-white py-2.5 rounded-none text-sm font-extrabold hover:bg-[#2455FF] transition-all flex justify-center items-center gap-1 shadow-sm">
                                            <span className="material-symbols-outlined text-[18px]">check_circle</span> Approve
                                        </button>
                                        <button disabled={processing} onClick={() => handleReject(req.id)} className="flex-1 bg-arcade-pink text-ink py-2.5 rounded-none text-sm font-extrabold hover:bg-[#D92532] hover:text-white transition-all flex justify-center items-center gap-1">
                                            <span className="material-symbols-outlined text-[18px]">cancel</span> Reject
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Applicant Details */}
                            <div className="md:w-2/3 flex flex-col gap-4">
                                <div>
                                    <h4 className="text-xs font-extrabold text-muted uppercase tracking-widest mb-1">Applicant</h4>
                                    <p className="text-xl font-bold text-[#111111] font-headline">{req.userName}</p>
                                    <a href={`mailto:${req.userEmail}`} className="text-[#2455FF] font-semibold text-sm hover:underline flex items-center gap-1.5 mt-0.5">
                                        <span className="material-symbols-outlined text-[16px]">mail</span> {req.userEmail}
                                    </a>
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-paper border border-ink p-5 rounded-none">
                                    <div>
                                        <span className="text-[10px] font-extrabold text-[#454545] uppercase tracking-widest block mb-1">Living Situation</span>
                                        <span className="text-sm font-bold text-[#111111]">{req.livingSituation}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-extrabold text-[#454545] uppercase tracking-widest block mb-1">Experience</span>
                                        <span className="text-sm font-bold text-[#111111]">{req.experience}</span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-extrabold text-muted uppercase tracking-widest mb-2">Message to Sanctuary</h4>
                                    <p className="text-sm text-[#111111] font-medium bg-paper border border-ink p-5 rounded-none italic leading-relaxed">
                                        "{req.message}"
                                    </p>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdoptionRequests;
