import React, { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Stars, RetCell, Badge } from '../components/UI'

/* ── Slider component ── */
function Slider({ label, value, min, max, step, format, onChange }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent2)' }}>{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  )
}

const indianFmt = n => {
  if (n >= 10000000) return `₹${(n/10000000).toFixed(1)}Cr`
  if (n >= 100000)   return `₹${(n/100000).toFixed(1)}L`
  if (n >= 1000)     return `₹${(n/1000).toFixed(0)}K`
  return `₹${Math.round(n)}`
}

/* ── Step-up SIP computation ──
   Each year SIP amount increases by stepUp%
   Returns total invested & final corpus ── */
function calcStepUpSIP(monthlyAmt, annualRate, years, stepUp) {
  const r = annualRate / 100 / 12
  let totalInvested = 0
  let corpus        = 0
  const yearly      = []

  for (let y = 1; y <= years; y++) {
    const sip = monthlyAmt * Math.pow(1 + stepUp / 100, y - 1) // SIP this year
    for (let m = 0; m < 12; m++) {
      corpus        = (corpus + sip) * (1 + r)
      totalInvested += sip
    }
    yearly.push({ year: `Y${y}`, invested: Math.round(totalInvested), total: Math.round(corpus), sip: Math.round(sip) })
  }
  return { corpus: Math.round(corpus), totalInvested: Math.round(totalInvested), yearly }
}

/* ── Regular SIP computation ── */
function calcRegularSIP(monthlyAmt, annualRate, years) {
  const n = years * 12, r = annualRate / 100 / 12
  const fv = monthlyAmt * (Math.pow(1 + r, n) - 1) / r * (1 + r)
  const invested = monthlyAmt * n
  const yearly = Array.from({ length: years }, (_, i) => {
    const y = i + 1, nn = y * 12
    const fvy = monthlyAmt * (Math.pow(1 + r, nn) - 1) / r * (1 + r)
    return { year: `Y${y}`, invested: Math.round(monthlyAmt * nn), total: Math.round(fvy) }
  })
  return { corpus: Math.round(fv), totalInvested: Math.round(invested), yearly }
}

