// src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function ProtectedRoute({ children }) {
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setIsAuthorized(false);
                setLoading(false);
                return;
            }

            try {
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();

                    // Check if they have the 'admin' or 'vet' role
                    if (userData.role === 'admin' || userData.role === 'vet') {
                        setIsAuthorized(true);
                    } else {
                        // Background sign out for unauthorized users
                        await signOut(auth);
                        setIsAuthorized(false);
                    }
                } else {
                    await signOut(auth);
                    setIsAuthorized(false);
                }
            } catch (error) {
                console.error("Error checking permissions:", error);
                setIsAuthorized(false);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // ── LOADING STATE ──
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F7DBA7] font-['Urbanist']">
                <div className="flex flex-col items-center gap-4 bg-white/50 p-8 rounded-[2rem] shadow-sm border border-[#003459]/5 backdrop-blur-sm">
                    <span className="material-symbols-outlined animate-spin text-4xl text-[#003459]">progress_activity</span>
                    <span className="text-[#003459] font-extrabold tracking-widest uppercase text-xs">Verifying Access...</span>
                </div>
            </div>
        );
    }

    // ── AUTHORIZED: RENDER DASHBOARD ──
    if (isAuthorized) {
        return children;
    }

    // ── UNAUTHORIZED: RESTRICTED UI ──
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7DBA7] font-['Urbanist'] p-4">
            <div className="bg-white p-10 sm:p-12 rounded-[2.5rem] shadow-2xl border border-[#003459]/5 max-w-md w-full text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">

                <div className="w-24 h-24 bg-[#FF564F]/10 text-[#FF564F] rounded-[1.5rem] flex items-center justify-center mb-6 border border-[#FF564F]/20">
                    <span className="material-symbols-outlined text-5xl">gpp_bad</span>
                </div>

                <h1 className="text-3xl font-black text-[#003459] font-['Poppins'] tracking-tight mb-3">
                    Access Restricted
                </h1>

                <p className="text-[#52616B] font-medium leading-relaxed mb-8">
                    Your account does not have the required administrative credentials to view this portal.
                </p>

                <button
                    onClick={() => window.location.href = '/'} // Or your routing method to go back to Login
                    className="w-full px-6 py-4 bg-[#003459] text-white rounded-xl font-extrabold hover:bg-[#00A7E7] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#003459]/20"
                >
                    <span className="material-symbols-outlined text-xl">arrow_back</span>
                    Return to Login
                </button>

            </div>

            <p className="text-center text-[#003459]/40 text-xs font-bold mt-8 uppercase tracking-widest">
                StrayConnect Secure Network
            </p>
        </div>
    );
}