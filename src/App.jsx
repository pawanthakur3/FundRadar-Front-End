import React, { useState, useCallback, useEffect } from 'react'
import Sidebar from './components/Navbar'
import Explore from './pages/Explore'
import Compare from './pages/Compare'
import FundHouses from './pages/FundHouses'
import SIPCalc from './pages/SIPCalc'
import ReturnsCalc from './pages/ReturnsCalc'
import Overlap from './pages/Overlap'
import TaxCalc from './pages/TaxCalc'
import Watchlist from './pages/Watchlist'
import FundModal from './components/FundModal'
import { useFunds } from './hooks/useFunds'

const LS_KEY = 'fundradar_watchlist'
function loadWatchCodes() { try { return JSON.parse(localStorage.getItem(LS_KEY)||'[]') } catch { return [] } }

export default function App() {
  const { funds, loading, error, stats } = useFunds()
  const [tab,         setTab]         = useState('explore')
  const [compareList, setCompareList] = useState([])
  const [modalFund,   setModalFund]   = useState(null)
  const [rcFund,      setRcFund]      = useState(null)
  const [exploreAmc,  setExploreAmc]  = useState('')
  const [exploreCat,  setExploreCat]  = useState('')
  const [watchCodes,  setWatchCodes]  = useState(loadWatchCodes)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  /* Persist watchlist */
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(watchCodes)) } catch {}
  }, [watchCodes])

  /* Keep watchCodes in sync if Watchlist page modifies localStorage */
  useEffect(() => {
    const sync = () => setWatchCodes(loadWatchCodes())
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const toggleWatch = useCallback((code) => {
    setWatchCodes(p => p.includes(code) ? p.filter(c => c !== code) : [code, ...p])
  }, [])

  const isWatched = useCallback((code) => watchCodes.includes(code), [watchCodes])

  const handleCompare = useCallback((code) => {
    setCompareList(prev => {
      const already = prev.find(f => f.schemeCode === code)
      if (already) return prev.filter(f => f.schemeCode !== code)
      if (prev.length >= 3) { alert('Max 3 funds. Remove one first.'); return prev }
      const fund = funds.find(f => f.schemeCode === code)
      return fund ? [...prev, fund] : prev
    })
  }, [funds])

  const handleRemoveCompare = useCallback((code) => {
    setCompareList(prev => prev.filter(f => f.schemeCode !== code))
  }, [])

  const handleCalcReturns = useCallback((fund) => {
    setRcFund(fund); setTab('returns')
  }, [])

  const handleViewFundHouse = useCallback((amcName) => {
    setExploreAmc(amcName); setExploreCat(''); setTab('explore')
  }, [])

  const handleStatClick = useCallback((cat) => {
    setExploreCat(cat); setExploreAmc('')
  }, [])

  const handleTab = useCallback((t) => {
    setTab(t); setModalFund(null)
    if (t === 'explore') { setExploreAmc(''); setExploreCat('') }
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex' }}>
      <Sidebar active={tab} onTab={handleTab}
        compareCount={compareList.length}
        watchCount={watchCodes.length}
        onCollapse={setSidebarCollapsed} />
      {/* Main content — offset left to clear sidebar (220px expanded, 64px collapsed) */}
      <main style={{ flex: 1, minWidth: 0, marginLeft: sidebarCollapsed ? 64 : 220, transition: 'margin-left 0.2s ease' }}>
        <div style={{ display: tab==='explore'    ? 'block':'none' }}>
          <Explore funds={funds} loading={loading} error={error} stats={stats}
            onDetail={setModalFund} compareList={compareList} onCompare={handleCompare}
            presetAmc={exploreAmc} presetCat={exploreCat} onStatClick={handleStatClick}
            onCalcReturns={handleCalcReturns}
            watchCodes={watchCodes} onToggleWatch={toggleWatch} />
        </div>
        <div style={{ display: tab==='fundhouses' ? 'block':'none' }}>
          <FundHouses funds={funds} loading={loading} onViewFunds={handleViewFundHouse} />
        </div>
        <div style={{ display: tab==='watchlist'  ? 'block':'none' }}>
          <Watchlist funds={funds} onDetail={setModalFund} onCalcReturns={handleCalcReturns} />
        </div>
        <div style={{ display: tab==='compare'    ? 'block':'none' }}>
          <Compare compareList={compareList} onRemove={handleRemoveCompare} />
        </div>
        <div style={{ display: tab==='sip'        ? 'block':'none' }}>
          <SIPCalc funds={funds} />
        </div>
        <div style={{ display: tab==='returns'    ? 'block':'none' }}>
          <ReturnsCalc funds={funds} initialFund={rcFund} />
        </div>
        <div style={{ display: tab==='overlap'    ? 'block':'none' }}>
          <Overlap funds={funds} />
        </div>
        <div style={{ display: tab==='tax'        ? 'block':'none' }}>
          <TaxCalc funds={funds} />
        </div>
      </main>
      {modalFund && (
        <FundModal fund={modalFund} onClose={() => setModalFund(null)}
          onCompare={handleCompare}
          inCompare={compareList.some(f => f.schemeCode===modalFund.schemeCode)}
          onCalcReturns={handleCalcReturns}
          isWatched={isWatched(modalFund.schemeCode)}
          onToggleWatch={() => toggleWatch(modalFund.schemeCode)} />
      )}
    </div>
  )
}
