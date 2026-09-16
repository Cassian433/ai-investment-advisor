import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Analysis } from '../lib/api'
import { pct, rupees, short, years } from '../lib/format'
import Card from '../ui/Card'
import { CountUp } from '../ui/Kpi'

export default function Projection({
  data,
  amount,
  horizon,
  className = '',
  compact = false,
}: {
  data: Analysis['projection']
  amount: number
  horizon: number
  className?: string
  compact?: boolean
}) {
  const rows = data.points.map((p) => ({ ...p, band: [p.low, p.high], year: p.month / 12 }))
  const gainPct = ((data.final - amount) / amount) * 100
  const milestones = [2, 3].map((m) => ({ m, month: data.points.find((p) => p.value >= amount * m)?.month }))

  return (
    <Card className={className} highlight>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Projected value · {years(horizon)}</div>
          <div className="mono glow-gold mt-2 text-4xl font-medium tracking-tight text-gold sm:text-5xl">
            <CountUp to={data.final} format={rupees} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="mono rounded-md bg-up/10 px-2 py-0.5 font-medium text-up">{pct(gainPct, 0)}</span>
            <span className="mono text-muted">{pct(data.cagr * 100)} CAGR</span>
            <span className="text-subtle">from {rupees(amount)}</span>
          </div>
        </div>
        <div className="mono flex gap-6 text-sm">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted">Bear case</div>
            <div className="mt-0.5 font-medium text-down">{short(data.final_low)}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted">Base case</div>
            <div className="mt-0.5 font-medium">{short(data.final)}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted">Bull case</div>
            <div className="mt-0.5 font-medium text-up">{short(data.final_high)}</div>
          </div>
        </div>
      </div>

      <div className={`-ml-2 mt-6 ${compact ? 'h-56' : 'h-72'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5a86d8" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#5a86d8" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="lineGlow" x1="0" x2="1">
                <stop offset="0%" stopColor="#5a86d8" />
                <stop offset="100%" stopColor="#d4a54a" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#202634" vertical={false} />
            <XAxis
              dataKey="year"
              type="number"
              domain={[0, horizon]}
              ticks={Array.from({ length: horizon + 1 }, (_, i) => i)}
              tickFormatter={(v) => (v === 0 ? 'Now' : `Y${v}`)}
              tick={{ fill: '#8b93a3', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => short(v)}
              tick={{ fill: '#8b93a3', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
              width={64}
              domain={['dataMin - 50000', 'auto']}
            />
            <Tooltip
              contentStyle={{ background: '#161b25', border: '1px solid #2b3342', borderRadius: 8, fontSize: 12, fontFamily: 'JetBrains Mono' }}
              labelStyle={{ color: '#8b93a3' }}
              labelFormatter={(v) => `Year ${Number(v).toFixed(1)}`}
              formatter={(v: unknown, name: unknown) => {
                if (Array.isArray(v)) return [`${short(v[0])} – ${short(v[1])}`, 'Range']
                return [rupees(Number(v)), name === 'value' ? 'Expected' : String(name)]
              }}
            />
            {milestones.map(
              (ms) =>
                ms.month !== undefined && (
                  <ReferenceLine
                    key={ms.m}
                    x={ms.month / 12}
                    stroke="#2b3342"
                    strokeDasharray="3 3"
                    label={{ value: `${ms.m}x`, fill: '#8b93a3', fontSize: 11, position: 'insideTopRight' }}
                  />
                ),
            )}
            <Area type="monotone" dataKey="band" stroke="none" fill="url(#bandFill)" isAnimationActive animationDuration={1200} />
            <Area type="monotone" dataKey="value" stroke="url(#lineGlow)" strokeWidth={2.5} fill="none" dot={false} isAnimationActive animationDuration={1400} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
