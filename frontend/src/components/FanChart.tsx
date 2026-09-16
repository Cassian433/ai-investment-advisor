import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { rupees, short } from '../lib/format'

const W = 1000
const H = 320
const PAD = { l: 56, r: 12, t: 12, b: 26 }
const PATHS = 180

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function gauss(r: () => number) {
  const u = 1 - r()
  const v = r()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
function quantile(sorted: number[], q: number) {
  const i = (sorted.length - 1) * q
  const lo = Math.floor(i)
  const hi = Math.ceil(i)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo)
}

export default function FanChart({ amount, mu, sigma, years }: { amount: number; mu: number; sigma: number; years: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const months = years * 12

  const sim = useMemo(() => {
    const r = rng(Math.round(amount) ^ Math.round(mu * 1e4) ^ Math.round(sigma * 1e4) ^ years)
    const dt = 1 / 12
    const drift = (Math.log(1 + mu) - (sigma * sigma) / 2) * dt
    const vol = Math.max(sigma, 0.005) * Math.sqrt(dt)
    const paths: number[][] = []
    for (let p = 0; p < PATHS; p++) {
      const path = [amount]
      let v = amount
      for (let m = 1; m <= months; m++) {
        v *= Math.exp(drift + vol * gauss(r))
        path.push(v)
      }
      paths.push(path)
    }
    const q = (k: number) => Array.from({ length: months + 1 }, (_, m) => quantile(paths.map((p) => p[m]).sort((a, b) => a - b), k))
    return { paths, p5: q(0.05), p25: q(0.25), p50: q(0.5), p75: q(0.75), p95: q(0.95) }
  }, [amount, mu, sigma, years, months])

  const yMin = Math.min(amount * 0.85, ...sim.p5)
  const yMax = Math.max(...sim.p95)
  const x = (m: number) => PAD.l + (m / months) * (W - PAD.l - PAD.r)
  const y = (v: number) => PAD.t + (1 - (v - yMin) / (yMax - yMin || 1)) * (H - PAD.t - PAD.b)
  const line = (arr: number[]) => arr.map((v, m) => `${x(m).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const band = (lo: number[], hi: number[]) => `${hi.map((v, m) => `${x(m).toFixed(1)},${y(v).toFixed(1)}`).join(' ')} ${lo
    .map((v, m) => `${x(m).toFixed(1)},${y(v).toFixed(1)}`)
    .reverse()
    .join(' ')}`
  const gridY = 4
  const ticks = Array.from({ length: gridY + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / gridY)
  const hm = hover

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const px = ((e.clientX - rect.left) / rect.width) * W
          const m = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * months)
          setHover(Math.max(0, Math.min(months, m)))
        }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="fanOuter" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f5a524" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#f5a524" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient id="fanInner" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f5a524" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#f5a524" stopOpacity="0.08" />
          </linearGradient>
          <filter id="glowLine" x="-10%" y="-50%" width="120%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="#14161c" />
            <text x={PAD.l - 8} y={y(v) + 3.5} textAnchor="end" fontSize="10" fontFamily="JetBrains Mono" fill="#5c606b">
              {short(v)}
            </text>
          </g>
        ))}
        {Array.from({ length: years + 1 }, (_, i) => (
          <text key={i} x={x(i * 12)} y={H - 8} textAnchor={i === 0 ? 'start' : i === years ? 'end' : 'middle'} fontSize="10" fontFamily="JetBrains Mono" fill="#5c606b">
            {i === 0 ? 'NOW' : `Y${i}`}
          </text>
        ))}
        <g opacity="0.9">
          {sim.paths.map((p, i) => (
            <polyline key={i} points={line(p)} fill="none" stroke="#f5a524" strokeOpacity="0.045" strokeWidth="1" />
          ))}
        </g>
        <motion.polygon points={band(sim.p5, sim.p95)} fill="url(#fanOuter)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
        <motion.polygon points={band(sim.p25, sim.p75)} fill="url(#fanInner)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }} />
        <line x1={PAD.l} x2={W - PAD.r} y1={y(amount)} y2={y(amount)} stroke="#2a2e38" strokeDasharray="3 5" />
        <motion.polyline
          points={line(sim.p50)}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          filter="url(#glowLine)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
        {hm !== null && (
          <g>
            <line x1={x(hm)} x2={x(hm)} y1={PAD.t} y2={H - PAD.b} stroke="#f5a524" strokeDasharray="2 3" />
            <circle cx={x(hm)} cy={y(sim.p50[hm])} r="4" fill="#fff" stroke="#050608" strokeWidth="2" />
            <circle cx={x(hm)} cy={y(sim.p95[hm])} r="2.5" fill="#f5a524" />
            <circle cx={x(hm)} cy={y(sim.p5[hm])} r="2.5" fill="#f5a524" />
          </g>
        )}
      </svg>
      <div className="mono absolute right-3 top-2 rounded border border-line bg-panel/90 px-2.5 py-1.5 text-[10.5px]">
        {hm !== null ? (
          <div className="space-y-0.5">
            <div className="text-muted">
              {hm === 0 ? 'Now' : `Year ${(hm / 12).toFixed(1)}`}
            </div>
            <div>
              <span className="text-muted">P95 </span>
              <span className="text-amber">{rupees(sim.p95[hm])}</span>
            </div>
            <div>
              <span className="text-muted">P50 </span>
              <span className="text-text">{rupees(sim.p50[hm])}</span>
            </div>
            <div>
              <span className="text-muted">P5 </span>
              <span className="text-amber">{rupees(sim.p5[hm])}</span>
            </div>
          </div>
        ) : (
          <div className="text-muted">
            {PATHS} simulated paths · <span className="text-text">P50 {short(sim.p50[months])}</span> · P5 {short(sim.p5[months])} · P95 {short(sim.p95[months])}
          </div>
        )}
      </div>
    </div>
  )
}
