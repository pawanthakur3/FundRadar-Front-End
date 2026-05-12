import React, { useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Spinner } from '../components/UI'

export default function ReturnsCalc({ funds, initialFund }) {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState([])
  const [selected, setSelected] = useState(initialFund || null)
  const [type,     setType]     = useState('lumpsum')
  const [amount,   setAmount]   = useState(100000)
  /* Date state — supports both picker and manual text input */
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d.toISOString().split('T')[0]
  })
  const [toDate,   setToDate]   = useState(new Date().toISOString().split('T')[0])
  const [fromText, setFromText] = useState('')  // manual typed value
  const [toText,   setToText]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState(null)
  const [error,    setError]    = useState('')
  const [showDrop, setShowDrop] = useState(false)
  const dropRef = useRef()

  useEffect(() => { if (initialFund) { setSelected(initialFund); setQuery(''); setResult(null) } }, [initialFund])

  /* Sync text inputs with date values on mount */
  useEffect(() => {
    setFromText(fromDate)
    setToText(toDate)
  }, [])

  /* Search */
  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return }
    const q = query.toLowerCase()
    setResults(funds.filter(f =>
      f.schemeName.toLowerCase().includes(q) ||
      f.amcName.toLowerCase().includes(q)
    ).slice(0, 10))
    setShowDrop(true)
  }, [query, funds])

  /* Close dropdown on outside click */
  useEffect(() => {
    const fn = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  /* Parse manual date input — supports DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD */
  function parseManualDate(str) {
    if (!str) return null
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
    // DD/MM/YYYY or DD-MM-YYYY
    const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
    if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`
    return null
  }

  function handleFromText(val) {
    setFromText(val)
    const parsed = parseManualDate(val)
    if (parsed) setFromDate(parsed)
  }

  function handleToText(val) {
    setToText(val)
    const parsed = parseManualDate(val)
    if (parsed) setToDate(parsed)
  }

  async function calculate() {
    if (!selected) { setError('Please select a fund'); return }
    const fd = parseManualDate(fromText) || fromDate
    const td = parseManualDate(toText)   || toDate
    if (!fd || !td) { setError('Please enter valid dates (DD/MM/YYYY or YYYY-MM-DD)'); return }
    if (new Date(fd) >= new Date(td)) { setError('From date must be before To date'); return }
    if (!amount || amount < 100) { setError('Enter a valid amount (min ₹100)'); return }

    setError(''); setLoading(true); setResult(null)
    try {
      const res  = await fetch(`https://api.mfapi.in/mf/${selected.schemeCode}`)
      const json = await res.json()
      const history = json.data || []
      if (!history.length) throw new Error('No NAV history available for this fund')

      const parseDate = str => {
        const [dd, mmm, yyyy] = str.split('-')
        return new Date(`${mmm} ${dd} ${yyyy}`)
      }

      const from = new Date(fd), to = new Date(td)
      const inRange = history
        .map(h => ({ date: parseDate(h.date), nav: parseFloat(h.nav), dateStr: h.date }))
        .filter(h => h.date >= from && h.date <= to)
        .sort((a, b) => a.date - b.date)

      if (inRange.length < 2) throw new Error('Not enough NAV data in selected date range. Try a wider range.')

      const firstNav = inRange[0].nav
      const lastNav  = inRange[inRange.length - 1].nav
      const days     = Math.round((inRange[inRange.length-1].date - inRange[0].date) / 86400000)
      const years    = days / 365

      let currentValue, totalInvested, absReturn, cagr

      if (type === 'lumpsum') {
        currentValue  = (amount / firstNav) * lastNav
        totalInvested = amount
        absReturn     = (currentValue - amount) / amount * 100
        cagr          = years > 0 ? (Math.pow(currentValue / amount, 1 / years) - 1) * 100 : 0
      } else {
        const months = {}
        inRange.forEach(h => {
          const key = `${h.date.getFullYear()}-${h.date.getMonth()}`
          if (!months[key]) months[key] = h
        })
        const sipDays     = Object.values(months)
        totalInvested     = sipDays.length * amount
        currentValue      = sipDays.reduce((s, h) => s + (amount / h.nav) * lastNav, 0)
        absReturn         = (currentValue - totalInvested) / totalInvested * 100
        const sipYrs      = sipDays.length / 12
        cagr              = sipYrs > 0 ? (Math.pow(currentValue / totalInvested, 1 / sipYrs) - 1) * 100 : 0
      }

      const step = Math.max(1, Math.floor(inRange.length / 80))
      const chartData = inRange.filter((_, i) => i % step === 0).map(h => ({ date: h.dateStr, nav: h.nav }))

      setResult({
        currentValue: Math.round(currentValue),
        totalInvested: Math.round(totalInvested),
        profit: Math.round(currentValue - totalInvested),
        absReturn, cagr, days, firstNav, lastNav, chartData,
        positive: absReturn >= 0,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', height: 38, padding: '0 12px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg3)',
    color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none',
  }
  const labelStyle = {
    fontSize: 12, color: 'var(--text3)', fontWeight: 600,
    display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
  }
  const cardStyle = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 40px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 26, marginBottom: 4 }}>Returns Calculator</h2>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>Calculate exactly how much any fund returned between any two dates</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16 }}>
        {/* Left: inputs */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>Fund & details</h3>

          {/* Fund search */}
          <div style={{ marginBottom: 16, position: 'relative' }} ref={dropRef}>
            <label style={labelStyle}>Select fund</label>
            {selected ? (
              <div style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent)', borderRadius: 8, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{selected.schemeName}</div>
                  <div style={{ fontSize: 11, color: 'var(--accent2)', marginTop: 2 }}>{selected.amcName}</div>
                </div>
                <button onClick={() => { setSelected(null); setResult(null) }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent2)', cursor: 'pointer', fontSize: 16, padding: '0 2px' }}>✕</button>
              </div>
            ) : (
              <>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}>⊕</span>
                  <input value={query} onChange={e => setQuery(e.target.value)}
                    onFocus={() => results.length && setShowDrop(true)}
                    placeholder="Type fund name or fund house..."
                    style={{ ...inputStyle, paddingLeft: 30 }} />
                </div>
                {showDrop && results.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', maxHeight: 240, overflowY: 'auto', marginTop: 4 }}>
                    {results.map(f => (
                      <div key={f.schemeCode} onClick={() => { setSelected(f); setQuery(''); setShowDrop(false); setResult(null) }}
                        style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={e => e.currentTarget.style.background='var(--bg4)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.schemeName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{f.amcName}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Type + Amount */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Investment type</label>
              <select value={type} onChange={e => setType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="lumpsum">Lumpsum</option>
                <option value="sip">Monthly SIP</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>{type === 'sip' ? 'Monthly SIP (₹)' : 'Amount (₹)'}</label>
              <input type="number" value={amount} min={100}
                onChange={e => setAmount(Number(e.target.value))} style={inputStyle} />
            </div>
          </div>

          {/* Date inputs — both picker + manual text */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
            <div>
              <label style={labelStyle}>From date</label>
              {/* Date picker */}
              <input type="date" value={fromDate}
                onChange={e => { setFromDate(e.target.value); setFromText(e.target.value) }}
                style={{ ...inputStyle, marginBottom: 6, colorScheme: 'dark' }} />
              {/* Manual text input */}
              <input type="text" value={fromText}
                onChange={e => handleFromText(e.target.value)}
                placeholder="DD/MM/YYYY"
                style={{ ...inputStyle, fontSize: 12 }} />
            </div>
            <div>
              <label style={labelStyle}>To date</label>
              <input type="date" value={toDate}
                onChange={e => { setToDate(e.target.value); setToText(e.target.value) }}
                style={{ ...inputStyle, marginBottom: 6, colorScheme: 'dark' }} />
              <input type="text" value={toText}
                onChange={e => handleToText(e.target.value)}
                placeholder="DD/MM/YYYY"
                style={{ ...inputStyle, fontSize: 12 }} />
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 16 }}>
            Supports: DD/MM/YYYY · DD-MM-YYYY · YYYY-MM-DD
          </div>

          <button onClick={calculate} disabled={loading} style={{
            width: '100%', height: 42, borderRadius: 10, border: 'none',
            background: loading ? 'var(--bg4)' : 'var(--accent)',
            color: loading ? 'var(--text3)' : '#fff',
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s',
          }}>
            {loading ? <><Spinner size={18} color="#666" /> Fetching NAV data…</> : '↗ Calculate returns'}
          </button>

          {error && (
            <div style={{ marginTop: 12, background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>{error}</div>
          )}
        </div>

        {/* Right: results */}
        <div>
          {!result && !loading && (
            <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, color: 'var(--text3)', textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.15 }}>↗</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>Select a fund and dates</div>
              <div style={{ fontSize: 13 }}>Your returns will appear here</div>
            </div>
          )}

          {loading && (
            <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, gap: 14 }}>
              <Spinner size={36} />
              <span style={{ color: 'var(--text2)', fontSize: 13 }}>Fetching real NAV history from mfapi.in…</span>
            </div>
          )}

          {result && (
            <div style={cardStyle} className="fade-in">
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{selected?.schemeName}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                  {selected?.amcName} · {result.days} days · {type === 'sip' ? 'Monthly SIP' : 'Lumpsum'}
                  &nbsp;·&nbsp; <span style={{ color: 'var(--text3)' }}>{fromDate} → {toDate}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
                {[
                  { label: 'Amount invested', val: `₹${result.totalInvested.toLocaleString('en-IN')}`,                      color: 'var(--accent2)' },
                  { label: 'Current value',   val: `₹${result.currentValue.toLocaleString('en-IN')}`,                       color: result.positive?'var(--green)':'var(--red)' },
                  { label: 'Profit / Loss',   val: `${result.positive?'+':''}₹${Math.abs(result.profit).toLocaleString('en-IN')}`, color: result.positive?'var(--green)':'var(--red)' },
                  { label: 'Absolute return', val: `${result.positive?'+':''}${result.absReturn.toFixed(2)}%`,               color: result.positive?'var(--green)':'var(--red)' },
                  { label: 'CAGR / XIRR',    val: `${result.positive?'+':''}${result.cagr.toFixed(2)}%`,                    color: result.positive?'var(--green)':'var(--red)' },
                  { label: 'NAV change',      val: `₹${result.firstNav.toFixed(2)} → ₹${result.lastNav.toFixed(2)}`,        color: 'var(--text)' },
                ].map((m, i) => (
                  <div key={i} style={{ background: 'var(--bg3)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: m.color }}>{m.val}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>NAV movement</div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.chartData}>
                    <XAxis dataKey="date" tick={{ fill: 'var(--text3)', fontSize: 9 }} axisLine={false} tickLine={false} interval={Math.floor(result.chartData.length / 6)} />
                    <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v.toFixed(0)}`} width={54} />
                    <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: 'var(--text2)' }} formatter={v => [`₹${v}`, 'NAV']} />
                    <ReferenceLine y={result.firstNav} stroke="var(--text3)" strokeDasharray="4 3" strokeWidth={1} />
                    <Line type="monotone" dataKey="nav" stroke={result.positive ? 'var(--green)' : 'var(--red)'} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
