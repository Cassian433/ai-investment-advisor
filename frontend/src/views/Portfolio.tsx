import { motion } from 'framer-motion'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import type { Analysis, Inputs } from '../lib/api'
import { pct, rupees } from '../lib/format'
import { COLORS, VOL } from '../lib/market'

const WHY: Record<string, string> = {
  fd: 'Fixed 7% with no swings. The part you never worry about.',
  gold: 'Tends to hold value when stocks fall. A cushion.',
  nifty: 'The 50 biggest companies on the NSE in one fund, at low cost.',
  bluechip: 'Large established companies with room to grow. Higher return, bigger swings.',
  crypto: 'Small slice, very volatile. Could go far either way.',
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
    <div className="space-y-3">
      <div className="cells grid-cols-2 lg:grid-cols-4">
        {[
          ['Capital', rupees(inputs.amount), ''],
          ['Equity', `${Math.round(equity * 100)}%`, 'NIFTY + BLUECHIP'],
          ['Expected return', pct(result.projection.cagr * 100), 'PER YEAR'],
          ['Typical swing', `±${(vol * 100).toFixed(1)}%`, `BAD YEAR −${(vol * 180).toFixed(0)}%`],
        ].map(([k, v, s]) => (
          <div key={k} className="px-4 py-3">
            <div className="eyebrow">{k}</div>
            <div className="mono mt-1.5 text-[20px] font-medium leading-none">{v}</div>
            {s && <div className="mono mt-1.5 text-[10.5px] text-subtle">{s}</div>}
          </div>
        ))}
      </div>
      <div className="cells lg:grid-cols-12">
        <section className="p-4 lg:col-span-8">
          <div className="eyebrow">Positions</div>
          <div className="mt-3 flex h-1.5 w-full overflow-hidden">
            {rows.map((r) => (
              <motion.div key={r.key} style={{ background: COLORS[r.key] }} initial={false} animate={{ width: `${r.weight * 100}%` }} transition={{ duration: 0.5 }} />
            ))}
          </div>
          <table className="mt-2 w-full text-[12px]">
            <thead>
              <tr className="label text-left">
                <th className="py-1.5 font-normal">Holding</th>
                <th className="py-1.5 text-right font-normal">Weight</th>
                <th className="py-1.5 text-right font-normal">Amount</th>
                <th className="py-1.5 text-right font-normal">Exp. return</th>
                <th className="py-1.5 text-right font-normal">Vol</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t border-line align-top">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2" style={{ background: COLORS[r.key] }} />
                      <span className="font-medium">{r.name}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted">{WHY[r.key]}</div>
                  </td>
                  <td className="mono py-2.5 text-right">{Math.round(r.weight * 100)}%</td>
                  <td className="mono py-2.5 text-right">{rupees(r.amount)}</td>
                  <td className="mono py-2.5 text-right text-up">{pct(r.expected_return * 100)}</td>
                  <td className="mono py-2.5 text-right text-muted">{Math.round((VOL[r.key] ?? 0.1) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="p-4 lg:col-span-4">
          <div className="eyebrow">Profile</div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} outerRadius="72%">
                <PolarGrid stroke="#1c1f27" />
                <PolarAngleAxis dataKey="k" tick={{ fill: '#8f93a0', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <Radar dataKey="v" stroke="#f5a524" fill="#f5a524" fillOpacity={0.2} isAnimationActive animationDuration={800} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  )
}
