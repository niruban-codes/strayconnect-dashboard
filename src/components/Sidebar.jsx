import React from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
function Sidebar() {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error', error);
    }
  };

  return (
    // <nav> is a semantic HTML element that Pico styles for us
    <nav className='sidebar'>
      <ul>
        <li><h3>🐾 StrayConnect</h3></li>
      </ul>
      <ul className='nav-items'>
        <li><a href="#" onClick={(e) => e.preventDefault()}>Dashboard</a></li>
        <li><a href="#" onClick={(e) => e.preventDefault()}>Reports</a></li>
        <li><a href="#" onClick={(e) => e.preventDefault()}>Profile</a></li>
      </ul>
      <ul>
        <li>
          <button onClick={handleSignOut} className="secondary">
            Sign Out
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Sidebar;