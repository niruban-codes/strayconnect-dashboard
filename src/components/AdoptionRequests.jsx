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
        pending: 'bg-[#FF912C]/10 text-[#FF912C]',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-[#FF564F]/10 text-[#FF564F]'
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-[#52616B] font-['Urbanist'] font-bold">
            <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
            Loading applications...
        </div>
    );

    return (
        <div className="space-y-6 max-w-5xl font-['Urbanist']">
            <header className="mb-8">
                <h2 className="text-3xl font-black text-[#003459] font-['Poppins'] tracking-tight">Adoption Pipeline</h2>
                <p className="text-[#52616B] font-semibold mt-2">Review and manage adoption inquiries from the mobile app.</p>
            </header>

            {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-[#003459]/10 shadow-sm">
                    <span className="material-symbols-outlined text-6xl text-[#52616B]/30 mb-4">inbox</span>
                    <p className="text-[#52616B] font-bold">No adoption applications yet.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {requests.map((req) => (
                        <div key={req.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#003459]/10 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">

                            {/* Left Column: Animal & Status Info */}
                            <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-[#003459]/10 pb-4 md:pb-0 md:pr-6 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${statusColors[req.status]}`}>
                                        {req.status}
                                    </span>
                                    <span className="text-xs text-[#52616B] font-bold">
                                        {req.createdAt?.toDate ? new Date(req.createdAt.toDate()).toLocaleDateString() : 'Recent'}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-black text-[#003459] font-['Poppins'] tracking-tight">{req.animalName}</h3>
                                <p className="text-xs text-[#52616B] font-bold mt-1 mb-4">ID: {req.animalSCID}</p>

                                {/* Action Buttons (Only show if pending) */}
                                {req.status === 'pending' && (
                                    <div className="flex gap-2 mt-auto pt-4">
                                        <button onClick={() => handleApprove(req)} className="flex-1 bg-[#003459] text-white py-2.5 rounded-xl text-sm font-extrabold hover:bg-[#00A7E7] transition-all flex justify-center items-center gap-1 shadow-sm">
                                            <span className="material-symbols-outlined text-[18px]">check_circle</span> Approve
                                        </button>
                                        <button onClick={() => handleReject(req.id)} className="flex-1 bg-[#FF564F]/10 text-[#FF564F] py-2.5 rounded-xl text-sm font-extrabold hover:bg-[#FF564F] hover:text-white transition-all flex justify-center items-center gap-1">
                                            <span className="material-symbols-outlined text-[18px]">cancel</span> Reject
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Applicant Details */}
                            <div className="md:w-2/3 flex flex-col gap-4">
                                <div>
                                    <h4 className="text-xs font-extrabold text-[#52616B]/60 uppercase tracking-widest mb-1">Applicant</h4>
                                    <p className="text-xl font-bold text-[#00171F] font-['Poppins']">{req.userName}</p>
                                    <a href={`mailto:${req.userEmail}`} className="text-[#00A7E7] font-semibold text-sm hover:underline flex items-center gap-1.5 mt-0.5">
                                        <span className="material-symbols-outlined text-[16px]">mail</span> {req.userEmail}
                                    </a>
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-stone-50 border border-[#003459]/5 p-5 rounded-2xl">
                                    <div>
                                        <span className="text-[10px] font-extrabold text-[#52616B] uppercase tracking-widest block mb-1">Living Situation</span>
                                        <span className="text-sm font-bold text-[#00171F]">{req.livingSituation}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-extrabold text-[#52616B] uppercase tracking-widest block mb-1">Experience</span>
                                        <span className="text-sm font-bold text-[#00171F]">{req.experience}</span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-extrabold text-[#52616B]/60 uppercase tracking-widest mb-2">Message to Sanctuary</h4>
                                    <p className="text-sm text-[#00171F] font-medium bg-stone-50 border border-[#003459]/5 p-5 rounded-2xl italic leading-relaxed">
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