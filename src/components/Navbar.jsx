import React from 'react'

const TABS = [
  { id: 'explore',    label: 'Explore',      icon: '⊞' },
  { id: 'fundhouses', label: 'Fund Houses',  icon: '🏛' },
  { id: 'compare',    label: 'Compare',      icon: '⇄' },
  { id: 'sip',        label: 'SIP Calc',     icon: '∑' },
  { id: 'returns',    label: 'Returns',      icon: '↗' },
]

export default function Navbar({ active, onTab, compareCount }) {
  return (
    <nav style={{
      background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)', padding: '0 24px',
      height: 56, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 200,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, var(--accent) 0%, #7b5ea7 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700, color: '#fff',
        }}>◎</div>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 300, letterSpacing: '-0.3px', color: 'var(--text)', fontStyle: 'italic' }}>FundRadar</span>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--accent)', background: 'var(--accent-bg)', padding: '2px 7px', borderRadius: 99, textTransform: 'uppercase' }}>INDIA</span>
      </div>

      <div style={{ display: 'flex', gap: 2 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => onTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8, border: 'none',
            background: active === t.id ? 'var(--accent-bg)' : 'transparent',
            color: active === t.id ? 'var(--accent2)' : 'var(--text2)',
            fontFamily: 'var(--font-body)', fontSize: 13,
            fontWeight: active === t.id ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: 14 }}>{t.icon}</span>
            {t.label}
            {t.id === 'compare' && compareCount > 0 && (
              <span style={{ background: 'var(--red)', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>{compareCount}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text3)' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite', display: 'inline-block' }} />
        Live AMFI data
      </div>
    </nav>
  )
}
