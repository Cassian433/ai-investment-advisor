import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import type { Allocation } from '../lib/api'
import { rupees } from '../lib/format'
import Card from './Card'

export const COLORS: Record<string, string> = {
  fd: '#6b7a99',
  gold: '#f2b73f',
  nifty: '#4f8cff',
  bluechip: '#3ddc97',
  crypto: '#c084fc',
}

export default function AllocationDonut({ allocation, total }: { allocation: Allocation[]; total: number }) {
  const rows = [...allocation].sort((a, b) => b.weight - a.weight)

  return (
    <Card title="Where the money goes">
      <div className="flex items-center gap-5">
        <div className="relative h-40 w-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rows}
                dataKey="weight"
                nameKey="name"
                innerRadius={52}
                outerRadius={76}
                paddingAngle={2}
                stroke="none"
                isAnimationActive
                animationDuration={900}
                animationBegin={200}
              >
                {rows.map((r) => (
                  <Cell key={r.key} fill={COLORS[r.key] ?? '#888'} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-[11px] text-muted">Total</div>
              <div className="num text-sm font-semibold">{rupees(total)}</div>
            </div>
          </div>
        </div>
        <ul className="flex-1 space-y-2.5">
          {rows.map((r) => (
            <li key={r.key} className="flex items-center gap-2.5 text-sm">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[r.key] }} />
              <span className="flex-1 truncate">{r.name}</span>
              <span className="num text-muted w-10 text-right">{Math.round(r.weight * 100)}%</span>
              <span className="num w-24 text-right font-medium">{rupees(r.amount)}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
