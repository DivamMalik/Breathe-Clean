import React from 'react';
import { X, Bell, AlertTriangle, CheckCircle2, Info, ShieldCheck } from 'lucide-react';

export default function NotificationModal({ isOpen, onClose, notifications, onClear }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '32px',
        width: '380px',
        maxHeight: '500px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 90,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface-elevated)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem' }}>
          <Bell size={18} color="#10b981" /> System Notifications
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onClear}
            style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, padding: '4px 8px' }}
          >
            Clear all
          </button>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>
      </div>

      <div style={{ padding: '12px 16px', overflowY: 'auto', display: 'flex', flexChange: 'column', flexDirection: 'column', gap: '10px' }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No new notifications. Everything is running smoothly.
          </div>
        ) : (
          notifications.map((n, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '12px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                fontSize: '0.82rem'
              }}
            >
              <div style={{ marginTop: '2px' }}>
                {n.type === 'alert' && <AlertTriangle size={16} color="#ef4444" />}
                {n.type === 'warning' && <AlertTriangle size={16} color="#f59e0b" />}
                {n.type === 'info' && <Info size={16} color="#0284c7" />}
                {n.type === 'success' && <ShieldCheck size={16} color="#10b981" />}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{n.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{n.message}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '2px' }}>{n.time}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
