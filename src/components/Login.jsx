import { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { Eye, EyeOff, ArrowRight, LockKeyhole } from 'lucide-react';
import { auth } from '../firebase';
import RescueRun from './RescueRun';
import MeadowDivider from './MeadowDivider';
import logo from '../assets/images/sc-logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const submit = async event => {
    event.preventDefault(); if (loading) return;
    setError(''); setMessage(''); setLoading(true);
    try { await signInWithEmailAndPassword(auth, email.trim(), password); }
    catch (err) { setError(['auth/invalid-credential', 'auth/wrong-password'].includes(err.code) ? 'Incorrect email or password. Please try again.' : 'Unable to sign in. Check your connection and try again.'); }
    finally { setLoading(false); }
  };
  const reset = async () => {
    if (loading) return;
    if (!email.trim()) { setError('Enter your email address first to request a reset link.'); return; }
    setLoading(true); setError(''); setMessage('');
    try { await sendPasswordResetEmail(auth, email.trim()); setMessage('If this email has a password account, a reset link will arrive shortly.'); }
    catch { setError('Unable to request a reset link. Check your email address and try again.'); }
    finally { setLoading(false); }
  };
  return <main className="login-layout">
    <section className="login-story">
      <div className="login-brand"><img src={logo} alt="" /><span>STRAYCONNECT<small>CARE OPERATIONS / SRI LANKA</small></span></div>
      <div><p className="eyebrow">REAL CARE. EVERY DAY.</p><h1>SMALL PAWS.<br />BIG MISSION.</h1><p className="login-intro">Their next chapter starts with you. Coordinate rescues, keep care records, and help animals find their people.</p></div>
      <RescueRun />
      <div className="login-tags"><span>RESCUE</span><span>CARE</span><span>REHOME</span></div>
    </section>
    <MeadowDivider />
    <section className="login-form-side"><div className="login-card"><div className="login-lock"><LockKeyhole size={26} /></div><p className="eyebrow">WELCOME BACK</p><h2>ENTER THE<br />CONTROL ROOM.</h2><p className="mb-8 text-muted">Sign in to your admin or veterinary account.</p>
      {error && <p role="alert" className="notice-error">{error}</p>}{message && <p role="status" className="notice-success">{message}</p>}
      <form onSubmit={submit} className="space-y-5"><div><label htmlFor="email">Email address</label><input id="email" type="email" required autoComplete="email" placeholder="you@sanctuary.org" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} /></div>
        <div><label htmlFor="password">Password</label><div className="password-field"><input id="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button></div></div>
        <button type="button" className="text-link" onClick={reset} disabled={loading}>Forgot password?</button><button type="submit" className="arcade-button w-full" disabled={loading}>{loading ? 'PLEASE WAIT…' : 'SIGN IN'}<ArrowRight size={20} /></button>
      </form><p className="login-footer">FOR AUTHORIZED CARE TEAMS</p></div></section>
  </main>;
}
