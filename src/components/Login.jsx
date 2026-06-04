// src/components/Login.jsx
import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import logo from '../assets/images/sc-logo.png';

/* ─────────────────────────────────────────────
   Inline keyframes injected once via a <style> tag
───────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800;900&family=Urbanist:wght@400;500;600;700;800&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes floatA {
    0%, 100% { transform: translateY(0px) rotate(-6deg); }
    50%       { transform: translateY(-14px) rotate(-6deg); }
  }
  @keyframes floatB {
    0%, 100% { transform: translateY(0px) rotate(4deg); }
    50%       { transform: translateY(-10px) rotate(4deg); }
  }
  @keyframes floatC {
    0%, 100% { transform: translateY(0px) rotate(-3deg); }
    50%       { transform: translateY(-8px) rotate(-3deg); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .sc-login-panel { animation: fadeUp 0.55s cubic-bezier(.22,.68,0,1.2) both; }
  .sc-float-a     { animation: floatA 6s ease-in-out infinite; }
  .sc-float-b     { animation: floatB 8s ease-in-out infinite; }
  .sc-float-c     { animation: floatC 10s ease-in-out infinite; }
  .sc-spin        { animation: spin 1s linear infinite; }

  .sc-input {
    width: 100%;
    background: #f8fafc;
    border: 1.5px solid rgba(0,52,89,0.10);
    border-radius: 14px;
    padding: 14px 16px 14px 46px;
    font-family: 'Urbanist', sans-serif;
    font-weight: 700;
    font-size: 15px;
    color: #00171F;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }
  .sc-input::placeholder { color: rgba(82,97,107,0.45); font-weight: 600; }
  .sc-input:focus {
    background: #fff;
    border-color: #00A7E7;
    box-shadow: 0 0 0 4px rgba(0,167,231,0.12);
  }
`;

/* ─── Stat badge used in the left panel ─── */
function StatBadge({ icon, value, label, delay = '0s' }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.12)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.22)',
      borderRadius: 16,
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      animationDelay: delay,
    }} className="sc-login-panel">
      <span className="material-symbols-outlined" style={{ color: '#F7DBA7', fontSize: 22 }}>{icon}</span>
      <div>
        <p style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 800, fontSize: 18, color: '#fff', lineHeight: 1 }}>{value}</p>
        <p style={{ fontFamily: 'Urbanist,sans-serif', fontWeight: 600, fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
      </div>
    </div>
  );
}

