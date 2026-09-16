import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import Analysing from './components/Analysing'
import Chat from './components/Chat'
import { Sidebar, Ticker, TopBar, type View } from './components/Nav'
import Setup from './components/Setup'
import Watchlist from './components/Watchlist'
import { analyse, fetchHistory, fetchNews, fetchPrices, fetchQuotes, type Analysis, type HistPoint, type Index, type Inputs, type Mood, type NewsItem, type Pick, type Quote } from './lib/api'
import { loadWatchlist, saveWatchlist } from './lib/store'
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
  const [watch, setWatch] = useState<string[]>(loadWatchlist)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [hist, setHist] = useState<Record<string, HistPoint[]>>({})
  const [news, setNews] = useState<NewsItem[]>([])
  const [mood, setMood] = useState<Mood | null>(null)
  const [selected, setSelected] = useState('RELIANCE.NS')
  const [animDone, setAnimDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const debounce = useRef<number | null>(null)

  useEffect(() => {
    const load = () => {
      fetchPrices().then((d) => { setPicks(d.picks); setIndices(d.indices) }).catch(() => {})
      fetchNews().then((d) => { setNews(d.news); setMood(d.market_mood) }).catch(() => {})
    }
    load()
    const id = setInterval(load, POLL_MS)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    saveWatchlist(watch)
    let alive = true
    const load = () => {
      fetchQuotes(watch).then((q) => alive && setQuotes(q)).catch(() => {})
      fetchHistory(watch, '1m').then((h) => alive && setHist((prev) => ({ ...prev, ...h }))).catch(() => {})
    }
    load()
    const id = setInterval(load, POLL_MS)
    return () => { alive = false; clearInterval(id) }
  }, [watch])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setChatOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function submit(i: Inputs) {
    setInputs(i); setResult(null); setAnimDone(false); setStage('analysing')
    analyse(i).then(setResult)
  }
  function change(i: Inputs) {
    setInputs(i)
    if (i.amount < 1000) return
    if (debounce.current) window.clearTimeout(debounce.current)
    setBusy(true)
    debounce.current = window.setTimeout(() => analyse(i).then(setResult).finally(() => setBusy(false)), 250)
  }
  const onAnimDone = useCallback(() => setAnimDone(true), [])
  useEffect(() => {
    if (stage === 'analysing' && animDone && result) { setStage('result'); setView('overview') }
  }, [stage, animDone, result])

  function openStock(t: string) {
    setSelected(t); setView('markets')
    if (stage === 'input') setStage('result')
  }
  function toggleWatch(t: string) {
    setWatch((w) => (w.includes(t) ? w.filter((x) => x !== t) : [...w, t]))
  }
  function goto(v: View) {
    setView(v)
    if (stage === 'input' && (v === 'markets' || v === 'news')) setStage('result')
  }
  function reset() { setStage('input'); setView('overview') }

  const hasPlan = !!result && !!inputs

  return (
    <div className="flex h-full">
      <Sidebar view={stage === 'input' ? 'overview' : view} setView={goto} hasPlan={hasPlan} onNew={reset} onAssistant={() => setChatOpen((o) => !o)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onPick={openStock} view={view} setView={goto} hasPlan={hasPlan} />
        <Ticker picks={picks} indices={indices} />
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto p-3">
            <AnimatePresence mode="wait">
              {stage === 'input' && (
                <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Setup onSubmit={submit} indices={indices} news={news} mood={mood} />
                </motion.div>
              )}
              {stage === 'analysing' && <Analysing key="analysing" onDone={onAnimDone} />}
              {stage === 'result' && (
                <motion.div key={`v-${view}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                  {view === 'overview' && hasPlan && <Overview result={result!} inputs={inputs!} onChange={change} busy={busy} onOpenNews={() => setView('news')} />}
                  {view === 'overview' && !hasPlan && <Setup onSubmit={submit} indices={indices} news={news} mood={mood} />}
                  {view === 'portfolio' && hasPlan && <Portfolio result={result!} inputs={inputs!} />}
                  {view === 'markets' && <Markets ticker={selected} inWatchlist={watch.includes(selected)} onToggleWatch={toggleWatch} />}
                  {view === 'news' && <News news={result?.news ?? news} mood={result?.market_mood ?? mood} />}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
          <Watchlist quotes={quotes} history={hist} selected={view === 'markets' && stage === 'result' ? selected : null} onSelect={openStock} onRemove={toggleWatch} />
        </div>
      </div>
      <Chat result={hasPlan ? result : null} inputs={hasPlan ? inputs : null} open={chatOpen} setOpen={setChatOpen} />
    </div>
  )
}
