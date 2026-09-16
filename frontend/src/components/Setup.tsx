import { useState } from 'react'
import type { Index, Inputs, Mood, NewsItem } from '../lib/api'
import { pct, short } from '../lib/format'

const HORIZONS = [1, 3, 5, 10]
const PRESETS = [100000, 500000, 1000000, 2500000]

export function riskWord(r: number): { word: string; cls: string } {
  if (r < 34) return { word: 'Conservative', cls: 'text-up' }
  if (r < 67) return { word: 'Moderate', cls: 'text-amber' }
  return { word: 'Aggressive', cls: 'text-down' }
}

export default function Setup({ onSubmit, indices, news, mood }: { onSubmit: (i: Inputs) => void; indices: Index[]; news: NewsItem[]; mood: Mood | null }) {
  const [amountText, setAmountText] = useState('5,00,000')
  const [horizon, setHorizon] = useState(5)
  const [risk, setRisk] = useState(50)
  const amount = Number(amountText.replace(/[^\d]/g, '')) || 0
  const rw = riskWord(risk)
  const setAmount = (n: number) => setAmountText(new Intl.NumberFormat('en-IN').format(n))

  return (
    <div className="cells lg:grid-cols-12">
      <section className="p-6 lg:col-span-7 lg:p-8">
        <div className="eyebrow">New analysis</div>
        <h1 className="mt-2 text-[24px] font-semibold tracking-tight">Set the parameters</h1>
        <p className="mt-1 text-[13px] text-muted">Capital, horizon, risk. The rest is computed from live data.</p>

        <div className="mt-8">
          <div className="label">Capital</div>
          <div className="mt-1 flex items-baseline gap-2 border-b border-line-2 focus-within:border-amber">
            <span className="mono text-[28px] text-muted">₹</span>
            <input
              inputMode="numeric"
              value={amountText}
              onChange={(e) => {
                const d = e.target.value.replace(/[^\d]/g, '')
                d ? setAmount(Number(d)) : setAmountText('')
              }}
              className="mono w-full bg-transparent py-1.5 text-[38px] font-medium outline-none"
              placeholder="5,00,000"
            />
            <span className="mono whitespace-nowrap text-[12px] text-subtle">{amount ? short(amount) : ''}</span>
          </div>
          <div className="mt-2.5 flex gap-1.5">
            {PRESETS.map((p) => (
              <button key={p} onClick={() => setAmount(p)} className={`mono border px-2 py-0.5 text-[11px] transition-colors cursor-pointer ${amount === p ? 'border-amber text-amber' : 'border-line text-muted hover:text-text'}`}>
                {short(p)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7">
          <div className="label">Horizon</div>
          <div className="mt-2 grid grid-cols-4 border border-line">
            {HORIZONS.map((h) => (
              <button key={h} onClick={() => setHorizon(h)} className={`mono border-r border-line py-2 text-[12px] transition-colors last:border-r-0 cursor-pointer ${h === horizon ? 'bg-amber text-bg font-semibold' : 'text-muted hover:bg-panel-2 hover:text-text'}`}>
                {h}Y
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7">
          <div className="flex items-center justify-between">
            <div className="label">Risk tolerance</div>
            <span className={`mono text-[12px] font-semibold ${rw.cls}`}>
              {rw.word.toUpperCase()} {risk}
            </span>
          </div>
          <input type="range" min={0} max={100} value={risk} onChange={(e) => setRisk(Number(e.target.value))} className="mt-4 w-full" />
          <div className="label mt-2 flex justify-between">
            <span>Preserve</span>
            <span>Grow</span>
          </div>
        </div>

        <button
          disabled={amount < 1000}
          onClick={() => onSubmit({ amount, horizon_years: horizon, risk })}
          className="mono mt-9 w-full bg-amber py-3 text-[13px] font-bold uppercase tracking-wider text-bg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        >
          Run analysis
        </button>
      </section>

      <div className="cells !border-0 lg:col-span-5">
        <section className="grid grid-cols-3 divide-x divide-line">
          {indices.map((ix) => {
            const up = ix.change_pct >= 0
            return (
              <div key={ix.ticker} className="px-4 py-3">
                <div className="eyebrow">{ix.name}</div>
                <div className="mono mt-1 text-[18px] font-medium">{ix.price >= 1000 ? ix.price.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : ix.price.toFixed(2)}</div>
                <div className={`mono text-[11px] ${up ? 'text-up' : 'text-down'}`}>{pct(ix.change_pct, 2)}</div>
              </div>
            )
          })}
          {indices.length === 0 && <div className="mono col-span-3 px-4 py-3 text-[11px] text-subtle">CONNECTING</div>}
        </section>
        <section className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="eyebrow">Headlines</span>
            {mood && <span className={`mono text-[10.5px] ${mood.label === 'Optimistic' ? 'text-up' : mood.label === 'Cautious' ? 'text-down' : 'text-amber'}`}>MOOD {mood.label.toUpperCase()}</span>}
          </div>
          <ul className="divide-y divide-line">
            {news.slice(0, 7).map((n) => (
              <li key={n.title} className="flex items-start gap-2.5 py-2">
                <span className={`mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full ${n.sentiment === 'positive' ? 'bg-up' : n.sentiment === 'negative' ? 'bg-down' : 'bg-subtle'}`} />
                <div className="min-w-0">
                  <div className="truncate text-[12.5px]">{n.title}</div>
                  <div className="mono text-[10px] text-subtle">{n.source.toUpperCase()}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
