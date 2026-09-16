export function nseStatus(now = new Date()): { open: boolean; label: string } {
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const day = ist.getDay()
  const mins = ist.getHours() * 60 + ist.getMinutes()
  const open = day >= 1 && day <= 5 && mins >= 555 && mins <= 930
  return { open, label: open ? 'NSE OPEN' : 'NSE CLOSED' }
}

export const VOL: Record<string, number> = { fd: 0.005, gold: 0.12, nifty: 0.16, bluechip: 0.2, crypto: 0.6 }
export const COLORS: Record<string, string> = { fd: '#8f93a0', gold: '#f5a524', nifty: '#4f8cff', bluechip: '#34c77b', crypto: '#b48cff' }
export const UP = '#34c77b'
export const DOWN = '#ff4d4f'
export const AMBER = '#f5a524'
export const LINE = '#1c1f27'
export const MUTED = '#8f93a0'
