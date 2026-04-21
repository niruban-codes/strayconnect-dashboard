import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
// NEW: Import the gatekeeper
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
    </div>
  );

  // UPDATED: Wrap the Dashboard in the ProtectedRoute!
  return currentUser ? (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  ) : (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="glass-card rounded-[2rem] p-10 w-full max-w-md shadow-xl border border-outline-variant/20">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <span className="material-symbols-outlined text-primary text-4xl"
            style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
          <h1 className="font-headline font-extrabold text-3xl text-primary">StrayConnect</h1>
        </div>
        <Login />
      </div>
    </div>
  );
}

export default App;