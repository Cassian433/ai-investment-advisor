export type Allocation = {
  key: string
  name: string
  weight: number
  amount: number
  expected_return: number
}

export type Pick = {
  sector?: string
  ticker: string
  name: string
  price: number
  change_pct: number
  currency: string
  why: string
  live: boolean
}

export type NewsItem = {
  title: string
  source: string
  url: string
  sentiment: 'positive' | 'neutral' | 'negative'
  published: string
}

export type Mood = { label: string; score: number }

export type ProjectionPoint = { month: number; value: number; low: number; high: number }

export type Analysis = {
  risk_score: number
  risk_label: 'Low' | 'Moderate' | 'High'
  risk_sentence: string
  allocation: Allocation[]
  picks: Pick[]
  news: NewsItem[]
  market_mood: Mood
  projection: {
    points: ProjectionPoint[]
    final: number
    final_low: number
    final_high: number
    cagr: number
  }
  generated_at: string
}

export type Inputs = { amount: number; horizon_years: number; risk: number }

export async function analyse(inputs: Inputs): Promise<Analysis> {
  const res = await fetch('/api/analyse', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(inputs),
  })
  if (!res.ok) throw new Error(`analyse failed: ${res.status}`)
  return res.json()
}

export type Index = { ticker: string; name: string; price: number; change_pct: number; live: boolean }

export async function fetchPrices(): Promise<{ picks: Pick[]; indices: Index[] }> {
  const res = await fetch('/api/prices')
  if (!res.ok) throw new Error(`prices failed: ${res.status}`)
  const data = await res.json()
  return { picks: data.picks, indices: data.indices ?? [] }
}

export async function fetchNews(): Promise<{ news: NewsItem[]; market_mood: Mood }> {
  const res = await fetch('/api/news')
  if (!res.ok) throw new Error(`news failed: ${res.status}`)
  return res.json()
}

export type Quote = Pick & { sector: string; prev_close: number | null; day_high: number | null; day_low: number | null; year_high: number | null; year_low: number | null; volume: number | null; market_cap: number | null }
export type SearchHit = { ticker: string; name: string; sector: string }
export type HistPoint = { t: string; o: number; h: number; l: number; c: number; v: number }
export type Range = '1w' | '1m' | '3m' | '1y' | '5y'

export async function fetchQuotes(tickers: string[]): Promise<Quote[]> {
  if (!tickers.length) return []
  const res = await fetch(`/api/quotes?tickers=${encodeURIComponent(tickers.join(','))}`)
  if (!res.ok) throw new Error(`quotes failed: ${res.status}`)
  return (await res.json()).quotes
}

export async function searchStocks(q: string): Promise<SearchHit[]> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
  if (!res.ok) return []
  return (await res.json()).results
}

export async function fetchHistory(tickers: string[], range: Range = '3m'): Promise<Record<string, HistPoint[]>> {
  if (!tickers.length) return {}
  const res = await fetch(`/api/history?tickers=${encodeURIComponent(tickers.join(','))}&range=${range}`)
  if (!res.ok) return {}
  return (await res.json()).series
}
