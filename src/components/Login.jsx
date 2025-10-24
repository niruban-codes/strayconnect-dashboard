import { auth } from '../firebase'; // 1. Import our auth service
import { signInWithEmailAndPassword } from 'firebase/auth'; // 2. Import the login function
import React, { useState } from 'react' // 1. Import useState

function Login() {
  // 2. Create "state" to remember email and password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 3. A function to handle the form submission
  const handleLogin = async (e) => {
  e.preventDefault(); // This stays the same

  try {
    // 3. Try to sign in with the email and password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Login Successful!', userCredential.user);
    // We will redirect to a dashboard here later

  } catch (error) {
    // 4. If it fails, show the error in the console
    console.error('Login Failed:', error.message);
    alert('Login failed: ' + error.message); // Show a popup to the user
  }
}

  return (
    // 4. Create the HTML form
    <form onSubmit={handleLogin}>
      <h2>Login Page</h2>

      <div>
        <label>Email:</label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required 
        />
      </div>

      <div>
        <label>Password:</label>
        <input 
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required 
        />
      </div>

      <button type="submit">Login</button>
    </form>
  )
}

export default Login