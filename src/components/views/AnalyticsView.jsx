import React from 'react';
import { Download, Zap, Activity, ShieldCheck } from 'lucide-react';
import LiveChart from '../LiveChart';

export default function AnalyticsView({
  timeRange,
  setTimeRange,
  chartData,
  addActivity
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Environmental Efficiency & Compliance Analytics</h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Continuous telemetry logs, energy savings from Eco Standby, and ASHRAE performance
          </p>
        </div>
        <button
          className="btn-demo-pill btn-reset"
          onClick={() => {
            addActivity('Exported full air quality compliance report (PDF)', 'blue');
            alert('Audit Export Generated:\nFull 30-day ASHRAE 62.1 indoor telemetry & energy savings audit exported to PDF/CSV.');
          }}
        >
          <Download size={14} /> Export CSV / PDF Audit
        </button>
      </div>

      {/* Energy & Efficiency Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        <div style={{ padding: '20px', borderRadius: '18px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 700, fontSize: '0.82rem' }}>
            <Zap size={16} /> Eco Standby Energy Saved
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '6px' }}>42.8 kWh</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Purifier turned OFF when air is clean (Image 2 logic)</div>
        </div>

        <div style={{ padding: '20px', borderRadius: '18px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7', fontWeight: 700, fontSize: '0.82rem' }}>
            <Activity size={16} /> Clean Air Delivery Rate (CADR)
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '6px' }}>480 m³/h</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Zero high-particulate incidents recorded</div>
        </div>

        <div style={{ padding: '20px', borderRadius: '18px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b5cf6', fontWeight: 700, fontSize: '0.82rem' }}>
            <ShieldCheck size={16} /> HEPA H14 Filter Life
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '6px' }}>94% Intact</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>142 days remaining before replacement</div>
        </div>
      </div>

      {/* Chart */}
      <LiveChart
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        chartData={chartData}
      />
    </div>
  );
}
