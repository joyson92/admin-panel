import React from 'react';
import { Activity, Plus } from 'lucide-react';

export default function BrandPanel() {
  return (
    <section className="login-brand-panel">
      <div className="brand-panel-overlay" />
      <div className="brand-panel-content">
        <div className="login-brand-lockup">
          <span className="login-brand-symbol"><Plus size={25} strokeWidth={4} /></span>
          <span>TA</span>
        </div>
        <div className="brand-copy">
          <p className="brand-eyebrow">Daily operations platform</p>
          <h1>Time & Attendance</h1>
          {/* <p>Real-time hospital operations, interactive patient journey tracking, and modern vitals telemetry at your fingertips.</p> */}
        </div>
        <div className="brand-metrics">
          <div><strong>100%</strong><span>SAAS READY</span></div>
          <div><strong>&lt; 50ms</strong><span>LATENCY</span></div>
        </div>
        <div className="brand-panel-foot"><Activity size={15} /> Connected care. Clearer decisions.</div>
      </div>
    </section>
  );
}
