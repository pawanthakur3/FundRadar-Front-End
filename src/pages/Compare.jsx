import React from 'react'
import { Badge, Stars, RetCell, RiskPill, EmptyState } from '../components/UI'
import { fmt } from '../utils/funds'

export default function Compare({ compareList, onRemove }) {
  const slots = [0, 1, 2].map(i => compareList[i] || null)

  const best = (vals, higher = true) => {
    const nums = vals.map(v => v !== null && v !== undefined ? parseFloat(v) : null)
    const valid = nums.filter(n => n !== null && isFinite(n))
    if (!valid.length) return nums.map(() => false)
    const ext = higher ? Math.max(...valid) : Math.min(...valid)
    return nums.map(n => n !== null && isFinite(n) && n === ext)
  }

  /* Helper — pick best Sharpe (higher is better, ignore nulls) */
  const bestSharpe = (vals) => {
    const nums = vals.map(v => v !== null && v !== undefined ? parseFloat(v) : null)
    const valid = nums.filter(n => n !== null)
    if (!valid.length) return nums.map(() => false)
    const max = Math.max(...valid)
    return nums.map(n => n !== null && n === max)
  }

  const rows = compareList.length ? [
    { label: 'Fund house',    vals: compareList.map(f => f.amcName || '—') },
    { label: 'Category',      vals: compareList.map(f => <Badge cat={f.category} />) },
    { label: 'NAV',           vals: compareList.map(f => `₹${fmt(f.nav)}`) },
    { label: '1Y returns',    vals: compareList.map(f => <RetCell v={f.ret1y} />), nums: compareList.map(f=>f.ret1y), higher: true },
    { label: '3Y returns',    vals: compareList.map(f => <RetCell v={f.ret3y} />), nums: compareList.map(f=>f.ret3y), higher: true },
    { label: '5Y returns',    vals: compareList.map(f => <RetCell v={f.ret5y} />), nums: compareList.map(f=>f.ret5y), higher: true },
    { label: 'AUM',           vals: compareList.map(f => `₹${f.aum.toLocaleString('en-IN')} Cr`) },
    { label: 'Expense ratio', vals: compareList.map(f => `${f.expense}%`), nums: compareList.map(f=>parseFloat(f.expense)), higher: false },
    { label: 'Star rating',   vals: compareList.map(f => <Stars n={f.stars} />), nums: compareList.map(f=>f.stars), higher: true },
    { label: 'Sharpe ratio',  vals: compareList.map(f => f.returns?.sharpe ?? f.ret1y !== undefined ? (f.returns?.sharpe ?? '—') : '—'), nums: compareList.map(f => f.returns?.sharpe ?? null), higher: true },
    { label: 'Risk',          vals: compareList.map(f => <RiskPill r={f.risk} />) },
  ] : []

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 40px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 26, marginBottom: 4 }}>Compare funds</h2>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>
          Add funds from the <strong style={{ color: 'var(--accent2)' }}>Explore</strong> tab using the <strong style={{ color: 'var(--accent2)' }}>+ Add</strong> button · Up to 3 funds · Best values highlighted ★
        </p>
      </div>

      {/* Slots */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {slots.map((f, i) => (
          <div key={i} style={{
            background: 'var(--bg2)', border: `1px ${f ? 'solid' : 'dashed'} ${f ? 'var(--border2)' : 'var(--border)'}`,
            borderRadius: 14, padding: 16, minHeight: 90,
            display: 'flex', flexDirection: 'column',
            justifyContent: f ? 'flex-start' : 'center', alignItems: f ? 'flex-start' : 'center',
          }}>
            {f ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
                  <Badge cat={f.category} />
                  <button onClick={() => onRemove(f.schemeCode)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 18, padding: '0 2px', lineHeight: 1 }}>✕</button>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 4 }}>{f.schemeName}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>{f.amcName}</div>
              </>
            ) : (
              <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', lineHeight: 1.5 }}>
                <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.2 }}>＋</div>
                Go to <strong>Explore</strong><br />and click <strong>+ Add</strong>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Comparison table */}
      {compareList.length === 0 ? (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16 }}>
          <EmptyState icon="⇄" title="No funds selected yet"
            subtitle='Go to Explore → click "+ Add" on any fund · Up to 3 funds can be compared' />
        </div>
      ) : (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, background: 'var(--bg3)', width: 130 }}>Metric</th>
                  {slots.map((f, i) => (
                    <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, background: 'var(--bg3)', color: f ? 'var(--text)' : 'var(--text3)' }}>
                      {f ? <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 210 }} title={f.schemeName}>{f.schemeName.length > 30 ? f.schemeName.slice(0,30)+'…' : f.schemeName}</span> : '—'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => {
                  const bests = row.nums ? best(row.nums, row.higher) : []
                  return (
                    <tr key={ri} style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding: '11px 14px', fontSize: 12, fontWeight: 500, color: 'var(--text3)' }}>{row.label}</td>
                      {slots.map((f, i) => (
                        <td key={i} style={{ padding: '11px 14px', fontSize: 13 }}>
                          {f ? (
                            <span style={row.nums && bests[i] ? { fontWeight: 700, color: 'var(--green)' } : {}}>
                              {row.vals[i]}
                              {row.nums && bests[i] && <span style={{ fontSize: 10, marginLeft: 5, color: 'var(--green)' }}>★ best</span>}
                            </span>
                          ) : <span style={{ color: 'var(--text3)' }}>—</span>}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
