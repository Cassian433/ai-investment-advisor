function seed(s: string): () => number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return () => {
    h += 0x6d2b79f5
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function series(ticker: string, last: number, changePct: number, n = 40, vol = 0.012): number[] {
  const rnd = seed(ticker)
  const out: number[] = [last]
  let v = last
  for (let i = 1; i < n; i++) {
    v = v / (1 + (rnd() - 0.5) * 2 * vol)
    out.push(v)
  }
  out.reverse()
  const prev = last / (1 + changePct / 100)
  out[out.length - 2] = prev
  out[out.length - 1] = last
  return out
}
