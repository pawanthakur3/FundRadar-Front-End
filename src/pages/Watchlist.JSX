import React, { useState, useEffect, useMemo } from 'react'
import { Badge, Stars, RetCell, RiskPill, EmptyState } from '../components/UI'
import { fmt } from '../utils/funds'

const LS_KEY = 'fundradar_watchlist'

function loadWatchlist() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function saveWatchlist(codes) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(codes)) } catch {}
}

export default function Watchlist({ funds, onDetail, onCalcReturns }) {
  const [watchCodes, setWatchCodes] = useState(loadWatchlist)
  const [sortBy, setSortBy]         = useState('added')
  const [note, setNote]             = useState('')
  const [editingNote, setEditingNote] = useState(null)
  const [notes, setNotes]           = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY + '_notes') || '{}') } catch { return {} }
  })

  /* Persist on change */
  useEffect(() => { saveWatchlist(watchCodes) }, [watchCodes])
  useEffect(() => {
    try { localStorage.setItem(LS_KEY + '_notes', JSON.stringify(notes)) } catch {}
  }, [notes])

  const remove = code => setWatchCodes(p => p.filter(c => c !== code))
  const clear  = () => { if (window.confirm('Clear all watchlist funds?')) setWatchCodes([]) }

  const watchFunds = useMemo(() => {
    const found = watchCodes.map(code => funds.find(f => f.schemeCode === code)).filter(Boolean)
    switch(sortBy) {
      case 'ret1y': return [...found].sort((a,b) => (b.ret1y||0) - (a.ret1y||0))
      case 'ret3y': return [...found].sort((a,b) => (b.ret3y||0) - (a.ret3y||0))
      case 'name':  return [...found].sort((a,b) => a.schemeName.localeCompare(b.schemeName))
      default:      return found // added order
    }
  }, [watchCodes, funds, sortBy])

  const saveNote = (code) => {
    setNotes(p => ({ ...p, [code]: note }))
    setEditingNote(null)
    setNote('')
  }

  const sel = { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px', height: 34, color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none', cursor: 'pointer' }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 40px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 26, marginBottom: 4 }}>Watchlist</h2>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>
          Save funds you want to track · Stored in your browser · No account needed · Add notes to each fund
        </p>
      </div>

      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: 'var(--accent-bg)', color: 'var(--accent2)', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 99 }}>
            {watchFunds.length} funds
          </div>
          {watchFunds.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>· Add more from Explore using the ★ button</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={sel}>
            <option value="added">Sort: Added order</option>
            <option value="ret1y">Sort: 1Y returns</option>
            <option value="ret3y">Sort: 3Y returns</option>
            <option value="name">Sort: Name A–Z</option>
          </select>
          {watchFunds.length > 0 && (
            <button onClick={clear} style={{ ...sel, background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red)', cursor: 'pointer', padding: '0 12px' }}>
              Clear all
            </button>
          )}
        </div>
      </div>

      {watchFunds.length === 0 ? (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16 }}>
          <EmptyState icon="★" title="Your watchlist is empty"
            subtitle='Go to Explore and click the ★ button on any fund to save it here' />
        </div>
      ) : (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Fund name','Fund house','Cat','NAV','1Y','3Y','Rating','Risk','Exp%','Note','Actions'].map((h,i) => (
                    <th key={i} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, background: 'var(--bg3)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {watchFunds.map(f => (
                  <React.Fragment key={f.schemeCode}>
                    <tr onClick={() => onDetail && onDetail(f)}
                      style={{ borderBottom: notes[f.schemeCode] || editingNote===f.schemeCode ? 'none' : '1px solid var(--border)', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding: '9px 12px', maxWidth: 220 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.schemeName}>{f.schemeName}</div>
                      </td>
                      <td style={{ padding: '9px 12px', maxWidth: 140 }}>
                        <div style={{ fontSize: 12, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.amcName||'—'}</div>
                      </td>
                      <td style={{ padding: '9px 12px' }}><Badge cat={f.category} /></td>
                      <td style={{ padding: '9px 12px', fontSize: 13 }}>₹{fmt(f.nav)}</td>
                      <td style={{ padding: '9px 12px' }}><RetCell v={f.ret1y} /></td>
                      <td style={{ padding: '9px 12px' }}><RetCell v={f.ret3y} /></td>
                      <td style={{ padding: '9px 12px' }}><Stars n={f.stars} /></td>
                      <td style={{ padding: '9px 12px' }}><RiskPill r={f.risk} /></td>
                      <td style={{ padding: '9px 12px', fontSize: 12, color: 'var(--text2)' }}>{f.expense}%</td>
                      <td style={{ padding: '9px 12px', maxWidth: 140 }} onClick={e => e.stopPropagation()}>
                        {notes[f.schemeCode]
                          ? <span style={{ fontSize: 11, color: 'var(--text2)', fontStyle: 'italic' }}>{notes[f.schemeCode].slice(0,30)}{notes[f.schemeCode].length>30?'…':''}</span>
                          : <button onClick={() => { setEditingNote(f.schemeCode); setNote('') }} style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>+ Add note</button>
                        }
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => onCalcReturns && onCalcReturns(f)}
                            title="Returns calculator"
                            style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid var(--border2)', background: 'transparent', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>↗</button>
                          <button onClick={() => setEditingNote(editingNote===f.schemeCode ? null : f.schemeCode)}
                            title="Edit note"
                            style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, border: '1px solid var(--border2)', background: 'transparent', color: 'var(--text3)', cursor: 'pointer' }}>✎</button>
                          <button onClick={() => remove(f.schemeCode)}
                            title="Remove from watchlist"
                            style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, border: '1px solid var(--border2)', background: 'transparent', color: 'var(--red)', cursor: 'pointer' }}>✕</button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline note editor */}
                    {editingNote === f.schemeCode && (
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <td colSpan={11} style={{ padding: '8px 12px' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input autoFocus value={note} onChange={e => setNote(e.target.value)}
                              onKeyDown={e => { if (e.key==='Enter') saveNote(f.schemeCode); if (e.key==='Escape') setEditingNote(null) }}
                              placeholder="Add a note about this fund…"
                              style={{ flex: 1, height: 32, padding: '0 10px', borderRadius: 6, border: '1px solid var(--accent)', background: 'var(--bg3)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none' }} />
                            <button onClick={() => saveNote(f.schemeCode)} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save</button>
                            <button onClick={() => setEditingNote(null)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border2)', background: 'transparent', color: 'var(--text3)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
                            {notes[f.schemeCode] && <button onClick={() => { setNotes(p => { const n={...p}; delete n[f.schemeCode]; return n }); setEditingNote(null) }} style={{ fontSize: 12, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}>Delete note</button>}
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Note display row */}
                    {notes[f.schemeCode] && editingNote !== f.schemeCode && (
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <td colSpan={11} style={{ padding: '4px 12px 8px', fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', background: 'var(--bg3)' }}>
                          📝 {notes[f.schemeCode]}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary stats */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12, color: 'var(--text3)' }}>
            {watchFunds.length > 0 && (() => {
              const avg1y = (watchFunds.reduce((s,f) => s+(f.ret1y||0),0)/watchFunds.length).toFixed(1)
              const avg3y = (watchFunds.reduce((s,f) => s+(f.ret3y||0),0)/watchFunds.length).toFixed(1)
              const cats  = [...new Set(watchFunds.map(f=>f.category))]
              return (
                <>
                  <span>Avg 1Y return: <b style={{ color: avg1y>=0?'var(--green)':'var(--red)' }}>{avg1y>=0?'+':''}{avg1y}%</b></span>
                  <span>Avg 3Y return: <b style={{ color: avg3y>=0?'var(--green)':'var(--red)' }}>{avg3y>=0?'+':''}{avg3y}%</b></span>
                  <span>Categories: <b style={{ color: 'var(--text)' }}>{cats.join(', ')}</b></span>
                  <span>Saved in: <b style={{ color: 'var(--text)' }}>browser (no account needed)</b></span>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
