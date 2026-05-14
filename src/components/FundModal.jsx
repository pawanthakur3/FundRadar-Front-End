import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Badge, Stars, RetCell, RiskPill, Spinner } from './UI'
import { fmt } from '../utils/funds'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/* Simulated NAV history — used when backend history not available */
function fakeHistory(fund) {
  const base = fund.nav
  const h = Math.abs(String(fund.schemeCode).split('').reduce((a,c) => a*31+c.charCodeAt(0), 0))
  return MONTHS.map((m, i) => ({
    month: m,
    nav:   parseFloat((base * (0.82 + (((h*(i+3))%350)/1200))).toFixed(2)),
    /* Simulated Nifty 50 benchmark — roughly tracks market */
    nifty: parseFloat((base * (0.85 + (((h*(i+7))%280)/1100))).toFixed(2)),
  }))
}

/* Convert backend navHistory array to chart format with benchmark */
function realHistory(navHistory = [], currentNav) {
  if (!navHistory.length) return null
  const sorted = [...navHistory]
    .map(h => {
      const [dd, mmm, yyyy] = (h.date||'').split('-')
      return { ts: new Date(`${mmm} ${dd} ${yyyy}`).getTime(), nav: parseFloat(h.nav) }
    })
    .filter(h => !isNaN(h.ts) && !isNaN(h.nav))
    .sort((a,b) => a.ts - b.ts)
  if (!sorted.length) return null

  /* Sample monthly */
  const monthly = []
  let lastM = -1
  for (const h of sorted) {
    const d = new Date(h.ts)
    const m = d.getFullYear()*12 + d.getMonth()
    if (m !== lastM) { monthly.push(h); lastM = m }
  }

  /* Normalize to 100 base for benchmark comparison */
  const base = monthly[0].nav
  return monthly.map((h, i) => {
    const normalized = (h.nav / base * 100).toFixed(2)
    /* Approximate Nifty 50 growth over same period — use simulated relative growth */
    const seed = (h.ts % 1000) / 1000
    const niftyGrowth = 1 + (i / monthly.length) * 0.14 + (seed - 0.5) * 0.03
    return {
      month:       new Date(h.ts).toLocaleDateString('en-IN', { month:'short', year:'2-digit' }),
      nav:         parseFloat(normalized),
      nifty:       parseFloat((100 * niftyGrowth).toFixed(2)),
      rawNav:      h.nav,
    }
  })
}

const HOLDINGS = ['HDFC Bank','Infosys','Reliance Industries','TCS','ICICI Bank','Axis Bank']

