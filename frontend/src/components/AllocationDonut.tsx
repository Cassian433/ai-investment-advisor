import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import type { Allocation } from '../lib/api'
import { rupees } from '../lib/format'
import { COLORS } from '../lib/market'
import Card from '../ui/Card'

export default function AllocationDonut({ allocation, total, className = '' }: { allocation: Allocation[]; total: number; className?: string }) {
  const rows = [...allocation].sort((a, b) => b.weight - a.weight)
  return (
    <Card title="Allocation" className={className}>
      <div className="flex items-center gap-5">
        <div className="relative h-40 w-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={rows} dataKey="weight" nameKey="name" innerRadius={54} outerRadius={76} paddingAngle={2} stroke="none" isAnimationActive animationDuration={900} animationBegin={200}>
                {rows.map((r) => (
                  <Cell key={r.key} fill={COLORS[r.key] ?? '#888'} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted">Capital</div>
              <div className="mono text-sm font-medium">{rupees(total)}</div>
            </div>
          </div>
        </div>
        <ul className="flex-1 space-y-2.5">
          {rows.map((r) => (
            <li key={r.key} className="flex items-center gap-2.5 text-sm">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[r.key] }} />
              <span className="flex-1 truncate">{r.name}</span>
              <span className="mono w-10 text-right text-muted">{Math.round(r.weight * 100)}%</span>
              <span className="mono w-24 text-right font-medium">{rupees(r.amount)}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
