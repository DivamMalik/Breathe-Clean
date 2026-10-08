import React, { useState } from 'react';
import { X, MapPin, Sliders, CheckCircle2, RotateCcw, Zap, Home, Thermometer, ShieldCheck } from 'lucide-react';
import { PRESET_CITIES, fetchLiveEnvironmentalData } from '../services/airQualityApi';

export default function UserSettingsModal({ isOpen, onClose, user, onUpdateSettings, onRerunSetup }) {
  if (!isOpen) return null;

  const [locationName, setLocationName] = useState(user?.location || 'San Francisco, CA');
  const [coords, setCoords] = useState({ lat: user?.lat || 37.7749, lng: user?.lng || -122.4194 });
  const [spaceName, setSpaceName] = useState(user?.spaceName || 'Primary Space');
  const [targetTemp, setTargetTemp] = useState(user?.targetTemp || 24);
  const [co2Limit, setCo2Limit] = useState(user?.co2Limit || 800);
  const [ecoStandby, setEcoStandby] = useState(user?.ecoStandby ?? true);
  const [savedMsg, setSavedMsg] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  const handleCitySelect = (cityName) => {
    setLocationName(cityName);
    const found = PRESET_CITIES.find((c) => c.name === cityName);
    if (found) {
      setCoords({ lat: found.lat, lng: found.lng });
    }
  };

  const handleGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationName('My Current Location (GPS)');
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        alert('Could not detect GPS coordinates.');
      }
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    // Fetch fresh live data for the updated coordinates!
    const liveData = await fetchLiveEnvironmentalData(coords.lat, coords.lng);
    onUpdateSettings({
      location: locationName,
      lat: coords.lat,
      lng: coords.lng,
      spaceName,
      targetTemp,
      co2Limit,
      ecoStandby,
      liveData
    });
    setSavedMsg('Settings & live location data updated successfully!');
    setTimeout(() => {
      setSavedMsg('');
      onClose();
    }, 800);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 120 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', borderRadius: '24px' }}
      >
        <div className="modal-header" style={{ padding: '20px 26px', background: 'var(--bg-surface-elevated)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-icon-box" style={{ width: '38px', height: '38px', borderRadius: '10px' }}>
              <Sliders size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Space & Location Settings
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Customize your environmental sensors & location telemetry
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px 26px' }}>
          {savedMsg && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'var(--accent-emerald-light)',
                color: 'var(--accent-emerald-dark)',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle2 size={16} /> {savedMsg}
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Location selector */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Location (Fetches Live Outdoor AQI & Weather)
                </label>
                <button
                  type="button"
                  onClick={handleGps}
                  disabled={gpsLoading}
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
                  <MapPin size={13} /> {gpsLoading ? 'Locating...' : 'Auto-Detect GPS'}
                </button>
              </div>
              <select
                value={locationName}
                onChange={(e) => handleCitySelect(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              >
                {PRESET_CITIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.country})
                  </option>
                ))}
                {locationName.includes('GPS') && <option value={locationName}>{locationName}</option>}
              </select>
            </div>

            {/* Space Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Space / Room Name
              </label>
              <input
                type="text"
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            {/* Target temperature & CO2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Target Comfort Temp (°C)
                </label>
                <input
                  type="number"
                  min="18"
                  max="30"
                  value={targetTemp}
                  onChange={(e) => setTargetTemp(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Max CO₂ Limit (ppm)
                </label>
                <select
                  value={co2Limit}
                  onChange={(e) => setCo2Limit(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value={800}>800 ppm (Optimal)</option>
                  <option value={1000}>1,000 ppm (Standard)</option>
                  <option value={1200}>1,200 ppm (Eco)</option>
                </select>
              </div>
            </div>

            {/* Eco Standby toggle */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Eco Standby (Purifier OFF when Clean)</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Conserves electricity while fresh natural airflow is active</div>
              </div>
              <input
                type="checkbox"
                checked={ecoStandby}
                onChange={(e) => setEcoStandby(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                }}
              >
                Apply Changes & Refresh Live Data
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onRerunSetup) onRerunSetup();
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Re-Run Setup Wizard
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
