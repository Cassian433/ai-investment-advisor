import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export default function Card({
  title,
  right,
  children,
  className = '',
}: {
  title?: string
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <motion.section
      variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className={`rounded-2xl border border-line bg-surface p-5 ${className}`}
    >
      {(title || right) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-sm font-medium text-muted">{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </motion.section>
  )
}
