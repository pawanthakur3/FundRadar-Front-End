import React, { useState, useMemo } from 'react'

const INR = n => `₹${Math.round(n).toLocaleString('en-IN')}`

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

const FUND_TYPES = [
  { id: 'equity',       label: 'Equity fund',             stcg: 20, ltcg: 12.5, ltcgThreshold: 12, ltcgExemption: 125000 },
  { id: 'debt',         label: 'Debt fund',               stcg: null, ltcg: null, ltcgThreshold: 24, ltcgExemption: 0 },
  { id: 'hybrid_eq',   label: 'Aggressive hybrid (>65% equity)', stcg: 20, ltcg: 12.5, ltcgThreshold: 12, ltcgExemption: 125000 },
  { id: 'hybrid_debt', label: 'Conservative hybrid (<65% equity)', stcg: null, ltcg: null, ltcgThreshold: 24, ltcgExemption: 0 },
  { id: 'elss',         label: 'ELSS (tax saver)',        stcg: 20, ltcg: 12.5, ltcgThreshold: 36, ltcgExemption: 125000 },
  { id: 'gold',         label: 'Gold / Silver ETF',       stcg: null, ltcg: null, ltcgThreshold: 24, ltcgExemption: 0 },
]

const SLABS = [
  { limit: 300000,  rate: 0 },
  { limit: 700000,  rate: 5 },
  { limit: 1000000, rate: 10 },
  { limit: 1200000, rate: 15 },
  { limit: 1500000, rate: 20 },
  { limit: Infinity,rate: 30 },
]

function slabTax(income) {
  let tax = 0, prev = 0
  for (const slab of SLABS) {
    if (income <= prev) break
    const taxable = Math.min(income, slab.limit) - prev
    tax += taxable * slab.rate / 100
    prev = slab.limit
  }
  return tax
}

