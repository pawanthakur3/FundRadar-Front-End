import React, { useState, useMemo } from 'react'
import { Spinner, EmptyState } from '../components/UI'

function fmtCr(n) {
  if (n >= 10000000) return `₹${(n/10000000).toFixed(1)}L Cr`
  if (n >= 100000)   return `₹${(n/100000).toFixed(0)} Cr`
  return `₹${n.toLocaleString('en-IN')} Cr`
}

const CAT_COLOR = { Equity: '#4f7cff', Debt: '#3ecf8e', Hybrid: '#fbbf24', Other: '#9998a8' }

export default function FundHouses({ funds, loading, onViewFunds }) {
  const [search,   setSearch]   = useState('')
  const [expanded, setExpanded] = useState(null)
  const [sort,     setSort]     = useState('funds') // funds | aum | name

  /* Group funds by AMC */
  const houses = useMemo(() => {
    const map = {}
    funds.forEach(f => {
      const amc = f.amcName || 'Unknown'
      if (!map[amc]) map[amc] = { name: amc, funds: [], totalAum: 0, cats: {} }
      map[amc].funds.push(f)
      map[amc].totalAum += (typeof f.aum === 'number' ? f.aum : 0)
      map[amc].cats[f.category] = (map[amc].cats[f.category] || 0) + 1
    })
    return Object.values(map)
  }, [funds])

  const filtered = useMemo(() => {
    let res = houses
    if (search) res = res.filter(h => h.name.toLowerCase().includes(search.toLowerCase()))
    res.sort((a, b) => {
      if (sort === 'name')  return a.name.localeCompare(b.name)
      if (sort === 'aum')   return b.totalAum - a.totalAum
      return b.funds.length - a.funds.length
    })
    return res
  }, [houses, search, sort])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80, gap: 14 }}>
      <Spinner size={36} /><span style={{ color: 'var(--text2)', fontSize: 13 }}>Loading fund houses…</span>
    </div>
  )

  const selStyle = { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px', height: 36, color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none', cursor: 'pointer' }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 40px' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: '24px 28px', marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 300, fontStyle: 'italic', marginBottom: 6, background: 'linear-gradient(135deg, var(--text) 0%, var(--accent2) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Fund Houses
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>
          {filtered.length} fund houses · Click a house to see its funds · Expand to browse schemes
        </p>
        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          {[
            { label: 'Total fund houses', val: houses.length },
            { label: 'Total active funds', val: funds.length.toLocaleString('en-IN') },
          ].map((s,i) => (
            <div key={i} style={{ background: 'var(--bg3)', borderRadius: 10, padding: '10px 16px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent2)' }}>{s.val}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }}>⊕</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search fund house…"
            style={{ ...selStyle, width: '100%', paddingLeft: 30, cursor: 'text' }} />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} style={selStyle}>
          <option value="funds">Sort: Most funds</option>
          <option value="aum">Sort: Highest AUM</option>
          <option value="name">Sort: Name A–Z</option>
        </select>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <EmptyState icon="🏛" title="No fund houses found" subtitle="Try a different search" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(house => {
            const isExp = expanded === house.name
            const topFunds = [...house.funds].sort((a,b) => b.ret3y - a.ret3y).slice(0, 5)
            const equityCount = house.cats['Equity'] || 0
            const debtCount   = house.cats['Debt']   || 0
            const hybridCount = house.cats['Hybrid'] || 0

            return (
              <div key={house.name} style={{ background: 'var(--bg2)', border: `1px solid ${isExp ? 'var(--border2)' : 'var(--border)'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.15s' }}>
                {/* House header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', cursor: 'pointer' }}
                  onClick={() => setExpanded(isExp ? null : house.name)}>

                  {/* Icon */}
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg4)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {house.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{house.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{house.funds.length} active schemes</div>
                  </div>

                  {/* Category breakdown */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {[['Equity', equityCount], ['Debt', debtCount], ['Hybrid', hybridCount]].map(([c, n]) => n > 0 && (
                      <span key={c} style={{ fontSize: 11, fontWeight: 600, color: CAT_COLOR[c], background: `${CAT_COLOR[c]}18`, padding: '2px 8px', borderRadius: 99 }}>
                        {c} {n}
                      </span>
                    ))}
                  </div>

                  {/* AUM */}
                  {house.totalAum > 0 && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{fmtCr(house.totalAum)}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>Total AUM</div>
                    </div>
                  )}

                  {/* Expand / View buttons */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => onViewFunds(house.name)} style={{
                      padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                      border: '1px solid var(--accent)', background: 'var(--accent-bg)',
                      color: 'var(--accent2)', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
                    }}>View all →</button>
                    <button onClick={() => setExpanded(isExp ? null : house.name)} style={{
                      padding: '5px 10px', borderRadius: 7, fontSize: 13,
                      border: '1px solid var(--border2)', background: 'var(--bg3)',
                      color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                    }}>{isExp ? '▲' : '▼'}</button>
                  </div>
                </div>

                {/* Expanded fund list */}
                {isExp && (
                  <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg3)' }}>
                    <div style={{ padding: '10px 20px 6px', fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Top {topFunds.length} funds by 3Y returns
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Fund name','Category','NAV','1Y ret','3Y ret','Risk'].map((h,i) => (
                            <th key={i} style={{ padding: '7px 14px', textAlign: 'left', fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid var(--border)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {topFunds.map(f => (
                          <tr key={f.schemeCode}
                            onMouseEnter={e => e.currentTarget.style.background='var(--bg4)'}
                            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                            <td style={{ padding: '9px 14px', fontSize: 13, fontWeight: 500, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.schemeName}>{f.schemeName}</td>
                            <td style={{ padding: '9px 14px' }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: CAT_COLOR[f.category], background: `${CAT_COLOR[f.category]}18`, padding: '2px 7px', borderRadius: 99 }}>{f.category}</span>
                            </td>
                            <td style={{ padding: '9px 14px', fontSize: 13 }}>₹{parseFloat(f.nav).toLocaleString('en-IN')}</td>
                            <td style={{ padding: '9px 14px', fontSize: 13, color: f.ret1y >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>{f.ret1y >= 0 ? '+' : ''}{f.ret1y}%</td>
                            <td style={{ padding: '9px 14px', fontSize: 13, color: f.ret3y >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>{f.ret3y >= 0 ? '+' : ''}{f.ret3y}%</td>
                            <td style={{ padding: '9px 14px', fontSize: 12, color: f.risk === 'High' ? 'var(--red)' : f.risk === 'Low' ? 'var(--green)' : 'var(--amber)' }}>{f.risk}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)' }}>
                      <button onClick={() => onViewFunds(house.name)} style={{
                        padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        border: 'none', background: 'var(--accent)', color: '#fff',
                        cursor: 'pointer', fontFamily: 'var(--font-body)',
                      }}>
                        View all {house.funds.length} funds from {house.name} →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
