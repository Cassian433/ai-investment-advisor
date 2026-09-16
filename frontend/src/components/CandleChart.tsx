import { CandlestickSeries, ColorType, CrosshairMode, HistogramSeries, LineSeries, createChart, type IChartApi, type UTCTimestamp } from 'lightweight-charts'
import { useEffect, useRef, useState } from 'react'
import type { HistPoint, Range } from '../lib/api'

type Legend = { o: number; h: number; l: number; c: number; v: number; ma20?: number; ma50?: number; t: string } | null

function sma(values: number[], n: number): (number | undefined)[] {
  const out: (number | undefined)[] = []
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i]
    if (i >= n) sum -= values[i - n]
    out.push(i >= n - 1 ? sum / n : undefined)
  }
  return out
}

export default function CandleChart({ data, range, height = 360 }: { data: HistPoint[]; range: Range; height?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const [legend, setLegend] = useState<Legend>(null)

  useEffect(() => {
    if (!ref.current || data.length < 2) return
    const intraday = range === '1w'
    const toTime = (iso: string) => {
      const d = new Date(iso)
      return intraday ? (Math.floor(d.getTime() / 1000) as UTCTimestamp) : (d.toISOString().slice(0, 10) as unknown as UTCTimestamp)
    }

    const chart = createChart(ref.current, {
      height,
      layout: { background: { type: ColorType.Solid, color: '#0b0c10' }, textColor: '#8f93a0', fontFamily: 'JetBrains Mono', fontSize: 10 },
      grid: { vertLines: { color: '#111318' }, horzLines: { color: '#111318' } },
      crosshair: { mode: CrosshairMode.Normal, vertLine: { color: '#f5a524', width: 1, style: 3, labelBackgroundColor: '#f5a524' }, horzLine: { color: '#f5a524', width: 1, style: 3, labelBackgroundColor: '#f5a524' } },
      rightPriceScale: { borderColor: '#1c1f27', scaleMargins: { top: 0.08, bottom: 0.24 } },
      timeScale: { borderColor: '#1c1f27', timeVisible: intraday, secondsVisible: false, rightOffset: 4 },
      handleScale: true,
      handleScroll: true,
    })
    chartRef.current = chart

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: '#34c77b',
      downColor: '#ff4d4f',
      borderUpColor: '#34c77b',
      borderDownColor: '#ff4d4f',
      wickUpColor: '#34c77b',
      wickDownColor: '#ff4d4f',
      priceLineColor: '#f5a524',
      priceLineStyle: 3,
    })
    const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'vol', lastValueVisible: false, priceLineVisible: false })
    chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 }, borderVisible: false })
    const ma20 = chart.addSeries(LineSeries, { color: '#f5a524', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false })
    const ma50 = chart.addSeries(LineSeries, { color: '#4f8cff', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false })

    const closes = data.map((d) => d.c)
    const m20 = sma(closes, 20)
    const m50 = sma(closes, 50)
    const seen = new Set<string>()
    const rows = data.filter((d) => {
      const k = String(toTime(d.t))
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    candles.setData(rows.map((d) => ({ time: toTime(d.t), open: d.o, high: d.h, low: d.l, close: d.c })))
    volume.setData(rows.map((d) => ({ time: toTime(d.t), value: d.v, color: d.c >= d.o ? 'rgba(52,199,123,0.35)' : 'rgba(255,77,79,0.35)' })))
    ma20.setData(rows.map((d, i) => ({ time: toTime(d.t), value: m20[i] })).filter((x) => x.value !== undefined) as { time: UTCTimestamp; value: number }[])
    ma50.setData(rows.map((d, i) => ({ time: toTime(d.t), value: m50[i] })).filter((x) => x.value !== undefined) as { time: UTCTimestamp; value: number }[])
    chart.timeScale().fitContent()

    const last = rows[rows.length - 1]
    setLegend({ ...last, ma20: m20[data.length - 1], ma50: m50[data.length - 1] })
    chart.subscribeCrosshairMove((param) => {
      if (!param.time) {
        setLegend({ ...last, ma20: m20[data.length - 1], ma50: m50[data.length - 1] })
        return
      }
      const c = param.seriesData.get(candles) as { open: number; high: number; low: number; close: number } | undefined
      const v = param.seriesData.get(volume) as { value: number } | undefined
      const a = param.seriesData.get(ma20) as { value: number } | undefined
      const b = param.seriesData.get(ma50) as { value: number } | undefined
      if (c) setLegend({ o: c.open, h: c.high, l: c.low, c: c.close, v: v?.value ?? 0, ma20: a?.value, ma50: b?.value, t: String(param.time) })
    })

    const ro = new ResizeObserver(() => {
      if (ref.current) chart.applyOptions({ width: ref.current.clientWidth })
    })
    ro.observe(ref.current)
    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [data, range, height])

  const fmt = (n?: number) => (n === undefined ? '—' : n >= 1000 ? n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : n.toFixed(2))
  const up = legend ? legend.c >= legend.o : true

  return (
    <div className="relative">
      {legend && (
        <div className="mono pointer-events-none absolute left-2 top-1.5 z-10 flex flex-wrap gap-x-3 text-[10.5px] text-muted">
          <span>
            O <span className={up ? 'text-up' : 'text-down'}>{fmt(legend.o)}</span>
          </span>
          <span>
            H <span className={up ? 'text-up' : 'text-down'}>{fmt(legend.h)}</span>
          </span>
          <span>
            L <span className={up ? 'text-up' : 'text-down'}>{fmt(legend.l)}</span>
          </span>
          <span>
            C <span className={up ? 'text-up' : 'text-down'}>{fmt(legend.c)}</span>
          </span>
          <span>
            VOL <span className="text-text">{legend.v >= 1e6 ? (legend.v / 1e6).toFixed(2) + 'M' : legend.v >= 1e3 ? (legend.v / 1e3).toFixed(0) + 'K' : legend.v}</span>
          </span>
          <span>
            MA20 <span className="text-amber">{fmt(legend.ma20)}</span>
          </span>
          <span>
            MA50 <span className="text-blue">{fmt(legend.ma50)}</span>
          </span>
        </div>
      )}
      <div ref={ref} style={{ height }} />
    </div>
  )
}
