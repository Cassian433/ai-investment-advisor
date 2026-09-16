export type Allocation = {
  key: string
  name: string
  weight: number
  amount: number
  expected_return: number
}

export type Pick = {
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

export async function fetchPrices(): Promise<Pick[]> {
  const res = await fetch('/api/prices')
  if (!res.ok) throw new Error(`prices failed: ${res.status}`)
  const data = await res.json()
  return data.picks
}
