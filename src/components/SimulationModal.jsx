import React from 'react';
import { X, ShieldAlert, Cpu, Wind, Thermometer, Droplets, CheckCircle, Activity } from 'lucide-react';
import AirflowCanvas from './AirflowCanvas';

export default function SimulationModal({
  isOpen,
  onClose,
  currentRoom,
  roomImage,
  windowLOpen,
  windowROpen,
  hvacLevel,
  purifierOn,
  indoorAQI,
  outdoorAQI,
  co2Level,
  temperature,
  humidity
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="brand-icon-box" style={{ width: '36px', height: '36px' }}>
              <Wind size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {currentRoom} — Environmental Simulation Inspector
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                High-fidelity computational fluid dynamics (CFD) airflow vector & IoT sensor overlay
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ position: 'relative', width: '100%', height: '380px', overflow: 'hidden' }}>
          <img src={roomImage} alt="Room detail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <AirflowCanvas
            windowLOpen={windowLOpen}
            windowROpen={windowROpen}
            hvacLevel={hvacLevel}
            purifierOn={purifierOn}
            flowSpeedMultiplier={1.5}
          />

          {/* Real-time telemetry HUD overlay */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '12px 18px',
              borderRadius: '14px',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CFD Velocity & Pressure
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#34d399' }}>
              Flow Rate: {((hvacLevel * 7.5) + (purifierOn ? 280 : 0) + ((windowLOpen || windowROpen) ? 210 : 0)).toFixed(0)} m³/h
            </div>
            <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
              Air Exchange Rate: <strong>{(2.8 + (hvacLevel / 40)).toFixed(1)} ACH</strong>
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '12px 18px',
              borderRadius: '14px',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>INDOOR AQI</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8' }}>{indoorAQI}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>CO₂</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#fbbf24' }}>{co2Level} ppm</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>TEMP</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#f87171' }}>{temperature}°C</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', background: 'var(--bg-surface)' }}>
          <div style={{ padding: '12px', background: 'var(--bg-surface-elevated)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '12px', fontWeight: 700 }}>
              <CheckCircle size={15} /> MERV-13 Filters
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>94% Intact</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimated life: 142 days</div>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-surface-elevated)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7', fontSize: '12px', fontWeight: 700 }}>
              <Wind size={15} /> Air Dispersion
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>Optimal</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No dead air zones detected</div>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-surface-elevated)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b5cf6', fontSize: '12px', fontWeight: 700 }}>
              <Cpu size={15} /> AI Latency
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>14 ms</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Edge IoT inference active</div>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-surface-elevated)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '12px', fontWeight: 700 }}>
              <Activity size={15} /> Safety Compliance
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>ASHRAE 62.1</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Full compliance confirmed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
