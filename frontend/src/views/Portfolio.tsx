import { motion } from 'framer-motion'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import AllocationDonut from '../components/AllocationDonut'
import type { Analysis, Inputs } from '../lib/api'
import { pct, rupees } from '../lib/format'
import { COLORS, VOL } from '../lib/market'
import Card from '../ui/Card'

const RATIONALE: Record<string, string> = {
  fd: 'Capital protection. Fixed 7% with no drawdown; anchors the portfolio.',
  gold: 'Inflation hedge. Historically moves against equities in a sell-off.',
  nifty: 'Core equity. Broad exposure to the 50 largest NSE companies at low cost.',
  bluechip: 'Growth. Concentrated large-cap positions with higher expected return.',
  crypto: 'Satellite. Small, high-variance allocation for asymmetric upside.',
}

export default function Portfolio({ result, inputs }: { result: Analysis; inputs: Inputs }) {
  const rows = [...result.allocation].sort((a, b) => b.weight - a.weight)
  const vol = rows.reduce((s, a) => s + a.weight * (VOL[a.key] ?? 0.1), 0) * 0.7
  const equity = rows.filter((r) => r.key === 'nifty' || r.key === 'bluechip').reduce((s, r) => s + r.weight, 0)
  const liquid = rows.filter((r) => r.key !== 'fd').reduce((s, r) => s + r.weight, 0)
  const hhi = rows.reduce((s, r) => s + r.weight * r.weight, 0)

  const radar = [
    { k: 'Growth', v: Math.min(100, (result.projection.cagr / 0.2) * 100) },
    { k: 'Stability', v: Math.max(0, 100 - vol * 350) },
    { k: 'Liquidity', v: liquid * 100 },
    { k: 'Diversification', v: Math.max(0, (1 - hhi) * 130) },
    { k: 'Inflation hedge', v: Math.min(100, (rows.find((r) => r.key === 'gold')?.weight ?? 0) * 300 + equity * 60) },
  ]

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="space-y-4">
      <div className="cells lg:grid-cols-12">
        <AllocationDonut allocation={result.allocation} total={inputs.amount} className="lg:col-span-7" />
        <Card title="Portfolio profile" className="lg:col-span-5">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} outerRadius="75%">
                <PolarGrid stroke="#202634" />
                <PolarAngleAxis dataKey="k" tick={{ fill: '#8b93a3', fontSize: 11 }} />
                <Radar dataKey="v" stroke="#5a86d8" fill="#5a86d8" fillOpacity={0.25} isAnimationActive animationDuration={900} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mono mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded bg-panel-2 px-2 py-2">
              <div className="text-muted">Equity</div>
              <div className="mt-0.5 text-sm">{Math.round(equity * 100)}%</div>
            </div>
            <div className="rounded bg-panel-2 px-2 py-2">
              <div className="text-muted">Volatility</div>
              <div className="mt-0.5 text-sm">{(vol * 100).toFixed(1)}%</div>
            </div>
            <div className="rounded bg-panel-2 px-2 py-2">
              <div className="text-muted">Max drawdown</div>
              <div className="mt-0.5 text-sm text-down">-{(vol * 180).toFixed(0)}%</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="cells">
      <Card title="Positions" right={<span className="mono text-xs text-muted">{rows.length} asset classes · {rupees(inputs.amount)}</span>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted">
                <th className="pb-3 text-left font-semibold">Asset</th>
                <th className="pb-3 text-right font-semibold">Weight</th>
                <th className="pb-3 text-right font-semibold">Amount</th>
                <th className="pb-3 text-right font-semibold">Exp. return</th>
                <th className="pb-3 text-right font-semibold">Volatility</th>
                <th className="pb-3 pl-6 text-left font-semibold">Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.key}>
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[r.key] }} />
                      <span className="font-medium">{r.name}</span>
                    </div>
                  </td>
                  <td className="mono py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-panel-2">
                        <motion.span
                          className="block h-full"
                          style={{ background: COLORS[r.key] }}
                          initial={{ width: 0 }}
                          animate={{ width: `${r.weight * 100}%` }}
                          transition={{ duration: 0.9, delay: 0.2 }}
                        />
                      </span>
                      {Math.round(r.weight * 100)}%
                    </div>
                  </td>
                  <td className="mono py-3 text-right font-medium">{rupees(r.amount)}</td>
                  <td className="mono py-3 text-right text-up">{pct(r.expected_return * 100)}</td>
                  <td className="mono py-3 text-right text-muted">{((VOL[r.key] ?? 0.1) * 100).toFixed(0)}%</td>
                  <td className="py-3 pl-6 text-xs text-muted">{RATIONALE[r.key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      </div>
    </motion.div>
  )
}
