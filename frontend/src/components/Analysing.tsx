import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const STEPS = [
  'Reading live prices from the market',
  'Scanning today’s news',
  'Scoring your risk',
  'Building your plan',
]

const STEP_MS = 650

export default function Analysing({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setStep((s) => s + 1), STEP_MS)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (step >= STEPS.length) {
      const t = setTimeout(onDone, 350)
      return () => clearTimeout(t)
    }
  }, [step, onDone])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mx-auto w-full max-w-md px-6 py-28"
    >
      <div className="h-1 w-full overflow-hidden rounded-full bg-surface-2">
        <motion.div
          className="h-full bg-accent"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: (STEPS.length * STEP_MS) / 1000, ease: 'linear' }}
        />
      </div>
      <ul className="mt-8 space-y-4">
        {STEPS.map((label, i) => {
          const done = i < step
          const active = i === step
          return (
            <motion.li
              key={label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: done || active ? 1 : 0.35, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 text-base"
            >
              <span
                className={`grid h-5 w-5 place-items-center rounded-full border text-[10px] ${
                  done ? 'border-up bg-up text-bg' : active ? 'border-accent' : 'border-line'
                }`}
              >
                {done ? '✓' : active ? <span className="h-2 w-2 animate-pulse rounded-full bg-accent" /> : ''}
              </span>
              <span className={done ? 'text-text' : active ? 'text-text' : 'text-muted'}>{label}</span>
            </motion.li>
          )
        })}
      </ul>
    </motion.div>
  )
}
