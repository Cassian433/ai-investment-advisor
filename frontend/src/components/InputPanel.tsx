import { motion } from 'framer-motion'
import { useState } from 'react'
import type { Inputs } from '../lib/api'
import { short } from '../lib/format'

const HORIZONS = [1, 3, 5, 10]

export function riskWord(r: number): { word: string; color: string } {
  if (r < 34) return { word: 'Safe', color: 'text-up' }
  if (r < 67) return { word: 'Balanced', color: 'text-accent' }
  return { word: 'Aggressive', color: 'text-down' }
}

export default function InputPanel({ onSubmit }: { onSubmit: (i: Inputs) => void }) {
  const [amountText, setAmountText] = useState('5,00,000')
  const [horizon, setHorizon] = useState(5)
  const [risk, setRisk] = useState(50)

  const amount = Number(amountText.replace(/[^\d]/g, '')) || 0
  const rw = riskWord(risk)
  const valid = amount >= 1000

  function onAmount(v: string) {
    const digits = v.replace(/[^\d]/g, '')
    if (!digits) return setAmountText('')
    setAmountText(new Intl.NumberFormat('en-IN').format(Number(digits)))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
      className="mx-auto w-full max-w-2xl px-6 py-14"
    >
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
        Where should your money go?
      </h1>
      <p className="mt-3 text-muted text-lg">
        Enter what you have. Get a risk score, a plan, live prices and news, and what it grows to.
      </p>

      <div className="mt-10 rounded-2xl border border-line bg-surface p-6 sm:p-8 space-y-8">
        <div>
          <label className="text-sm text-muted">Amount to invest</label>
          <div className="mt-2 flex items-baseline gap-2 border-b border-line focus-within:border-accent transition-colors">
            <span className="text-3xl text-muted">₹</span>
            <input
              inputMode="numeric"
              value={amountText}
              onChange={(e) => onAmount(e.target.value)}
              className="num w-full bg-transparent text-4xl font-semibold outline-none py-2"
              placeholder="5,00,000"
            />
            <span className="text-sm text-muted whitespace-nowrap">{amount ? short(amount) : ''}</span>
          </div>
        </div>

        <div>
          <label className="text-sm text-muted">For how long</label>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {HORIZONS.map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors cursor-pointer ${
                  h === horizon
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-line bg-surface-2 text-muted hover:text-text'
                }`}
              >
                {h} {h === 1 ? 'year' : 'years'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted">Risk you are comfortable with</label>
            <span className={`text-sm font-semibold ${rw.color}`}>{rw.word}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={risk}
            onChange={(e) => setRisk(Number(e.target.value))}
            className="mt-4 w-full"
          />
          <div className="mt-2 flex justify-between text-xs text-muted">
            <span>Keep it safe</span>
            <span>Go for growth</span>
          </div>
        </div>

        <button
          disabled={!valid}
          onClick={() => onSubmit({ amount, horizon_years: horizon, risk })}
          className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-bg transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Analyse my money
        </button>
      </div>
    </motion.div>
  )
}
