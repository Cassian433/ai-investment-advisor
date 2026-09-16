export default function Sparkline({ data, up, width = 80, height = 24 }: { data: number[]; up: boolean; width?: number; height?: number }) {
  if (data.length < 2) return <svg width={width} height={height} />
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const step = width / (data.length - 1)
  const pts = data.map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / span) * (height - 4) - 2).toFixed(1)}`)
  const color = up ? '#34c77b' : '#ff4d4f'
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  )
}
