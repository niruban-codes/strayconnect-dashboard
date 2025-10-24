import React from 'react';

const Dashboard = () => {

  const handleSignOut = () => {
    // We will add sign-out logic here
    console.log('Signing out...');
  };

  return (
    <div>
      <h2>Welcome to the Dashboard!</h2>
      <p>You are logged in.</p>
      <button onClick={handleSignOut}>Sign Out</button>
    </div>
  );
};

export default Dashboard;