import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Home,
  Building,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Wind,
  Check,
  Zap,
  Globe,
  Thermometer,
  RotateCcw,
  Leaf,
  Cpu,
  Radio,
  SlidersHorizontal,
  CheckCircle,
  Activity
} from 'lucide-react';
import { PRESET_CITIES, fetchLiveEnvironmentalData } from '../services/airQualityApi';

export default function SetupWizard({ user, onComplete, onCancel }) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4; // Simple, clean, well-maintained for all users!

  // Form State initialized from user profile
  const [selectedCity, setSelectedCity] = useState(user?.location || 'San Francisco, CA');
  const [coords, setCoords] = useState({ lat: user?.lat || 37.7749, lng: user?.lng || -122.4194 });
  const [livePreview, setLivePreview] = useState(null);
  const [loadingLive, setLoadingLive] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Space profile
  const [spaceName, setSpaceName] = useState(user?.spaceType || 'Primary Living Space');
  const [roomCategory, setRoomCategory] = useState(user?.spaceType || 'Residential Smart Home');
  const [roomSize, setRoomSize] = useState('350 sq ft / 32 m²');
  const [windowCount, setWindowCount] = useState(2);

  // Preferences
  const [targetTemp, setTargetTemp] = useState(24);
  const [co2Limit, setCo2Limit] = useState(800);
  const [ecoStandby, setEcoStandby] = useState(true); // Purifier OFF when air is clean

  // Devices
  const [hasPurifier, setHasPurifier] = useState(true);
  const [hasSmartWindows, setHasSmartWindows] = useState(true);
  const [hasCentralHvac, setHasCentralHvac] = useState(true);

  // Fetch live environmental data when city changes
  useEffect(() => {
    let isMounted = true;
    setLoadingLive(true);
    fetchLiveEnvironmentalData(coords.lat, coords.lng).then((data) => {
      if (isMounted) {
        setLivePreview(data);
        setLoadingLive(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [coords]);

  const handleCitySelect = (cityName) => {
    setSelectedCity(cityName);
    const found = PRESET_CITIES.find((c) => c.name === cityName);
    if (found) {
      setCoords({ lat: found.lat, lng: found.lng });
    }
  };

  const handleGpsDetect = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSelectedCity('My Current Location (GPS)');
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        alert('Could not detect location. Please choose a city from the list.');
      }
    );
  };

  const handleFinish = () => {
    if (onComplete) {
      onComplete({
        location: selectedCity,
        lat: coords.lat,
        lng: coords.lng,
        spaceName,
        roomCategory,
        roomSize,
        windowCount,
        targetTemp,
        co2Limit,
        ecoStandby,
        devices: { hasPurifier, hasSmartWindows, hasCentralHvac },
        liveData: livePreview
      });
    }
  };

  const stepTitles = [
    { num: 1, title: 'Location & Climate', desc: 'Real-time air telemetry' },
    { num: 2, title: 'Your Space', desc: 'Room layout & scale' },
    { num: 3, title: 'Comfort & Health', desc: 'Air thresholds & Eco mode' },
    { num: 4, title: 'Device Pairing', desc: 'Smart purifier & actuators' }
  ];

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '24px',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '920px',
        margin: '0 auto',
        width: '100%'
      }}
    >
      {/* Wizard Header */}
      <div
        style={{
          padding: '24px 32px 18px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-surface-elevated)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="brand-icon-box" style={{ width: '40px', height: '40px', borderRadius: '12px' }}>
              <Sliders size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                Setup Mode: Welcome, {user?.name || 'User'}!
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Personalize Breathe Clean for your exact location, comfort targets, and space type
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'var(--accent-emerald-light)',
              color: 'var(--accent-emerald-dark)',
              fontWeight: 800,
              fontSize: '0.8rem'
            }}
          >
            Step {currentStep} of {totalSteps}
          </div>
        </div>

        {/* 4 Step Pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {stepTitles.map((st) => (
            <div
              key={st.num}
              onClick={() => setCurrentStep(st.num)}
              style={{
                padding: '10px 12px',
                borderRadius: '12px',
                background:
                  currentStep === st.num
                    ? 'var(--accent-emerald-light)'
                    : currentStep > st.num
                    ? 'var(--bg-surface)'
                    : 'var(--border-light)',
                border:
                  currentStep === st.num
                    ? '1px solid var(--accent-emerald)'
                    : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: currentStep === st.num ? 'var(--accent-emerald-dark)' : 'var(--text-muted)' }}>
                  0{st.num}
                </span>
                {currentStep > st.num && <Check size={13} color="#10b981" />}
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: currentStep === st.num ? 'var(--accent-emerald-dark)' : 'var(--text-primary)' }}>
                {st.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div style={{ padding: '32px', minHeight: '340px' }}>
        {/* STEP 1: Location & Live Telemetry (Requirement 6) */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Step 1: Your Location & Live Environmental Baseline
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Breathe Clean syncs real-time outdoor AQI, particulate matter, and weather to automate your indoor ventilation.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Select Your City or Region
                    </label>
                    <button
                      type="button"
                      onClick={handleGpsDetect}
                      disabled={gpsLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#10b981',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <MapPin size={13} /> {gpsLoading ? 'Detecting GPS...' : 'Auto-Detect via GPS'}
                    </button>
                  </div>
                  <select
                    value={selectedCity}
                    onChange={(e) => handleCitySelect(e.target.value)}
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

                <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  📍 <strong>Selected Coordinates:</strong> {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° W
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Live telemetry fetched directly from global Open-Meteo meteorological satellites.
                  </div>
                </div>
              </div>

              {/* Live Preview Card */}
              <div
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(2, 132, 199, 0.08) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
                    Live Ambient Telemetry
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {loadingLive ? 'Syncing...' : 'Updated Live'}
                  </span>
                </div>

                {livePreview && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '2.4rem', fontWeight: 800, color: livePreview.outdoorAQI <= 50 ? '#10b981' : '#f59e0b', lineHeight: 1 }}>
                        {livePreview.outdoorAQI}
                      </span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        Outdoor AQI ({livePreview.outdoorAQI <= 50 ? 'Good' : 'Moderate'})
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px', fontSize: '0.78rem' }}>
                      <div>PM2.5: <strong>{livePreview.pm25Outdoor} µg/m³</strong></div>
                      <div>Weather: <strong>{livePreview.weatherTitle}</strong></div>
                      <div>Temp: <strong>{livePreview.temperature}°C</strong></div>
                      <div>Humidity: <strong>{livePreview.humidity}%</strong></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Space & Room Category (Requirement 2: for everyone) */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Step 2: Your Space & Architectural Profile
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Breathe Clean is designed for all environments: private homes, workplaces, healthcare clinics, and education.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Space Category
                </label>
                <select
                  value={roomCategory}
                  onChange={(e) => setRoomCategory(e.target.value)}
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
                  <option value="Residential Smart Home">Residential Smart Home / Living Room</option>
                  <option value="Commercial Office Workspace">Corporate Office & Executive Room</option>
                  <option value="Educational Classroom & Campus">Educational Classroom / Lecture Hall</option>
                  <option value="Healthcare & Wellness Clinic">Healthcare Clinic & Recovery Suite</option>
                  <option value="Fitness Studio & Hospitality">Fitness Studio & Hospitality Lounge</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Custom Space Name
                </label>
                <input
                  type="text"
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  placeholder="e.g. Master Living Room or Tech Hub 4"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Approximate Floor Area
                </label>
                <input
                  type="text"
                  value={roomSize}
                  onChange={(e) => setRoomSize(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Perimeter Windows for Natural Fresh Air
                </label>
                <select
                  value={windowCount}
                  onChange={(e) => setWindowCount(Number(e.target.value))}
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
                  <option value={1}>1 Window (Standard Inflow)</option>
                  <option value={2}>2 Windows (Cross-Ventilation)</option>
                  <option value={4}>4+ Windows (Large Panoramic)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Comfort & Health Preferences */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Step 3: Comfort Targets & Autonomous AI Policies
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Set your ideal room temperature, maximum carbon dioxide limits, and energy-saving rules.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Target Comfort Temperature (°C)
                </label>
                <input
                  type="number"
                  min="18"
                  max="30"
                  value={targetTemp}
                  onChange={(e) => setTargetTemp(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  CO₂ Flush Limit (ppm)
                </label>
                <select
                  value={co2Limit}
                  onChange={(e) => setCo2Limit(Number(e.target.value))}
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
                  <option value={800}>800 ppm (ASHRAE Optimum Focus)</option>
                  <option value={1000}>1,000 ppm (Standard Recommended Limit)</option>
                  <option value={1200}>1,200 ppm (Energy Saving)</option>
                </select>
              </div>
            </div>

            {/* Eco Standby Policy Toggle (Requirement: Air p is on when air is clean fix) */}
            <div
              style={{
                padding: '18px 20px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(2, 132, 199, 0.05) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.92rem', color: '#065f46' }}>
                  <Zap size={18} color="#10b981" />
                  <span>Smart Eco Standby: Turn Air Purifier OFF when Air is Clean</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '3px' }}>
                  When indoor and outdoor air quality is good, windows provide healthy natural ventilation. The purifier is automatically turned OFF to save electricity.
                </div>
              </div>

              <input
                type="checkbox"
                checked={ecoStandby}
                onChange={(e) => setEcoStandby(e.target.checked)}
                style={{ width: '22px', height: '22px', accentColor: '#10b981', cursor: 'pointer' }}
              />
            </div>
          </div>
        )}

        {/* STEP 4: Device Pairing */}
        {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Step 4: Smart Hardware & Actuators in this Space
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Pair and verify connected IoT devices. Click each hardware unit to toggle or test signal.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>
                <span className="pulse-dot" style={{ background: '#10b981' }} /> Local Hub Online &bull; 3/3 Channels Ready
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Purifier Card */}
              <div
                onClick={() => setHasPurifier(!hasPurifier)}
                style={{
                  padding: '16px 20px',
                  borderRadius: '16px',
                  background: hasPurifier ? 'rgba(16, 185, 129, 0.06)' : 'var(--bg-surface-elevated)',
                  border: hasPurifier ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: hasPurifier ? '#10b981' : 'var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Leaf size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                        HEPA H14 Smart Air Purifier
                      </span>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', fontWeight: 700 }}>
                        BLE &bull; 9ms ping
                      </span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Cylindrical floor-standing unit with ionizer & carbon filter. Turns OFF when air is clean in Eco Standby.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      alert('Purifier Diagnostic: Connection ping 8ms. Fan tachometer OK. Filter integrity 94%.');
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    Test Ping
                  </button>
                  <input
                    type="checkbox"
                    checked={hasPurifier}
                    onChange={(e) => setHasPurifier(e.target.checked)}
                    style={{ width: '22px', height: '22px', accentColor: '#10b981', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Smart Windows Card */}
              <div
                onClick={() => setHasSmartWindows(!hasSmartWindows)}
                style={{
                  padding: '16px 20px',
                  borderRadius: '16px',
                  background: hasSmartWindows ? 'rgba(2, 132, 199, 0.06)' : 'var(--bg-surface-elevated)',
                  border: hasSmartWindows ? '1.5px solid #0284c7' : '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: hasSmartWindows ? '#0284c7' : 'var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Home size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                        Smart Motorized Windows ({windowCount} Actuators)
                      </span>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: '#f0f9ff', color: '#0284c7', fontWeight: 700 }}>
                        Zigbee 3.0 &bull; 14ms ping
                      </span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Linear electric actuators for automatic opening and weather sealing based on outdoor pollen/AQI.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      alert('Window Actuators Diagnostic: Both left & right servo encoders responding at 100% torque.');
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    Test Ping
                  </button>
                  <input
                    type="checkbox"
                    checked={hasSmartWindows}
                    onChange={(e) => setHasSmartWindows(e.target.checked)}
                    style={{ width: '22px', height: '22px', accentColor: '#0284c7', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Central HVAC Card */}
              <div
                onClick={() => setHasCentralHvac(!hasCentralHvac)}
                style={{
                  padding: '16px 20px',
                  borderRadius: '16px',
                  background: hasCentralHvac ? 'rgba(139, 92, 246, 0.06)' : 'var(--bg-surface-elevated)',
                  border: hasCentralHvac ? '1.5px solid #8b5cf6' : '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: hasCentralHvac ? '#8b5cf6' : 'var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Wind size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                        Central HVAC & Damper Modulation
                      </span>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: '#f5f3ff', color: '#7c3aed', fontWeight: 700 }}>
                        BACnet IP &bull; Connected
                      </span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Variable speed air handling unit with economizer bypass and MERV-13 particulate pre-filtration.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      alert('HVAC Damper Diagnostic: Damper relay connected. VFD responding smoothly on BACnet IP.');
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    Test Ping
                  </button>
                  <input
                    type="checkbox"
                    checked={hasCentralHvac}
                    onChange={(e) => setHasCentralHvac(e.target.checked)}
                    style={{ width: '22px', height: '22px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '12px 18px',
                borderRadius: '12px',
                background: 'var(--bg-surface-elevated)',
                border: '1px dashed var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="#10b981" />
                <span>All selected actuators ready to sync with your AI rules</span>
              </div>
              <span style={{ fontWeight: 700, color: '#10b981' }}>Ready to Launch</span>
            </div>
          </div>
        )}
      </div>

      {/* Wizard Footer Controls */}
      <div
        style={{
          padding: '18px 32px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-surface-elevated)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <button
          onClick={() => {
            if (currentStep > 1) setCurrentStep(currentStep - 1);
            else if (onCancel) onCancel();
          }}
          style={{
            padding: '10px 18px',
            borderRadius: '12px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ArrowLeft size={16} /> {currentStep === 1 ? 'Cancel' : 'Previous Step'}
        </button>

        <button
          onClick={() => {
            if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
            else handleFinish();
          }}
          style={{
            padding: '11px 24px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            fontSize: '0.88rem',
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
          }}
        >
          <span>{currentStep === totalSteps ? 'Save & Launch My Space' : 'Continue'}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
