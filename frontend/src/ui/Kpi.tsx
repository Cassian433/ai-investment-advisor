import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect } from 'react'

export function CountUp({ to, format, delay = 0.2 }: { to: number; format: (n: number) => string; delay?: number }) {
  const mv = useMotionValue(0)
  const text = useTransform(mv, format)
  useEffect(() => {
    const c = animate(mv, to, { duration: 1.2, ease: 'easeOut', delay })
    return c.stop
  }, [to, mv, delay])
  return <motion.span>{text}</motion.span>
}

export default function Kpi({
  label,
  value,
  sub,
  tone = 'text',
  accent = false,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  tone?: 'text' | 'up' | 'down' | 'gold' | 'accent'
  accent?: boolean
}) {
  const color = { text: 'text-text', up: 'text-up', down: 'text-down', gold: 'text-gold', accent: 'text-accent' }[tone]
  return (
    <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className={`px-4 py-3.5 ${accent ? 'cell-hi' : ''}`}>
      <div className="eyebrow">{label}</div>
      <div className={`mono mt-1.5 text-[22px] font-medium leading-tight ${color}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </motion.div>
  )
}
