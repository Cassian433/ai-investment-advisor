import { motion } from 'framer-motion'
import type { Mood, NewsItem } from '../lib/api'
import Card from './Card'

const CHIP: Record<NewsItem['sentiment'], string> = {
  positive: 'bg-up/10 text-up',
  neutral: 'bg-surface-2 text-muted',
  negative: 'bg-down/10 text-down',
}

const MOOD: Record<string, string> = {
  Optimistic: 'bg-up/10 text-up border-up/30',
  Steady: 'bg-accent/10 text-accent border-accent/30',
  Cautious: 'bg-down/10 text-down border-down/30',
}

function ago(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const h = Math.floor(ms / 3_600_000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function NewsFeed({ news, mood }: { news: NewsItem[]; mood: Mood }) {
  return (
    <Card
      title="What the news says"
      right={
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${MOOD[mood.label] ?? MOOD.Steady}`}>
          Market mood: {mood.label}
        </span>
      }
    >
      <ul className="space-y-3">
        {news.map((n, i) => (
          <motion.li
            key={n.title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.06 }}
            className="flex items-start gap-3"
          >
            <span className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${CHIP[n.sentiment]}`}>
              {n.sentiment}
            </span>
            <div className="min-w-0">
              <a
                href={n.url}
                target={n.url === '#' ? undefined : '_blank'}
                rel="noreferrer"
                className="block text-sm leading-snug hover:text-accent transition-colors"
              >
                {n.title}
              </a>
              <div className="mt-0.5 text-xs text-muted">
                {n.source} · {ago(n.published)}
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </Card>
  )
}
