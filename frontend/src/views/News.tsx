import { motion } from 'framer-motion'
import { useState } from 'react'
import type { Mood, NewsItem } from '../lib/api'

type Filter = 'all' | NewsItem['sentiment']

function ago(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (h < 1) return 'NOW'
  if (h < 24) return `${h}H`
  return `${Math.floor(h / 24)}D`
}

export default function News({ news, mood }: { news: NewsItem[]; mood: Mood | null }) {
  const [filter, setFilter] = useState<Filter>('all')
  const shown = news.filter((n) => filter === 'all' || n.sentiment === filter)
  const counts = { positive: 0, neutral: 0, negative: 0 }
  news.forEach((n) => counts[n.sentiment]++)
  const pos = mood ? (mood.score + 1) / 2 : 0.5
  const tone = mood?.label === 'Optimistic' ? 'text-up' : mood?.label === 'Cautious' ? 'text-down' : 'text-amber'

  return (
    <div className="cells lg:grid-cols-12">
      <section className="p-4 lg:col-span-4">
        <div className="eyebrow">Market mood</div>
        <div className={`mono mt-2 text-[30px] font-medium leading-none ${tone}`}>{(mood?.label ?? '—').toUpperCase()}</div>
        <div className="mono mt-1.5 text-[11px] text-muted">
          SCORE {mood ? (mood.score >= 0 ? '+' : '') + mood.score.toFixed(2) : '—'} · {news.length} HEADLINES
        </div>
        <div className="relative mt-5 h-1.5 w-full bg-gradient-to-r from-down via-amber to-up">
          <motion.span className="absolute -top-[5px] h-4 w-[3px] bg-text" initial={false} animate={{ left: `${pos * 100}%` }} transition={{ duration: 0.8 }} />
        </div>
        <div className="label mt-2 flex justify-between">
          <span>Bearish</span>
          <span>Bullish</span>
        </div>
        <div className="mono mt-5 grid grid-cols-3 divide-x divide-line border border-line text-center text-[11px]">
          <div className="py-2">
            <div className="text-[18px] text-up">{counts.positive}</div>POS
          </div>
          <div className="py-2">
            <div className="text-[18px] text-muted">{counts.neutral}</div>NEU
          </div>
          <div className="py-2">
            <div className="text-[18px] text-down">{counts.negative}</div>NEG
          </div>
        </div>
      </section>
      <section className="p-4 lg:col-span-8">
        <div className="flex items-center justify-between">
          <span className="eyebrow">Headlines</span>
          <div className="flex border border-line">
            {(['all', 'positive', 'neutral', 'negative'] as Filter[]).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`mono px-2.5 py-0.5 text-[10.5px] uppercase cursor-pointer ${filter === f ? 'bg-amber font-semibold text-bg' : 'text-muted hover:text-text'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <ul className="mt-1">
          {shown.map((n) => (
            <li key={n.title} className="flex items-start gap-3 border-b border-line py-3 last:border-b-0">
              <span className={`mono mt-[2px] w-9 shrink-0 text-[10px] ${n.sentiment === 'positive' ? 'text-up' : n.sentiment === 'negative' ? 'text-down' : 'text-subtle'}`}>{n.sentiment.slice(0, 3).toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <a href={n.url} target={n.url === '#' ? undefined : '_blank'} rel="noreferrer" className="text-[13px] leading-snug hover:text-amber">
                  {n.title}
                </a>
                <div className="mono mt-0.5 text-[10px] text-subtle">
                  {n.source.toUpperCase()} · {ago(n.published)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
