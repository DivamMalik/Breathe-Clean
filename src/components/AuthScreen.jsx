import React, { useState } from 'react';
import {
  Leaf,
  Wind,
  ShieldCheck,
  User,
  Mail,
  Lock,
  MapPin,
  Building,
  Home,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  LogIn,
  Sliders,
  Globe,
  Sun,
  Moon
} from 'lucide-react';
import { PRESET_CITIES } from '../services/airQualityApi';

export default function AuthScreen({ onLoginSuccess, onLogin, theme, toggleTheme }) {
  const triggerLogin = onLoginSuccess || onLogin;
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' or 'signup'
  const [loading, setLoading] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('divam.malik@breatheclean.io');
  const [signInPassword, setSignInPassword] = useState('••••••••••••');
  const [signInRole, setSignInRole] = useState('admin'); // 'admin' or 'user'

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState('user'); // default is user for everyone!
  const [selectedCity, setSelectedCity] = useState(PRESET_CITIES[0].name);
  const [customCoordinates, setCustomCoordinates] = useState({ lat: PRESET_CITIES[0].lat, lng: PRESET_CITIES[0].lng });
  const [spaceType, setSpaceType] = useState('Residential Smart Home');

  // Handle GPS detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCustomCoordinates({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setSelectedCity('My Current Location (GPS)');
        setDetectingGps(false);
      },
      (err) => {
        console.warn('Geolocation denied or error:', err);
        setDetectingGps(false);
        alert('Could not detect GPS coordinates. Please pick a city from the list.');
      },
      { timeout: 8000 }
    );
  };

  const handleCityChange = (cityName) => {
    setSelectedCity(cityName);
    const found = PRESET_CITIES.find((c) => c.name === cityName);
    if (found) {
      setCustomCoordinates({ lat: found.lat, lng: found.lng });
    }
  };

  // Sign In submit
  const handleSignIn = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const isDivam = signInEmail.toLowerCase().includes('divam');
      const role = signInRole === 'admin' || isDivam ? 'admin' : 'user';
      onLoginSuccess({
        name: isDivam ? 'Divam Malik' : signInEmail.split('@')[0],
        email: signInEmail,
        role: role,
        roleLabel: role === 'admin' ? 'System Administrator' : 'Space Occupant',
        location: selectedCity,
        lat: customCoordinates.lat,
        lng: customCoordinates.lng,
        spaceType: 'Smart Facility & Living Space',
        isFirstTime: false
      });
    }, 400);
  };

  // Sign Up submit (trigggers First-Time Setup Wizard!)
  const handleSignUp = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess({
        name: signUpName.trim() || 'New User',
        email: signUpEmail,
        role: signUpRole,
        roleLabel: signUpRole === 'admin' ? 'System Administrator' : 'Space Occupant',
        location: selectedCity,
        lat: customCoordinates.lat,
        lng: customCoordinates.lng,
        spaceType: spaceType,
        isFirstTime: true // Triggers Setup Mode automatically!
      });
    }, 400);
  };

  // Quick Demo Logins
  const quickLoginAdmin = () => {
    onLoginSuccess({
      name: 'Divam Malik',
      email: 'divam.malik@breatheclean.io',
      role: 'admin',
      roleLabel: 'System Administrator',
      location: 'San Francisco, CA',
      lat: 37.7749,
      lng: -122.4194,
      spaceType: 'Commercial Smart Facility',
      isFirstTime: false
    });
  };

  const quickLoginUser = () => {
    onLoginSuccess({
      name: 'Sarah Chen',
      email: 'sarah.chen@smartliving.com',
      role: 'user',
      roleLabel: 'Home Resident',
      location: 'New York, NY',
      lat: 40.7128,
      lng: -74.0060,
      spaceType: 'Residential Smart Home',
      isFirstTime: false
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-surface-elevated) 100%)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Subtle Background Glow Spheres */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0) 70%)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(2, 132, 199, 0.1) 0%, rgba(2, 132, 199, 0) 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* Top Floating Theme Switcher */}
      <div style={{ position: 'absolute', top: '24px', right: '32px', zIndex: 10 }}>
        <button
          onClick={toggleTheme}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          <span>{theme === 'light' ? 'Dark Theme' : 'Light Theme'}</span>
        </button>
      </div>

      {/* Main Glassmorphic Auth Box */}
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '28px',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '32px 36px 24px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-surface-elevated)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
            }}
          >
            <Leaf size={28} />
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginTop: '4px' }}>
            Breathe Clean
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '380px' }}>
            Smart Air & Automated Ventilation Platform for <strong>Homes, Offices, Schools & Healthcare</strong>
          </p>

          {/* Tab Switcher: Sign In vs Sign Up */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              background: 'var(--border-light)',
              borderRadius: '14px',
              padding: '4px',
              marginTop: '16px'
            }}
          >
            <button
              onClick={() => setActiveTab('signin')}
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: '10px',
                fontSize: '0.86rem',
                fontWeight: 700,
                background: activeTab === 'signin' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'signin' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: activeTab === 'signin' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: '10px',
                fontSize: '0.86rem',
                fontWeight: 700,
                background: activeTab === 'signup' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'signup' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: activeTab === 'signup' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Create Account (New User)
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div style={{ padding: '28px 36px 36px' }}>
          {/* Quick Demo Login Cards (Visible on Sign In) */}
          {activeTab === 'signin' && (
            <div style={{ marginBottom: '22px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                One-Click Quick Access
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={quickLoginAdmin}
                  style={{
                    padding: '12px 10px',
                    borderRadius: '14px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>
                    <ShieldCheck size={16} /> Admin Mode
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Divam Malik</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Full Actuation & Controls</div>
                </button>

                <button
                  type="button"
                  onClick={quickLoginUser}
                  style={{
                    padding: '12px 10px',
                    borderRadius: '14px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#0284c7' }}>
                    <User size={16} /> Standard User
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Sarah Chen</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Personal Space Comfort</div>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0 16px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                <span>or log in with credentials</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
              </div>
            </div>
          )}

          {/* SIGN IN FORM */}
          {activeTab === 'signin' ? (
            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 38px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface-elevated)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 38px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface-elevated)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Access Level / Role
                </label>
                <select
                  value={signInRole}
                  onChange={(e) => setSignInRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem'
                  }}
                >
                  <option value="admin">System Administrator (Master Building & HVAC Controls)</option>
                  <option value="user">Standard User (Personal Room & Comfort Controls)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '8px',
                  padding: '13px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
                }}
              >
                <LogIn size={18} />
                <span>{loading ? 'Authenticating...' : 'Enter Breathe Clean Platform'}</span>
              </button>
            </form>
          ) : (
            /* SIGN UP FORM (For Everyone: Prompts for Location & Space Type) */
            <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Rivera"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 38px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface-elevated)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    required
                    placeholder="alex@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 38px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface-elevated)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    required
                    placeholder="Minimum 8 characters"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 38px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface-elevated)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              {/* Location Selection with GPS Detection (Requirement 6) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Your Location (for Live AQI & Weather)
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingGps}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#10b981',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <MapPin size={13} /> {detectingGps ? 'Locating...' : 'Auto-Detect GPS'}
                  </button>
                </div>
                <select
                  value={selectedCity}
                  onChange={(e) => handleCityChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem'
                  }}
                >
                  {PRESET_CITIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.country})
                    </option>
                  ))}
                  {selectedCity.includes('GPS') && <option value={selectedCity}>{selectedCity}</option>}
                </select>
              </div>

              {/* Space Environment Type (Requirement 2: Not just students, for everyone) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Space & Environment Category
                </label>
                <select
                  value={spaceType}
                  onChange={(e) => setSpaceType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem'
                  }}
                >
                  <option value="Residential Smart Home">Residential Smart Home / Apartment</option>
                  <option value="Commercial Office Workspace">Corporate Office & Workplace</option>
                  <option value="Educational Classroom & Campus">Educational Classroom / School</option>
                  <option value="Healthcare & Wellness Clinic">Healthcare Clinic / Medical Suite</option>
                  <option value="Retail & Hospitality Lounge">Retail & Hospitality Venue</option>
                </select>
              </div>

              {/* Role Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Account Permission
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setSignUpRole('user')}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: signUpRole === 'user' ? '2px solid #10b981' : '1px solid var(--border-color)',
                      background: signUpRole === 'user' ? 'var(--accent-emerald-light)' : 'var(--bg-surface-elevated)',
                      color: signUpRole === 'user' ? 'var(--accent-emerald-dark)' : 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Standard User
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignUpRole('admin')}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: signUpRole === 'admin' ? '2px solid #10b981' : '1px solid var(--border-color)',
                      background: signUpRole === 'admin' ? 'var(--accent-emerald-light)' : 'var(--bg-surface-elevated)',
                      color: signUpRole === 'admin' ? 'var(--accent-emerald-dark)' : 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    System Admin
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '10px',
                  padding: '13px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
                }}
              >
                <span>Continue to Step-Up Setup Mode</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