/* ─── Floating decoration card ─── */
function FloatCard({ emoji, text, style, floatClass }) {
  return (
    <div className={floatClass} style={{
      position: 'absolute',
      background: 'rgba(255,255,255,0.14)',
      backdropFilter: 'blur(14px)',
      border: '1px solid rgba(255,255,255,0.25)',
      borderRadius: 16,
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      pointerEvents: 'none',
      ...style,
    }}>
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <span style={{ fontFamily: 'Urbanist,sans-serif', fontWeight: 700, fontSize: 13, color: '#fff', whiteSpace: 'nowrap' }}>{text}</span>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN LOGIN COMPONENT
════════════════════════════════════════════ */
function Login() {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login Successful!', userCredential.user);
    } catch (err) {
      console.error('Login Failed:', err.message);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Incorrect email or password. Please try again.');
      } else {
        setError('Login failed. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>

      {/* ── Full-screen two-column grid ── */}
      <div style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        fontFamily: 'Urbanist, sans-serif',
        background: '#F0F4F8',
      }}>

        {/* ════════ LEFT PANEL — Brand / Hero ════════ */}
        <div style={{
          background: 'linear-gradient(145deg, #003459 0%, #00171F 60%, #001824 100%)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px',
        }}>

          {/* Background circles decoration */}
          <div style={{ position: 'absolute', width: 520, height: 520, borderRadius: '50%', background: 'rgba(0,167,231,0.07)', top: -200, right: -180, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 340, height: 340, borderRadius: '50%', background: 'rgba(247,219,167,0.05)', bottom: -100, left: -80, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

          {/* Floating decoration cards */}
          <FloatCard emoji="🐾" text="842 Animals Rescued" style={{ top: '22%', right: -10 }} floatClass="sc-float-a" />
          <FloatCard emoji="🏥" text="128 Vet Checkups" style={{ top: '42%', right: 40 }} floatClass="sc-float-b" />
          <FloatCard emoji="🏡" text="63 Adoptions" style={{ top: '62%', right: 0 }} floatClass="sc-float-c" />

          {/* Logo + wordmark */}
          <div className="sc-login-panel" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'rgba(247,219,167,0.15)',
              border: '1.5px solid rgba(247,219,167,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img src={logo} alt="StrayConnect" style={{ width: 30, height: 30, objectFit: 'contain' }} />
            </div>
            <div>
              <p style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 900, fontSize: 18, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>StrayConnect</p>
              <p style={{ fontWeight: 700, fontSize: 10, color: 'rgba(247,219,167,0.7)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2 }}>Admin Dashboard</p>
            </div>
          </div>

          {/* Hero copy */}
          <div style={{ animationDelay: '0.1s' }} className="sc-login-panel">
            <p style={{
              fontFamily: 'Poppins,sans-serif', fontWeight: 900,
              fontSize: 'clamp(2rem, 3.2vw, 3rem)',
              color: '#fff',
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              marginBottom: 18,
            }}>
              Every stray<br />
              deserves a<br />
              <span style={{ color: '#F7DBA7' }}>safe home.</span>
            </p>
            <p style={{ fontWeight: 600, fontSize: 15, color: 'rgba(255,255,255,0.55)', maxWidth: 340, lineHeight: 1.65 }}>
              Manage rescues, health records, adoptions, and community events — all from one powerful hub.
            </p>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <StatBadge icon="pets"           value="1,200+"  label="Animals Helped"   delay="0.15s" />
            <StatBadge icon="volunteer_activism" value="340+"  label="Active Volunteers" delay="0.2s" />
            <StatBadge icon="location_on"    value="24"      label="Partner Shelters"  delay="0.25s" />
            <StatBadge icon="favorite"       value="98%"     label="Adoption Success"  delay="0.3s" />
          </div>

          {/* Bottom watermark */}
          <p style={{ fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            © 2025 StrayConnect — Authorized Use Only
          </p>
        </div>

        {/* ════════ RIGHT PANEL — Login Form ════════ */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 64px',
          background: '#F0F4F8',
        }}>
          <div style={{ width: '100%', maxWidth: 420 }} className="sc-login-panel">

            {/* Header */}
            <div style={{ marginBottom: 40 }}>
              <p style={{ fontWeight: 700, fontSize: 12, color: '#00A7E7', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
                Welcome back
              </p>
              <h1 style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 900, fontSize: 36, color: '#003459', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 10 }}>
                Sign in to your<br />portal
              </h1>
              <p style={{ fontWeight: 600, fontSize: 14, color: '#52616B' }}>
                Enter your credentials to access the admin dashboard.
              </p>
            </div>

            {/* Error alert */}
            {error && (
              <div style={{
                marginBottom: 24,
                padding: '14px 16px',
                background: 'rgba(255,86,79,0.08)',
                border: '1.5px solid rgba(255,86,79,0.2)',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}>
                <span className="material-symbols-outlined" style={{ color: '#FF564F', fontSize: 20, marginTop: 1 }}>error</span>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#FF564F', lineHeight: 1.5 }}>{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontWeight: 800, fontSize: 10, color: '#52616B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: 'rgba(82,97,107,0.55)', fontSize: 20, pointerEvents: 'none',
                  }}>mail</span>
                  <input
                    type="email"
                    placeholder="admin@strayconnect.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="sc-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontWeight: 800, fontSize: 10, color: '#52616B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: 'rgba(82,97,107,0.55)', fontSize: 20, pointerEvents: 'none',
                  }}>lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="sc-input"
                    style={{ paddingRight: 46 }}
                  />
                  <button
                    type="button"
                    tabIndex="-1"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                      color: 'rgba(82,97,107,0.6)', display: 'flex', alignItems: 'center',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#00A7E7'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(82,97,107,0.6)'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8 }}>
                <button type="button" style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'Urbanist,sans-serif', fontWeight: 700, fontSize: 13,
                  color: '#003459', transition: 'color 0.2s', padding: 0,
                }}
                  onMouseEnter={e => e.currentTarget.style.color = '#00A7E7'}
                  onMouseLeave={e => e.currentTarget.style.color = '#003459'}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 8,
                  width: '100%',
                  padding: '16px 24px',
                  borderRadius: 16,
                  background: loading ? 'rgba(0,52,89,0.6)' : '#003459',
                  color: '#fff',
                  fontFamily: 'Urbanist,sans-serif',
                  fontWeight: 800,
                  fontSize: 16,
                  letterSpacing: '0.02em',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 8px 32px rgba(0,52,89,0.22)',
                  transition: 'background 0.25s, box-shadow 0.25s, transform 0.15s',
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#00A7E7'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,167,231,0.3)'; }}}
                onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = '#003459'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,52,89,0.22)'; }}}
                onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)'; }}
                onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined sc-spin" style={{ fontSize: 20 }}>progress_activity</span>
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In Securely
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider + footer note */}
            <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(0,52,89,0.08)' }} />
              <p style={{ fontWeight: 700, fontSize: 11, color: 'rgba(82,97,107,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                Authorized Personnel Only
              </p>
              <div style={{ flex: 1, height: 1, background: 'rgba(0,52,89,0.08)' }} />
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default Login;