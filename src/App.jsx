import React, { useState, useCallback } from 'react'
import Navbar from './components/Navbar'
import Explore from './pages/Explore'
import Compare from './pages/Compare'
import FundHouses from './pages/FundHouses'
import SIPCalc from './pages/SIPCalc'
import ReturnsCalc from './pages/ReturnsCalc'
import FundModal from './components/FundModal'
import { useFunds } from './hooks/useFunds'

export default function App() {
  const { funds, loading, error, stats } = useFunds()
  const [tab,           setTab]         = useState('explore')
  const [compareList,   setCompareList] = useState([])
  const [modalFund,     setModalFund]   = useState(null)
  const [rcFund,        setRcFund]      = useState(null)
  const [exploreAmc,    setExploreAmc]  = useState('')  // filter from fund house page
  const [exploreCat,    setExploreCat]  = useState('')  // filter from hero stat click

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

  /* Fund house page → Explore with AMC pre-filtered */
  const handleViewFundHouse = useCallback((amcName) => {
    setExploreAmc(amcName)
    setExploreCat('')
    setTab('explore')
  }, [])

  /* Hero stat click → filter by category */
  const handleStatClick = useCallback((cat) => {
    setExploreCat(cat)
    setExploreAmc('')
  }, [])

  const handleTab = useCallback((t) => {
    setTab(t)
    setModalFund(null)
    if (t === 'explore') { setExploreAmc(''); setExploreCat('') }
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar active={tab} onTab={handleTab} compareCount={compareList.length} />
      <main>
        <div style={{ display: tab === 'explore'    ? 'block' : 'none' }}>
          <Explore
            funds={funds} loading={loading} error={error} stats={stats}
            onDetail={setModalFund} compareList={compareList} onCompare={handleCompare}
            presetAmc={exploreAmc} presetCat={exploreCat}
            onStatClick={handleStatClick}
            onCalcReturns={handleCalcReturns}
          />
        </div>
        <div style={{ display: tab === 'fundhouses' ? 'block' : 'none' }}>
          <FundHouses funds={funds} loading={loading} onViewFunds={handleViewFundHouse} />
        </div>
        <div style={{ display: tab === 'compare'    ? 'block' : 'none' }}>
          <Compare compareList={compareList} onRemove={handleRemoveCompare} />
        </div>
        <div style={{ display: tab === 'sip'        ? 'block' : 'none' }}>
          <SIPCalc funds={funds} />
        </div>
        <div style={{ display: tab === 'returns'    ? 'block' : 'none' }}>
          <ReturnsCalc funds={funds} initialFund={rcFund} />
        </div>
      </main>
      {modalFund && (
        <FundModal
          fund={modalFund} onClose={() => setModalFund(null)}
          onCompare={handleCompare}
          inCompare={compareList.some(f => f.schemeCode === modalFund.schemeCode)}
          onCalcReturns={handleCalcReturns}
        />
      )}
    </div>
  )
}
