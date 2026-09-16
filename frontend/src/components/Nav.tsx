import { useEffect, useRef, useState } from 'react'
import { searchStocks, type Index, type Pick, type SearchHit } from '../lib/api'
import { clock, pct } from '../lib/format'
import { nseStatus } from '../lib/market'

export type View = 'overview' | 'portfolio' | 'markets' | 'news'

const NAV: { key: View; label: string; code: string }[] = [
  { key: 'overview', label: 'Overview', code: 'F1' },
  { key: 'portfolio', label: 'Portfolio', code: 'F2' },
  { key: 'markets', label: 'Markets', code: 'F3' },
  { key: 'news', label: 'News', code: 'F4' },
]

const FACTS: [string, string, string][] = [
  ['Market feed', 'Live NSE, index and crypto prices', 'Refreshed every 60 seconds'],
  ['Risk model', 'Machine learning, trained on 2,000 investor profiles', 'Scores you from 0 to 100'],
  ['Portfolio engine', 'Splits capital across 5 asset classes', 'Adjusts for time horizon'],
  ['Projection', 'Monte Carlo simulation, 180 scenarios', 'Best, base and worst case'],
  ['News engine', 'NLP sentiment on live headlines', 'Rolled into a market mood index'],
  ['AI assistant', 'LLM harness with live market context', 'Runs on Claude Sonnet'],
]

export function Sidebar({ view, setView, hasPlan, onNew, onAssistant }: { view: View; setView: (v: View) => void; hasPlan: boolean; onNew: () => void; onAssistant: () => void }) {
  return (
    <aside className="hidden w-[210px] shrink-0 flex-col border-r border-line bg-panel lg:flex">
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-3.5">
        <span className="grid h-6 w-6 place-items-center bg-amber">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#050608" strokeWidth="3" strokeLinecap="round">
            <path d="M4 18 10 10l4 4 6-8" />
          </svg>
        </span>
        <div>
          <div className="text-[15px] font-semibold leading-none tracking-tight">VANTAGE</div>
          <div className="label mt-1">Investment terminal</div>
        </div>
      </div>
      <nav className="flex flex-col py-2">
        {NAV.map((n) => {
          const active = view === n.key
          const disabled = !hasPlan && (n.key === 'overview' || n.key === 'portfolio')
          return (
            <button
              key={n.key}
              disabled={disabled}
              onClick={() => setView(n.key)}
              className={`flex items-center justify-between border-l-2 px-4 py-2.5 text-[13px] transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${
                active ? 'border-amber bg-panel-2 text-text' : 'border-transparent text-muted hover:text-text'
              }`}
            >
              <span>{n.label}</span>
              <span className="mono text-[10px] text-subtle">{n.code}</span>
            </button>
          )
        })}
      </nav>
      <div className="mx-3 mt-2 border border-amber/40 bg-amber/5">
        <button onClick={onAssistant} className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-amber/10 cursor-pointer">
          <span className="mono grid h-7 w-7 shrink-0 place-items-center bg-amber text-[12px] font-bold text-bg">AI</span>
          <span>
            <span className="block text-[13px] font-semibold">Ask Vantage</span>
            <span className="label block">Live-context assistant</span>
          </span>
        </button>
      </div>
      <button onClick={onNew} className="mx-3 mt-2 border border-line-2 px-3 py-2 text-[12px] font-medium text-muted transition-colors hover:border-amber hover:text-text cursor-pointer">
        New analysis
      </button>
      <div className="mt-auto border-t border-line">
        <div className="eyebrow border-b border-line px-4 py-2">Under the hood</div>
        <dl>
          {FACTS.map(([k, v, s2]) => (
            <div key={k} className="border-b border-line px-4 py-2 last:border-b-0">
              <dt className="text-[11.5px] font-semibold text-text">{k}</dt>
              <dd className="text-[10.5px] leading-snug text-muted">{v}</dd>
              <dd className="mono text-[9.5px] uppercase tracking-wider text-subtle">{s2}</dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  )
}

export function TopBar({ onPick, view, setView, hasPlan }: { onPick: (t: string) => void; view: View; setView: (v: View) => void; hasPlan: boolean }) {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState(new Date())
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    if (!q.trim()) return setHits([])
    const t = setTimeout(() => searchStocks(q).then(setHits), 120)
    return () => clearTimeout(t)
  }, [q])
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  const status = nseStatus(now)

  return (
    <div className="flex items-center gap-4 border-b border-line bg-panel px-4 py-2">
      <div ref={box} className="relative w-[360px]">
        <span className="mono pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-amber">›</span>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search any NSE symbol or company"
          className="mono h-8 w-full border border-line bg-bg pl-6 pr-3 text-[12px] text-text outline-none placeholder:text-subtle focus:border-amber"
        />
        {open && hits.length > 0 && (
          <div className="absolute left-0 right-0 top-9 z-30 border border-line-2 bg-panel shadow-xl shadow-black/60">
            {hits.map((h) => (
              <button
                key={h.ticker}
                onMouseDown={() => {
                  onPick(h.ticker)
                  setQ('')
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-panel-2 cursor-pointer"
              >
                <span>
                  <span className="mono text-[12px] font-semibold text-amber">{h.ticker.replace('.NS', '')}</span>
                  <span className="ml-2 text-[12px]">{h.name}</span>
                </span>
                <span className="label">{h.sector}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <nav className="flex items-center gap-1 lg:hidden">
        {NAV.map((n) => (
          <button key={n.key} disabled={!hasPlan && (n.key === 'overview' || n.key === 'portfolio')} onClick={() => setView(n.key)} className={`px-2 py-1 text-xs ${view === n.key ? 'text-amber' : 'text-muted'}`}>
            {n.label}
          </button>
        ))}
      </nav>
      <div className="mono ml-auto flex items-center gap-4 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${status.open ? 'bg-up' : 'bg-amber'}`} />
          {status.label}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-up opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-up" />
          </span>
          LIVE
        </span>
        <span className="text-muted">
          {now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()} {clock(now)} IST
        </span>
      </div>
    </div>
  )
}

export function Ticker({ picks, indices }: { picks: Pick[]; indices: Index[] }) {
  const items = [...indices.map((i) => ({ label: i.name, price: i.price, change_pct: i.change_pct, idx: true })), ...picks.map((p) => ({ label: p.ticker.replace('.NS', ''), price: p.price, change_pct: p.change_pct, idx: false }))]
  if (!items.length) return null
  return (
    <div className="overflow-hidden border-b border-line bg-bg">
      <div className="ticker flex w-max whitespace-nowrap py-1">
        {[...items, ...items].map((p, i) => {
          const up = p.change_pct >= 0
          return (
            <span key={i} className="mono flex items-center gap-2 border-r border-line px-4 text-[11px]">
              <span className={`font-semibold ${p.idx ? 'text-amber' : 'text-text'}`}>{p.label}</span>
              <span className="text-muted">{p.price >= 1000 ? p.price.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : p.price.toFixed(2)}</span>
              <span className={up ? 'text-up' : 'text-down'}>
                {up ? '▲' : '▼'} {pct(Math.abs(p.change_pct), 2).replace('+', '')}
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
