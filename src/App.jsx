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
    <Login />
  );
}

export default App;