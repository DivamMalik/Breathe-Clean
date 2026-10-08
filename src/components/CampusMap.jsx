import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Layers, Wind, Eye, CheckCircle2, ChevronRight, Navigation, Sparkles } from 'lucide-react';

export default function CampusMap({ onSelectRoom, selectedRoom = 'Classroom 301' }) {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const [mapStyle, setMapStyle] = useState('streets'); // 'streets' or 'satellite'
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showWind, setShowWind] = useState(true);
  const [activeBuilding, setActiveBuilding] = useState('Classroom 301');

  // Campus building nodes with real-world relative coordinates (around college campus)
  const buildings = [
    {
      id: 'classroom-301',
      name: 'Classroom 301',
      building: 'Academic Block A - Floor 3',
      lat: 34.0522,
      lng: -118.2437,
      aqi: 40,
      pm25: 12,
      co2: 620,
      temp: 27,
      humidity: 52,
      status: 'Good',
      color: '#10b981',
      occupancy: '28 Students'
    },
    {
      id: 'library-lounge',
      name: 'Campus Library Lounge',
      building: 'William Hall - Floor 2',
      lat: 34.0535,
      lng: -118.2415,
      aqi: 35,
      pm25: 9,
      co2: 540,
      temp: 24,
      humidity: 48,
      status: 'Excellent',
      color: '#10b981',
      occupancy: '64 Students'
    },
    {
      id: 'science-lab-4',
      name: 'Science Lab 4',
      building: 'STEM Technology Center',
      lat: 34.0508,
      lng: -118.2460,
      aqi: 58,
      pm25: 19,
      co2: 780,
      temp: 25.5,
      humidity: 55,
      status: 'Moderate',
      color: '#f59e0b',
      occupancy: '16 Researchers'
    },
    {
      id: 'student-union',
      name: 'Student Dining Hall',
      building: 'Campus Center Block',
      lat: 34.0540,
      lng: -118.2470,
      aqi: 72,
      pm25: 24,
      co2: 890,
      temp: 26.8,
      humidity: 60,
      status: 'Moderate',
      color: '#f59e0b',
      occupancy: '120 Diners'
    },
    {
      id: 'sports-complex',
      name: 'Athletic Pavilion',
      building: 'Recreation Center',
      lat: 34.0495,
      lng: -118.2410,
      aqi: 28,
      pm25: 7,
      co2: 480,
      temp: 22,
      humidity: 50,
      status: 'Excellent',
      color: '#10b981',
      occupancy: '42 Athletes'
    },
    {
      id: 'perimeter-station',
      name: 'Campus Perimeter North',
      building: 'Outdoor Weather Mast',
      lat: 34.0555,
      lng: -118.2445,
      aqi: 55,
      pm25: 18,
      co2: 412,
      temp: 26,
      humidity: 45,
      status: 'Good',
      color: '#0284c7',
      occupancy: 'Ambient Air'
    }
  ];

  useEffect(() => {
    // Dynamic load Leaflet if not present
    let mapInstance = null;

    const initMap = () => {
      if (!window.L || !mapContainerRef.current) return;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
      }

      const campusCenter = [34.0524, -118.2435];
      const map = window.L.map(mapContainerRef.current, {
        center: campusCenter,
        zoom: 16,
        zoomControl: false,
        attributionControl: false
      });

      // Add Zoom Control at top right
      window.L.control.zoom({ position: 'topright' }).addTo(map);

      // Public tile layers without API key restrictions
      const streetTiles = window.L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 19, attribution: '&copy; OpenStreetMap' }
      );
      const satTiles = window.L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      );

      if (mapStyle === 'satellite') {
        satTiles.addTo(map);
      } else {
        streetTiles.addTo(map);
      }

      // Add building markers
      buildings.forEach((b) => {
        const isSelected = selectedRoom === b.name;
        const iconHtml = `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transform: translate(-50%, -50%);
          ">
            <div style="
              width: ${isSelected ? '38px' : '30px'};
              height: ${isSelected ? '38px' : '30px'};
              border-radius: 50%;
              background: ${b.color};
              color: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 800;
              font-size: ${isSelected ? '12px' : '10px'};
              box-shadow: 0 4px 16px ${b.color}88;
              border: 3px solid #ffffff;
              transition: transform 0.2s ease;
            ">
              ${b.aqi}
            </div>
            <div style="
              position: absolute;
              bottom: -18px;
              white-space: nowrap;
              background: rgba(15, 23, 42, 0.85);
              color: #ffffff;
              padding: 2px 6px;
              border-radius: 6px;
              font-size: 9px;
              font-weight: 700;
              pointer-events: none;
            ">
              ${b.name.split(' ')[0]}
            </div>
          </div>
        `;

        const customIcon = window.L.divIcon({
          className: 'custom-aqi-pin',
          html: iconHtml,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker = window.L.marker([b.lat, b.lng], { icon: customIcon }).addTo(map);
        marker.on('click', () => {
          setActiveBuilding(b.name);
          if (onSelectRoom) onSelectRoom(b.name);
        });

        // Heatmap circles if active
        if (showHeatmap) {
          window.L.circle([b.lat, b.lng], {
            color: b.color,
            fillColor: b.color,
            fillOpacity: 0.18,
            radius: 80,
            stroke: false
          }).addTo(map);
        }
      });

      leafletMapRef.current = map;
    };

    if (window.L) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [mapStyle, showHeatmap, selectedRoom]);

  const currentBld = buildings.find((b) => b.name === activeBuilding) || buildings[0];

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Map Header */}
      <div
        style={{
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-surface-elevated)',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="brand-icon-box" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
            <MapPin size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              Campus IoT Geospatial Air Quality Map
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Real-time Google Maps telemetry across college buildings & outdoor perimeter
            </div>
          </div>
        </div>

        {/* Map Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setMapStyle(mapStyle === 'streets' ? 'satellite' : 'streets')}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              fontSize: '0.76rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Layers size={14} /> {mapStyle === 'streets' ? 'Satellite View' : 'Street Map'}
          </button>

          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              background: showHeatmap ? 'var(--accent-emerald-light)' : 'var(--bg-surface)',
              color: showHeatmap ? 'var(--accent-emerald-dark)' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Eye size={14} /> Heatmap {showHeatmap ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Map Canvas + Telemetry Split View */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', minHeight: '380px' }}>
        {/* Leaflet/Google Map Viewport */}
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: '100%',
            minHeight: '380px',
            position: 'relative',
            background: '#e5e7eb'
          }}
        />

        {/* Selected Building Details Sidebar */}
        <div
          style={{
            padding: '20px',
            background: 'var(--bg-surface)',
            borderLeft: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px'
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Selected Campus Zone
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {currentBld.name}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              {currentBld.building} &bull; {currentBld.occupancy}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                borderRadius: '14px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                marginBottom: '14px'
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>AIR QUALITY INDEX</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: currentBld.color, lineHeight: 1 }}>
                  {currentBld.aqi}
                </div>
              </div>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: currentBld.aqi <= 50 ? 'var(--accent-emerald-light)' : 'var(--accent-amber-light)',
                  color: currentBld.aqi <= 50 ? 'var(--accent-emerald-dark)' : '#b45309'
                }}
              >
                ● {currentBld.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
              <div style={{ padding: '8px 10px', background: 'var(--bg-surface-elevated)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>PM2.5</span>
                <strong>{currentBld.pm25} µg/m³</strong>
              </div>
              <div style={{ padding: '8px 10px', background: 'var(--bg-surface-elevated)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>CO₂ Concentration</span>
                <strong>{currentBld.co2} ppm</strong>
              </div>
              <div style={{ padding: '8px 10px', background: 'var(--bg-surface-elevated)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Temperature</span>
                <strong>{currentBld.temp}°C</strong>
              </div>
              <div style={{ padding: '8px 10px', background: 'var(--bg-surface-elevated)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Relative Humidity</span>
                <strong>{currentBld.humidity}%</strong>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (onSelectRoom) onSelectRoom(currentBld.name);
            }}
            style={{
              padding: '12px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            <span>Jump to {currentBld.name} Live Controls</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
