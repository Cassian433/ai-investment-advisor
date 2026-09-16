import { motion } from 'framer-motion'
import { useState } from 'react'
import type { Mood, NewsItem } from '../lib/api'
import Card from '../ui/Card'

type Filter = 'all' | NewsItem['sentiment']

const CHIP: Record<NewsItem['sentiment'], string> = {
  positive: 'bg-up/15 text-up border-up/30',
  neutral: 'bg-panel-2 text-muted border-line',
  negative: 'bg-down/15 text-down border-down/30',
}

function ago(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function News({ news, mood }: { news: NewsItem[]; mood: Mood }) {
  const [filter, setFilter] = useState<Filter>('all')
  const counts = {
    positive: news.filter((n) => n.sentiment === 'positive').length,
    neutral: news.filter((n) => n.sentiment === 'neutral').length,
    negative: news.filter((n) => n.sentiment === 'negative').length,
  }
  const shown = news.filter((n) => filter === 'all' || n.sentiment === filter)
  const pos = (mood.score + 1) / 2

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="cells lg:grid-cols-12">
      <Card title="Market sentiment" className="lg:col-span-4" highlight>
        <div className="display text-3xl font-semibold">{mood.label}</div>
        <div className="mono mt-1 text-xs text-muted">score {mood.score >= 0 ? '+' : ''}{mood.score.toFixed(2)} · {news.length} headlines</div>
        <div className="relative mt-5 h-2 w-full rounded-full bg-gradient-to-r from-down via-gold to-up opacity-90">
          <motion.span
            className="absolute -top-1.5 h-5 w-5 -translate-x-1/2 rounded-full border-[3px] border-bg bg-white shadow"
            initial={{ left: '50%' }}
            animate={{ left: `${pos * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-subtle">
          <span>Bearish</span>
          <span>Bullish</span>
        </div>
        <div className="mono mt-6 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded bg-up/10 px-2 py-2 text-up">
            <div className="text-lg font-medium">{counts.positive}</div>positive
          </div>
          <div className="rounded bg-panel-2 px-2 py-2 text-muted">
            <div className="text-lg font-medium">{counts.neutral}</div>neutral
          </div>
          <div className="rounded bg-down/10 px-2 py-2 text-down">
            <div className="text-lg font-medium">{counts.negative}</div>negative
          </div>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-muted">
          Each headline is scored on its wording. The mood is the balance of positive against negative stories in today's feed.
        </p>
      </Card>

      <Card
        title="Headlines"
        className="lg:col-span-8"
        right={
          <div className="flex gap-1">
            {(['all', 'positive', 'neutral', 'negative'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded px-2 py-1 text-xs capitalize transition-colors cursor-pointer ${
                  filter === f ? 'bg-panel-2 text-text' : 'text-muted hover:text-text'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        }
      >
        <ul className="divide-y divide-line">
          {shown.map((n, i) => (
            <motion.li key={n.title} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="flex items-start gap-4 py-3.5 first:pt-0">
              <span className={`mt-0.5 shrink-0 rounded border px-2 py-0.5 text-[11px] font-semibold capitalize ${CHIP[n.sentiment]}`}>{n.sentiment}</span>
              <div className="min-w-0 flex-1">
                <a href={n.url} target={n.url === '#' ? undefined : '_blank'} rel="noreferrer" className="block text-[15px] leading-snug hover:text-accent transition-colors">
                  {n.title}
                </a>
                <div className="mono mt-1 text-xs text-muted">
                  {n.source} · {ago(n.published)}
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </Card>
    </motion.div>
  )
}
