import React, { useState, useMemo, useEffect } from 'react'
import { Badge, Stars, RetCell, RiskPill, Spinner, EmptyState } from '../components/UI'
import { fmt } from '../utils/funds'

const PER = 20

/* Sub-category buckets derived from fund name */
function getSubCat(name = '') {
  const n = name.toLowerCase()
  if (n.includes('large cap') || n.includes('largecap') || n.includes('bluechip') || n.includes('blue chip')) return 'Large Cap'
  if (n.includes('mid cap')   || n.includes('midcap'))  return 'Mid Cap'
  if (n.includes('small cap') || n.includes('smallcap') || n.includes('micro cap')) return 'Small Cap'
  if (n.includes('large & mid') || n.includes('large and mid')) return 'Large & Mid Cap'
  if (n.includes('multi cap') || n.includes('multicap')) return 'Multi Cap'
  if (n.includes('flexi cap') || n.includes('flexicap')) return 'Flexi Cap'
  if (n.includes('elss') || n.includes('tax saver') || n.includes('tax saving')) return 'ELSS'
  if (n.includes('index') || n.includes('nifty') || n.includes('sensex') || n.includes('etf')) return 'Index / ETF'
  if (n.includes('sectoral') || n.includes('sector') || n.includes('thematic')) return 'Sectoral / Thematic'
  if (n.includes('focused')) return 'Focused'
  if (n.includes('overnight')) return 'Overnight'
  if (n.includes('liquid'))    return 'Liquid'
  if (n.includes('ultra short') || n.includes('ultrashort')) return 'Ultra Short'
  if (n.includes('short dur') || n.includes('short term')) return 'Short Duration'
  if (n.includes('medium dur') || n.includes('medium term')) return 'Medium Duration'
  if (n.includes('long dur')  || n.includes('long term'))  return 'Long Duration'
  if (n.includes('gilt'))      return 'Gilt'
  if (n.includes('credit risk')) return 'Credit Risk'
  if (n.includes('corporate bond')) return 'Corporate Bond'
  if (n.includes('banking and psu') || n.includes('banking & psu')) return 'Banking & PSU'
  if (n.includes('dynamic bond') || n.includes('dynamic debt')) return 'Dynamic Bond'
  if (n.includes('balanced advantage') || n.includes('dynamic asset')) return 'Balanced Advantage'
  if (n.includes('aggressive hybrid')) return 'Aggressive Hybrid'
  if (n.includes('arbitrage')) return 'Arbitrage'
  if (n.includes('equity saving')) return 'Equity Savings'
  if (n.includes('multi asset')) return 'Multi Asset'
  return ''
}

const SUB_CAT_OPTIONS = {
  Equity: ['Large Cap','Mid Cap','Small Cap','Large & Mid Cap','Multi Cap','Flexi Cap','ELSS','Index / ETF','Sectoral / Thematic','Focused'],
  Debt:   ['Overnight','Liquid','Ultra Short','Short Duration','Medium Duration','Long Duration','Gilt','Credit Risk','Corporate Bond','Banking & PSU','Dynamic Bond'],
  Hybrid: ['Balanced Advantage','Aggressive Hybrid','Arbitrage','Equity Savings','Multi Asset'],
  Other:  [],
}

