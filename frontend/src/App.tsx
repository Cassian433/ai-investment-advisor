import { AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import Analysing from './components/Analysing'
import Chat from './components/Chat'
import Landing from './components/Landing'
import ParamBar from './components/ParamBar'
import { Sidebar, TopBar, type View } from './components/Shell'
import { analyse, fetchPrices, type Analysis, type Index, type Inputs, type Pick } from './lib/api'
import Markets from './views/Markets'
import News from './views/News'
import Overview from './views/Overview'
import Portfolio from './views/Portfolio'

type Stage = 'input' | 'analysing' | 'result'
const POLL_MS = 60_000

export default function App() {
  const [stage, setStage] = useState<Stage>('input')
  const [view, setView] = useState<View>('overview')
  const [inputs, setInputs] = useState<Inputs | null>(null)
  const [result, setResult] = useState<Analysis | null>(null)
  const [picks, setPicks] = useState<Pick[]>([])
  const [indices, setIndices] = useState<Index[]>([])
  const [updated, setUpdated] = useState(new Date())
  const [animDone, setAnimDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const debounce = useRef<number | null>(null)

  useEffect(() => {
    const load = () =>
      fetchPrices()
        .then((d) => {
          setPicks(d.picks)
          setIndices(d.indices)
          setUpdated(new Date())
        })
        .catch(() => {})
    load()
    const id = setInterval(load, POLL_MS)
    return () => clearInterval(id)
  }, [])

  function submit(i: Inputs) {
    setInputs(i)
    setResult(null)
    setAnimDone(false)
    setStage('analysing')
    analyse(i).then((r) => {
      setResult(r)
      setPicks(r.picks)
    })
  }

  function change(i: Inputs) {
    setInputs(i)
    if (i.amount < 1000) return
    if (debounce.current) window.clearTimeout(debounce.current)
    setBusy(true)
    debounce.current = window.setTimeout(() => {
      analyse(i)
        .then((r) => {
          setResult(r)
          setPicks(r.picks)
        })
        .finally(() => setBusy(false))
    }, 250)
  }

  const onAnimDone = useCallback(() => setAnimDone(true), [])

  useEffect(() => {
    if (stage === 'analysing' && animDone && result) setStage('result')
  }, [stage, animDone, result])

  function reset() {
    setStage('input')
    setView('overview')
  }

  return (
    <div className="flex min-h-full">
      <Sidebar view={view} setView={setView} enabled={stage === 'result'} onNew={reset} onAssistant={() => setChatOpen(true)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar picks={picks} indices={indices} />
        <main className="flex-1">
          <AnimatePresence mode="wait">
            {stage === 'input' && <Landing key="input" onSubmit={submit} picks={picks} indices={indices} />}
            {stage === 'analysing' && <Analysing key="analysing" onDone={onAnimDone} />}
            {stage === 'result' && result && inputs && (
              <div key="result" className="mx-auto w-full max-w-[1400px] space-y-4 px-5 pb-6">
                <ParamBar inputs={inputs} onChange={change} busy={busy} />
                <div className="flex gap-1 lg:hidden">
                  {(['overview', 'portfolio', 'markets', 'news'] as View[]).map((v) => (
                    <button key={v} onClick={() => setView(v)} className={`rounded px-3 py-1.5 text-sm capitalize ${view === v ? 'bg-accent/15 text-text' : 'text-muted'}`}>
                      {v}
                    </button>
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  {view === 'overview' && (
                    <div key="ov">
                      <Overview result={result} inputs={inputs} picks={picks} />
                    </div>
                  )}
                  {view === 'portfolio' && (
                    <div key="pf">
                      <Portfolio result={result} inputs={inputs} />
                    </div>
                  )}
                  {view === 'markets' && (
                    <div key="mk">
                      <Markets picks={picks} updated={updated} />
                    </div>
                  )}
                  {view === 'news' && (
                    <div key="nw">
                      <News news={result.news} mood={result.market_mood} />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
      <Chat result={stage === 'result' ? result : null} inputs={stage === 'result' ? inputs : null} open={chatOpen} setOpen={setChatOpen} />
    </div>
  )
}