export default function SIPCalc({ funds }) {
  const [amt,     setAmt]     = useState(5000)
  const [rate,    setRate]    = useState(12)
  const [yrs,     setYrs]     = useState(10)
  const [stepUp,  setStepUp]  = useState(0)   // 0 = regular SIP
  const [mode,    setMode]    = useState('regular') // 'regular' | 'stepup'

  const result = useMemo(() => {
    if (mode === 'stepup' && stepUp > 0) {
      const r = calcStepUpSIP(amt, rate, yrs, stepUp)
      return { ...r, gains: r.corpus - r.totalInvested }
    }
    const r = calcRegularSIP(amt, rate, yrs)
    return { ...r, gains: r.corpus - r.totalInvested }
  }, [amt, rate, yrs, stepUp, mode])

  /* For comparison: show regular SIP alongside step-up */
  const regularResult = useMemo(() => {
    if (mode !== 'stepup' || stepUp === 0) return null
    return calcRegularSIP(amt, rate, yrs)
  }, [amt, rate, yrs, stepUp, mode])

  const topFunds = useMemo(() =>
    funds.filter(f => f.stars === 5).sort((a,b) => (b.ret3y||0) - (a.ret3y||0)).slice(0, 8)
  , [funds])

  const cardStyle = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }
  const wealthPct = result.totalInvested > 0 ? Math.round(result.gains / result.totalInvested * 100) : 0

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 40px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 26, marginBottom: 4 }}>SIP Calculator</h2>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>Regular SIP · Step-up SIP · Compare both strategies</p>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['regular', 'Regular SIP'], ['stepup', 'Step-up SIP']].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '7px 18px', borderRadius: 8, border: '1px solid',
            borderColor: mode === m ? 'var(--accent)' : 'var(--border2)',
            background:  mode === m ? 'var(--accent-bg)' : 'transparent',
            color:       mode === m ? 'var(--accent2)' : 'var(--text2)',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: mode === m ? 600 : 400,
            cursor: 'pointer', transition: 'all 0.15s',
          }}>{label}</button>
        ))}
        {mode === 'stepup' && (
          <div style={{ marginLeft: 8, fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--amber-bg)', borderRadius: 8, border: '1px solid var(--border2)' }}>
            💡 Increase SIP amount by {stepUp}% each year
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16 }}>
        {/* Left: controls */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 18 }}>
            {mode === 'stepup' ? 'Step-up SIP details' : 'Investment details'}
          </h3>

          <Slider label="Monthly SIP amount" value={amt} min={500} max={100000} step={500}
            format={v => `₹${v.toLocaleString('en-IN')}`} onChange={setAmt} />
          <Slider label="Expected annual return" value={rate} min={1} max={30} step={1}
            format={v => `${v}%`} onChange={setRate} />
          <Slider label="Investment period" value={yrs} min={1} max={40} step={1}
            format={v => `${v} yr${v>1?'s':''}`} onChange={setYrs} />

          {mode === 'stepup' && (
            <Slider label="Annual SIP step-up" value={stepUp} min={0} max={50} step={1}
              format={v => v === 0 ? 'No step-up' : `+${v}% each year`} onChange={setStepUp} />
          )}

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
            {[
              { label: 'Total invested', val: `₹${result.totalInvested.toLocaleString('en-IN')}`, color: 'var(--text)' },
              { label: 'Est. returns',   val: `₹${result.gains.toLocaleString('en-IN')}`,         color: 'var(--green)' },
              { label: 'Total corpus',   val: `₹${result.corpus.toLocaleString('en-IN')}`,        color: 'var(--accent2)' },
              { label: 'Wealth gained',  val: `${wealthPct}%`,                                    color: 'var(--green)' },
            ].map((s,i) => (
              <div key={i} style={{ background: 'var(--bg3)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Step-up vs Regular comparison */}
          {regularResult && stepUp > 0 && (
            <div style={{ marginTop: 12, background: 'var(--bg4)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Step-up advantage vs regular SIP</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text2)' }}>Extra corpus</span>
                <span style={{ color: 'var(--green)', fontWeight: 700 }}>
                  +₹{(result.corpus - regularResult.corpus).toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
                <span style={{ color: 'var(--text2)' }}>Extra invested</span>
                <span style={{ color: 'var(--amber)', fontWeight: 600 }}>
                  +₹{(result.totalInvested - regularResult.totalInvested).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Growth line chart */}
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
              {mode === 'stepup' && stepUp > 0 ? 'Step-up vs Regular SIP growth' : 'Growth over time'}
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text3)', marginBottom: 10 }}>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:3, background:'var(--accent)', display:'inline-block', borderRadius:2 }} />
                {mode === 'stepup' && stepUp > 0 ? 'Step-up corpus' : 'Total corpus'}
              </span>
              {regularResult && stepUp > 0 && (
                <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:3, background:'var(--amber)', display:'inline-block', borderRadius:2, opacity:0.8 }} />Regular SIP</span>
              )}
              <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:3, background:'var(--green)', display:'inline-block', borderRadius:2, opacity:0.7 }} />Invested</span>
            </div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.yearly.map((y, i) => ({
                  ...y,
                  regularTotal: regularResult ? regularResult.yearly[i]?.total : undefined,
                }))}>
                  <XAxis dataKey="year" tick={{ fill:'var(--text3)', fontSize:10 }} axisLine={false} tickLine={false} interval={Math.floor(yrs/6)} />
                  <YAxis tick={{ fill:'var(--text3)', fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={indianFmt} width={52} />
                  <Tooltip contentStyle={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, fontSize:12 }}
                    labelStyle={{ color:'var(--text2)' }}
                    formatter={(v, n) => [`₹${v.toLocaleString('en-IN')}`, n==='total'?'Corpus':n==='regularTotal'?'Regular SIP':'Invested']} />
                  <Line type="monotone" dataKey="total"        stroke="var(--accent)" strokeWidth={2} dot={false} />
                  {regularResult && stepUp > 0 && (
                    <Line type="monotone" dataKey="regularTotal" stroke="#fbbf24" strokeWidth={2} dot={false} strokeDasharray="6 3" />
                  )}
                  <Line type="monotone" dataKey="invested" stroke="var(--green)" strokeWidth={2} dot={false} strokeDasharray="5 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut split */}
          <div style={{ ...cardStyle, display:'flex', alignItems:'center', gap:24 }}>
            <div>
              <div style={{ fontSize:12, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>Portfolio split</div>
              <div style={{ height:110, width:110 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ v: result.totalInvested }, { v: Math.max(0, result.gains) }]}
                      dataKey="v" cx="50%" cy="50%" innerRadius={32} outerRadius={50} paddingAngle={2}>
                      <Cell fill="#378ADD" />
                      <Cell fill="#3ecf8e" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ fontSize:13 }}>
              {[
                { label:'Invested', color:'#378ADD', val:`₹${result.totalInvested.toLocaleString('en-IN')}`, pct: result.corpus > 0 ? Math.round(result.totalInvested/result.corpus*100) : 0 },
                { label:'Returns',  color:'#3ecf8e', val:`₹${Math.max(0,result.gains).toLocaleString('en-IN')}`,   pct: result.corpus > 0 ? Math.round(Math.max(0,result.gains)/result.corpus*100) : 0 },
              ].map((s,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <span style={{ width:10, height:10, borderRadius:2, background:s.color, flexShrink:0 }} />
                  <span style={{ color:'var(--text2)' }}>{s.label}</span>
                  <span style={{ fontWeight:600 }}>{s.val}</span>
                  <span style={{ color:'var(--text3)', fontSize:11 }}>({s.pct}%)</span>
                </div>
              ))}
              {mode === 'stepup' && stepUp > 0 && regularResult && (
                <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid var(--border)', fontSize:11, color:'var(--text3)' }}>
                  Step-up final SIP: ₹{Math.round(amt * Math.pow(1+stepUp/100, yrs-1)).toLocaleString('en-IN')}/mo
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top rated funds */}
      {topFunds.length > 0 && (
        <div style={{ marginTop:20, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontWeight:600, fontSize:13 }}>Top rated funds to consider</span>
            <span style={{ fontSize:12, color:'var(--text3)' }}>5-star funds sorted by 3Y returns</span>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  {['Fund name','Fund house','Category','NAV','1Y','3Y','Rating','Risk'].map((h,i) => (
                    <th key={i} style={{ padding:'8px 12px', textAlign:'left', fontSize:11, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, background:'var(--bg3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topFunds.map(f => (
                  <tr key={f.schemeCode} style={{ borderBottom:'1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'9px 12px', fontSize:13, fontWeight:600, maxWidth:200 }}><div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.schemeName}</div></td>
                    <td style={{ padding:'9px 12px', fontSize:12, color:'var(--text2)', maxWidth:160 }}><div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.amcName||'—'}</div></td>
                    <td style={{ padding:'9px 12px' }}><Badge cat={f.category} /></td>
                    <td style={{ padding:'9px 12px', fontSize:13 }}>₹{parseFloat(f.nav).toLocaleString('en-IN')}</td>
                    <td style={{ padding:'9px 12px' }}><RetCell v={f.ret1y} /></td>
                    <td style={{ padding:'9px 12px' }}><RetCell v={f.ret3y} /></td>
                    <td style={{ padding:'9px 12px' }}><Stars n={f.stars} /></td>
                    <td style={{ padding:'9px 12px', fontSize:12, color: f.risk==='High'?'var(--red)':f.risk==='Low'?'var(--green)':'var(--amber)' }}>{f.risk}</td>
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