export default function Explore({ funds, loading, error, stats, onDetail, compareList, onCompare, presetAmc, presetCat, onStatClick, onCalcReturns, watchCodes = [], onToggleWatch }) {
  const [search,  setSearch]  = useState('')
  const [cat,     setCat]     = useState('')
  const [subCat,  setSubCat]  = useState('')
  const [risk,    setRisk]    = useState('')
  const [sort,    setSort]    = useState('name')
  const [page,    setPage]    = useState(1)

  /* Sync presets coming from outside (FundHouses → Explore, Stat click) */
  useEffect(() => {
    if (presetAmc !== undefined) setSearch(presetAmc ? presetAmc : '')
  }, [presetAmc])

  useEffect(() => {
    if (presetCat !== undefined) { setCat(presetCat || ''); setSubCat(''); setPage(1) }
  }, [presetCat])

  /* Reset subCat when category changes */
  const handleCatChange = (val) => { setCat(val); setSubCat(''); setPage(1) }

  const subCatOpts = SUB_CAT_OPTIONS[cat] || []

  /* Filter + sort */
  const filtered = useMemo(() => {
    let res = funds.filter(f => {
      const q = search.toLowerCase()
      if (q && !f.schemeName.toLowerCase().includes(q) && !f.amcName.toLowerCase().includes(q)) return false
      if (cat    && f.category !== cat) return false
      if (subCat && getSubCat(f.schemeName) !== subCat) return false
      if (risk   && f.risk !== risk) return false
      return true
    })
    res.sort((a, b) => {
      switch(sort) {
        case 'ret1y':  return b.ret1y - a.ret1y
        case 'ret3y':  return b.ret3y - a.ret3y
        case 'rating': return b.stars - a.stars
        case 'nav':    return parseFloat(b.nav) - parseFloat(a.nav)
        default:       return a.schemeName.localeCompare(b.schemeName)
      }
    })
    return res
  }, [funds, search, cat, subCat, risk, sort])

  const total = filtered.length
  const pages = Math.ceil(total / PER)
  const slice = filtered.slice((page-1)*PER, page*PER)
  const inC   = code => compareList.some(x => x.schemeCode === code)

  const chip = (label, active, onClick) => (
    <button onClick={onClick} style={{
      padding: '5px 14px', borderRadius: 99, fontSize: 13, fontWeight: active ? 600 : 400,
      border: '1px solid', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-body)',
      borderColor: active ? 'var(--accent)' : 'var(--border2)',
      background:  active ? 'var(--accent-bg)' : 'transparent',
      color:       active ? 'var(--accent2)' : 'var(--text2)',
    }}>{label}</button>
  )

  const selStyle = {
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '0 10px', height: 36, color: 'var(--text)',
    fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none', cursor: 'pointer',
  }

  const CAT_STATS = stats ? [
    { key: 'all',    label: 'All funds',   val: stats.total,  color: 'var(--text)' },
    { key: 'Equity', label: 'Equity',      val: stats.equity, color: 'var(--eq-color)' },
    { key: 'Debt',   label: 'Debt',        val: stats.debt,   color: 'var(--dt-color)' },
    { key: 'Hybrid', label: 'Hybrid',      val: stats.hybrid, color: 'var(--hy-color)' },
  ] : []

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '20px 24px 40px' }}>

      {/* Hero */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: '24px 28px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 300, fontStyle: 'italic', lineHeight: 1.2, marginBottom: 6, background: 'linear-gradient(135deg, var(--text) 0%, var(--accent2) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Every mutual fund in India, in one place.
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 13 }}>Live NAV data from AMFI · Active funds only · Click a category to filter</p>
          </div>

          {/* Clickable category stat pills */}
          {stats && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {CAT_STATS.map(s => {
                const isActive = (s.key === 'all' && !cat) || cat === s.key
                return (
                  <button key={s.key} onClick={() => { handleCatChange(s.key === 'all' ? '' : s.key); if (onStatClick) onStatClick(s.key === 'all' ? '' : s.key) }} style={{
                    background: isActive ? 'var(--bg4)' : 'var(--bg3)',
                    border: `1px solid ${isActive ? 'var(--border2)' : 'var(--border)'}`,
                    borderRadius: 12, padding: '10px 18px', cursor: 'pointer',
                    textAlign: 'center', transition: 'all 0.15s',
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)' }}>
                      {s.val.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: 11, color: isActive ? 'var(--text2)' : 'var(--text3)', marginTop: 2 }}>{s.label}</div>
                    {isActive && <div style={{ width: 20, height: 2, background: s.color, borderRadius: 1, margin: '4px auto 0' }} />}
                  </button>
                )
              })}
              {stats.amcs > 0 && (
                <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text2)', fontFamily: 'var(--font-display)' }}>{stats.amcs}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Fund houses</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search — fund name OR fund house */}
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none', fontSize: 14 }}>⊕</span>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search fund name or fund house…"
            style={{ ...selStyle, width: '100%', paddingLeft: 30, cursor: 'text' }}
          />
        </div>

        {/* Risk */}
        <select value={risk} onChange={e => { setRisk(e.target.value); setPage(1) }} style={selStyle}>
          <option value="">All risk levels</option>
          <option value="Low">Low risk</option>
          <option value="Moderate">Moderate risk</option>
          <option value="High">High risk</option>
        </select>

        {/* Sort */}
        <select value={sort} onChange={e => setSort(e.target.value)} style={selStyle}>
          <option value="name">Name A–Z</option>
          <option value="ret1y">1Y returns</option>
          <option value="ret3y">3Y returns</option>
          <option value="rating">Star rating</option>
          <option value="nav">NAV</option>
        </select>

        {/* Clear filters */}
        {(search || cat || subCat || risk) && (
          <button onClick={() => { setSearch(''); setCat(''); setSubCat(''); setRisk(''); setPage(1) }}
            style={{ ...selStyle, background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red)', cursor: 'pointer', padding: '0 12px' }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Sub-category chip filters — only when a category is selected */}
      {cat && subCatOpts.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {chip(`All ${cat}`, !subCat, () => { setSubCat(''); setPage(1) })}
          {subCatOpts.map(s => chip(s, subCat === s, () => { setSubCat(s); setPage(1) }))}
        </div>
      )}

      {/* Category quick chips if no cat selected */}
      {!cat && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {['Equity','Debt','Hybrid','Other'].map(c => chip(c, false, () => handleCatChange(c)))}
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>
            {loading ? 'Loading funds…' : `${total.toLocaleString('en-IN')} ${cat ? cat : 'active'} funds${subCat ? ` · ${subCat}` : ''}${search ? ` · "${search}"` : ''}`}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>Click row · ★ Watchlist · + Compare · ↗ Returns</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 48, gap: 12 }}>
            <Spinner size={32} /><span style={{ color: 'var(--text2)', fontSize: 13 }}>Fetching active funds from AMFI…</span>
          </div>
        ) : error ? (
          <EmptyState icon="⚡" title="Could not load funds" subtitle={error} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Fund name','Fund house','Category','NAV','1Y','3Y','5Y','Rating','Risk','Exp%','Watch','Compare','Returns'].map((h,i) => (
                    <th key={i} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.6, background: 'var(--bg3)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slice.length === 0 ? (
                  <tr><td colSpan={11}><EmptyState icon="🔍" title="No funds match" subtitle="Try clearing filters or searching differently" /></td></tr>
                ) : slice.map(f => (
                  <tr key={f.schemeCode} onClick={() => onDetail(f)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ padding: '10px 12px', maxWidth: 240 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.schemeName}>{f.schemeName || '—'}</div>
                    </td>
                    <td style={{ padding: '10px 12px', maxWidth: 150 }}>
                      <div style={{ fontSize: 12, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.amcName}>{f.amcName || '—'}</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}><Badge cat={f.category} /></td>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500 }}>₹{fmt(f.nav)}</td>
                    <td style={{ padding: '10px 12px' }}><RetCell v={f.ret1y} /></td>
                    <td style={{ padding: '10px 12px' }}><RetCell v={f.ret3y} /></td>
                    <td style={{ padding: '10px 12px' }}><RetCell v={f.ret5y} /></td>
                    <td style={{ padding: '10px 12px' }}><Stars n={f.stars} /></td>
                    <td style={{ padding: '10px 12px' }}><RiskPill r={f.risk} /></td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text2)' }}>{f.expense}%</td>
                    <td style={{ padding: '10px 12px' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => onToggleWatch && onToggleWatch(f.schemeCode)}
                        title={inW(f.schemeCode) ? 'Remove from watchlist' : 'Add to watchlist'}
                        style={{
                          padding: '4px 8px', borderRadius: 6, fontSize: 13, border: '1px solid',
                          borderColor: inW(f.schemeCode) ? '#fbbf24' : 'var(--border2)',
                          background: inW(f.schemeCode) ? 'rgba(251,191,36,0.12)' : 'transparent',
                          color: inW(f.schemeCode) ? '#fbbf24' : 'var(--text3)',
                          cursor: 'pointer', transition: 'all 0.15s', lineHeight: 1,
                        }}>★</button>
                    </td>
                    <td style={{ padding: '10px 12px' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => onCompare(f.schemeCode)} style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid',
                        borderColor: inC(f.schemeCode) ? 'var(--accent)' : 'var(--border2)',
                        background:  inC(f.schemeCode) ? 'var(--accent-bg)' : 'transparent',
                        color:       inC(f.schemeCode) ? 'var(--accent2)' : 'var(--text3)',
                        cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', transition: 'all 0.15s',
                      }}>{inC(f.schemeCode) ? '✓ Added' : '+ Add'}</button>
                    </td>
                    <td style={{ padding: '10px 12px' }} onClick={e => e.stopPropagation()}>
                      <button
                        title="Send to Returns Calculator"
                        onClick={() => onCalcReturns && onCalcReturns(f)}
                        style={{
                          padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                          border: '1px solid var(--border2)', background: 'transparent',
                          color: 'var(--text3)', cursor: 'pointer',
                          fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='var(--text)'; e.currentTarget.style.borderColor='var(--text2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text3)'; e.currentTarget.style.borderColor='var(--border2)'; }}
                      >↗ Returns</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && total > PER && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text2)' }}>
            <span>{(page-1)*PER+1}–{Math.min(page*PER,total)} of {total.toLocaleString('en-IN')}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button disabled={page<=1} onClick={() => { setPage(p=>p-1); window.scrollTo(0,180) }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border2)', background: 'var(--bg3)', color: 'var(--text)', cursor: page<=1?'not-allowed':'pointer', opacity: page<=1?0.4:1, fontFamily: 'var(--font-body)' }}>‹</button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                const p = Math.max(1, Math.min(pages-4, page-2)) + i
                return <button key={p} onClick={() => { setPage(p); window.scrollTo(0,180) }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid', borderColor: p===page?'var(--accent)':'var(--border2)', background: p===page?'var(--accent)':'var(--bg3)', color: p===page?'#fff':'var(--text)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{p}</button>
              })}
              <button disabled={page>=pages} onClick={() => { setPage(p=>p+1); window.scrollTo(0,180) }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border2)', background: 'var(--bg3)', color: 'var(--text)', cursor: page>=pages?'not-allowed':'pointer', opacity: page>=pages?0.4:1, fontFamily: 'var(--font-body)' }}>›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
