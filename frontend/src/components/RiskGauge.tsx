import { motion } from 'framer-motion'
import Card from './Card'

const R = 80
const CIRC = Math.PI * R

export default function RiskGauge({
  score,
  label,
  sentence,
}: {
  score: number
  label: string
  sentence: string
}) {
  const color = score < 34 ? 'var(--color-up)' : score < 67 ? 'var(--color-accent)' : 'var(--color-down)'
  const offset = CIRC * (1 - score / 100)

  return (
    <Card title="Risk score" className="flex flex-col">
      <div className="relative mx-auto mt-2 w-full max-w-[240px]">
        <svg viewBox="0 0 200 110" className="w-full">
          <defs>
            <linearGradient id="riskTrack" x1="0" x2="1">
              <stop offset="0%" stopColor="var(--color-up)" />
              <stop offset="50%" stopColor="var(--color-accent)" />
              <stop offset="100%" stopColor="var(--color-down)" />
            </linearGradient>
          </defs>
          <path
            d={`M 20 100 A ${R} ${R} 0 0 1 180 100`}
            fill="none"
            stroke="url(#riskTrack)"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.18"
          />
          <motion.path
            d={`M 20 100 A ${R} ${R} 0 0 1 180 100`}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            initial={{ strokeDashoffset: CIRC }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <motion.div
            className="num text-5xl font-semibold leading-none"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {score}
          </motion.div>
          <div className="mt-1 text-sm font-medium" style={{ color }}>
            {label} risk
          </div>
        </div>
      </div>
      <p className="mt-6 text-sm text-muted leading-relaxed">{sentence}</p>
    </Card>
  )
}
