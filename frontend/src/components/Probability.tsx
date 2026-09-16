import { motion } from 'framer-motion'
import type { Analysis, Inputs } from '../lib/api'
import { VOL } from '../lib/market'
import { pAbove } from '../lib/prob'
import Card from '../ui/Card'

export default function Probability({ result, inputs, className = '' }: { result: Analysis; inputs: Inputs; className?: string }) {
  const mu = result.projection.cagr
  const sigma = result.allocation.reduce((s, a) => s + a.weight * (VOL[a.key] ?? 0.1), 0) * 0.7
  const T = inputs.horizon_years
  const fd = Math.pow(1.07, T)

  const rows = [
    { label: 'Ends above what you put in', p: pAbove(1, mu, sigma, T), tone: '#2ea36b' },
    { label: 'Beats a 7% fixed deposit', p: pAbove(fd, mu, sigma, T), tone: '#5a86d8' },
    { label: 'Grows 1.5x', p: pAbove(1.5, mu, sigma, T), tone: '#d4a54a' },
    { label: 'Doubles', p: pAbove(2, mu, sigma, T), tone: '#8f7fc9' },
    { label: 'Loses more than 20%', p: 1 - pAbove(0.8, mu, sigma, T), tone: '#d64545' },
  ]

  return (
    <Card title="Likelihood of outcomes" className={className} right={<span className="mono text-xs text-muted">{T}Y · σ {(sigma * 100).toFixed(0)}%</span>}>
      <ul className="space-y-3.5">
        {rows.map((r) => (
          <li key={r.label}>
            <div className="flex items-center justify-between text-sm">
              <span>{r.label}</span>
              <span className="mono font-medium" style={{ color: r.tone }}>
                {Math.round(r.p * 100)}%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-panel-2">
              <motion.div
                className="h-full rounded-full"
                style={{ background: r.tone }}
                initial={{ width: 0 }}
                animate={{ width: `${r.p * 100}%` }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs leading-relaxed text-muted">
        From the portfolio's expected return and volatility, assuming returns are log-normal. Move the risk slider and watch these shift.
      </p>
    </Card>
  )
}
