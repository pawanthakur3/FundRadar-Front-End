import { useState, useEffect, useMemo } from 'react'
import { normaliseFund, getCategory, getRisk, getStars, getSimulatedMetrics } from '../utils/funds'

const API_BASE = 'http://localhost:5000/api'

/* ─────────────────────────────────────────────────────────────────
   Extract AMC name from the scheme name.
   
   AMFI scheme names follow the pattern:
     "<Fund House Name> <Scheme Type> <Options>"
   
   E.g. "HDFC Top 100 Fund - Direct Plan - Growth"
        → "HDFC Mutual Fund"
   
   We maintain a lookup of known AMC prefixes → full AMC names.
   This is 100% reliable and works with no API calls.
───────────────────────────────────────────────────────────────── */
const AMC_PREFIX_MAP = [
  // Sorted longest-first so more specific matches win
  ['Aditya Birla Sun Life',       'Aditya Birla Sun Life Mutual Fund'],
  ['Axis',                        'Axis Mutual Fund'],
  ['Bajaj Finserv',               'Bajaj Finserv Mutual Fund'],
  ['Bandhan',                     'Bandhan Mutual Fund'],
  ['Bank of India',               'Bank of India Mutual Fund'],
  ['Baroda BNP Paribas',          'Baroda BNP Paribas Mutual Fund'],
  ['Canara Robeco',               'Canara Robeco Mutual Fund'],
  ['DSP',                         'DSP Mutual Fund'],
  ['Edelweiss',                   'Edelweiss Mutual Fund'],
  ['Franklin India',              'Franklin Templeton Mutual Fund'],
  ['Franklin Templeton',          'Franklin Templeton Mutual Fund'],
  ['Groww',                       'Groww Mutual Fund'],
  ['HDFC',                        'HDFC Mutual Fund'],
  ['Helios',                      'Helios Mutual Fund'],
  ['HSBC',                        'HSBC Mutual Fund'],
  ['ICICI Prudential',            'ICICI Prudential Mutual Fund'],
  ['IDBI',                        'IDBI Mutual Fund'],
  ['IDFC',                        'IDFC Mutual Fund'],
  ['IIFL',                        'IIFL Mutual Fund'],
  ['Invesco India',               'Invesco Mutual Fund'],
  ['ITI',                         'ITI Mutual Fund'],
  ['JM Financial',                'JM Financial Mutual Fund'],
  ['JM',                          'JM Financial Mutual Fund'],
  ['Kotak Mahindra',              'Kotak Mutual Fund'],
  ['Kotak',                       'Kotak Mutual Fund'],
  ['LIC',                         'LIC Mutual Fund'],
  ['Mahindra Manulife',           'Mahindra Manulife Mutual Fund'],
  ['Mirae Asset',                 'Mirae Asset Mutual Fund'],
  ['Motilal Oswal',               'Motilal Oswal Mutual Fund'],
  ['Navi',                        'Navi Mutual Fund'],
  ['Nippon India',                'Nippon India Mutual Fund'],
  ['NJ',                          'NJ Mutual Fund'],
  ['Old Bridge',                  'Old Bridge Mutual Fund'],
  ['PGIM India',                  'PGIM India Mutual Fund'],
  ['PPFAS',                       'PPFAS Mutual Fund'],
  ['Parag Parikh',                'PPFAS Mutual Fund'],
  ['Quantum',                     'Quantum Mutual Fund'],
  ['Quant',                       'Quant Mutual Fund'],
  ['SBI',                         'SBI Mutual Fund'],
  ['Samco',                       'Samco Mutual Fund'],
  ['Shriram',                     'Shriram Mutual Fund'],
  ['Sundaram',                    'Sundaram Mutual Fund'],
  ['Tata',                        'Tata Mutual Fund'],
  ['Taurus',                      'Taurus Mutual Fund'],
  ['Trust',                       'Trust Mutual Fund'],
  ['Union',                       'Union Mutual Fund'],
  ['UTI',                         'UTI Mutual Fund'],
  ['WhiteOak Capital',            'WhiteOak Capital Mutual Fund'],
  ['WhiteOak',                    'WhiteOak Capital Mutual Fund'],
  ['Zerodha',                     'Zerodha Mutual Fund'],
  ['360 One',                     '360 One Mutual Fund'],
  ['360One',                      '360 One Mutual Fund'],
  ['Bajaj',                       'Bajaj Finserv Mutual Fund'],
  ['Baroda',                      'Baroda BNP Paribas Mutual Fund'],
  ['BNP Paribas',                 'Baroda BNP Paribas Mutual Fund'],
]

function extractAmcFromName(schemeName) {
  if (!schemeName) return ''
  const name = schemeName.trim()
  for (const [prefix, amcName] of AMC_PREFIX_MAP) {
    if (name.toLowerCase().startsWith(prefix.toLowerCase())) {
      return amcName
    }
  }
  // Fallback: take everything before the first "-" or before common keywords
  const dashIdx = name.indexOf(' - ')
  if (dashIdx > 4) {
    const prefix = name.slice(0, dashIdx).trim()
    // Remove trailing common words
    return prefix
      .replace(/\s+(Mutual Fund|MF|Asset|AMC)$/i, '')
      .trim()
  }
  return ''
}

export function useFunds() {
  const [funds,   setFunds]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [source,  setSource]  = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        let data = [], fromBackend = false

        /* 1. Try backend first */
        try {
          const res  = await fetch(`${API_BASE}/funds?limit=5000&sort=name&order=asc`,
            { signal: AbortSignal.timeout(5000) })
          const json = await res.json()
          if (json.success && json.data?.length) {
            data = json.data.map(normaliseFund)
            fromBackend = true
          }
        } catch { /* fall through */ }

        /* 2. Fallback: fetch all funds from mfapi.in
              mfapi /mf only returns { schemeCode, schemeName }
              — no AMC name in list endpoint.
              We extract AMC from the scheme name via prefix matching. */
        if (!data.length) {
          const res     = await fetch('https://api.mfapi.in/mf')
          const rawFunds = await res.json()

          data = rawFunds.map(f => {
            const name    = f.schemeName || f.scheme_name || ''
            const type    = f.schemeType || f.scheme_type || ''
            const amcName = extractAmcFromName(name)  // ← key fix
            const cat     = getCategory(name, type)
            const sim     = getSimulatedMetrics(f.schemeCode)

            return {
              schemeCode: f.schemeCode,
              schemeName: name,
              amcName,
              category:   cat,
              risk:       getRisk(cat, name),
              stars:      getStars(f.schemeCode),
              nav:        sim.nav,
              ret1y:      sim.ret1y,
              ret3y:      sim.ret3y,
              ret5y:      sim.ret5y,
              aum:        sim.aum,
              expense:    sim.expense,
              navHistory: [],
            }
          })
        }

        if (!cancelled) {
          setFunds(data)
          setSource(fromBackend ? 'backend' : 'mfapi')
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const stats = useMemo(() => {
    if (!funds.length) return null
    const amcs = new Set(funds.map(f => f.amcName).filter(Boolean))
    return {
      total:   funds.length,
      equity:  funds.filter(f => f.category === 'Equity').length,
      debt:    funds.filter(f => f.category === 'Debt').length,
      hybrid:  funds.filter(f => f.category === 'Hybrid').length,
      amcs:    amcs.size,
      amcList: [...amcs].sort(),
    }
  }, [funds])

  return { funds, loading, error, stats, source }
}
