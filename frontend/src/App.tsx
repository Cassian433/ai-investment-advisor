import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import AllocationDonut from './components/AllocationDonut'
import Analysing from './components/Analysing'
import Header from './components/Header'
import InputPanel from './components/InputPanel'
import LivePicks from './components/LivePicks'
import NewsFeed from './components/NewsFeed'
import Projection from './components/Projection'
import RiskGauge from './components/RiskGauge'
import { analyse, type Analysis, type Inputs } from './lib/api'

type Stage = 'input' | 'analysing' | 'result'

export default function App() {
  const [stage, setStage] = useState<Stage>('input')
  const [inputs, setInputs] = useState<Inputs | null>(null)
  const [result, setResult] = useState<Analysis | null>(null)
  const [animDone, setAnimDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function submit(i: Inputs) {
    setInputs(i)
    setResult(null)
    setAnimDone(false)
    setError(null)
    setStage('analysing')
    analyse(i)
      .then(setResult)
      .catch((e) => setError(String(e)))
  }

  const onAnimDone = useCallback(() => setAnimDone(true), [])

  function reset() {
    setStage('input')
    setResult(null)
  }

  useEffect(() => {
    if (stage === 'analysing' && animDone && (result || error)) setStage('result')
  }, [stage, animDone, result, error])

  return (
    <div className="min-h-full flex flex-col">
      <Header onReset={reset} showReset={stage === 'result'} />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {stage === 'input' && <InputPanel key="input" onSubmit={submit} />}
          {stage === 'analysing' && <Analysing key="analysing" onDone={onAnimDone} />}
          {stage === 'result' && result && inputs && (
            <motion.div
              key="result"
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              variants={{ show: { transition: { staggerChildren: 0.08 } } }}
              className="mx-auto w-full max-w-7xl px-6 py-8"
            >
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                <Projection data={result.projection} amount={inputs.amount} horizon={inputs.horizon_years} />
                <div className="lg:col-span-4">
                  <RiskGauge score={result.risk_score} label={result.risk_label} sentence={result.risk_sentence} />
                </div>
                <div className="lg:col-span-4">
                  <AllocationDonut allocation={result.allocation} total={inputs.amount} />
                </div>
                <div className="lg:col-span-4">
                  <LivePicks initial={result.picks} />
                </div>
                <div className="lg:col-span-4">
                  <NewsFeed news={result.news} mood={result.market_mood} />
                </div>
              </div>
              <p className="mt-8 text-center text-xs text-muted">
                Projections are estimates from long-run average returns. Prices and news are live from Yahoo Finance.
              </p>
            </motion.div>
          )}
          {stage === 'result' && error && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-md px-6 py-24 text-center">
              <p className="text-lg">Could not reach the market data service.</p>
              <p className="mt-2 text-sm text-muted">{error}</p>
              <button onClick={reset} className="mt-6 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg cursor-pointer">
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
