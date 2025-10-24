import React, { useState, useEffect } from 'react';
import './App.css';
import { auth } from './firebase'; // 1. Import auth
import { onAuthStateChanged } from 'firebase/auth'; // 2. Import the listener

import Login from './components/Login';
import Dashboard from './components/Dashboard'; // 3. Import our new dashboard

function App() {
  // 4. Create state to hold the current user
  const [currentUser, setCurrentUser] = useState(null);

  // 5. Use useEffect to run this listener only once
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // This code runs every time the auth state changes
      if (user) {
        // User is signed in
        console.log('User is logged in:', user);
        setCurrentUser(user);
      } else {
        // User is signed out
        console.log('User is logged out');
        setCurrentUser(null);
      }
    });

    // Cleanup: stop listening when the component unmounts
    return () => unsubscribe();
  }, []); // The empty [] means this effect runs only once

  return (
    <div className="App">
      <h1>StrayConnect Vet Dashboard</h1>

      {/* 6. This is the magic! */}
      {/* If currentUser exists, show Dashboard. If not, show Login. */}
      {currentUser ? <Dashboard /> : <Login />}

    </div>
  );
}

export default App;