export default function FundModal({ fund, onClose, onCompare, inCompare, onCalcReturns }) {
  const [tab,       setTab]       = useState('nav')
  const [showBench, setShowBench] = useState(true)
  const overlayRef = useRef()

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!fund) return null

  const h = Math.abs(String(fund.schemeCode).split('').reduce((a,c) => a*31+c.charCodeAt(0), 0))
  const holdings = HOLDINGS.map((name, i) => ({
    name,
    pct: parseFloat(((8.4 - i*0.8) * (0.8 + ((h*(i+1))%40)/100)).toFixed(1)),
  }))

  /* Use real history from backend if available, else fake */
  const hasRealHistory = fund.navHistory && fund.navHistory.length > 2
  const chartData = useMemo(() =>
    hasRealHistory ? realHistory(fund.navHistory, fund.nav) : fakeHistory(fund)
  , [fund])

  /* Sharpe ratio display */
  const sharpe = fund.returns?.sharpe ?? null

  /* Return values — prefer real ones from backend */
  const ret1y = fund.returns?.ret1y ?? fund.ret1y
  const ret3y = fund.returns?.ret3y ?? fund.ret3y
  const ret5y = fund.returns?.ret5y ?? fund.ret5y

  const metricCards = [
    { label: 'Current NAV',   val: `₹${fmt(fund.nav)}`,                   color: 'var(--text)' },
    { label: '1Y returns',    val: <RetCell v={ret1y} />,                  color: null },
    { label: '3Y returns',    val: <RetCell v={ret3y} />,                  color: null },
    { label: '5Y returns',    val: <RetCell v={ret5y} />,                  color: null },
    { label: 'Sharpe ratio',  val: sharpe !== null ? sharpe : '—',         color: sharpe !== null ? (sharpe > 1 ? 'var(--green)' : sharpe > 0 ? 'var(--amber)' : 'var(--red)') : 'var(--text3)' },
    { label: 'Expense ratio', val: fund.expense != null ? `${fund.expense}%` : '—', color: 'var(--text)' },
  ]

  /* Chart axis label */
  const yAxisLabel = hasRealHistory ? 'Indexed (base 100)' : `₹`
  const navFormatter = hasRealHistory
    ? (v) => [v, 'Fund (indexed)']
    : (v) => [`₹${v}`, 'NAV']

  return (
    <div ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onClose() }}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', zIndex:500, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'60px 20px', overflowY:'auto' }}>
      <div className="fade-in" style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:20, width:'100%', maxWidth:600, padding:28, position:'relative' }}>

        {/* Close */}
        <button onClick={onClose} style={{ position:'absolute', top:18, right:18, background:'var(--bg3)', border:'none', width:30, height:30, borderRadius:8, cursor:'pointer', color:'var(--text2)', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>

        {/* Header */}
        <div style={{ marginBottom:18 }}>
          <Badge cat={fund.category} />
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:700, lineHeight:1.35, margin:'8px 0 4px', paddingRight:40 }}>{fund.schemeName}</h2>
          <div style={{ fontSize:12, color:'var(--text2)' }}>{fund.amcName || '—'}</div>
          <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Scheme code: {fund.schemeCode}</div>
        </div>

        {/* Metrics — 6 cards including Sharpe */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:20 }}>
          {metricCards.map((m, i) => (
            <div key={i} style={{ background:'var(--bg3)', borderRadius:10, padding:'10px 12px', border:'1px solid var(--border)' }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>{m.label}</div>
              <div style={{ fontSize:15, fontWeight:600, color: m.color || 'var(--text)' }}>{m.val}</div>
            </div>
          ))}
        </div>

        {/* Sharpe explanation if present */}
        {sharpe !== null && (
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:14, padding:'6px 10px', background:'var(--bg4)', borderRadius:6, border:'1px solid var(--border)' }}>
            <b>Sharpe ratio</b> measures risk-adjusted return. &gt;1 = excellent · 0–1 = acceptable · &lt;0 = poor.
            This fund scored <b style={{ color: sharpe > 1 ? 'var(--green)' : sharpe > 0 ? 'var(--amber)' : 'var(--red)' }}>{sharpe}</b>
            {sharpe > 1 ? ' — good risk-adjusted performance.' : sharpe > 0 ? ' — moderate risk-adjusted performance.' : ' — returns not compensating for risk.'}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, marginBottom:14, borderBottom:'1px solid var(--border)', paddingBottom:12, alignItems:'center' }}>
          {[['nav', 'NAV Chart'], ['holdings', 'Top Holdings']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:'4px 14px', borderRadius:8, border:'none',
              background: tab===t ? 'var(--accent-bg)' : 'transparent',
              color:      tab===t ? 'var(--accent2)' : 'var(--text2)',
              fontFamily:'var(--font-body)', fontSize:12,
              fontWeight: tab===t ? 600 : 400, cursor:'pointer', transition:'all 0.15s',
            }}>{label}</button>
          ))}
          {/* Benchmark toggle — only on NAV tab */}
          {tab === 'nav' && (
            <button onClick={() => setShowBench(b => !b)} style={{
              marginLeft:'auto', padding:'3px 10px', borderRadius:6, fontSize:11, fontWeight:500,
              border:'1px solid', cursor:'pointer', transition:'all 0.15s', fontFamily:'var(--font-body)',
              borderColor: showBench ? '#fbbf24' : 'var(--border2)',
              background:  showBench ? 'rgba(251,191,36,0.1)' : 'transparent',
              color:       showBench ? '#fbbf24' : 'var(--text3)',
            }}>
              {showBench ? '✓' : '○'} Nifty 50 benchmark
            </button>
          )}
        </div>

        {/* NAV chart with optional Nifty 50 benchmark */}
        {tab === 'nav' && (
          <div>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8, display:'flex', gap:16 }}>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:10, height:3, background:'var(--accent)', display:'inline-block', borderRadius:2 }} />
                {fund.schemeName.split(' ').slice(0,3).join(' ')}…
              </span>
              {showBench && (
                <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ width:10, height:3, background:'#fbbf24', display:'inline-block', borderRadius:2 }} />
                  Nifty 50 {hasRealHistory ? '(indicative)' : '(simulated)'}
                </span>
              )}
              {hasRealHistory && <span style={{ color:'var(--green)', marginLeft:'auto' }}>✓ Real NAV data</span>}
            </div>
            <div style={{ height:170, marginBottom:16 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData || []}>
                  <XAxis dataKey="month" tick={{ fill:'var(--text3)', fontSize:9 }} axisLine={false} tickLine={false}
                    interval={Math.floor((chartData?.length||12)/6)} />
                  <YAxis tick={{ fill:'var(--text3)', fontSize:9 }} axisLine={false} tickLine={false}
                    tickFormatter={v => hasRealHistory ? v.toFixed(0) : `₹${v.toFixed(0)}`} width={46} />
                  <Tooltip
                    contentStyle={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, fontSize:11 }}
                    labelStyle={{ color:'var(--text2)' }}
                    formatter={(v, name) => [
                      hasRealHistory ? v.toFixed(1) : `₹${v}`,
                      name === 'nav' ? 'Fund' : 'Nifty 50'
                    ]}
                  />
                  <Line type="monotone" dataKey="nav"   stroke="var(--accent)" strokeWidth={2} dot={false} />
                  {showBench && <Line type="monotone" dataKey="nifty" stroke="#fbbf24" strokeWidth={2} dot={false} strokeDasharray="5 4" strokeOpacity={0.85} />}
                </LineChart>
              </ResponsiveContainer>
            </div>
            {hasRealHistory && (
              <div style={{ fontSize:10, color:'var(--text3)', textAlign:'center' }}>
                Indexed to 100 at start — shows relative performance. Nifty 50 line is indicative.
              </div>
            )}
          </div>
        )}

        {/* Holdings */}
        {tab === 'holdings' && (
          <div style={{ marginBottom:16 }}>
            {holdings.map((h, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ fontSize:12, flex:1, color:'var(--text)' }}>{h.name}</div>
                <div style={{ width:100, height:5, background:'var(--bg4)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ width:`${Math.min(100,h.pct/10*100)}%`, height:'100%', background:'var(--accent)', borderRadius:3 }} />
                </div>
                <div style={{ fontSize:11, color:'var(--text2)', width:36, textAlign:'right' }}>{h.pct}%</div>
              </div>
            ))}
            <div style={{ fontSize:10, color:'var(--text3)', marginTop:8 }}>Holdings data is indicative. Real data requires SEBI-registered data provider.</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:14, borderTop:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Stars n={fund.stars} />
            <RiskPill r={fund.risk} />
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => { onCalcReturns(fund); onClose() }} style={{ padding:'7px 14px', borderRadius:8, border:'1px solid var(--border2)', background:'var(--bg3)', color:'var(--text)', fontSize:13, cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:500 }}>
              ↗ Returns
            </button>
            <button onClick={() => { onCompare(fund.schemeCode); onClose() }} style={{ padding:'7px 16px', borderRadius:8, border:'none', background: inCompare ? 'var(--red-bg)' : 'var(--accent)', color: inCompare ? 'var(--red)' : '#fff', fontSize:13, cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:600 }}>
              {inCompare ? '− Remove' : '+ Compare'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
