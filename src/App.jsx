import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';

function App() {
  // Create state to hold the current user
  const [currentUser, setCurrentUser] = useState(null);

  // Run auth listener once on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User is logged in:', user);
        setCurrentUser(user);
      } else {
        console.log('User is logged out');
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      {currentUser ? (
        <div className="app-container">
          <Sidebar />
          <div className="content-area">
            <Dashboard />
          </div>
        </div>
      ) : (
        <div className="login-container">
          <article>
            <h1 style={{ textAlign: 'center' }}>🐾 StrayConnect</h1>
            <Login />
          </article>
        </div>
      )}
    </>
  );
}

export default App;
