import type { HistPoint, Quote } from '../lib/api'
import { pct, price } from '../lib/format'
import Sparkline from '../ui/Sparkline'

export default function Watchlist({
  quotes,
  history,
  selected,
  onSelect,
  onRemove,
}: {
  quotes: Quote[]
  history: Record<string, HistPoint[]>
  selected?: string | null
  onSelect: (t: string) => void
  onRemove?: (t: string) => void
}) {
  return (
    <aside className="hidden w-[300px] shrink-0 flex-col border-l border-line bg-panel xl:flex">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="eyebrow">Watchlist</span>
        <span className="mono text-[10px] text-subtle">{quotes.length} · 1M</span>
      </div>
      <ul className="flex-1 overflow-y-auto">
        {quotes.map((q) => {
          const up = q.change_pct >= 0
          const h = history[q.ticker]?.map((p) => p.c) ?? []
          const active = selected === q.ticker
          return (
            <li key={q.ticker} className={`group border-b border-line ${active ? 'bg-panel-2' : ''}`}>
              <button onClick={() => onSelect(q.ticker)} className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-panel-2 cursor-pointer">
                <div className="min-w-0 flex-1">
                  <div className={`mono truncate text-[12px] font-semibold ${active ? 'text-amber' : ''}`}>{q.ticker.replace('.NS', '')}</div>
                  <div className="truncate text-[11px] text-muted">{q.name}</div>
                </div>
                <Sparkline data={h} up={up} width={64} height={22} />
                <div className="mono w-[84px] text-right">
                  <div className="text-[12px]">{price(q.price)}</div>
                  <div className={`text-[11px] ${up ? 'text-up' : 'text-down'}`}>{pct(q.change_pct, 2)}</div>
                </div>
                {onRemove && (
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove(q.ticker)
                    }}
                    className="mono w-3 text-center text-subtle opacity-0 hover:text-down group-hover:opacity-100"
                    title="Remove"
                  >
                    ×
                  </span>
                )}
              </button>
            </li>
          )
        })}
        {quotes.length === 0 && <li className="mono py-6 text-center text-[11px] text-subtle">CONNECTING</li>}
      </ul>
      <div className="mono border-t border-line px-4 py-2 text-[10px] text-subtle">Search above to add any NSE symbol</div>
    </aside>
  )
}
