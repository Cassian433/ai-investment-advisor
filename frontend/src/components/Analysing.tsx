import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const STEPS = [
  'Fetching NSE quotes for 5 instruments',
  'Ingesting market headlines',
  'Scoring risk profile · logistic regression',
  'Optimising allocation across 5 asset classes',
  'Simulating 60-month projection with variance band',
]

const STEP_MS = 560

export default function Analysing({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [t0] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const a = setInterval(() => setStep((s) => s + 1), STEP_MS)
    const b = setInterval(() => setElapsed(Date.now() - t0), 50)
    return () => {
      clearInterval(a)
      clearInterval(b)
    }
  }, [t0])

  useEffect(() => {
    if (step >= STEPS.length) {
      const t = setTimeout(onDone, 300)
      return () => clearTimeout(t)
    }
  }, [step, onDone])

  const progress = Math.min(1, step / STEPS.length)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid min-h-full place-items-center px-6">
      <div className="w-full max-w-lg rounded-md border border-line bg-panel p-6">
        <div className="flex items-center justify-between">
          <div className="eyebrow">Running analysis</div>
          <div className="mono text-xs text-muted">{(elapsed / 1000).toFixed(2)}s</div>
        </div>
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-panel-2">
          <motion.div
            className="h-full bg-accent"
            animate={{ width: `${progress * 100}%` }}
            transition={{ ease: 'easeOut', duration: 0.4 }}
          />
        </div>
        <ul className="mono mt-5 space-y-2 text-[13px]">
          {STEPS.map((label, i) => {
            const done = i < step
            const active = i === step
            return (
              <motion.li
                key={label}
                initial={{ opacity: 0 }}
                animate={{ opacity: done || active ? 1 : 0.3 }}
                className="flex items-center gap-3"
              >
                <span className={`w-14 text-right text-subtle`}>{done || active ? `${((i * STEP_MS) / 1000).toFixed(2)}s` : ''}</span>
                <span className={`w-4 text-center ${done ? 'text-up' : active ? 'text-accent' : 'text-subtle'}`}>
                  {done ? '✓' : active ? '›' : '·'}
                </span>
                <span className={done ? 'text-text' : active ? 'text-text' : 'text-muted'}>{label}</span>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </motion.div>
  )
}
