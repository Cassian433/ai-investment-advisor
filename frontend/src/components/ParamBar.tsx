import type { Inputs } from '../lib/api'
import { short } from '../lib/format'
import { riskWord } from './Landing'

const HORIZONS = [1, 3, 5, 10]

export default function ParamBar({ inputs, onChange, busy }: { inputs: Inputs; onChange: (i: Inputs) => void; busy: boolean }) {
  const rw = riskWord(inputs.risk)
  const text = new Intl.NumberFormat('en-IN').format(inputs.amount)

  return (
    <div className="sticky top-0 z-10 -mx-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line bg-bg/95 px-5 py-2.5 backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="eyebrow">Capital</span>
        <div className="flex items-baseline gap-1 border-b border-line-strong focus-within:border-accent">
          <span className="mono text-sm text-muted">₹</span>
          <input
            inputMode="numeric"
            value={text}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/[^\d]/g, '')) || 0
              onChange({ ...inputs, amount: n })
            }}
            className="mono w-28 bg-transparent py-0.5 text-sm font-medium outline-none"
          />
          <span className="mono text-xs text-subtle">{short(inputs.amount)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="eyebrow">Horizon</span>
        <div className="flex overflow-hidden rounded border border-line">
          {HORIZONS.map((h) => (
            <button
              key={h}
              onClick={() => onChange({ ...inputs, horizon_years: h })}
              className={`mono px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                h === inputs.horizon_years ? 'bg-accent/20 text-text' : 'text-muted hover:text-text'
              }`}
            >
              {h}Y
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-w-[260px] flex-1 items-center gap-3">
        <span className="eyebrow">Risk</span>
        <input type="range" min={0} max={100} value={inputs.risk} onChange={(e) => onChange({ ...inputs, risk: Number(e.target.value) })} className="flex-1" />
        <span className={`mono w-32 text-right text-xs font-semibold ${rw.color}`}>
          {rw.word} · {inputs.risk}
        </span>
      </div>

      <span className={`mono text-[11px] ${busy ? 'text-accent' : 'text-subtle'}`}>{busy ? 'recomputing…' : 'live'}</span>
    </div>
  )
}
