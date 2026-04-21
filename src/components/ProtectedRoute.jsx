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
                        // Kick them out!
                        alert("Access Denied: You need Vet or Admin privileges to view this dashboard.");
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <div className="animate-spin text-primary material-symbols-outlined text-4xl">autorenew</div>
            </div>
        );
    }

    // If authorized, show the dashboard. If not, show a message (or a Login screen).
    return isAuthorized ? children : (
        <div className="min-h-screen flex flex-col items-center justify-center bg-surface">
            <span className="material-symbols-outlined text-6xl text-error mb-4">gpp_bad</span>
            <h1 className="text-2xl font-bold text-primary mb-2">Access Restricted</h1>
            <p className="text-on-surface-variant">Please log in using an authorized Vet or Admin account.</p>
        </div>
    );
}