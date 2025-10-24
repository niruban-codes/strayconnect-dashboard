import React from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import AddAnimal from './AddAnimal';
import AnimalList from './AnimalList'; // <-- 1. IMPORT IT

const Dashboard = () => {

  const handleSignOut = async () => {
    try {
      await signOut(auth); // <-- This is the missing line
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error', error);
    }
  };

  return (
    <div>
      <h2>Welcome to the Dashboard!</h2>
      <p>You are logged in.</p>
      <button onClick={handleSignOut}>Sign Out</button>

      <hr /> 

      <AddAnimal />

      <hr /> {/* Add another line to separate */}

      <AnimalList /> {/* <-- 2. USE IT */}

    </div>
  );
};

export default Dashboard;