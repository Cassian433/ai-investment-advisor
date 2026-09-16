import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { fetchNews, type Index, type Inputs, type Mood, type NewsItem, type Pick } from '../lib/api'
import { pct, price, short } from '../lib/format'
import { series } from '../lib/spark'
import Sparkline from '../ui/Sparkline'

const HORIZONS = [1, 3, 5, 10]
const PRESETS = [100000, 500000, 1000000, 2500000]

export function riskWord(r: number): { word: string; color: string } {
  if (r < 34) return { word: 'Conservative', color: 'text-up' }
  if (r < 67) return { word: 'Moderate', color: 'text-gold' }
  return { word: 'Aggressive', color: 'text-down' }
}

function ago(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (h < 1) return 'now'
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function Landing({ onSubmit, picks, indices }: { onSubmit: (i: Inputs) => void; picks: Pick[]; indices: Index[] }) {
  const [amountText, setAmountText] = useState('5,00,000')
  const [horizon, setHorizon] = useState(5)
  const [risk, setRisk] = useState(50)
  const [news, setNews] = useState<NewsItem[]>([])
  const [mood, setMood] = useState<Mood | null>(null)
  const amount = Number(amountText.replace(/[^\d]/g, '')) || 0
  const rw = riskWord(risk)

  useEffect(() => {
    fetchNews()
      .then((d) => {
        setNews(d.news)
        setMood(d.market_mood)
      })
      .catch(() => {})
  }, [])

  function setAmount(n: number) {
    setAmountText(new Intl.NumberFormat('en-IN').format(n))
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto w-full max-w-[1400px] px-5 py-5">
      <div className="cells lg:grid-cols-12">
        <section className="p-6 lg:col-span-5 lg:p-8">
          <div className="eyebrow">New analysis</div>
          <h1 className="display mt-2 text-[28px] font-semibold leading-tight">Set the parameters</h1>
          <p className="mt-1.5 text-sm text-muted">Everything on the right is already live. Run the analysis to get the plan.</p>

          <div className="mt-8">
            <label className="eyebrow">Capital</label>
            <div className="mt-2 flex items-baseline gap-2 border-b border-line-strong transition-colors focus-within:border-accent">
              <span className="mono text-2xl text-muted">₹</span>
              <input
                inputMode="numeric"
                value={amountText}
                onChange={(e) => {
                  const d = e.target.value.replace(/[^\d]/g, '')
                  d ? setAmount(Number(d)) : setAmountText('')
                }}
                className="mono w-full bg-transparent py-2 text-[34px] font-medium outline-none"
                placeholder="5,00,000"
              />
              <span className="mono whitespace-nowrap text-sm text-muted">{amount ? short(amount) : ''}</span>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount(p)}
                  className={`mono rounded border px-2 py-0.5 text-[11px] transition-colors cursor-pointer ${
                    amount === p ? 'border-accent text-text' : 'border-line text-muted hover:text-text'
                  }`}
                >
                  {short(p)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7">
            <label className="eyebrow">Horizon</label>
            <div className="mt-2 grid grid-cols-4 overflow-hidden rounded border border-line">
              {HORIZONS.map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={`mono border-r border-line py-2.5 text-sm transition-colors last:border-r-0 cursor-pointer ${
                    h === horizon ? 'bg-accent/15 text-text' : 'text-muted hover:bg-panel-2 hover:text-text'
                  }`}
                >
                  {h} yr
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7">
            <div className="flex items-center justify-between">
              <label className="eyebrow">Risk tolerance</label>
              <span className={`mono text-xs font-semibold ${rw.color}`}>
                {rw.word} · {risk}
              </span>
            </div>
            <input type="range" min={0} max={100} value={risk} onChange={(e) => setRisk(Number(e.target.value))} className="mt-4 w-full" />
            <div className="mono mt-2 flex justify-between text-[10px] uppercase tracking-wider text-subtle">
              <span>Preserve</span>
              <span>Grow</span>
            </div>
          </div>

          <button
            disabled={amount < 1000}
            onClick={() => onSubmit({ amount, horizon_years: horizon, risk })}
            className="mt-9 w-full rounded bg-accent px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            Run analysis
          </button>
          <div className="mono mt-3 text-center text-[11px] text-subtle">Risk model, allocation, projection, live quotes, news scoring</div>
        </section>

        <div className="cells !rounded-none !border-0 lg:col-span-7">
          <section className="grid grid-cols-3 divide-x divide-line">
            {indices.map((ix) => {
              const up = ix.change_pct >= 0
              return (
                <div key={ix.ticker} className="px-5 py-4">
                  <div className="eyebrow">{ix.name}</div>
                  <div className="mono mt-1 text-xl font-medium">{ix.price >= 1000 ? ix.price.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : ix.price.toFixed(2)}</div>
                  <div className={`mono text-xs ${up ? 'text-up' : 'text-down'}`}>
                    {up ? '▲' : '▼'} {pct(Math.abs(ix.change_pct), 2).replace('+', '')}
                  </div>
                </div>
              )
            })}
          </section>

          <section className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="eyebrow">Watchlist</div>
              <div className="mono text-[11px] text-subtle">NSE · refreshes every minute</div>
            </div>
            <ul className="divide-y divide-line">
              {picks.map((p) => {
                const up = p.change_pct >= 0
                return (
                  <li key={p.ticker} className="flex items-center gap-4 py-2.5">
                    <div className="w-40 min-w-0">
                      <div className="truncate text-sm font-medium">{p.name}</div>
                      <div className="mono text-[11px] text-muted">{p.ticker.replace('.NS', '')}</div>
                    </div>
                    <div className="flex-1">
                      <Sparkline data={series(p.ticker, p.price, p.change_pct, 40)} up={up} width={160} height={26} />
                    </div>
                    <div className="mono w-28 text-right text-sm">{price(p.price)}</div>
                    <div className={`mono w-20 text-right text-sm ${up ? 'text-up' : 'text-down'}`}>{pct(p.change_pct, 2)}</div>
                  </li>
                )
              })}
              {picks.length === 0 && <li className="mono py-6 text-center text-xs text-subtle">Connecting to market feed</li>}
            </ul>
          </section>

          <section className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="eyebrow">Headlines</div>
              {mood && (
                <span className={`mono text-[11px] ${mood.label === 'Optimistic' ? 'text-up' : mood.label === 'Cautious' ? 'text-down' : 'text-gold'}`}>
                  Mood · {mood.label}
                </span>
              )}
            </div>
            <ul className="divide-y divide-line">
              {news.slice(0, 5).map((n) => (
                <li key={n.title} className="flex items-start gap-3 py-2.5">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.sentiment === 'positive' ? 'bg-up' : n.sentiment === 'negative' ? 'bg-down' : 'bg-subtle'}`} />
                  <div className="min-w-0 flex-1 truncate text-sm">{n.title}</div>
                  <span className="mono shrink-0 text-[11px] text-subtle">
                    {n.source} · {ago(n.published)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </motion.div>
  )
}
