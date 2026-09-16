import { motion } from 'framer-motion'
import Card from '../ui/Card'

const R = 80
const CIRC = Math.PI * R

export default function RiskGauge({ score, label, sentence, className = '' }: { score: number; label: string; sentence: string; className?: string }) {
  const color = score < 34 ? '#2ea36b' : score < 67 ? '#d4a54a' : '#d64545'
  const offset = CIRC * (1 - score / 100)

  return (
    <Card title="Risk score" className={`flex flex-col ${className}`}>
      <div className="relative mx-auto mt-1 w-full max-w-[230px]">
        <svg viewBox="0 0 200 110" className="w-full">
          <defs>
            <linearGradient id="riskTrack" x1="0" x2="1">
              <stop offset="0%" stopColor="#2ea36b" />
              <stop offset="50%" stopColor="#d4a54a" />
              <stop offset="100%" stopColor="#d64545" />
            </linearGradient>
          </defs>
          <path d={`M 20 100 A ${R} ${R} 0 0 1 180 100`} fill="none" stroke="url(#riskTrack)" strokeWidth="12" strokeLinecap="round" opacity="0.18" />
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
            style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <motion.div className="mono text-5xl font-medium leading-none" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            {score}
          </motion.div>
          <div className="mt-1 text-sm font-semibold" style={{ color }}>
            {label} risk
          </div>
        </div>
      </div>
      <p className="mt-5 text-sm leading-relaxed text-muted">{sentence}</p>
    </Card>
  )
}
