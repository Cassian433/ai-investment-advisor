import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Analysis } from '../lib/api'
import { pct, rupees, short, years } from '../lib/format'
import Card from './Card'

function CountUp({ to }: { to: number }) {
  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) => rupees(v))
  useEffect(() => {
    const c = animate(mv, to, { duration: 1.4, ease: 'easeOut', delay: 0.3 })
    return c.stop
  }, [to, mv])
  return <motion.span>{text}</motion.span>
}

export default function Projection({ data, amount, horizon }: { data: Analysis['projection']; amount: number; horizon: number }) {
  const rows = data.points.map((p) => ({ ...p, band: [p.low, p.high], year: p.month / 12 }))
  const gain = data.final - amount
  const gainPct = (gain / amount) * 100

  return (
    <Card className="lg:col-span-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm text-muted">
            {rupees(amount)} becomes, in {years(horizon)}
          </div>
          <div className="num mt-1 text-4xl sm:text-5xl font-semibold tracking-tight text-accent">
            <CountUp to={data.final} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="num rounded-full bg-up/10 px-2.5 py-0.5 font-medium text-up">
              {pct(gainPct, 0)}
            </span>
            <span className="num text-muted">{pct(data.cagr * 100)} a year on average</span>
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <div className="text-muted">Worst case</div>
            <div className="num font-medium">{short(data.final_low)}</div>
          </div>
          <div>
            <div className="text-muted">Best case</div>
            <div className="num font-medium">{short(data.final_high)}</div>
          </div>
        </div>
      </div>

      <div className="mt-6 h-64 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f2b73f" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#f2b73f" stopOpacity={0.06} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1f2735" vertical={false} />
            <XAxis
              dataKey="year"
              type="number"
              domain={[0, horizon]}
              ticks={Array.from({ length: horizon + 1 }, (_, i) => i)}
              tickFormatter={(v) => (v === 0 ? 'Now' : `${v}y`)}
              tick={{ fill: '#8a93a6', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => short(v)}
              tick={{ fill: '#8a93a6', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={64}
            />
            <Tooltip
              contentStyle={{ background: '#161c29', border: '1px solid #1f2735', borderRadius: 10, fontSize: 13 }}
              labelStyle={{ color: '#8a93a6' }}
              labelFormatter={(v) => `${Number(v).toFixed(1)} years`}
              formatter={(v: unknown, name: unknown) => {
                if (Array.isArray(v)) return [`${short(v[0])} to ${short(v[1])}`, 'Range']
                return [rupees(Number(v)), name === 'value' ? 'Expected' : String(name)]
              }}
            />
            <Area
              type="monotone"
              dataKey="band"
              stroke="none"
              fill="url(#bandFill)"
              isAnimationActive
              animationDuration={1200}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#f2b73f"
              strokeWidth={2.5}
              fill="none"
              dot={false}
              isAnimationActive
              animationDuration={1400}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
