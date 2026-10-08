import React from 'react';
import CampusMap from '../CampusMap';

export default function AirQualityMapView({
  currentRoom,
  setCurrentRoom,
  addActivity,
  pm25Outdoor,
  pm10Outdoor,
  co2Level,
  humidity
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Geospatial Environmental Map & Sensor Network</h2>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Interactive campus map monitoring ambient air plumes, clusters, and WHO air safety compliance
        </p>
      </div>

      {/* Campus Map */}
      <CampusMap
        selectedRoom={currentRoom}
        onSelectRoom={(r) => {
          setCurrentRoom(r);
          addActivity(`Selected ${r} from Geospatial Map`, 'blue');
        }}
      />

      {/* Detailed Pollutant Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700 }}>FINE PARTICULATE (PM2.5)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', margin: '4px 0' }}>{pm25Outdoor} µg/m³</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>WHO 24h Threshold: &lt; 15 µg/m³ (Compliant)</div>
        </div>

        <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700 }}>COARSE DUST (PM10)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', margin: '4px 0' }}>{pm10Outdoor} µg/m³</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>WHO 24h Threshold: &lt; 45 µg/m³ (Compliant)</div>
        </div>

        <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700 }}>CARBON DIOXIDE (CO₂)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', margin: '4px 0' }}>{co2Level} ppm</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>ASHRAE 62.1 Ceiling: 1,000 ppm</div>
        </div>

        <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700 }}>RELATIVE HUMIDITY</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7', margin: '4px 0' }}>{humidity}%</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Optimal comfort range: 40% &ndash; 60%</div>
        </div>
      </div>
    </div>
  );
}
