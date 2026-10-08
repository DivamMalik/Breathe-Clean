import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Lock, User, Building, LogIn, Sparkles, CheckCircle2 } from 'lucide-react';

export default function SignInModal({ isOpen, onClose, currentUser, onLogin, onLogout }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('divam.malik@campus.edu');
  const [password, setPassword] = useState('••••••••••••');
  const [name, setName] = useState('Divam Malik');
  const [role, setRole] = useState('System Administrator');
  const [campus, setCampus] = useState('Central Engineering Campus');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({
      name: isSignUp ? name : (email.includes('divam') ? 'Divam Malik' : email.split('@')[0]),
      email,
      role,
      campus
    });
    setSuccessMsg('Authentication successful! Welcome back.');
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 800);
  };

  const handleQuickAdmin = () => {
    onLogin({
      name: 'Divam Malik',
      email: 'divam.malik@campus.edu',
      role: 'System Administrator',
      campus: 'College Campus - Block A'
    });
    setSuccessMsg('Logged in as Divam Malik (System Administrator)');
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 600);
  };

  const handleQuickStudent = () => {
    onLogin({
      name: 'Alex Johnson',
      email: 'alex.j@student.campus.edu',
      role: 'Student Observer',
      campus: 'College Campus - Dormitory 4'
    });
    setSuccessMsg('Logged in as Student Observer');
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 600);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 120 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', borderRadius: '24px', overflow: 'hidden' }}
      >
        <div className="modal-header" style={{ padding: '20px 26px', background: 'var(--bg-surface-elevated)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-icon-box" style={{ width: '38px', height: '38px', borderRadius: '10px' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {isSignUp ? 'Create Breathe Clean Account' : 'Breathe Clean Authentication'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Smart Air Quality Management Portal
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px 26px' }}>
          {successMsg && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px',
                borderRadius: '12px',
                background: 'var(--accent-emerald-light)',
                color: 'var(--accent-emerald-dark)',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}

          {/* Quick Demo Login Preset Buttons */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
              One-Click Quick Login
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={handleQuickAdmin}
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--accent-emerald)',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Sparkles size={14} color="#10b981" /> Divam Malik (Admin)
              </button>
              <button
                type="button"
                onClick={handleQuickStudent}
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <User size={14} color="#0284c7" /> Student Observer
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            <span>or continue with credentials</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {isSignUp && (
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface-elevated)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Role & Permission Level
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              >
                <option value="System Administrator">System Administrator (Full Actuation & AI Override)</option>
                <option value="Campus Facilities Manager">Campus Facilities Manager (HVAC & Filter Controls)</option>
                <option value="Faculty / Teacher">Faculty / Classroom Lead</option>
                <option value="Student Observer">Student Observer (Read-Only Telemetry)</option>
              </select>
            </div>

            <button
              type="submit"
              style={{
                marginTop: '10px',
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.9rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              <LogIn size={18} /> {isSignUp ? 'Create Administrator Account' : 'Sign In to Breathe Clean'}
            </button>
          </form>

          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              style={{ color: '#10b981', fontWeight: 700, textDecoration: 'underline' }}
            >
              {isSignUp ? 'Sign In' : 'Register New Campus'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
