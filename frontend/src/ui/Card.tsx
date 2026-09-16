import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export default function Card({
  title,
  right,
  children,
  className = '',
  highlight = false,
}: {
  title?: ReactNode
  right?: ReactNode
  children: ReactNode
  className?: string
  highlight?: boolean
}) {
  return (
    <motion.section
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
      transition={{ duration: 0.35 }}
      className={`p-5 ${highlight ? 'cell-hi' : ''} ${className}`}
    >
      {(title || right) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="eyebrow">{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </motion.section>
  )
}
