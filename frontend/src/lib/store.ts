const KEY = 'vantage.watchlist'
export const DEFAULT_WATCHLIST = ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS', 'ITC.NS', 'GOLDBEES.NS', 'BTC-INR']

export function loadWatchlist(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? (JSON.parse(raw) as string[]) : null
    return Array.isArray(arr) && arr.length ? arr : DEFAULT_WATCHLIST
  } catch {
    return DEFAULT_WATCHLIST
  }
}

export function saveWatchlist(list: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}
