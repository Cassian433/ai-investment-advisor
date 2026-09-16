import { useEffect, useState } from 'react'
import type { Index, Pick } from '../lib/api'
import { clock, pct, price } from '../lib/format'
import { nseStatus } from '../lib/market'

export type View = 'overview' | 'portfolio' | 'markets' | 'news'

const NAV: { key: View; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: 'M3 12h4l3-8 4 16 3-8h4' },
  { key: 'portfolio', label: 'Portfolio', icon: 'M12 3a9 9 0 1 0 9 9h-9z M12 3v9h9' },
  { key: 'markets', label: 'Markets', icon: 'M4 19h16M6 15l4-5 4 3 5-7' },
  { key: 'news', label: 'News', icon: 'M4 5h16v14H4z M8 9h8M8 13h8M8 17h5' },
]

function Icon({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

export function Sidebar({ view, setView, enabled, onNew, onAssistant }: { view: View; setView: (v: View) => void; enabled: boolean; onNew: () => void; onAssistant: () => void }) {
  return (
    <aside className="hidden w-52 shrink-0 flex-col border-r border-line lg:flex">
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-4">
        <span className="grid h-7 w-7 place-items-center rounded bg-accent">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <path d="M4 18 10 10l4 4 6-8" />
          </svg>
        </span>
        <div>
          <div className="display text-[16px] font-semibold leading-none">Vantage</div>
          <div className="mono mt-1 text-[10px] uppercase tracking-wider text-muted">Investment advisor</div>
        </div>
      </div>
      <nav className="flex flex-col py-2">
        {NAV.map((n) => {
          const active = view === n.key
          return (
            <button
              key={n.key}
              disabled={!enabled}
              onClick={() => setView(n.key)}
              className={`flex items-center gap-3 border-l-2 px-4 py-2.5 text-[13px] transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-35 ${
                active ? 'border-accent bg-accent/10 text-text' : 'border-transparent text-muted hover:bg-panel hover:text-text'
              }`}
            >
              <span className={active ? 'text-accent' : ''}>
                <Icon d={n.icon} />
              </span>
              {n.label}
            </button>
          )
        })}
      </nav>
      <div className="mx-3 mt-3">
        <button
          onClick={onAssistant}
          className="flex w-full items-center gap-3 rounded border border-accent/40 bg-accent/10 px-3 py-3 text-left transition-colors hover:bg-accent/20 cursor-pointer"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-accent text-[13px] font-bold text-white">V</span>
          <span>
            <span className="block text-[13px] font-semibold">Ask Vantage</span>
            <span className="block text-[11px] text-muted">Assistant on live data</span>
          </span>
        </button>
      </div>
      <div className="mt-auto border-t border-line p-3">
        <button onClick={onNew} className="w-full rounded border border-line-strong px-3 py-2 text-[13px] font-medium transition-colors hover:border-accent hover:text-text cursor-pointer">
          New analysis
        </button>
        <div className="mono mt-3 text-[10px] leading-relaxed text-subtle">
          Quotes and news: Yahoo Finance
          <br />
          Risk model: logistic regression
          <br />
          Assistant: Claude Sonnet
        </div>
      </div>
    </aside>
  )
}

export function TopBar({ picks, indices }: { picks: Pick[]; indices: Index[] }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const status = nseStatus(now)
  const items = [...indices.map((i) => ({ ...i, label: i.name })), ...picks.map((p) => ({ ...p, label: p.ticker.replace('.NS', '') }))]

  return (
    <div className="border-b border-line">
      <div className="flex items-center justify-between px-5 py-2">
        <div className="mono flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${status.open ? 'bg-up' : 'bg-gold'}`} />
            {status.label.toUpperCase()}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-up opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-up" />
            </span>
            LIVE
          </span>
        </div>
        <div className="mono text-[11px] text-muted">
          {now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()} · {clock(now)} IST
        </div>
      </div>
      {items.length > 0 && (
        <div className="overflow-hidden border-t border-line bg-panel">
          <div className="ticker flex w-max whitespace-nowrap py-1.5">
            {[...items, ...items].map((p, i) => {
              const up = p.change_pct >= 0
              const isIndex = i % items.length < indices.length
              return (
                <span key={i} className="mono flex items-center gap-2 border-r border-line px-5 text-[11.5px]">
                  <span className={`font-semibold ${isIndex ? 'text-gold' : 'text-text'}`}>{p.label}</span>
                  <span className="text-muted">{p.price >= 1000 ? p.price.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : price(p.price)}</span>
                  <span className={up ? 'text-up' : 'text-down'}>
                    {up ? '▲' : '▼'} {pct(Math.abs(p.change_pct), 2).replace('+', '')}
                  </span>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
