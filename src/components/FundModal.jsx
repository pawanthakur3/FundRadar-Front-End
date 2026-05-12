import React, { useEffect, useRef, useState } from 'react'
import { Badge, Stars, RetCell, RiskPill, Spinner } from './UI'
import { fmt, retSign } from '../utils/funds'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fakeHistory(fund) {
  const base = fund.nav
  const h = Math.abs(String(fund.schemeCode).split('').reduce((a,c) => a*31+c.charCodeAt(0), 0))
  return MONTHS.map((m, i) => ({
    month: m,
    nav: parseFloat((base * (0.82 + (((h * (i + 3)) % 350) / 1200))).toFixed(2)),
  }))
}

const HOLDINGS = [
  'HDFC Bank','Infosys','Reliance Industries','TCS','ICICI Bank','Axis Bank',
]

export default function FundModal({ fund, onClose, onCompare, inCompare, onCalcReturns }) {
  const [tab, setTab] = useState('nav')
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
    pct: parseFloat(((8.4 - i * 0.8) * (0.8 + ((h * (i + 1)) % 40) / 100)).toFixed(1)),
  }))
  const chartData = fakeHistory(fund)

  return (
    <div ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)', zIndex: 500,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '60px 20px', overflowY: 'auto',
      }}>
      <div className="fade-in" style={{
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 20, width: '100%', maxWidth: 580,
        padding: 28, position: 'relative',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 18, right: 18,
          background: 'var(--bg3)', border: 'none', width: 30, height: 30,
          borderRadius: 8, cursor: 'pointer', color: 'var(--text2)',
          fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>

        {/* Header */}
        <div style={{ marginBottom: 18 }}>
          <Badge cat={fund.category} />
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700,
            lineHeight: 1.35, margin: '8px 0 4px', paddingRight: 40,
          }}>{fund.schemeName}</h2>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>{fund.amcName || '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Scheme code: {fund.schemeCode}</div>
        </div>

        {/* Metrics grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
          {[
            { label: 'Current NAV', val: `₹${fmt(fund.nav)}`, color: 'var(--text)' },
            { label: '1Y returns',  val: <RetCell v={fund.ret1y} />, color: null },
            { label: '3Y returns',  val: <RetCell v={fund.ret3y} />, color: null },
            { label: '5Y returns',  val: <RetCell v={fund.ret5y} />, color: null },
            { label: 'AUM',         val: `₹${fund.aum.toLocaleString('en-IN')} Cr`, color: 'var(--text)' },
            { label: 'Expense',     val: `${fund.expense}%`, color: 'var(--text)' },
          ].map((m, i) => (
            <div key={i} style={{
              background: 'var(--bg3)', borderRadius: 10, padding: '10px 12px',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: m.color }}>{m.val}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 14, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
          {['nav','holdings'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '4px 14px', borderRadius: 8, border: 'none',
              background: tab === t ? 'var(--accent-bg)' : 'transparent',
              color: tab === t ? 'var(--accent2)' : 'var(--text2)',
              fontFamily: 'var(--font-body)', fontSize: 12,
              fontWeight: tab === t ? 600 : 400, cursor: 'pointer',
              transition: 'all 0.15s', textTransform: 'capitalize',
            }}>{t === 'nav' ? 'NAV History' : 'Top Holdings'}</button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'nav' && (
          <div style={{ height: 160, marginBottom: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="month" tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${v.toFixed(0)}`} width={50} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text2)' }}
                  formatter={v => [`₹${v}`, 'NAV']}
                />
                <Line type="monotone" dataKey="nav" stroke="var(--accent)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 'holdings' && (
          <div style={{ marginBottom: 16 }}>
            {holdings.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 12, flex: 1, color: 'var(--text)' }}>{h.name}</div>
                <div style={{ width: 100, height: 5, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, h.pct / 10 * 100)}%`, height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)', width: 36, textAlign: 'right' }}>{h.pct}%</div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Stars n={fund.stars} />
            <RiskPill r={fund.risk} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { onCalcReturns(fund); onClose(); }} style={{
              padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border2)',
              background: 'var(--bg3)', color: 'var(--text)', fontSize: 13,
              cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 500,
            }}>↗ Returns</button>
            <button onClick={() => { onCompare(fund.schemeCode); onClose(); }} style={{
              padding: '7px 16px', borderRadius: 8, border: 'none',
              background: inCompare ? 'var(--red-bg)' : 'var(--accent)',
              color: inCompare ? 'var(--red)' : '#fff', fontSize: 13,
              cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600,
            }}>{inCompare ? '− Remove' : '+ Compare'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
