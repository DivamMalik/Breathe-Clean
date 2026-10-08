import React from 'react';
import { Maximize2, Wind, Leaf } from 'lucide-react';
import AirflowCanvas from '../AirflowCanvas';

export default function LiveRoomView({
  currentRoom,
  setCurrentRoom,
  setIsModalOpen,
  roomImageSrc,
  roomImageFallback,
  windowLOpen,
  windowROpen,
  hvacLevel,
  setHvacLevel,
  purifierOn,
  toggleWindows,
  togglePurifier,
  currentUser
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Live Room CFD & Actuation Center</h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Computational fluid dynamics particle visualization & IoT hardware telemetry
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            className="room-select-dropdown"
            value={currentRoom}
            onChange={(e) => setCurrentRoom(e.target.value)}
          >
            <option value="Classroom 301">Classroom 301 (Academic Block A)</option>
            <option value="Campus Library Lounge">Campus Library Lounge (William Hall)</option>
            <option value="Science Lab 4">Science Lab 4 (STEM Complex)</option>
          </select>
          <button className="btn-demo-pill btn-reset" onClick={() => setIsModalOpen(true)}>
            <Maximize2 size={15} /> Expand CFD Inspector
          </button>
        </div>
      </div>

      {/* Room Card */}
      <div className="room-view-card">
        <div className="room-viewport" style={{ height: '520px' }}>
          <img
            src={roomImageSrc}
            alt={currentRoom}
            className="room-bg-image"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = roomImageFallback;
            }}
          />

          <AirflowCanvas
            windowLOpen={windowLOpen}
            windowROpen={windowROpen}
            hvacLevel={hvacLevel}
            purifierOn={purifierOn}
            flowSpeedMultiplier={1.2}
          />

          {/* Overlays */}
          <div
            className="floating-overlay-tag"
            style={{ left: '16%', top: '48%' }}
            onClick={() => toggleWindows(!windowLOpen)}
          >
            <span>Window L</span>
            <span className={`tag-badge-pill ${windowLOpen ? 'tag-badge-open' : 'tag-badge-closed'}`}>
              {windowLOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>

          <div
            className="floating-overlay-tag"
            style={{ left: '49%', top: '22%' }}
            onClick={() => {
              if (currentUser.role === 'admin') {
                setHvacLevel(hvacLevel >= 70 ? 35 : 70);
              } else {
                alert('Central HVAC damper is managed by building administration. Personal comfort controls allowed on room window.');
              }
            }}
          >
            <Wind size={14} color="#0284c7" />
            <span>HVAC</span>
            <span className="tag-badge-pill tag-badge-hvac">{hvacLevel}%</span>
          </div>

          <div
            className="floating-overlay-tag"
            style={{ left: '56%', top: '68%' }}
            onClick={() => togglePurifier(!purifierOn)}
          >
            <Leaf size={14} color={purifierOn ? '#10b981' : '#94a3b8'} />
            <span>Air Purifier</span>
            <span className={`tag-badge-pill ${purifierOn ? 'tag-badge-purifier' : 'tag-badge-closed'}`}>
              {purifierOn ? 'ON' : 'OFF'}
            </span>
          </div>

          <div
            className="floating-overlay-tag"
            style={{ left: '84%', top: '48%' }}
            onClick={() => toggleWindows(!windowROpen)}
          >
            <span>Window R</span>
            <span className={`tag-badge-pill ${windowROpen ? 'tag-badge-open' : 'tag-badge-closed'}`}>
              {windowROpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
        </div>

        <div className="room-view-footer">
          <div className="legend-group">
            <div className="legend-item">
              <span className="legend-color-dot" style={{ background: '#10b981' }} />
              <span>Fresh Air Inflow ({windowLOpen || windowROpen ? 'Active' : 'Closed'})</span>
            </div>
            <div className="legend-item">
              <span className="legend-color-dot" style={{ background: '#0284c7' }} />
              <span>Filtered Air ({hvacLevel}%)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color-dot" style={{ background: '#8b5cf6' }} />
              <span>Purified Air ({purifierOn ? 'Active' : 'Eco Standby'})</span>
            </div>
          </div>
          <div className="flow-controls-quick">
            <span>Flow Rate: <strong>{((hvacLevel * 7.5) + (purifierOn ? 280 : 0) + (windowLOpen ? 210 : 0)).toFixed(0)} m³/h</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
