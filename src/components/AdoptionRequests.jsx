// src/components/AdoptionRequests.jsx
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';

function AdoptionRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Listen to the adoptionRequests collection in real-time
    useEffect(() => {
        const q = query(collection(db, 'adoptionRequests'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 1. Handle Approval
    const handleApprove = async (request) => {
        if (!window.confirm(`Approve adoption of ${request.animalName} by ${request.userName}?`)) return;

        try {
            // Step A: Mark the request as approved
            await updateDoc(doc(db, 'adoptionRequests', request.id), {
                status: 'approved',
                processedAt: new Date()
            });

            // Step B: IMPORTANT! Change the actual animal's status to 'adopted'
            // This automatically updates the mobile app so no one else can apply!
            await updateDoc(doc(db, 'animals', request.animalId), {
                status: 'adopted',
                ownerId: request.userId,
                adoptedBy: request.userId,
                adoptedAt: new Date()
            });

            alert('Adoption Approved! The animal status is now updated.');
        } catch (error) {
            console.error("Error approving adoption:", error);
            alert('Failed to approve adoption.');
        }
    };

    // 2. Handle Rejection
    const handleReject = async (requestId) => {
        if (!window.confirm('Are you sure you want to reject this application?')) return;

        try {
            await updateDoc(doc(db, 'adoptionRequests', requestId), {
                status: 'rejected',
                processedAt: new Date()
            });
        } catch (error) {
            console.error("Error rejecting adoption:", error);
            alert('Failed to reject adoption.');
        }
    };

    const statusColors = {
        pending: 'bg-amber-100 text-amber-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700'
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
            Loading applications...
        </div>
    );

    return (
        <div className="space-y-6 max-w-5xl">
            <header className="mb-8">
                <h2 className="text-3xl font-extrabold text-primary font-headline tracking-tight">Adoption Pipeline</h2>
                <p className="text-on-surface-variant mt-2">Review and manage adoption inquiries from the mobile app.</p>
            </header>

            {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-3xl border border-outline-variant/20">
                    <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">inbox</span>
                    <p className="text-on-surface-variant font-medium">No adoption applications yet.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {requests.map((req) => (
                        <div key={req.id} className="bg-white rounded-3xl p-6 shadow-sm border border-outline-variant/20 flex flex-col md:flex-row gap-6">

                            {/* Left Column: Animal & Status Info */}
                            <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-outline-variant/20 pb-4 md:pb-0 md:pr-6">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[req.status]}`}>
                                        {req.status}
                                    </span>
                                    <span className="text-xs text-stone-400 font-medium">
                                        {req.createdAt?.toDate ? new Date(req.createdAt.toDate()).toLocaleDateString() : 'Recent'}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-primary">{req.animalName}</h3>
                                <p className="text-xs text-on-surface-variant font-mono mt-1 mb-4">{req.animalSCID}</p>

                                {/* Action Buttons (Only show if pending) */}
                                {req.status === 'pending' && (
                                    <div className="flex gap-2 mt-auto pt-4">
                                        <button onClick={() => handleApprove(req)} className="flex-1 bg-primary text-white py-2 rounded-xl text-sm font-bold hover:brightness-110 transition-all flex justify-center items-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">check_circle</span> Approve
                                        </button>
                                        <button onClick={() => handleReject(req.id)} className="flex-1 bg-error-container text-on-error-container py-2 rounded-xl text-sm font-bold hover:bg-error hover:text-white transition-all flex justify-center items-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">cancel</span> Reject
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Applicant Details */}
                            <div className="md:w-2/3 flex flex-col gap-4">
                                <div>
                                    <h4 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-1">Applicant</h4>
                                    <p className="text-lg font-bold text-on-surface">{req.userName}</p>
                                    <a href={`mailto:${req.userEmail}`} className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">mail</span> {req.userEmail}
                                    </a>
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-surface-container-lowest p-4 rounded-2xl">
                                    <div>
                                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Living Situation</span>
                                        <span className="text-sm font-semibold text-on-surface">{req.livingSituation}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Experience</span>
                                        <span className="text-sm font-semibold text-on-surface">{req.experience}</span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-2">Message to Sanctuary</h4>
                                    <p className="text-sm text-on-surface-variant bg-surface-container-lowest p-4 rounded-2xl italic">
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