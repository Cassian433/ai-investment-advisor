import { useEffect, useState } from 'react'
import CandleChart from '../components/CandleChart'
import { fetchHistory, fetchQuotes, type HistPoint, type Quote, type Range } from '../lib/api'
import { pct, price } from '../lib/format'

const RANGES: { key: Range; label: string }[] = [
  { key: '1w', label: '1W' },
  { key: '1m', label: '1M' },
  { key: '3m', label: '3M' },
  { key: '1y', label: '1Y' },
  { key: '5y', label: '5Y' },
]

function fmtBig(n: number | null): string {
  if (n == null) return '—'
  if (n >= 1e12) return `₹${(n / 1e12).toFixed(2)} L Cr`
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(0)} Cr`
  if (n >= 1e5) return `${(n / 1e5).toFixed(1)} L`
  return n.toLocaleString('en-IN')
}

export default function Markets({ ticker, inWatchlist, onToggleWatch }: { ticker: string; inWatchlist: boolean; onToggleWatch: (t: string) => void }) {
  const [range, setRange] = useState<Range>('3m')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [series, setSeries] = useState<HistPoint[]>([])

  useEffect(() => {
    setQuote(null)
    fetchQuotes([ticker]).then((q) => setQuote(q[0] ?? null))
  }, [ticker])
  useEffect(() => {
    setSeries([])
    fetchHistory([ticker], range).then((h) => setSeries(h[ticker] ?? []))
  }, [ticker, range])

  const first = series[0]?.c
  const last = series[series.length - 1]?.c
  const periodChange = first && last ? ((last - first) / first) * 100 : null
  const up = (quote?.change_pct ?? 0) >= 0
  const hi = series.length ? Math.max(...series.map((s) => s.h)) : null
  const lo = series.length ? Math.min(...series.map((s) => s.l)) : null
  const stats: [string, string][] = quote
    ? [
        ['Prev close', quote.prev_close != null ? price(quote.prev_close) : '—'],
        ['Day range', quote.day_low != null && quote.day_high != null ? `${price(quote.day_low)} – ${price(quote.day_high)}` : '—'],
        ['52W range', quote.year_low != null && quote.year_high != null ? `${price(quote.year_low)} – ${price(quote.year_high)}` : '—'],
        ['Volume', quote.volume != null ? fmtBig(quote.volume) : '—'],
        ['Mkt cap', quote.market_cap != null ? fmtBig(quote.market_cap) : '—'],
        ['Sector', quote.sector || '—'],
        [`${RANGES.find((r) => r.key === range)?.label} high`, hi != null ? price(hi) : '—'],
        [`${RANGES.find((r) => r.key === range)?.label} low`, lo != null ? price(lo) : '—'],
        [`${RANGES.find((r) => r.key === range)?.label} change`, periodChange != null ? pct(periodChange, 2) : '—'],
      ]
    : []

  return (
    <div className="cells">
      <section className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="mono text-[18px] font-bold text-amber">{ticker.replace('.NS', '')}</span>
              <span className="text-[15px] font-medium">{quote?.name ?? ''}</span>
              <span className="label ml-1">{quote?.sector}</span>
              {quote?.live && <span className="mono ml-1 border border-up/40 px-1.5 text-[9.5px] text-up">LIVE</span>}
            </div>
            <div className="mono mt-2 flex items-baseline gap-3">
              <span className="text-[34px] font-medium leading-none tracking-tight">{quote ? price(quote.price) : '—'}</span>
              {quote && (
                <span className={`text-[13px] font-medium ${up ? 'text-up' : 'text-down'}`}>
                  {up ? '▲' : '▼'} {pct(Math.abs(quote.change_pct), 2).replace('+', '')} TODAY
                </span>
              )}
              {periodChange != null && (
                <span className={`text-[12px] ${periodChange >= 0 ? 'text-up' : 'text-down'}`}>
                  {pct(periodChange, 2)} <span className="text-muted">{RANGES.find((r) => r.key === range)?.label}</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex border border-line">
              {RANGES.map((r) => (
                <button key={r.key} onClick={() => setRange(r.key)} className={`mono px-2.5 py-1 text-[11px] cursor-pointer ${r.key === range ? 'bg-amber font-semibold text-bg' : 'text-muted hover:text-text'}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <button onClick={() => onToggleWatch(ticker)} className={`mono border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer ${inWatchlist ? 'border-line-2 text-muted hover:text-down' : 'border-amber text-amber hover:bg-amber hover:text-bg'}`}>
              {inWatchlist ? 'Remove' : '+ Watchlist'}
            </button>
          </div>
        </div>
      </section>
      <section className="p-0">
        {series.length > 1 ? <CandleChart data={series} range={range} height={380} /> : <div className="mono grid h-[380px] place-items-center text-[11px] text-subtle">LOADING OHLCV</div>}
      </section>
      <section className="grid grid-cols-3 divide-x divide-line">
        {stats.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between border-b border-line px-4 py-2 text-[12px]">
            <span className="label">{k}</span>
            <span className="mono">{v}</span>
          </div>
        ))}
      </section>
      {quote?.why && <section className="px-4 py-3 text-[12px] text-muted">{quote.why}</section>}
    </div>
  )
}
