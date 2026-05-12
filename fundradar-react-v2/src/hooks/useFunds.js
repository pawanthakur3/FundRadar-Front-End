import { useState, useEffect, useMemo } from 'react'
import { normaliseFund, getCategory, getRisk, getStars, getSimulatedMetrics } from '../utils/funds'

const API_BASE = 'http://localhost:5000/api'

/* Parse AMFI NAV text to extract AMC names per scheme code
   Format: SchemeCode;ISINDiv;ISINReinv;SchemeName;NAV;Date */
function parseAmfiNavText(text) {
  const map = {}   // schemeCode → { nav, date, amcName }
  let currentAmc = ''

  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const parts = trimmed.split(';')

    /* AMC header lines have no semicolons and are not numeric */
    if (parts.length === 1 && isNaN(parts[0])) {
      currentAmc = trimmed
      continue
    }

    if (parts.length >= 6 && !isNaN(parts[0])) {
      const code = parseInt(parts[0].trim())
      const nav  = parseFloat(parts[4].trim())
      const date = parts[5]?.trim() || ''
      if (!isNaN(nav) && nav > 0) {
        map[code] = { nav, date, amcName: currentAmc }
      }
    }
  }
  return map
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
        } catch { /* fall through to mfapi */ }

        /* 2. Fallback: mfapi.in list + AMFI NAV file for AMC names */
        if (!data.length) {
          /* Fetch fund list and AMFI NAV file in parallel */
          const [mfRes, amfiRes] = await Promise.all([
            fetch('https://api.mfapi.in/mf'),
            fetch('https://www.amfiindia.com/spages/NAVAll.txt').catch(() => null),
          ])

          const rawFunds = await mfRes.json()

          /* Parse AMFI file to get AMC names and filter to active funds */
          let amfiMap = {}
          if (amfiRes?.ok) {
            const text = await amfiRes.text()
            amfiMap = parseAmfiNavText(text)
          }

          const hasAmfi = Object.keys(amfiMap).length > 0

          data = rawFunds
            /* Filter to active funds if we have AMFI data */
            .filter(f => !hasAmfi || amfiMap[f.schemeCode])
            .map(f => {
              const name = f.schemeName || f.scheme_name || ''
              const type = f.schemeType || f.scheme_type || ''
              /* Get AMC name from AMFI map (reliable) or fallback to mfapi field */
              const amcName = amfiMap[f.schemeCode]?.amcName
                || f.mutualFundFamily || f.mutual_fund_family || ''
              const nav = amfiMap[f.schemeCode]?.nav || 0
              const cat = getCategory(name, type)
              const sim = getSimulatedMetrics(f.schemeCode)

              return {
                schemeCode: f.schemeCode,
                schemeName: name,
                amcName,
                category:   cat,
                risk:       getRisk(cat, name),
                stars:      getStars(f.schemeCode),
                nav:        nav || sim.nav,
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
          setSource(fromBackend ? 'backend' : 'mfapi+amfi')
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
