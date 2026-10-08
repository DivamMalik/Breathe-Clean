import React, { useState } from 'react';

export default function LiveChart({ timeRange, setTimeRange, chartData }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  // SVG dimensions
  const width = 640;
  const height = 220;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 35;

  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const data = chartData && chartData.length > 0 ? chartData : [
    { time: '12:00', indoor: 38, outdoor: 52, co2: 600, temp: 26.5 },
    { time: '12:15', indoor: 40, outdoor: 54, co2: 615, temp: 26.8 },
    { time: '12:30', indoor: 45, outdoor: 58, co2: 640, temp: 27.0 },
    { time: '12:45', indoor: 42, outdoor: 55, co2: 620, temp: 27.1 },
    { time: '13:00', indoor: 39, outdoor: 53, co2: 610, temp: 27.0 },
  ];

  const n = data.length;

  // Scales
  // AQI max is ~300 on Y-axis
  const maxY = 300;
  const getY = (val) => padTop + innerH - (Math.min(val, maxY) / maxY) * innerH;
  const getX = (i) => padLeft + (i / Math.max(1, n - 1)) * innerW;

  // Build SVG path generator (smooth curve)
  const createPath = (key, scaleFactor = 1) => {
    if (n === 0) return '';
    const points = data.map((d, i) => ({
      x: getX(i),
      y: getY(d[key] * scaleFactor)
    }));

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const mx = (p0.x + p1.x) / 2;
      path += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const createAreaPath = (key, scaleFactor = 1) => {
    const linePath = createPath(key, scaleFactor);
    if (!linePath) return '';
    const lastX = getX(n - 1);
    const firstX = getX(0);
    const bottomY = padTop + innerH;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  // Series definitions
  // CO2 is divided by 3 to scale nicely onto the 0-300 axis (e.g. 600 ppm -> 200 on chart)
  // Temp is multiplied by 4 (27 -> 108)
  const indoorPath = createPath('indoor');
  const outdoorPath = createPath('outdoor');
  const co2Path = createPath('co2', 1 / 3);
  const tempPath = createPath('temp', 4);

  const indoorArea = createAreaPath('indoor');

  const yTicks = [0, 100, 200, 300];

  const hoveredItem = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : null;

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title-box">
          <div className="chart-title">Sensor Data (Live)</div>
          <div className="chart-subtitle">Continuous multi-sensor telemetry stream</div>
        </div>

        <div className="chart-filter-pills">
          {['1H', '6H', '24H', '7D'].map((range) => (
            <button
              key={range}
              className={`filter-btn ${timeRange === range ? 'active' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="svg-chart-container">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="chart-svg"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width * width;
            if (relX >= padLeft && relX <= width - padRight) {
              const idx = Math.round(((relX - padLeft) / innerW) * (n - 1));
              setHoverIndex(Math.max(0, Math.min(n - 1, idx)));
            }
          }}
        >
          <defs>
            <linearGradient id="indoorGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines */}
          {yTicks.map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="var(--border-color)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  fill="var(--text-muted)"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="var(--font-mono)"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={indoorArea} fill="url(#indoorGrad)" />

          {/* Lines */}
          <path d={outdoorPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
          <path d={indoorPath} fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
          <path d={co2Path} fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
          <path d={tempPath} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />

          {/* X Axis Time Labels */}
          {data.map((d, i) => {
            // Show every few labels or first and last
            if (i % Math.ceil(n / 5) === 0 || i === n - 1) {
              const x = getX(i);
              return (
                <text
                  key={i}
                  x={x}
                  y={height - 8}
                  fill="var(--text-muted)"
                  fontSize="10.5"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                >
                  {d.time}
                </text>
              );
            }
            return null;
          })}

          {/* Hover Crosshair & Indicators */}
          {hoverIndex !== null && hoveredItem && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padTop}
                x2={getX(hoverIndex)}
                y2={padTop + innerH}
                stroke="var(--text-muted)"
                strokeDasharray="2 2"
                strokeWidth="1.5"
              />
              {/* Highlight Dots */}
              <circle cx={getX(hoverIndex)} cy={getY(hoveredItem.outdoor)} r="4.5" fill="#10b981" stroke="#fff" strokeWidth="2" />
              <circle cx={getX(hoverIndex)} cy={getY(hoveredItem.indoor)} r="4.5" fill="#0284c7" stroke="#fff" strokeWidth="2" />
              <circle cx={getX(hoverIndex)} cy={getY(hoveredItem.co2 / 3)} r="4.5" fill="#f59e0b" stroke="#fff" strokeWidth="2" />
              <circle cx={getX(hoverIndex)} cy={getY(hoveredItem.temp * 4)} r="4.5" fill="#ef4444" stroke="#fff" strokeWidth="2" />
            </g>
          )}
        </svg>

        {/* Floating Tooltip Box */}
        {hoveredItem && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '16px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              padding: '8px 12px',
              borderRadius: '10px',
              boxShadow: 'var(--shadow-md)',
              fontSize: '11px',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              pointerEvents: 'none'
            }}
          >
            <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{hoveredItem.time}</div>
            <div style={{ color: '#0284c7' }}>Indoor AQI: <strong>{hoveredItem.indoor}</strong></div>
            <div style={{ color: '#10b981' }}>Outdoor AQI: <strong>{hoveredItem.outdoor}</strong></div>
            <div style={{ color: '#f59e0b' }}>CO₂: <strong>{hoveredItem.co2} ppm</strong></div>
            <div style={{ color: '#ef4444' }}>Temp: <strong>{hoveredItem.temp}°C</strong></div>
          </div>
        )}
      </div>

      <div className="chart-legend-row">
        <div className="legend-series-item">
          <span className="legend-color-line" style={{ background: '#0284c7' }} />
          <span>Indoor AQI</span>
        </div>
        <div className="legend-series-item">
          <span className="legend-color-line" style={{ background: '#10b981' }} />
          <span>Outdoor AQI</span>
        </div>
        <div className="legend-series-item">
          <span className="legend-color-line" style={{ background: '#f59e0b' }} />
          <span>CO₂ (ppm)</span>
        </div>
        <div className="legend-series-item">
          <span className="legend-color-line" style={{ background: '#ef4444' }} />
          <span>Temperature (°C)</span>
        </div>
      </div>
    </div>
  );
}
