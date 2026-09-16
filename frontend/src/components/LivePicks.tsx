import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { fetchPrices, type Pick } from '../lib/api'
import { pct, price } from '../lib/format'
import Card from './Card'

const POLL_MS = 30_000

export default function LivePicks({ initial }: { initial: Pick[] }) {
  const [picks, setPicks] = useState(initial)
  const [updated, setUpdated] = useState(new Date())

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        setPicks(await fetchPrices())
        setUpdated(new Date())
      } catch {
        /* keep the last good prices */
      }
    }, POLL_MS)
    return () => clearInterval(id)
  }, [])

  const anyLive = picks.some((p) => p.live)

  return (
    <Card
      title="What to buy today"
      right={
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span className={`h-1.5 w-1.5 rounded-full ${anyLive ? 'bg-up' : 'bg-muted'}`} />
          {anyLive ? 'Live prices' : 'Last known prices'} · {updated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      }
    >
      <ul className="divide-y divide-line">
        {picks.map((p, i) => {
          const up = p.change_pct >= 0
          return (
            <motion.li
              key={p.ticker}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.07 }}
              className="py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-muted">{p.ticker.replace('.NS', '')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="num font-medium">{price(p.price)}</div>
                  <div className={`num text-xs font-medium ${up ? 'text-up' : 'text-down'}`}>
                    {up ? '▲' : '▼'} {pct(Math.abs(p.change_pct)).replace('+', '')}
                  </div>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted leading-relaxed">{p.why}</p>
            </motion.li>
          )
        })}
      </ul>
    </Card>
  )
}
