import { motion } from 'framer-motion'
import AllocationDonut from '../components/AllocationDonut'
import Probability from '../components/Probability'
import Projection from '../components/Projection'
import RiskGauge from '../components/RiskGauge'
import type { Analysis, Inputs, Pick } from '../lib/api'
import { pct, price, rupees } from '../lib/format'
import { VOL } from '../lib/market'
import { series } from '../lib/spark'
import Card from '../ui/Card'
import Kpi, { CountUp } from '../ui/Kpi'
import Sparkline from '../ui/Sparkline'

const MOOD_TONE: Record<string, 'up' | 'gold' | 'down'> = { Optimistic: 'up', Steady: 'gold', Cautious: 'down' }

export default function Overview({ result, inputs, picks }: { result: Analysis; inputs: Inputs; picks: Pick[] }) {
  const vol = result.allocation.reduce((s, a) => s + a.weight * (VOL[a.key] ?? 0.1), 0) * 0.7
  const sharpe = (result.projection.cagr - 0.07) / Math.max(vol, 0.01)
  const movers = [...picks].sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct)).slice(0, 3)

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="space-y-4">
      <div className="cells grid-cols-2 lg:grid-cols-5">
        <Kpi label="Projected value" value={<CountUp to={result.projection.final} format={rupees} />} sub={`in ${inputs.horizon_years} years`} tone="gold" accent />
        <Kpi label="Expected CAGR" value={pct(result.projection.cagr * 100)} sub="base case, annualised" tone="up" />
        <Kpi label="Risk score" value={`${result.risk_score} / 100`} sub={`${result.risk_label} profile`} tone={result.risk_score < 34 ? 'up' : result.risk_score < 67 ? 'gold' : 'down'} />
        <Kpi label="Volatility" value={pct(vol * 100).replace('+', '')} sub={`Sharpe ${sharpe.toFixed(2)} vs 7% FD`} />
        <Kpi label="Market mood" value={result.market_mood.label} sub={`${result.news.length} headlines scored`} tone={MOOD_TONE[result.market_mood.label] ?? 'gold'} />
      </div>

      <div className="cells lg:grid-cols-12">
        <Projection data={result.projection} amount={inputs.amount} horizon={inputs.horizon_years} className="lg:col-span-8 lg:row-span-2" />
        <RiskGauge score={result.risk_score} label={result.risk_label} sentence={result.risk_sentence} className="lg:col-span-4" />
        <Card title="Biggest moves today" className="lg:col-span-4">
          <ul className="divide-y divide-line">
            {movers.map((p) => {
              const up = p.change_pct >= 0
              return (
                <li key={p.ticker} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{p.name}</div>
                    <div className="mono text-[11px] text-muted">{p.ticker.replace('.NS', '')}</div>
                  </div>
                  <Sparkline data={series(p.ticker, p.price, p.change_pct, 30)} up={up} width={72} height={22} />
                  <div className="mono w-24 text-right">
                    <div className="text-sm">{price(p.price)}</div>
                    <div className={`text-[11px] ${up ? 'text-up' : 'text-down'}`}>{pct(p.change_pct, 2)}</div>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
        <AllocationDonut allocation={result.allocation} total={inputs.amount} className="lg:col-span-5" />
        <Probability result={result} inputs={inputs} className="lg:col-span-4" />
        <Card title="Headlines" className="lg:col-span-3">
          <ul className="space-y-3">
            {result.news.slice(0, 4).map((n) => (
              <li key={n.title} className="flex items-start gap-2.5">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.sentiment === 'positive' ? 'bg-up' : n.sentiment === 'negative' ? 'bg-down' : 'bg-subtle'}`} />
                <div className="min-w-0">
                  <div className="text-[13px] leading-snug">{n.title}</div>
                  <div className="mono mt-0.5 text-[11px] text-subtle">{n.source}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </motion.div>
  )
}
