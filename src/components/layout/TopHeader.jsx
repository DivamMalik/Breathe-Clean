import React from 'react';
import { ShieldCheck, User, RefreshCw, Bell } from 'lucide-react';

export default function TopHeader({
  currentUser,
  isFetchingLive,
  syncLiveLocationData,
  controlMode,
  setControlMode,
  addActivity,
  setIsSettingsModalOpen,
  todayFormatted,
  timeFormatted,
  notifications,
  isNotifOpen,
  setIsNotifOpen
}) {
  return (
    <header className="top-header">
      <div className="header-left">
        <div className="greeting-row">
          <h1 className="greeting-title">
            {currentUser.name === 'Divam Malik'
              ? 'Good Afternoon, Divam'
              : `Good Afternoon, ${currentUser.name}`}
          </h1>
          {currentUser.role === 'admin' ? (
            <span
              style={{
                padding: '3px 10px',
                borderRadius: '20px',
                background: 'var(--accent-emerald-light)',
                color: 'var(--accent-emerald-dark)',
                fontSize: '0.72rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ShieldCheck size={12} /> Admin Mode
            </span>
          ) : (
            <span
              style={{
                padding: '3px 10px',
                borderRadius: '20px',
                background: 'var(--accent-blue-light)',
                color: '#0369a1',
                fontSize: '0.72rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <User size={12} /> Personal Space Mode
            </span>
          )}
        </div>
        <div className="greeting-subtitle">
          {currentUser.spaceType || 'Smart Environment'} &bull; Your space is breathing clean.
        </div>
      </div>

      <div className="header-right">
        {/* Live Data Sync Indicator */}
        <div
          onClick={() => syncLiveLocationData(currentUser.lat, currentUser.lng)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '20px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            fontSize: '0.76rem',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
          title="Click to refresh real-time satellite data"
        >
          <RefreshCw size={13} className={isFetchingLive ? 'spin' : ''} color="#10b981" />
          <span>{isFetchingLive ? 'Syncing...' : 'Live Data Active'}</span>
        </div>

        {/* Auto / Manual Mode Badge */}
        <div
          className={`mode-status-badge ${controlMode}`}
          onClick={() => {
            const nextMode = controlMode === 'auto' ? 'manual' : 'auto';
            setControlMode(nextMode);
            addActivity(`Mode switched to ${nextMode.toUpperCase()} by ${currentUser.name}`, 'blue');
          }}
          title="Click to toggle between Auto and Manual control"
        >
          <span className="pulse-dot" />
          <span>{controlMode === 'auto' ? 'AUTO MODE' : 'MANUAL MODE'}</span>
        </div>

        {/* Location Tag */}
        <div
          className="datetime-location-box"
          onClick={() => setIsSettingsModalOpen(true)}
          style={{ cursor: 'pointer' }}
          title="Click to change location or settings"
        >
          <div className="datetime-text">{todayFormatted} &bull; {timeFormatted}</div>
          <div className="location-tag" style={{ color: '#10b981' }}>
            📍 {currentUser.location} &bull; Edit
          </div>
        </div>

        {/* Notification Bell */}
        <button
          className="notification-btn"
          onClick={() => setIsNotifOpen(!isNotifOpen)}
          title="View Notifications"
        >
          <Bell size={20} />
          {notifications.length > 0 && <span className="notification-badge" />}
        </button>
      </div>
    </header>
  );
}
