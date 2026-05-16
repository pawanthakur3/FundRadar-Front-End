import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Badge, Spinner, EmptyState } from '../components/UI'

/* Simulated top-10 holdings per fund derived deterministically from scheme code.
   In production, replace with real holdings from mfapi or AMFI.                */
const STOCK_UNIVERSE = [
  'HDFC Bank','Reliance Industries','ICICI Bank','Infosys','TCS',
  'Axis Bank','SBI','Bajaj Finance','Kotak Mahindra Bank','Larsen & Toubro',
  'HCL Technologies','Wipro','Maruti Suzuki','Titan','Asian Paints',
  'ITC','Hindustan Unilever','Bharti Airtel','Nestle India','Sun Pharma',
  'Tech Mahindra','Ultratech Cement','Adani Ports','Power Grid','NTPC',
  'Coal India','ONGC','Tata Motors','Mahindra & Mahindra','Divis Labs',
  'Cipla','Dr. Reddys','Grasim','JSW Steel','Tata Steel',
  'IndusInd Bank','BPCL','Eicher Motors','Hero MotoCorp','Shree Cement',
  'Pidilite Industries','Dabur','Berger Paints','Godrej Consumer','Britannia',
  'Page Industries','SBI Life','HDFC Life','Bajaj Finserv','Muthoot Finance',
]

function getHoldings(schemeCode, category) {
  const h = Math.abs(String(schemeCode).split('').reduce((a,c) => a*31+c.charCodeAt(0), 0))
  const count = 10
  const holdings = []
  const used = new Set()
  let seed = h

  /* Equity funds hold stocks, Debt holds bonds (simulated as different names) */
  const universe = category === 'Debt'
    ? STOCK_UNIVERSE.map(s => s + ' Bond') : STOCK_UNIVERSE

  for (let i = 0; i < count; i++) {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff
    const idx = Math.abs(seed) % universe.length
    if (!used.has(idx)) {
      used.add(idx)
      const weight = parseFloat((15 - i * 1.2 + ((Math.abs(seed) % 30) / 10)).toFixed(1))
      holdings.push({ name: universe[idx], weight: Math.max(1, weight) })
    } else {
      i-- // retry
    }
    if (holdings.length >= count) break
  }

  /* Normalise weights to ~100% */
  const total = holdings.reduce((s,h) => s + h.weight, 0)
  return holdings.map(h => ({ ...h, weight: parseFloat((h.weight/total*100).toFixed(1)) }))
    .sort((a,b) => b.weight - a.weight)
}

