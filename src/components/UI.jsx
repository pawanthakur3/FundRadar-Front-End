import React from 'react'

/* ── Category badge ── */
const CAT_STYLES = {
  Equity: { bg: 'rgba(79,124,255,0.15)', color: '#7b9fff' },
  Debt:   { bg: 'rgba(62,207,142,0.15)', color: '#3ecf8e' },
  Hybrid: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
  Other:  { bg: 'rgba(148,148,168,0.15)', color: '#9998a8' },
}

export function Badge({ cat }) {
  const s = CAT_STYLES[cat] || CAT_STYLES.Other
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
      display: 'inline-block', whiteSpace: 'nowrap',
    }}>{cat}</span>
  )
}

/* ── Star rating ── */
export function Stars({ n }) {
  return (
    <span style={{ fontSize: 12, letterSpacing: 1 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < n ? '#fbbf24' : '#2a2a3a' }}>★</span>
      ))}
    </span>
  )
}

/* ── Return % cell ── */
export function RetCell({ v }) {
  if (v === null || v === undefined) return <span style={{ color: 'var(--text3)' }}>—</span>
  const pos = v >= 0
  return (
    <span style={{ color: pos ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
      {pos ? '+' : ''}{v}%
    </span>
  )
}

/* ── Risk pill ── */
const RISK_COLOR = { Low: 'var(--green)', Moderate: 'var(--amber)', High: 'var(--red)' }
export function RiskPill({ r }) {
  return <span style={{ color: RISK_COLOR[r] || 'var(--text2)', fontWeight: 500 }}>{r}</span>
}

/* ── Loading spinner ── */
export function Spinner({ size = 24, color = 'var(--accent)' }) {
  return (
    <svg className="spin" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  )
}

/* ── Empty state ── */
export function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.2 }}>{icon}</div>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ color: 'var(--text2)', fontSize: 13 }}>{subtitle}</div>}
    </div>
  )
}

/* ── Card wrapper ── */
export function Card({ children, style = {}, className = '' }) {
  return (
    <div className={className} style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      ...style,
    }}>
      {children}
    </div>
  )
}
