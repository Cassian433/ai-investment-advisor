import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect } from 'react'
import FanChart from '../components/FanChart'
import { riskWord } from '../components/Setup'
import type { Analysis, Inputs } from '../lib/api'
import { pct, rupees, short } from '../lib/format'
import { COLORS, VOL } from '../lib/market'
import { pAbove } from '../lib/prob'

const HORIZONS = [1, 3, 5, 10]
const R = 80
const CIRC = Math.PI * R

function CountUp({ to }: { to: number }) {
  const mv = useMotionValue(to)
  const text = useTransform(mv, (v) => rupees(v))
  useEffect(() => {
    const c = animate(mv, to, { duration: 0.7, ease: 'easeOut' })
    return c.stop
  }, [to, mv])
  return <motion.span>{text}</motion.span>
}

function Kpi({ label, value, sub, tone = '' }: { label: string; value: React.ReactNode; sub?: string; tone?: string }) {
  return (
    <div className="px-4 py-3">
      <div className="eyebrow">{label}</div>
      <div className={`mono mt-1.5 text-[20px] font-medium leading-none ${tone}`}>{value}</div>
      {sub && <div className="mono mt-1.5 text-[10.5px] text-subtle">{sub}</div>}
    </div>
  )
}

export default function Overview({ result, inputs, onChange, busy, onOpenNews }: { result: Analysis; inputs: Inputs; onChange: (i: Inputs) => void; busy: boolean; onOpenNews: () => void }) {
  const p = result.projection
  const T = inputs.horizon_years
  const gain = p.final - inputs.amount
  const sigma = result.allocation.reduce((s, a) => s + a.weight * (VOL[a.key] ?? 0.1), 0) * 0.7
  const sharpe = (p.cagr - 0.07) / Math.max(sigma, 0.01)
  const alloc = [...result.allocation].sort((a, b) => b.weight - a.weight)
  const rw = riskWord(inputs.risk)
  const gaugeColor = result.risk_score < 34 ? '#34c77b' : result.risk_score < 67 ? '#f5a524' : '#ff4d4f'
  const probs = [
    ['Ends above what you put in', pAbove(1, p.cagr, sigma, T)],
    ['Beats a 7% fixed deposit', pAbove(Math.pow(1.07, T), p.cagr, sigma, T)],
    ['Grows 1.5x', pAbove(1.5, p.cagr, sigma, T)],
    ['Doubles', pAbove(2, p.cagr, sigma, T)],
    ['Loses more than 20%', 1 - pAbove(0.8, p.cagr, sigma, T)],
  ] as [string, number][]
  const moodTone = result.market_mood.label === 'Optimistic' ? 'text-up' : result.market_mood.label === 'Cautious' ? 'text-down' : 'text-amber'

  return (
    <div className="space-y-3">
      <div className="cells flex flex-wrap items-center gap-x-6 gap-y-2 !bg-panel px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="label">Capital</span>
          <span className="mono flex items-baseline gap-0.5 border-b border-line-2 focus-within:border-amber">
            <span className="text-muted">₹</span>
            <input inputMode="numeric" value={new Intl.NumberFormat('en-IN').format(inputs.amount)} onChange={(e) => onChange({ ...inputs, amount: Number(e.target.value.replace(/[^\d]/g, '')) || 0 })} className="w-24 bg-transparent py-0.5 text-[12px] font-medium outline-none" />
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="label">Horizon</span>
          <div className="flex border border-line">
            {HORIZONS.map((h) => (
              <button key={h} onClick={() => onChange({ ...inputs, horizon_years: h })} className={`mono px-2.5 py-0.5 text-[11px] cursor-pointer ${h === T ? 'bg-amber font-semibold text-bg' : 'text-muted hover:text-text'}`}>
                {h}Y
              </button>
            ))}
          </div>
        </div>
        <div className="flex min-w-[240px] flex-1 items-center gap-3">
          <span className="label">Risk</span>
          <input type="range" min={0} max={100} value={inputs.risk} onChange={(e) => onChange({ ...inputs, risk: Number(e.target.value) })} className="flex-1" />
          <span className={`mono w-32 text-right text-[11px] font-semibold ${rw.cls}`}>
            {rw.word.toUpperCase()} {inputs.risk}
          </span>
        </div>
        <span className={`mono text-[10px] ${busy ? 'text-amber' : 'text-subtle'}`}>{busy ? 'RECOMPUTING' : 'LIVE'}</span>
      </div>

      <div className="cells grid-cols-2 lg:grid-cols-5">
        <Kpi label="Projected value" value={<CountUp to={p.final} />} sub={`${T}Y · +${short(gain)}`} />
        <Kpi label="Expected CAGR" value={pct(p.cagr * 100)} sub="base case" tone="text-up" />
        <Kpi label="Risk score" value={`${result.risk_score}/100`} sub={result.risk_label.toUpperCase()} tone={result.risk_score < 34 ? 'text-up' : result.risk_score < 67 ? 'text-amber' : 'text-down'} />
        <Kpi label="Volatility" value={pct(sigma * 100).replace('+', '')} sub={`SHARPE ${sharpe.toFixed(2)}`} />
        <Kpi label="Market mood" value={result.market_mood.label} sub={`${result.news.length} HEADLINES`} tone={moodTone} />
      </div>

      <div className="cells lg:grid-cols-12">
        <section className="p-4 lg:col-span-8">
          <div className="flex items-end justify-between">
            <div>
              <div className="eyebrow">Projection · Monte Carlo</div>
              <div className="mono mt-1.5 text-[34px] font-medium leading-none tracking-tight">
                <CountUp to={p.final} />
              </div>
              <div className="mono mt-1.5 text-[11.5px]">
                <span className="text-up">+{rupees(gain)} ({pct((gain / inputs.amount) * 100, 0)})</span>
                <span className="text-muted"> in {T}Y from {rupees(inputs.amount)}</span>
              </div>
            </div>
            <div className="mono flex gap-5 text-right text-[11px]">
              <div>
                <div className="label">Bear</div>
                <div className="text-down">{short(p.final_low)}</div>
              </div>
              <div>
                <div className="label">Base</div>
                <div>{short(p.final)}</div>
              </div>
              <div>
                <div className="label">Bull</div>
                <div className="text-up">{short(p.final_high)}</div>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <FanChart amount={inputs.amount} mu={p.cagr} sigma={sigma} years={T} />
          </div>
        </section>

        <div className="cells !border-0 lg:col-span-4">
          <section className="p-4">
            <div className="eyebrow">Risk profile</div>
            <div className="relative mx-auto mt-1 w-full max-w-[210px]">
              <svg viewBox="0 0 200 110" className="w-full">
                <path d={`M 20 100 A ${R} ${R} 0 0 1 180 100`} fill="none" stroke="#1c1f27" strokeWidth="10" strokeLinecap="round" />
                <motion.path d={`M 20 100 A ${R} ${R} 0 0 1 180 100`} fill="none" stroke={gaugeColor} strokeWidth="10" strokeLinecap="round" strokeDasharray={CIRC} initial={{ strokeDashoffset: CIRC }} animate={{ strokeDashoffset: CIRC * (1 - result.risk_score / 100) }} transition={{ duration: 0.9, ease: 'easeOut' }} style={{ filter: `drop-shadow(0 0 6px ${gaugeColor}88)` }} />
              </svg>
              <div className="absolute inset-x-0 bottom-0 text-center">
                <div className="mono text-[38px] font-medium leading-none">{result.risk_score}</div>
                <div className="mono mt-1 text-[10.5px] uppercase tracking-wider" style={{ color: gaugeColor }}>
                  {result.risk_label} risk
                </div>
              </div>
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-muted">{result.risk_sentence}</p>
          </section>
          <section className="p-4">
            <div className="eyebrow">Likelihood · {T}Y</div>
            <ul className="mt-2">
              {probs.map(([label, pr]) => (
                <li key={label} className="flex items-center justify-between border-b border-line py-2 text-[12px] last:border-b-0">
                  <span>{label}</span>
                  <span className="mono flex items-center gap-2.5">
                    <span className="h-[3px] w-16 bg-panel-2">
                      <motion.span className="block h-full bg-amber" initial={false} animate={{ width: `${pr * 100}%` }} transition={{ duration: 0.5 }} />
                    </span>
                    <span className="w-8 text-right">{Math.round(pr * 100)}%</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <div className="cells lg:grid-cols-12">
        <section className="p-4 lg:col-span-7">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Allocation</span>
            <span className="mono text-[10.5px] text-subtle">{rupees(inputs.amount)}</span>
          </div>
          <div className="mt-3 flex h-1.5 w-full overflow-hidden">
            {alloc.map((a) => (
              <motion.div key={a.key} style={{ background: COLORS[a.key] }} initial={false} animate={{ width: `${a.weight * 100}%` }} transition={{ duration: 0.5 }} />
            ))}
          </div>
          <table className="mono mt-2 w-full text-[12px]">
            <thead>
              <tr className="label text-left">
                <th className="py-1.5 font-normal">Asset</th>
                <th className="py-1.5 text-right font-normal">Wt</th>
                <th className="py-1.5 text-right font-normal">Amount</th>
                <th className="py-1.5 text-right font-normal">Exp</th>
                <th className="py-1.5 text-right font-normal">Vol</th>
              </tr>
            </thead>
            <tbody>
              {alloc.map((a) => (
                <tr key={a.key} className="border-t border-line">
                  <td className="py-2">
                    <span className="mr-2 inline-block h-2 w-2" style={{ background: COLORS[a.key] }} />
                    {a.name}
                  </td>
                  <td className="py-2 text-right text-muted">{Math.round(a.weight * 100)}%</td>
                  <td className="py-2 text-right">{rupees(a.amount)}</td>
                  <td className="py-2 text-right text-up">{pct(a.expected_return * 100)}</td>
                  <td className="py-2 text-right text-muted">{Math.round((VOL[a.key] ?? 0.1) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="p-4 lg:col-span-5">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Headlines</span>
            <button onClick={onOpenNews} className="mono text-[10.5px] text-amber hover:underline cursor-pointer">
              ALL ›
            </button>
          </div>
          <ul className="mt-1">
            {result.news.slice(0, 6).map((n) => (
              <li key={n.title} className="flex items-start gap-2.5 border-b border-line py-2 last:border-b-0">
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
