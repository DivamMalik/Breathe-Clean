import React from 'react';
import {
  AlertTriangle,
  Lock,
  Wind,
  Leaf,
  ShieldCheck,
  Building2,
  Home,
  Power,
  Minus,
  Plus,
  User
} from 'lucide-react';
import { ADMIN_ZONE_TABS, FACILITY_ZONES } from '../../constants/mockData';

export default function MasterControlsView({
  currentUser,
  windowLOpen,
  setWindowLOpen,
  windowROpen,
  setWindowROpen,
  louverOpen,
  setLouverOpen,
  roofDamperOpen,
  setRoofDamperOpen,
  purifierOn,
  setPurifierOn,
  purifierSpeed,
  setPurifierSpeed,
  damperMode,
  setDamperMode,
  hvacLevel,
  setHvacLevel,
  facilityTargetTemp,
  setFacilityTargetTemp,
  uvcSanitizerOn,
  setUvcSanitizerOn,
  ionizerOn,
  setIonizerOn,
  adminZoneTab,
  setAdminZoneTab,
  addActivity,
  handleResetClean,
  setControlMode,
  toggleWindows,
  togglePurifier
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
          {currentUser.role === 'admin' ? 'Master Facility Actuation Console' : 'Personal Space Comfort Controls'}
        </h2>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          {currentUser.role === 'admin'
            ? 'Central overrides for campus chillers, motorized windows, and emergency shutoffs'
            : 'Personal room controls for windows, purifier whisper modes, and temperature'}
        </p>
      </div>

      {currentUser.role === 'admin' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Admin Master Emergency Bar */}
          <div
            style={{
              padding: '18px 22px',
              borderRadius: '18px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1.5px solid rgba(239, 68, 68, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626'
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#dc2626' }}>
                  Facility Master Emergency Controls &bull; Administrator Clearance
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Overrides all individual zone and room settings during environmental emergencies or campus flushes.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className="btn-demo-pill btn-spike"
                onClick={() => {
                  setWindowLOpen(false);
                  setWindowROpen(false);
                  setLouverOpen(false);
                  setRoofDamperOpen(false);
                  setPurifierOn(true);
                  setPurifierSpeed('Turbo');
                  setDamperMode('recirc');
                  setHvacLevel(75);
                  addActivity('ADMIN OVERRIDE: Emergency Building Lockdown (Windows & Dampers Sealed, Purifiers Turbo)', 'red');
                  alert('EMERGENCY LOCKDOWN ACTIVATED:\nAll 12 motorized window actuators sealed.\nCentral HVAC switched to 100% Recirculation + MERV-13.\nHEPA Purifier fleet running at Turbo CADR.');
                }}
              >
                <Lock size={15} /> Emergency Lockdown (Seal All)
              </button>

              <button
                className="btn-demo-pill"
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#fff',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                }}
                onClick={() => {
                  setWindowLOpen(true);
                  setWindowROpen(true);
                  setLouverOpen(true);
                  setRoofDamperOpen(true);
                  setHvacLevel(100);
                  setDamperMode('fresh');
                  setPurifierOn(true);
                  setPurifierSpeed('Turbo');
                  addActivity('ADMIN OVERRIDE: Bio-Purge Fresh Air Flush (All Dampers 100%, High Volume Ventilation)', 'blue');
                  alert('BIO-PURGE ACTIVATED:\nAll motorized windows & dampers opened 100%.\nAHU Fan speed boosted to 100% displacement flush.');
                }}
              >
                <Wind size={15} /> Bio-Purge (Max Air Flush)
              </button>

              <button
                className="btn-demo-pill"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
                onClick={() => {
                  setPurifierOn(false);
                  setPurifierSpeed('Eco');
                  setWindowLOpen(true);
                  setWindowROpen(true);
                  setHvacLevel(35);
                  addActivity('ADMIN OVERRIDE: Campus-Wide Eco Standby (Purifiers OFF, Natural Cross-Ventilation Active)', 'green');
                  alert('ECO STANDBY ACTIVATED:\nAll purifiers set to Eco Standby (0W draw) as air is clean.\nNatural cross-ventilation maintained.');
                }}
              >
                <Leaf size={15} /> Campus Eco Standby
              </button>

              <button
                className="btn-demo-pill btn-reset"
                onClick={() => {
                  handleResetClean();
                  setControlMode('auto');
                  setLouverOpen(true);
                  setRoofDamperOpen(false);
                  setDamperMode('fresh');
                  addActivity('ADMIN OVERRIDE: Cleared all overrides. AI Autonomous control restored.', 'green');
                }}
              >
                <ShieldCheck size={15} /> Restore Standard Auto
              </button>
            </div>
          </div>

          {/* Multi-Zone Actuator Broadcast Selector */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '16px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} color="#0284c7" />
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Target Control Zone:
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {ADMIN_ZONE_TABS.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => {
                    setAdminZoneTab(zone.id);
                    addActivity(`Admin focused actuator scope on: ${zone.label}`, 'blue');
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: adminZoneTab === zone.id ? 'var(--accent-emerald-light)' : 'var(--bg-surface-elevated)',
                    border: adminZoneTab === zone.id ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                    color: adminZoneTab === zone.id ? 'var(--accent-emerald-dark)' : 'var(--text-secondary)',
                    fontWeight: adminZoneTab === zone.id ? 800 : 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {zone.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3 Master Actuator Console Stations */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* STATION 1: Motorized Windows & Natural Ventilation */}
            <div
              style={{
                padding: '22px',
                borderRadius: '20px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                    <Home size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>Motorized Window Actuators</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Linear electric servos & facade louvers</div>
                  </div>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: (windowLOpen || windowROpen) ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    color: (windowLOpen || windowROpen) ? '#059669' : '#dc2626',
                    fontWeight: 800,
                    fontSize: '0.72rem'
                  }}
                >
                  {(windowLOpen && windowROpen) ? '● All Open (65°)' : (!windowLOpen && !windowROpen) ? '● All Sealed (0°)' : '● Partial Inflow'}
                </span>
              </div>

              {/* Master Presets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Master Inflow Position</span>
                  <span style={{ color: '#0284c7' }}>{(windowLOpen && windowROpen) ? '100% Inflow' : (!windowLOpen && !windowROpen) ? '0% (Sealed)' : '50% Inflow'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  <button
                    onClick={() => {
                      setWindowLOpen(false);
                      setWindowROpen(false);
                      addActivity('Admin sealed all motorized windows (0%)', 'red');
                    }}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      background: (!windowLOpen && !windowROpen) ? '#fee2e2' : 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      color: (!windowLOpen && !windowROpen) ? '#dc2626' : 'var(--text-secondary)',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Sealed (0%)
                  </button>
                  <button
                    onClick={() => {
                      setWindowLOpen(true);
                      setWindowROpen(false);
                      addActivity('Admin set windows to Weather Mode (25%)', 'blue');
                    }}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      background: (windowLOpen && !windowROpen) ? 'var(--accent-blue-light)' : 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      color: (windowLOpen && !windowROpen) ? '#0284c7' : 'var(--text-secondary)',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Storm (25%)
                  </button>
                  <button
                    onClick={() => {
                      setWindowLOpen(true);
                      setWindowROpen(true);
                      addActivity('Admin set windows to Optimal Natural Breeze (60%)', 'green');
                    }}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      background: (windowLOpen && windowROpen) ? 'var(--accent-emerald-light)' : 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      color: (windowLOpen && windowROpen) ? '#059669' : 'var(--text-secondary)',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Breeze (60%)
                  </button>
                  <button
                    onClick={() => {
                      setWindowLOpen(true);
                      setWindowROpen(true);
                      setLouverOpen(true);
                      setRoofDamperOpen(true);
                      addActivity('Admin set all windows and louvers to Full Open (100%)', 'blue');
                    }}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      background: (louverOpen && roofDamperOpen) ? '#f0fdf4' : 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      color: (louverOpen && roofDamperOpen) ? '#16a34a' : 'var(--text-secondary)',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Flush (100%)
                  </button>
                </div>
              </div>

              {/* Individual Servos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  INDIVIDUAL SERVO CHANNELS
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>Window Left (North Facade)</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Actuator #A1 &bull; {windowLOpen ? '65° Tilt' : '0° Sealed'}</div>
                  </div>
                  <button
                    onClick={() => {
                      const next = !windowLOpen;
                      setWindowLOpen(next);
                      addActivity(`Admin toggled Window Left: ${next ? 'OPEN' : 'CLOSED'}`, next ? 'green' : 'red');
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      background: windowLOpen ? '#10b981' : '#64748b',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.76rem',
                      cursor: 'pointer'
                    }}
                  >
                    {windowLOpen ? 'OPEN' : 'CLOSED'}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>Window Right (South Atrium)</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Actuator #A2 &bull; {windowROpen ? '65° Tilt' : '0° Sealed'}</div>
                  </div>
                  <button
                    onClick={() => {
                      const next = !windowROpen;
                      setWindowROpen(next);
                      addActivity(`Admin toggled Window Right: ${next ? 'OPEN' : 'CLOSED'}`, next ? 'green' : 'red');
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      background: windowROpen ? '#10b981' : '#64748b',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.76rem',
                      cursor: 'pointer'
                    }}
                  >
                    {windowROpen ? 'OPEN' : 'CLOSED'}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>Cross-Breeze Louver (East)</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Actuator #L1 &bull; {louverOpen ? 'Active Flow' : 'Bypass Sealed'}</div>
                  </div>
                  <button
                    onClick={() => {
                      const next = !louverOpen;
                      setLouverOpen(next);
                      addActivity(`Admin toggled East Cross Louver: ${next ? 'OPEN' : 'CLOSED'}`, next ? 'green' : 'red');
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      background: louverOpen ? '#0284c7' : '#64748b',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.76rem',
                      cursor: 'pointer'
                    }}
                  >
                    {louverOpen ? 'ACTIVE' : 'SEALED'}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>Roof Skylight Aeration Damper</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Actuator #R1 &bull; {roofDamperOpen ? 'Stack Flush' : 'Thermal Lock'}</div>
                  </div>
                  <button
                    onClick={() => {
                      const next = !roofDamperOpen;
                      setRoofDamperOpen(next);
                      addActivity(`Admin toggled Roof Aeration Damper: ${next ? 'OPEN' : 'CLOSED'}`, next ? 'green' : 'red');
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      background: roofDamperOpen ? '#8b5cf6' : '#64748b',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.76rem',
                      cursor: 'pointer'
                    }}
                  >
                    {roofDamperOpen ? 'OPEN' : 'CLOSED'}
                  </button>
                </div>
              </div>
            </div>

            {/* STATION 2: Central HVAC & Variable Air Damper */}
            <div
              style={{
                padding: '22px',
                borderRadius: '20px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                    <Wind size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>Central HVAC & AHU Damper</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>VFD Fan speed & air intake mixing</div>
                  </div>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: hvacLevel > 0 ? 'rgba(139, 92, 246, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                    color: hvacLevel > 0 ? '#7c3aed' : '#64748b',
                    fontWeight: 800,
                    fontSize: '0.72rem'
                  }}
                >
                  {hvacLevel}% Fan Speed
                </span>
              </div>

              {/* Slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700 }}>
                  <span style={{ color: 'var(--text-muted)' }}>VFD Modulation Frequency</span>
                  <span style={{ color: '#8b5cf6' }}>{hvacLevel}% ({Math.round(hvacLevel * 12.5)} m³/h)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={hvacLevel}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setHvacLevel(val);
                    addActivity(`Admin set Central HVAC fan speed to ${val}%`, 'blue');
                  }}
                  style={{ width: '100%', accentColor: '#8b5cf6', cursor: 'pointer' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {[
                    { label: '25% Quiet', val: 25 },
                    { label: '50% Norm', val: 50 },
                    { label: '75% High', val: 75 },
                    { label: '100% Max', val: 100 }
                  ].map((spd) => (
                    <button
                      key={spd.val}
                      onClick={() => {
                        setHvacLevel(spd.val);
                        addActivity(`Admin adjusted HVAC preset to ${spd.val}%`, 'blue');
                      }}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '8px',
                        background: hvacLevel === spd.val ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-surface-elevated)',
                        border: hvacLevel === spd.val ? '1.5px solid #8b5cf6' : '1px solid var(--border-color)',
                        color: hvacLevel === spd.val ? '#7c3aed' : 'var(--text-secondary)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {spd.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Damper Modes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  OUTDOOR INTAKE DAMPER MODE
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { id: 'fresh', name: '🍃 100% Outdoor Fresh Air', desc: 'Direct ambient air delivery when outdoor AQI is clean' },
                    { id: 'recirc', name: '🔄 Recirculation + MERV-13', desc: 'Isolates outdoor air during high particulate spikes' },
                    { id: 'economizer', name: '⚡ Economizer Free-Cooling', desc: 'Passive thermodynamic temperature exchange' }
                  ].map((mode) => (
                    <div
                      key={mode.id}
                      onClick={() => {
                        setDamperMode(mode.id);
                        addActivity(`Admin switched Damper Mode to: ${mode.name}`, 'blue');
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: damperMode === mode.id ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-surface-elevated)',
                        border: damperMode === mode.id ? '1.5px solid #8b5cf6' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: damperMode === mode.id ? '#7c3aed' : 'var(--text-primary)' }}>
                        {mode.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{mode.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chiller Stepper */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Chilled Water Setpoint</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Building chilled beam loop</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => {
                      const next = Math.max(18, facilityTargetTemp - 0.5);
                      setFacilityTargetTemp(next);
                      addActivity(`Admin decreased facility temperature to ${next.toFixed(1)}°C`, 'blue');
                    }}
                    style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 800 }}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0284c7', minWidth: '54px', textAlign: 'center' }}>
                    {facilityTargetTemp.toFixed(1)}°C
                  </span>
                  <button
                    onClick={() => {
                      const next = Math.min(28, facilityTargetTemp + 0.5);
                      setFacilityTargetTemp(next);
                      addActivity(`Admin increased facility temperature to ${next.toFixed(1)}°C`, 'blue');
                    }}
                    style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 800 }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* STATION 3: HEPA Purifier Fleet */}
            <div
              style={{
                padding: '22px',
                borderRadius: '20px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <Leaf size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>HEPA Purifier Fleet</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>H14 Clean Air Delivery System</div>
                  </div>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: purifierOn ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                    color: purifierOn ? '#059669' : '#d97706',
                    fontWeight: 800,
                    fontSize: '0.72rem'
                  }}
                >
                  {purifierOn ? `● Active (${purifierSpeed})` : '● Eco Standby (OFF)'}
                </span>
              </div>

              {/* Fleet Power */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: purifierOn ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface-elevated)',
                  border: purifierOn ? '1.5px solid #10b981' : '1px solid var(--border-color)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>Fleet Master Power</div>
                  <div style={{ fontSize: '0.72rem', color: purifierOn ? '#059669' : 'var(--text-muted)' }}>
                    {purifierOn ? 'Running CADR 480 m³/h' : 'Eco Standby: Purifier OFF when air is clean'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    const next = !purifierOn;
                    setPurifierOn(next);
                    if (next && purifierSpeed === 'Eco') setPurifierSpeed('Standard');
                    addActivity(`Admin toggled Fleet Purifier Power: ${next ? 'ON' : 'OFF (Eco Standby)'}`, next ? 'green' : 'red');
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    background: purifierOn ? '#10b981' : '#64748b',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Power size={14} /> {purifierOn ? 'RUNNING' : 'ECO STANDBY'}
                </button>
              </div>

              {/* Speed Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  FLEET SPEED & CADR MODULATION
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'Eco', name: '🍃 Eco Standby', desc: '0W • Off when clean' },
                    { id: 'Low', name: '🌙 Whisper', desc: '15W • Silent (24 dB)' },
                    { id: 'Standard', name: '⚡ Standard', desc: '45W • CADR 320m³/h' },
                    { id: 'Turbo', name: '🚀 Turbo CADR', desc: '110W • CADR 500m³/h' }
                  ].map((spd) => (
                    <button
                      key={spd.id}
                      onClick={() => {
                        setPurifierSpeed(spd.id);
                        if (spd.id === 'Eco') setPurifierOn(false);
                        else setPurifierOn(true);
                        addActivity(`Admin adjusted Purifier Fleet speed to ${spd.name}`, 'green');
                      }}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        background: purifierSpeed === spd.id ? 'var(--accent-emerald-light)' : 'var(--bg-surface-elevated)',
                        border: purifierSpeed === spd.id ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                        color: purifierSpeed === spd.id ? 'var(--accent-emerald-dark)' : 'var(--text-secondary)',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.8rem' }}>{spd.name}</div>
                      <div style={{ fontSize: '0.68rem', opacity: 0.8 }}>{spd.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sanitizers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  AUXILIARY GERMICIDAL SANITIZERS
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>UV-C Germicidal Disinfection</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>254nm irradiation inside plenum &bull; 99.9% path kill</div>
                  </div>
                  <button
                    onClick={() => {
                      const next = !uvcSanitizerOn;
                      setUvcSanitizerOn(next);
                      addActivity(`Admin toggled UV-C Sanitizer: ${next ? 'ACTIVATED' : 'DISABLED'}`, next ? 'blue' : 'gray');
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: uvcSanitizerOn ? '#8b5cf6' : '#64748b',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.74rem',
                      cursor: 'pointer'
                    }}
                  >
                    {uvcSanitizerOn ? 'ACTIVE' : 'OFF'}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Needlepoint Bipolar Ionizer</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Agglomerates sub-micron particulates without ozone</div>
                  </div>
                  <button
                    onClick={() => {
                      const next = !ionizerOn;
                      setIonizerOn(next);
                      addActivity(`Admin toggled Bipolar Ionizer: ${next ? 'ACTIVATED' : 'DISABLED'}`, next ? 'blue' : 'gray');
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: ionizerOn ? '#0284c7' : '#64748b',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.74rem',
                      cursor: 'pointer'
                    }}
                  >
                    {ionizerOn ? 'ACTIVE' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy-Preserving Aggregate Zone Telemetry & Direct Zone Actions */}
          <div
            style={{
              padding: '22px',
              borderRadius: '20px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={20} color="#10b981" />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    Facility Zone Telemetry & Direct Actuation Console
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Real-time zone actuators &bull; Click any action button to test or override individual building pods
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: '0.74rem',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#059669',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🛡️ GDPR / Privacy Compliant: Sensitive Occupant PII Protected
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              As administrator, you have full actuation authority over all HVAC dampers, motorized linear servos, and filtration equipment. Individual occupant calendars and personal metadata remain strictly masked.
            </p>

            {/* Zone Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {FACILITY_ZONES.map((row) => (
                <div
                  key={row.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: '14px',
                    background: 'var(--bg-surface-elevated)',
                    fontSize: '0.84rem',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800 }}>{row.zone}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>{row.occ}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ color: '#0284c7', fontSize: '0.8rem' }}>Flow: <strong>{row.flow}</strong></div>
                    <div style={{ fontSize: '0.8rem' }}>CO₂: <strong>{row.co2} ppm</strong></div>
                    <div style={{ fontSize: '0.8rem' }}>
                      AQI: <strong style={{ color: row.aqi <= 50 ? '#10b981' : '#f59e0b' }}>{row.aqi}</strong>
                    </div>
                    <span className={`kpi-badge ${row.aqi <= 50 ? 'badge-good' : 'badge-normal'}`}>● {row.status}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        addActivity(`Admin executed Air Flush for: ${row.zone}`, 'blue');
                        alert(`Zone Command Dispatched:\nDisplacement air flush queued for ${row.zone}.\nVAV Damper set to 100%.`);
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: 'rgba(2, 132, 199, 0.1)',
                        border: '1px solid rgba(2, 132, 199, 0.3)',
                        color: '#0284c7',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      🌀 Flush Zone
                    </button>

                    <button
                      onClick={() => {
                        addActivity(`Admin toggled motorized windows for: ${row.zone}`, 'green');
                        alert(`Window Command Dispatched:\nActuators in ${row.zone} responding to natural breeze command.`);
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#059669',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      🪟 Toggle Windows
                    </button>

                    <button
                      onClick={() => {
                        addActivity(`Admin activated Eco Standby for: ${row.zone}`, 'green');
                        alert(`Eco Mode Dispatched:\nPurifier turned OFF in ${row.zone} to conserve energy.`);
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      🍃 Eco Standby
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Standard User Comfort View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              padding: '18px 22px',
              borderRadius: '18px',
              background: 'rgba(2, 132, 199, 0.08)',
              border: '1.5px solid rgba(2, 132, 199, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284c7'
              }}
            >
              <User size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0284c7' }}>
                Personal Space Comfort Controls &bull; {currentUser.spaceType || 'Room Controls'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                You have direct manual control over your immediate room windows, air purifier speed, and target temperature.
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {/* Room Windows Card */}
            <div
              style={{
                padding: '22px',
                borderRadius: '20px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Home size={20} color="#0284c7" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Room Windows</h3>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: (windowLOpen || windowROpen) ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    color: (windowLOpen || windowROpen) ? '#059669' : '#dc2626',
                    fontWeight: 800,
                    fontSize: '0.74rem'
                  }}
                >
                  {(windowLOpen && windowROpen) ? 'Open (Fresh Breeze)' : 'Sealed'}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Smart linear actuators tilt your windows open for fresh, oxygen-rich outdoor air.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  className="btn-demo-pill btn-reset"
                  style={{ justifyContent: 'center' }}
                  onClick={() => {
                    setWindowLOpen(true);
                    setWindowROpen(true);
                    addActivity('User opened room windows for natural ventilation', 'green');
                  }}
                >
                  <Home size={15} /> Open Windows
                </button>
                <button
                  className="btn-demo-pill btn-spike"
                  style={{ justifyContent: 'center' }}
                  onClick={() => {
                    setWindowLOpen(false);
                    setWindowROpen(false);
                    addActivity('User sealed room windows against outdoor drafts', 'red');
                  }}
                >
                  <Lock size={15} /> Seal Windows
                </button>
              </div>
            </div>

            {/* Room Air Purifier Card */}
            <div
              style={{
                padding: '22px',
                borderRadius: '20px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Leaf size={20} color="#10b981" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>HEPA H14 Air Purifier</h3>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: purifierOn ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                    color: purifierOn ? '#059669' : '#d97706',
                    fontWeight: 800,
                    fontSize: '0.74rem'
                  }}
                >
                  {purifierOn ? `Running (${purifierSpeed})` : 'Eco Standby (OFF)'}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Automatically turns OFF when indoor air is healthy to conserve electricity (Image 2 logic).
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  className="btn-demo-pill btn-reset"
                  style={{ justifyContent: 'center' }}
                  onClick={() => {
                    setPurifierOn(true);
                    setPurifierSpeed('Standard');
                    addActivity('User turned Room Air Purifier ON', 'green');
                  }}
                >
                  <Power size={15} /> Turn Purifier ON
                </button>
                <button
                  className="btn-demo-pill btn-spike"
                  style={{ justifyContent: 'center' }}
                  onClick={() => {
                    setPurifierOn(false);
                    setPurifierSpeed('Eco');
                    addActivity('User set Room Air Purifier to Eco Standby (OFF)', 'blue');
                  }}
                >
                  <Power size={15} /> Eco Standby (OFF)
                </button>
              </div>

              {/* Speed Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '6px' }}>
                {['Eco', 'Low', 'Standard', 'Turbo'].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => {
                      setPurifierSpeed(spd);
                      if (spd === 'Eco') setPurifierOn(false);
                      else setPurifierOn(true);
                      addActivity(`User changed purifier speed to ${spd}`, 'green');
                    }}
                    style={{
                      padding: '6px 4px',
                      borderRadius: '8px',
                      background: purifierSpeed === spd ? 'var(--accent-emerald-light)' : 'var(--bg-surface-elevated)',
                      border: purifierSpeed === spd ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                      color: purifierSpeed === spd ? 'var(--accent-emerald-dark)' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      cursor: 'pointer'
                    }}
                  >
                    {spd}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
