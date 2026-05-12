import React, { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Stars, RetCell, Badge } from '../components/UI'

function Slider({ label, value, min, max, step, format, onChange }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent2)' }}>{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  )
}

const indianFmt = n => {
  if (n >= 10000000) return `₹${(n/10000000).toFixed(1)}Cr`
  if (n >= 100000)   return `₹${(n/100000).toFixed(1)}L`
  if (n >= 1000)     return `₹${(n/1000).toFixed(0)}K`
  return `₹${n}`
}

export default function SIPCalc({ funds }) {
  const [amt,  setAmt]  = useState(5000)
  const [rate, setRate] = useState(12)
  const [yrs,  setYrs]  = useState(10)

  const result = useMemo(() => {
    const n = yrs * 12, r = rate / 100 / 12
    const fv = amt * (Math.pow(1 + r, n) - 1) / r * (1 + r)
    const invested = amt * n
    const gains = fv - invested

    const yearly = Array.from({ length: yrs }, (_, i) => {
      const y = i + 1, nn = y * 12
      const fvy = amt * (Math.pow(1 + r, nn) - 1) / r * (1 + r)
      return { year: `Y${y}`, invested: Math.round(amt * nn), total: Math.round(fvy) }
    })
    return { fv: Math.round(fv), invested: Math.round(invested), gains: Math.round(gains), yearly }
  }, [amt, rate, yrs])

  const topFunds = useMemo(() =>
    funds.filter(f => f.stars === 5).sort((a,b) => b.ret3y - a.ret3y).slice(0, 8)
  , [funds])

  const cardStyle = {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 16, padding: 20,
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 40px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 26, marginBottom: 4 }}>SIP Calculator</h2>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>Estimate your Systematic Investment Plan returns with compound growth</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16 }}>
        {/* Controls */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1 }}>Investment details</h3>
          <Slider label="Monthly investment" value={amt} min={500} max={100000} step={500}
            format={v => `₹${v.toLocaleString('en-IN')}`} onChange={setAmt} />
          <Slider label="Expected annual return" value={rate} min={1} max={30} step={1}
            format={v => `${v}%`} onChange={setRate} />
          <Slider label="Investment period" value={yrs} min={1} max={40} step={1}
            format={v => `${v} yr${v>1?'s':''}`} onChange={setYrs} />

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
            {[
              { label: 'Total invested',  val: `₹${result.invested.toLocaleString('en-IN')}`, color: 'var(--text)' },
              { label: 'Est. returns',    val: `₹${result.gains.toLocaleString('en-IN')}`,    color: 'var(--green)' },
              { label: 'Total value',     val: `₹${result.fv.toLocaleString('en-IN')}`,       color: 'var(--accent2)' },
              { label: 'Wealth gained',   val: `${Math.round(result.gains/result.invested*100)}%`, color: 'var(--green)' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--bg3)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Line chart */}
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Growth over time</div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text3)', marginBottom: 10 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 3, background: 'var(--accent)', display: 'inline-block', borderRadius: 2 }} />Total value</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 3, background: 'var(--green)', display: 'inline-block', borderRadius: 2, opacity: 0.7 }} />Invested</span>
            </div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.yearly}>
                  <XAxis dataKey="year" tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.floor(yrs/6)} />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={indianFmt} width={52} />
                  <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: 'var(--text2)' }}
                    formatter={(v, n) => [`₹${v.toLocaleString('en-IN')}`, n === 'total' ? 'Total value' : 'Invested']} />
                  <Line type="monotone" dataKey="total"    stroke="var(--accent)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="invested" stroke="var(--green)"  strokeWidth={2} dot={false} strokeDasharray="5 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut */}
          <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Portfolio split</div>
              <div style={{ height: 110, width: 110 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{v:result.invested},{v:result.gains}]} dataKey="v" cx="50%" cy="50%" innerRadius={32} outerRadius={50} paddingAngle={2}>
                      <Cell fill="#378ADD" />
                      <Cell fill="#3ecf8e" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ fontSize: 13 }}>
              {[
                { label: 'Invested', color: '#378ADD', val: `₹${result.invested.toLocaleString('en-IN')}`, pct: Math.round(result.invested/result.fv*100) },
                { label: 'Returns',  color: '#3ecf8e', val: `₹${result.gains.toLocaleString('en-IN')}`,   pct: Math.round(result.gains/result.fv*100) },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                  <span style={{ color: 'var(--text2)' }}>{s.label}</span>
                  <span style={{ fontWeight: 600 }}>{s.val}</span>
                  <span style={{ color: 'var(--text3)', fontSize: 11 }}>({s.pct}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top rated funds */}
      {topFunds.length > 0 && (
        <div style={{ marginTop: 20, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>Top rated funds to consider</span>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>5-star funds sorted by 3Y returns</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Fund name','Fund house','Category','NAV','1Y','3Y','Rating','Risk'].map((h,i) => (
                    <th key={i} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, background: 'var(--bg3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topFunds.map(f => (
                  <tr key={f.schemeCode} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 600, maxWidth: 200 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.schemeName}</div></td>
                    <td style={{ padding: '9px 12px', fontSize: 12, color: 'var(--text2)', maxWidth: 160 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.amcName||'—'}</div></td>
                    <td style={{ padding: '9px 12px' }}><Badge cat={f.category} /></td>
                    <td style={{ padding: '9px 12px', fontSize: 13 }}>₹{parseFloat(f.nav).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '9px 12px' }}><RetCell v={f.ret1y} /></td>
                    <td style={{ padding: '9px 12px' }}><RetCell v={f.ret3y} /></td>
                    <td style={{ padding: '9px 12px' }}><Stars n={f.stars} /></td>
                    <td style={{ padding: '9px 12px', fontSize: 12, color: f.risk==='High'?'var(--red)':f.risk==='Low'?'var(--green)':'var(--amber)' }}>{f.risk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
