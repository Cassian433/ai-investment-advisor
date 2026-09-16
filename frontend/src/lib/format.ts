const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const inr2 = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

export function rupees(n: number): string {
  return inr.format(n)
}

export function price(n: number): string {
  return n >= 10000 ? inr.format(n) : inr2.format(n)
}

export function short(n: number): string {
  if (n >= 1e7) return `₹${trim(n / 1e7)} Cr`
  if (n >= 1e5) return `₹${trim(n / 1e5)} L`
  if (n >= 1e3) return `₹${trim(n / 1e3)}K`
  return `₹${Math.round(n)}`
}

function trim(x: number): string {
  const s = x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2)
  return s.replace(/\.0+$/, '').replace(/(\.\d)0$/, '$1')
}

export function pct(n: number, digits = 1): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(digits)}%`
}

export function years(n: number): string {
  return n === 1 ? '1 year' : `${n} years`
}

export function clock(d: Date): string {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}
