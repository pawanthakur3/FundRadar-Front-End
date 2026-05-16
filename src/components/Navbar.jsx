import React, { useState } from 'react'

const TABS = [
  { id: 'explore',    label: 'Explore',      icon: '⊞', section: 'main' },
  { id: 'fundhouses', label: 'Fund Houses',  icon: '🏛', section: 'main' },
  { id: 'watchlist',  label: 'Watchlist',    icon: '★',  section: 'main' },
  { id: 'compare',    label: 'Compare',      icon: '⇄',  section: 'tools' },
  { id: 'overlap',    label: 'Overlap',      icon: '◎',  section: 'tools' },
  { id: 'sip',        label: 'SIP Calc',     icon: '∑',  section: 'tools' },
  { id: 'returns',    label: 'Returns',      icon: '↗',  section: 'tools' },
  { id: 'tax',        label: 'Tax Calc',     icon: '₹',  section: 'tools' },
]

export default function Sidebar({ active, onTab, compareCount, watchCount = 0, onCollapse }) {
  const [collapsed, setCollapsed] = useState(false)
  const toggle = () => {
    setCollapsed(c => {
      const next = !c
      onCollapse && onCollapse(next)
      return next
    })
  }

  const w = collapsed ? 64 : 220

  const navBtn = (t) => {
    const isActive = active === t.id
    return (
      <button key={t.id} onClick={() => onTab(t.id)} title={collapsed ? t.label : ''} style={{
        display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
        justifyContent: collapsed ? 'center' : 'flex-start',
        width: '100%', padding: collapsed ? '10px 0' : '9px 14px',
        borderRadius: 10, border: 'none',
        background: isActive ? 'var(--accent-bg)' : 'transparent',
        color: isActive ? 'var(--accent2)' : 'var(--text2)',
        fontFamily: 'var(--font-body)', fontSize: 13,
        fontWeight: isActive ? 600 : 400,
        cursor: 'pointer', transition: 'all 0.15s',
        position: 'relative', marginBottom: 2,
        textAlign: 'left',
      }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background='var(--bg3)'; e.currentTarget.style.color='var(--text)' }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background='transparent'; e.currentTarget.style.color=isActive?'var(--accent2)':'var(--text2)' }}
      >
        {/* Active indicator bar */}
        {isActive && (
          <span style={{
            position: 'absolute', left: 0, top: '20%', bottom: '20%',
            width: 3, borderRadius: '0 3px 3px 0',
            background: 'var(--accent)',
          }} />
        )}
        <span style={{ fontSize: 17, lineHeight: 1, flexShrink: 0, width: 20, textAlign: 'center' }}>{t.icon}</span>
        {!collapsed && <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</span>}
        {!collapsed && t.id === 'compare' && compareCount > 0 && (
          <span style={{ background: 'var(--red)', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '1px 6px', marginLeft: 'auto' }}>{compareCount}</span>
        )}
        {!collapsed && t.id === 'watchlist' && watchCount > 0 && (
          <span style={{ background: '#BA7517', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '1px 6px', marginLeft: 'auto' }}>{watchCount}</span>
        )}
        {collapsed && t.id === 'compare' && compareCount > 0 && (
          <span style={{ position: 'absolute', top: 6, right: 6, background: 'var(--red)', color: '#fff', borderRadius: 99, fontSize: 9, fontWeight: 700, padding: '0 4px', lineHeight: '14px' }}>{compareCount}</span>
        )}
        {collapsed && t.id === 'watchlist' && watchCount > 0 && (
          <span style={{ position: 'absolute', top: 6, right: 6, background: '#BA7517', color: '#fff', borderRadius: 99, fontSize: 9, fontWeight: 700, padding: '0 4px', lineHeight: '14px' }}>{watchCount}</span>
        )}
      </button>
    )
  }

  const mainTabs  = TABS.filter(t => t.section === 'main')
  const toolsTabs = TABS.filter(t => t.section === 'tools')

  return (
    <aside style={{
      width: w, minHeight: '100vh', flexShrink: 0,
      background: 'var(--bg2)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, bottom: 0,
      zIndex: 200, transition: 'width 0.2s ease',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 0' : '20px 16px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: 8, flexShrink: 0,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent) 0%, #7b5ea7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, color: '#fff',
            }}>◎</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 300, fontStyle: 'italic', color: 'var(--text)', whiteSpace: 'nowrap' }}>FundRadar</div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: 'var(--accent)', textTransform: 'uppercase', marginTop: 1 }}>India</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent) 0%, #7b5ea7 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 700, color: '#fff',
          }}>◎</div>
        )}
        <button onClick={toggle} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text3)', fontSize: 16, padding: 4,
          borderRadius: 6, lineHeight: 1, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, padding: collapsed ? '12px 8px' : '12px 10px', overflowY: 'auto', overflowX: 'hidden' }}>
        {/* Section: Browse */}
        {!collapsed && (
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, paddingLeft: 6 }}>Browse</div>
        )}
        {mainTabs.map(navBtn)}

        {!collapsed && (
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, margin: '16px 0 6px', paddingLeft: 6 }}>Tools</div>
        )}
        {collapsed && <div style={{ height: 12 }} />}
        {toolsTabs.map(navBtn)}
      </div>

      {/* Live indicator + footer */}
      <div style={{
        padding: collapsed ? '12px 0' : '12px 16px',
        borderTop: '1px solid var(--border)', flexShrink: 0,
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 6,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite', display: 'inline-block', flexShrink: 0 }} />
        {!collapsed && <span style={{ fontSize: 11, color: 'var(--text3)' }}>Live AMFI data</span>}
      </div>
    </aside>
  )
}
