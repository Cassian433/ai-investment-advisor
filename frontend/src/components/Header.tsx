import { useEffect, useState } from 'react'
import { clock } from '../lib/format'

export default function Header({ onReset, showReset }: { onReset: () => void; showReset: boolean }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-line">
      <button onClick={onReset} className="flex items-center gap-3 cursor-pointer">
        <span className="h-7 w-7 rounded-md bg-accent grid place-items-center">
          <span className="h-3 w-3 rounded-sm bg-bg" />
        </span>
        <span className="text-lg font-semibold tracking-tight">Advisor</span>
        <span className="hidden sm:inline text-sm text-muted">AI investment advisor</span>
      </button>
      <div className="flex items-center gap-4">
        {showReset && (
          <button
            onClick={onReset}
            className="text-sm text-muted hover:text-text transition-colors cursor-pointer"
          >
            Change inputs
          </button>
        )}
        <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-up opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-up" />
          </span>
          <span className="font-medium">Live</span>
          <span className="num text-muted">{clock(now)}</span>
        </div>
      </div>
    </header>
  )
}
