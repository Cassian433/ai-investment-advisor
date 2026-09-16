export function nseStatus(now = new Date()): { open: boolean; label: string } {
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const day = ist.getDay()
  const mins = ist.getHours() * 60 + ist.getMinutes()
  const open = day >= 1 && day <= 5 && mins >= 555 && mins <= 930
  return { open, label: open ? 'NSE open' : 'NSE closed' }
}

export const VOL: Record<string, number> = { fd: 0.005, gold: 0.12, nifty: 0.16, bluechip: 0.2, crypto: 0.6 }
export const COLORS: Record<string, string> = {
  fd: '#6f7a8c',
  gold: '#d4a54a',
  nifty: '#5a86d8',
  bluechip: '#2ea36b',
  crypto: '#8f7fc9',
}
export const UP = '#2ea36b'
export const DOWN = '#d64545'
export const GOLD = '#d4a54a'
export const ACCENT = '#5a86d8'
export const LINE = '#202634'
export const MUTED = '#8b93a3'
