import React from 'react';
import { Cpu, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function AutomationView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>AI Autonomous Rule Engine</h2>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Configured IF-THEN triggers, ASHRAE safety automation, and explainable decision paths
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ padding: '18px 22px', borderRadius: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#10b981' }}>RULE 1: High Outdoor Particulates Shield</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              <strong>IF</strong> Outdoor AQI &gt; 120 <strong>THEN</strong> Close smart windows immediately, set Purifier to Turbo, and switch HVAC to recirculation.
            </div>
          </div>
          <span className="kpi-badge badge-good">Active</span>
        </div>

        <div style={{ padding: '18px 22px', borderRadius: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0284c7' }}>RULE 2: Carbon Dioxide Alertness Flush</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              <strong>IF</strong> Indoor CO₂ &gt; 800 ppm <strong>THEN</strong> Increase ventilation to 75% and open windows (if outdoor air is safe) to flush fresh oxygen.
            </div>
          </div>
          <span className="kpi-badge badge-good">Active</span>
        </div>

        <div style={{ padding: '18px 22px', borderRadius: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#8b5cf6' }}>RULE 3: Eco Standby Power Saver (Image 2 Logic)</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              <strong>IF</strong> Indoor AQI ≤ 50 AND Outdoor AQI &lt; 80 <strong>THEN</strong> Switch Air Purifier to OFF (Eco Standby) to conserve power while enjoying clean natural breeze.
            </div>
          </div>
          <span className="kpi-badge badge-good">Active</span>
        </div>

        <div style={{ padding: '18px 22px', borderRadius: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f59e0b' }}>RULE 4: Night-Time Thermal Purge & Damper Economizer</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              <strong>IF</strong> Outdoor Temp &lt; Indoor Temp - 3°C AND Outdoor AQI &lt; 50 <strong>THEN</strong> Open economizer bypass louvers for 100% natural free-cooling.
            </div>
          </div>
          <span className="kpi-badge badge-good">Active</span>
        </div>
      </div>
    </div>
  );
}
