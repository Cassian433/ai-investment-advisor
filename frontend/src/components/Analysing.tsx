import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const STEPS = ['FETCH  NSE quotes · 5 instruments', 'INGEST headlines · sentiment scoring', 'MODEL  logistic regression · risk profile', 'ALLOC  5 asset classes · horizon adjusted', 'SIM    180 Monte Carlo paths · 60 months']
const STEP_MS = 520

export default function Analysing({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [t0] = useState(Date.now())
  const [el, setEl] = useState(0)
  useEffect(() => {
    const a = setInterval(() => setStep((s) => s + 1), STEP_MS)
    const b = setInterval(() => setEl(Date.now() - t0), 50)
    return () => {
      clearInterval(a)
      clearInterval(b)
    }
  }, [t0])
  useEffect(() => {
    if (step >= STEPS.length) {
      const t = setTimeout(onDone, 250)
      return () => clearTimeout(t)
    }
  }, [step, onDone])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cells">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <span className="eyebrow">Running analysis</span>
          <span className="mono text-[11px] text-muted">{(el / 1000).toFixed(2)}s</span>
        </div>
        <div className="mt-3 h-[2px] w-full bg-panel-2">
          <motion.div className="h-full bg-amber" animate={{ width: `${Math.min(1, step / STEPS.length) * 100}%` }} transition={{ ease: 'easeOut', duration: 0.4 }} />
        </div>
        <ul className="mono mt-4 space-y-1.5 text-[12px]">
          {STEPS.map((label, i) => {
            const done = i < step
            const active = i === step
            return (
              <li key={label} className={`flex items-center gap-3 whitespace-pre ${done || active ? '' : 'opacity-30'}`}>
                <span className="w-12 text-subtle">{done || active ? `${((i * STEP_MS) / 1000).toFixed(2)}s` : ''}</span>
                <span className={`w-3 ${done ? 'text-up' : active ? 'text-amber' : 'text-subtle'}`}>{done ? '✓' : active ? '›' : '·'}</span>
                <span className={done || active ? 'text-text' : 'text-muted'}>{label}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </motion.div>
  )
}
