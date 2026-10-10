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
            <div className="min-h-screen flex items-center justify-center bg-[#FFE335] font-body">
                <div className="flex flex-col items-center gap-4 bg-paper p-8 rounded-none shadow-sm border border-ink ">
                    <span className="material-symbols-outlined animate-spin text-4xl text-[#111111]">progress_activity</span>
                    <span className="text-[#111111] font-extrabold tracking-widest uppercase text-xs">Verifying Access...</span>
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFE335] font-body p-4">
            <div className="bg-paper p-10 sm:p-12 rounded-none shadow-2xl border border-ink max-w-md w-full text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">

                <div className="w-24 h-24 bg-arcade-pink text-ink rounded-none flex items-center justify-center mb-6 border border-ink">
                    <span className="material-symbols-outlined text-5xl">gpp_bad</span>
                </div>

                <h1 className="text-3xl font-black text-[#111111] font-headline tracking-tight mb-3">
                    Access Restricted
                </h1>

                <p className="text-[#454545] font-medium leading-relaxed mb-8">
                    Your account does not have the required administrative credentials to view this portal.
                </p>

                <button
                    onClick={() => window.location.href = '/'} // Or your routing method to go back to Login
                    className="w-full px-6 py-4 bg-[#111111] text-white rounded-none font-extrabold hover:bg-[#2455FF] transition-all flex items-center justify-center gap-2 shadow-lg "
                >
                    <span className="material-symbols-outlined text-xl">arrow_back</span>
                    Return to Login
                </button>

            </div>

            <p className="text-center text-ink text-xs font-bold mt-8 uppercase tracking-widest">
                StrayConnect Secure Network
            </p>
        </div>
    );
}