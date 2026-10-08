import React from 'react';
import {
  Wind,
  LayoutDashboard,
  Home,
  Waves,
  BarChart3,
  Sliders,
  Cpu,
  Settings,
  Sun,
  Moon,
  ShieldCheck,
  User,
  LogOut,
  Leaf
} from 'lucide-react';

export default function Sidebar({
  activeNav,
  setActiveNav,
  isSetupActive,
  setIsSetupActive,
  theme,
  setTheme,
  currentUser,
  setCurrentUser,
  setIsSettingsModalOpen,
  toggleRole
}) {
  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon-box">
          <Wind size={24} />
        </div>
        <div>
          <div className="brand-name">Breathe Clean</div>
          <div className="brand-subtitle">Smart Air. Healthier Spaces.</div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="sidebar-section">
        <nav className="nav-menu">
          <button
            className={`nav-item ${activeNav === 'dashboard' && !isSetupActive ? 'active' : ''}`}
            onClick={() => {
              setActiveNav('dashboard');
              setIsSetupActive(false);
            }}
          >
            <span className="nav-item-icon"><LayoutDashboard size={19} /></span>
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-item ${activeNav === 'room' && !isSetupActive ? 'active' : ''}`}
            onClick={() => {
              setActiveNav('room');
              setIsSetupActive(false);
            }}
          >
            <span className="nav-item-icon"><Home size={19} /></span>
            <span>Live Room</span>
            <span className="nav-badge">Live</span>
          </button>

          <button
            className={`nav-item ${activeNav === 'air' && !isSetupActive ? 'active' : ''}`}
            onClick={() => {
              setActiveNav('air');
              setIsSetupActive(false);
            }}
          >
            <span className="nav-item-icon"><Waves size={19} /></span>
            <span>Air Quality & Map</span>
          </button>

          <button
            className={`nav-item ${activeNav === 'analytics' && !isSetupActive ? 'active' : ''}`}
            onClick={() => {
              setActiveNav('analytics');
              setIsSetupActive(false);
            }}
          >
            <span className="nav-item-icon"><BarChart3 size={19} /></span>
            <span>Analytics</span>
          </button>

          <button
            className={`nav-item ${activeNav === 'controls' && !isSetupActive ? 'active' : ''}`}
            onClick={() => {
              setActiveNav('controls');
              setIsSetupActive(false);
            }}
          >
            <span className="nav-item-icon"><Sliders size={19} /></span>
            <span>{currentUser.role === 'admin' ? 'Master Controls' : 'Comfort Controls'}</span>
          </button>

          <button
            className={`nav-item ${activeNav === 'automation' && !isSetupActive ? 'active' : ''}`}
            onClick={() => {
              setActiveNav('automation');
              setIsSetupActive(false);
            }}
          >
            <span className="nav-item-icon"><Cpu size={19} /></span>
            <span>Automation</span>
          </button>

          {/* Setup Mode button */}
          <button
            className={`nav-item ${isSetupActive ? 'active' : ''}`}
            onClick={() => setIsSetupActive(true)}
          >
            <span className="nav-item-icon"><Settings size={19} /></span>
            <span>Setup Mode</span>
            <span className="nav-badge" style={{ background: 'rgba(2, 132, 199, 0.2)', color: '#38bdf8' }}>Custom</span>
          </button>
        </nav>
      </div>

      {/* Sidebar Footer Controls */}
      <div className="sidebar-footer">
        {/* Light / Dark Mode Toggle Pill */}
        <div className="theme-switch-pill">
          <button
            className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
          >
            <Sun size={15} /> Light
          </button>
          <button
            className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <Moon size={15} /> Dark
          </button>
        </div>

        {/* User Profile Card */}
        <div
          className="user-profile-badge"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px' }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}
            onClick={() => setIsSettingsModalOpen(true)}
            title="Click to view & edit your location and comfort settings"
          >
            <div
              className="user-avatar"
              style={{
                background: currentUser.role === 'admin'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #0284c7, #3b82f6)'
              }}
            >
              {currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              <span className="user-status-dot" />
            </div>
            <div className="user-info">
              <div className="user-name">{currentUser.name}</div>
              <div className="user-role">
                {currentUser.roleLabel || (currentUser.role === 'admin' ? 'System Administrator' : 'Space Occupant')}
              </div>
            </div>
          </div>

          <button
            onClick={() => setCurrentUser(null)}
            title="Sign Out to Authentication Gateway"
            style={{ color: 'var(--text-muted)', padding: '4px', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Role Switcher Pill */}
        <button
          onClick={toggleRole}
          style={{
            padding: '6px 10px',
            borderRadius: '8px',
            background: currentUser.role === 'admin' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(2, 132, 199, 0.15)',
            border: currentUser.role === 'admin' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(2, 132, 199, 0.4)',
            color: currentUser.role === 'admin' ? '#34d399' : '#38bdf8',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          {currentUser.role === 'admin' ? <ShieldCheck size={13} /> : <User size={13} />}
          <span>Switch to {currentUser.role === 'admin' ? 'Standard User' : 'Admin'} View</span>
        </button>

        {/* AWS Platform Pill */}
        <div className="aws-badge-pill">
          <Leaf size={16} color="#fb923c" />
          <span>Powered by AWS Smart Platform</span>
        </div>
      </div>
    </aside>
  );
}