export default function TaxCalc({ funds }) {
  const [fundType, setFundType]   = useState('equity')
  const [invested, setInvested]   = useState(500000)
  const [currentVal, setCurrentVal] = useState(750000)
  const [holdingMos, setHoldingMos] = useState(18)
  const [annualIncome, setAnnualIncome] = useState(1000000)
  const [mode, setMode]           = useState('lumpsum') // lumpsum | sip

  const ft = FUND_TYPES.find(f => f.id === fundType)

  const result = useMemo(() => {
    const gains      = currentVal - invested
    const isLTCG     = holdingMos >= ft.ltcgThreshold
    const isEquityType = ft.stcg !== null

    if (gains <= 0) return { gains: 0, tax: 0, postTaxGains: 0, postTaxValue: currentVal, rate: 0, type: 'No gain', exemption: 0 }

    let tax = 0, exemption = 0, taxableGain = gains, note = ''

    if (isEquityType) {
      if (isLTCG) {
        /* LTCG equity: exempt up to ₹1.25L, 12.5% above */
        exemption   = Math.min(gains, ft.ltcgExemption)
        taxableGain = Math.max(0, gains - exemption)
        tax         = taxableGain * ft.ltcg / 100
        note        = `LTCG @ ${ft.ltcg}% (₹1.25L exempt)`
      } else {
        /* STCG equity: flat 20% */
        tax  = gains * ft.stcg / 100
        note = `STCG @ ${ft.stcg}%`
      }
    } else {
      /* Debt / gold funds: added to income, taxed at slab rate */
      const taxWithGains    = slabTax(annualIncome + gains)
      const taxWithoutGains = slabTax(annualIncome)
      tax  = taxWithGains - taxWithoutGains
      note = `Added to income · slab rate`
      if (isLTCG) note += ` (held ${holdingMos}m)`
    }

    const effectiveRate = gains > 0 ? (tax / gains * 100) : 0
    return {
      gains, tax: Math.round(tax), postTaxGains: Math.round(gains - tax),
      postTaxValue: Math.round(currentVal - tax),
      rate: effectiveRate.toFixed(1),
      exemption: Math.round(exemption),
      note, isLTCG, isEquityType,
    }
  }, [fundType, invested, currentVal, holdingMos, annualIncome, ft])

  const card = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }
  const metricCard = (label, val, color = 'var(--text)', sub = null) => (
    <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color }}>{val}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 40px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 26, marginBottom: 4 }}>Tax Calculator</h2>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>Calculate post-tax returns on mutual fund gains · STCG / LTCG · All fund types · FY 2024-25 rules</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16 }}>
        {/* Left: inputs */}
        <div style={card}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 18 }}>Investment details</h3>

          {/* Fund type */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Fund type</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {FUND_TYPES.map(f => (
                <button key={f.id} onClick={() => setFundType(f.id)} style={{
                  padding: '7px 12px', borderRadius: 8, border: '1px solid',
                  borderColor: fundType === f.id ? 'var(--accent)' : 'var(--border)',
                  background: fundType === f.id ? 'var(--accent-bg)' : 'transparent',
                  color: fundType === f.id ? 'var(--accent2)' : 'var(--text2)',
                  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: fundType === f.id ? 600 : 400,
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s',
                }}>{f.label}</button>
              ))}
            </div>
          </div>

          <Slider label="Amount invested" value={invested} min={10000} max={5000000} step={10000}
            format={v => INR(v)} onChange={setInvested} />
          <Slider label="Current value" value={currentVal} min={invested} max={invested * 5} step={10000}
            format={v => INR(v)} onChange={v => setCurrentVal(Math.max(invested, v))} />
          <Slider label="Holding period" value={holdingMos} min={1} max={60} step={1}
            format={v => v < 12 ? `${v} months` : `${(v/12).toFixed(1)} years`} onChange={setHoldingMos} />

          {/* Annual income — only relevant for debt funds */}
          {ft.stcg === null && (
            <Slider label="Annual income (for slab)" value={annualIncome} min={300000} max={5000000} step={50000}
              format={v => INR(v)} onChange={setAnnualIncome} />
          )}

          {/* LTCG threshold info */}
          <div style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--bg4)', padding: '8px 10px', borderRadius: 8, marginTop: 4 }}>
            {ft.stcg !== null
              ? `LTCG threshold: ${ft.ltcgThreshold} months · LTCG exemption: ₹1,25,000/year`
              : `Gains taxed as income at your slab rate (no separate LTCG rate for this fund type)`}
          </div>
        </div>

        {/* Right: results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Summary */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                background: result.isLTCG ? 'var(--green-bg)' : 'var(--red-bg)',
                color: result.isLTCG ? 'var(--green)' : 'var(--red)',
              }}>{result.isLTCG ? 'Long-term capital gain (LTCG)' : 'Short-term capital gain (STCG)'}</div>
              {result.note && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{result.note}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
              {metricCard('Total gains', INR(result.gains), result.gains > 0 ? 'var(--green)' : 'var(--red)')}
              {metricCard('Tax liability', INR(result.tax), 'var(--red)', `Effective rate: ${result.rate}%`)}
              {metricCard('Post-tax gains', INR(result.postTaxGains), result.postTaxGains > 0 ? 'var(--green)' : 'var(--red)')}
              {metricCard('Amount invested', INR(invested), 'var(--text)')}
              {metricCard('Current value', INR(currentVal), 'var(--accent2)')}
              {metricCard('Post-tax value', INR(result.postTaxValue), 'var(--green)')}
            </div>

            {result.exemption > 0 && (
              <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--green)', marginBottom: 12 }}>
                ✓ LTCG exemption applied: {INR(result.exemption)} is tax-free (₹1.25L annual limit)
              </div>
            )}

            {/* Tax breakdown bar */}
            {currentVal > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Value breakdown</div>
                <div style={{ display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden', fontSize: 11, fontWeight: 600 }}>
                  <div style={{ width: `${invested/currentVal*100}%`, background: '#378ADD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', minWidth: 40 }}>
                    {Math.round(invested/currentVal*100)}%
                  </div>
                  <div style={{ width: `${result.postTaxGains/currentVal*100}%`, background: '#3ecf8e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', minWidth: result.postTaxGains > 0 ? 40 : 0 }}>
                    {result.postTaxGains > 0 ? `${Math.round(result.postTaxGains/currentVal*100)}%` : ''}
                  </div>
                  <div style={{ flex: 1, background: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    Tax
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 11, color: 'var(--text3)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: '#378ADD', display: 'inline-block', borderRadius: 2 }}/>Cost basis</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: '#3ecf8e', display: 'inline-block', borderRadius: 2 }}/>Post-tax gains</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: '#f87171', display: 'inline-block', borderRadius: 2 }}/>Tax</span>
                </div>
              </div>
            )}
          </div>

          {/* Tax rules reference */}
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>FY 2024-25 tax rules reference</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Fund type', 'STCG', 'LTCG period', 'LTCG rate', 'Exemption'].map((h,i) => (
                    <th key={i} style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text3)', fontWeight: 500, fontSize: 11, background: 'var(--bg3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Equity / Hybrid (>65%)', '20%', '>12 months', '12.5%', '₹1.25L/yr'],
                  ['ELSS',                  '20%', '>36 months', '12.5%', '₹1.25L/yr'],
                  ['Debt / Gold / Others',  'Slab','>24 months', 'Slab',  'None'],
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '7px 10px', color: 'var(--text)', fontSize: 12 }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
              Disclaimer: This is for educational purposes only. Consult a tax advisor for your specific situation.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
