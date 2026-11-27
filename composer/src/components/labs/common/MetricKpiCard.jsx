import React from 'react';

export default function MetricKpiCard({ label, value, subtext, subvalue, highlight, status, icon }) {
  const text = subtext ?? subvalue;
  const colorClass = highlight || (status === 'optimal' ? 'emerald' : status === 'warning' ? 'amber' : status === 'info' ? 'cyan' : 'cyan');
  return (
    <div className="lab-kpi-box">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="lab-kpi-label">{label}</span>
        {icon && <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{icon}</span>}
      </div>
      <div className={`lab-kpi-value ${colorClass}`}>{value}</div>
      {text && (
        <span style={{ fontSize: '0.64rem', color: 'var(--lab-text-muted)' }}>
          {text}
        </span>
      )}
    </div>
  );
}