function FundPicker({ funds, selected, onSelect, onRemove, label, color }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef()

  const results = useMemo(() => {
    if (!q || q.length < 2) return []
    const lq = q.toLowerCase()
    return funds.filter(f =>
      f.schemeName.toLowerCase().includes(lq) || f.amcName.toLowerCase().includes(lq)
    ).filter(f => !selected.some(s => s.schemeCode === f.schemeCode)).slice(0, 8)
  }, [q, funds, selected])

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const inp = {
    width: '100%', height: 36, padding: '0 10px 0 28px', borderRadius: 8,
    border: `1px solid ${color}40`, background: 'var(--bg3)',
    color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none',
  }

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{label}</div>

      {/* Selected funds */}
      {selected.map(f => (
        <div key={f.schemeCode} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: `${color}14`, border: `1px solid ${color}40`, borderRadius: 8, padding: '8px 10px', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>{f.schemeName}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{f.amcName}</div>
          </div>
          <button onClick={() => onRemove(f.schemeCode)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16, padding: '0 0 0 6px', flexShrink: 0, marginTop: 1 }}>✕</button>
        </div>
      ))}

      {/* Search */}
      {selected.length < 3 && (
        <div ref={ref} style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 14, pointerEvents: 'none' }}>⊕</span>
          <input value={q} onChange={e => { setQ(e.target.value); setOpen(true) }}
            onFocus={() => results.length && setOpen(true)}
            placeholder={`Add fund ${selected.length + 1}…`} style={inp} />
          {open && results.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', maxHeight: 240, overflowY: 'auto', marginTop: 4 }}>
              {results.map(f => (
                <div key={f.schemeCode}
                  onClick={() => { onSelect(f); setQ(''); setOpen(false) }}
                  style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--bg4)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.schemeName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 1 }}>{f.amcName}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Overlap({ funds }) {
  const [groupA, setGroupA] = useState([])
  const [groupB, setGroupB] = useState([])

  const addA = f => setGroupA(p => p.find(x => x.schemeCode===f.schemeCode) ? p : [...p, f])
  const addB = f => setGroupB(p => p.find(x => x.schemeCode===f.schemeCode) ? p : [...p, f])
  const remA = code => setGroupA(p => p.filter(f => f.schemeCode !== code))
  const remB = code => setGroupB(p => p.filter(f => f.schemeCode !== code))

  /* Compute combined holdings for each group */
  const holdingsA = useMemo(() => {
    if (!groupA.length) return {}
    const map = {}
    groupA.forEach(f => {
      const h = getHoldings(f.schemeCode, f.category)
      h.forEach(s => { map[s.name] = (map[s.name]||0) + s.weight / groupA.length })
    })
    return map
  }, [groupA])

  const holdingsB = useMemo(() => {
    if (!groupB.length) return {}
    const map = {}
    groupB.forEach(f => {
      const h = getHoldings(f.schemeCode, f.category)
      h.forEach(s => { map[s.name] = (map[s.name]||0) + s.weight / groupB.length })
    })
    return map
  }, [groupB])

  const overlap = useMemo(() => {
    if (!groupA.length || !groupB.length) return null
    const common = []
    for (const stock of Object.keys(holdingsA)) {
      if (holdingsB[stock]) {
        common.push({
          name:    stock,
          weightA: parseFloat(holdingsA[stock].toFixed(1)),
          weightB: parseFloat(holdingsB[stock].toFixed(1)),
          minWeight: Math.min(holdingsA[stock], holdingsB[stock]),
        })
      }
    }
    common.sort((a,b) => b.minWeight - a.minWeight)

    const overlapPct = common.reduce((s,c) => s + c.minWeight, 0)
    const uniqueA    = Object.keys(holdingsA).filter(s => !holdingsB[s])
    const uniqueB    = Object.keys(holdingsB).filter(s => !holdingsA[s])

    return { common, overlapPct: Math.min(100, overlapPct).toFixed(1), uniqueA, uniqueB }
  }, [holdingsA, holdingsB, groupA, groupB])

  const overlapColor = overlap
    ? parseFloat(overlap.overlapPct) > 60 ? '#f87171'
      : parseFloat(overlap.overlapPct) > 30 ? '#fbbf24' : '#3ecf8e'
    : 'var(--text3)'

  const card = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 40px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 26, marginBottom: 4 }}>Portfolio Overlap</h2>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>
          See how much any two funds share in common · High overlap = less diversification · Free, no login
        </p>
      </div>

      {/* Fund pickers */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <FundPicker funds={funds} selected={groupA} onSelect={addA} onRemove={remA}
            label="Portfolio A (up to 3 funds)" color="#4f7cff" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 28, gap: 4 }}>
            <div style={{ fontSize: 22, color: 'var(--text3)' }}>⇄</div>
            {overlap && (
              <div style={{ fontSize: 13, fontWeight: 700, color: overlapColor, textAlign: 'center', lineHeight: 1.2 }}>
                {overlap.overlapPct}%<br/>
                <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text3)' }}>overlap</span>
              </div>
            )}
          </div>
          <FundPicker funds={funds} selected={groupB} onSelect={addB} onRemove={remB}
            label="Portfolio B (up to 3 funds)" color="#3ecf8e" />
        </div>
      </div>

      {/* Results */}
      {!groupA.length || !groupB.length ? (
        <div style={card}>
          <EmptyState icon="⇄" title="Add at least 1 fund to each side"
            subtitle="Search above to add funds · Overlap score will appear instantly" />
        </div>
      ) : overlap && (
        <>
          {/* Overlap score card */}
          <div style={{ ...card, marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Overlap score', val: `${overlap.overlapPct}%`, color: overlapColor, sub: parseFloat(overlap.overlapPct) > 60 ? 'High — low diversification' : parseFloat(overlap.overlapPct) > 30 ? 'Moderate overlap' : 'Low — well diversified' },
                { label: 'Common stocks', val: overlap.common.length, color: 'var(--text)', sub: 'held by both sides' },
                { label: 'Unique to A', val: overlap.uniqueA.length, color: '#4f7cff', sub: 'only in Portfolio A' },
                { label: 'Unique to B', val: overlap.uniqueB.length, color: '#3ecf8e', sub: 'only in Portfolio B' },
              ].map((m,i) => (
                <div key={i} style={{ background: 'var(--bg3)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{m.val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Overlap bar */}
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Portfolio composition</div>
            <div style={{ display: 'flex', height: 22, borderRadius: 6, overflow: 'hidden', fontSize: 11, fontWeight: 600 }}>
              <div style={{ width: `${overlap.overlapPct}%`, background: overlapColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', minWidth: 40 }}>
                {overlap.overlapPct}% shared
              </div>
              <div style={{ flex: 1, background: '#378ADD30', display: 'flex', alignItems: 'center', paddingLeft: 8, fontSize: 10, color: 'var(--text3)' }}>
                Unique
              </div>
            </div>

            {/* Overlap rating */}
            <div style={{
              marginTop: 12, padding: '10px 12px', borderRadius: 8, fontSize: 12,
              background: parseFloat(overlap.overlapPct) > 60 ? 'var(--red-bg)' : parseFloat(overlap.overlapPct) > 30 ? 'var(--amber-bg)' : 'var(--green-bg)',
              color: parseFloat(overlap.overlapPct) > 60 ? 'var(--red)' : parseFloat(overlap.overlapPct) > 30 ? 'var(--amber)' : 'var(--green)',
            }}>
              {parseFloat(overlap.overlapPct) > 60
                ? '⚠ High overlap — these funds largely invest in the same stocks. Adding both to your portfolio provides little diversification.'
                : parseFloat(overlap.overlapPct) > 30
                ? '◆ Moderate overlap — some shared holdings. Consider if the unique holdings in each justify holding both.'
                : '✓ Low overlap — these funds complement each other well. Good for diversification.'}
            </div>
          </div>

          {/* Common holdings table */}
          {overlap.common.length > 0 && (
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>
                Common holdings ({overlap.common.length} stocks)
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Stock', 'Weight in A', 'Weight in B', 'Overlap weight', 'Visualisation'].map((h,i) => (
                        <th key={i} style={{ padding: '7px 12px', textAlign: i > 0 ? 'center' : 'left', fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, background: 'var(--bg3)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {overlap.common.map((s,i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600 }}>{s.name}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 12, color: '#4f7cff', fontWeight: 600 }}>{s.weightA}%</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 12, color: '#3ecf8e', fontWeight: 600 }}>{s.weightB}%</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 12, color: overlapColor, fontWeight: 600 }}>{s.minWeight.toFixed(1)}%</td>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <div style={{ width: `${s.weightA*4}px`, height: 6, background: '#4f7cff', borderRadius: 3, maxWidth: 60 }} />
                            <div style={{ width: `${s.weightB*4}px`, height: 6, background: '#3ecf8e', borderRadius: 3, maxWidth: 60 }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
                Note: Holdings are simulated for demonstration. In production, real holdings from SEBI/AMFI disclosures would be used.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
