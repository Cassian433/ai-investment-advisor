import { motion } from 'framer-motion'
import { useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts'
import type { Pick } from '../lib/api'
import { pct, price } from '../lib/format'
import { series } from '../lib/spark'
import Card from '../ui/Card'
import Sparkline from '../ui/Sparkline'

function signal(p: Pick): { label: string; cls: string } {
  if (p.change_pct > 0.8) return { label: 'BUY', cls: 'bg-up/15 text-up border-up/30' }
  if (p.change_pct < -0.8) return { label: 'WATCH', cls: 'bg-down/15 text-down border-down/30' }
  return { label: 'HOLD', cls: 'bg-gold/15 text-gold border-gold/30' }
}

export default function Markets({ picks, updated }: { picks: Pick[]; updated: Date }) {
  const [sel, setSel] = useState(picks[0]?.ticker)
  const active = picks.find((p) => p.ticker === sel) ?? picks[0]
  const data = active ? series(active.ticker, active.price, active.change_pct, 60, 0.015).map((v, i) => ({ i, v })) : []
  const up = (active?.change_pct ?? 0) >= 0
  const color = up ? '#2ea36b' : '#d64545'

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="cells lg:grid-cols-12">
      <Card
        title="Watchlist"
        className="lg:col-span-5"
        right={<span className="mono text-xs text-muted">Updated {updated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span>}
      >
        <ul className="divide-y divide-line">
          {picks.map((p) => {
            const pu = p.change_pct >= 0
            const s = signal(p)
            return (
              <li key={p.ticker}>
                <button
                  onClick={() => setSel(p.ticker)}
                  className={`flex w-full items-center gap-3 rounded px-2 py-3 text-left transition-colors cursor-pointer ${
                    p.ticker === active?.ticker ? 'bg-panel-2' : 'hover:bg-panel-2/60'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{p.name}</span>
                      <span className={`rounded border px-1.5 py-px text-[10px] font-semibold ${s.cls}`}>{s.label}</span>
                    </div>
                    <div className="mono text-xs text-muted">
                      {p.ticker} · {p.live ? 'live' : 'last close'}
                    </div>
                  </div>
                  <Sparkline data={series(p.ticker, p.price, p.change_pct, 30)} up={pu} width={72} height={24} />
                  <div className="mono w-28 text-right">
                    <div className="text-sm">{price(p.price)}</div>
                    <div className={`text-xs ${pu ? 'text-up' : 'text-down'}`}>{pct(p.change_pct, 2)}</div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </Card>

      {active && (
        <Card className="lg:col-span-7" highlight>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="display text-2xl font-semibold">{active.name}</h2>
                <span className="mono rounded border border-line px-1.5 py-px text-[11px] text-muted">{active.ticker}</span>
              </div>
              <div className="mono mt-2 flex items-baseline gap-3">
                <span className="text-4xl font-medium">{price(active.price)}</span>
                <span className={`text-base font-medium ${up ? 'text-up' : 'text-down'}`}>
                  {up ? '▲' : '▼'} {pct(Math.abs(active.change_pct), 2).replace('+', '')} today
                </span>
              </div>
            </div>
            <div className="mono grid grid-cols-3 gap-4 text-right text-xs">
              <div>
                <div className="text-muted">Prev close</div>
                <div className="mt-0.5 text-sm">{price(active.price / (1 + active.change_pct / 100))}</div>
              </div>
              <div>
                <div className="text-muted">60d low</div>
                <div className="mt-0.5 text-sm">{price(Math.min(...data.map((d) => d.v)))}</div>
              </div>
              <div>
                <div className="text-muted">60d high</div>
                <div className="mt-0.5 text-sm">{price(Math.max(...data.map((d) => d.v)))}</div>
              </div>
            </div>
          </div>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="tickFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis domain={['dataMin', 'dataMax']} hide />
                <Tooltip
                  contentStyle={{ background: '#161b25', border: '1px solid #2b3342', borderRadius: 8, fontSize: 12, fontFamily: 'JetBrains Mono' }}
                  labelFormatter={(i) => `${60 - Number(i)} sessions ago`}
                  formatter={(v: unknown) => [price(Number(v)), active.ticker]}
                />
                <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill="url(#tickFill)" dot={false} isAnimationActive animationDuration={800} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">{active.why}</p>
        </Card>
      )}
    </motion.div>
  )
}
