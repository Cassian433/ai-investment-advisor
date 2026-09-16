import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { Analysis, Inputs } from '../lib/api'

type Msg = { role: 'user' | 'assistant'; content: string }

const FALLBACK_START = [
  'Is today a good day to put money into the market?',
  'What is moving Indian stocks right now?',
  'Should a beginner start with an index fund or gold?',
]
const FALLBACK_RESULT = [
  'Should I invest today or wait a few weeks?',
  'Is this plan too risky for me?',
  'Which of these picks would you buy first?',
]

export default function Chat({
  result,
  inputs,
  open,
  setOpen,
}: {
  result: Analysis | null
  inputs: Inputs | null
  open: boolean
  setOpen: (o: boolean) => void
}) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [suggested, setSuggested] = useState<string[]>(result ? FALLBACK_RESULT : FALLBACK_START)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/chat/suggested?stage=${result ? 'result' : 'start'}`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d.questions) && setSuggested(d.questions))
      .catch(() => {})
  }, [result])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, busy, open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250)
  }, [open])

  async function send(q: string) {
    const question = q.trim()
    if (!question || busy) return
    setText('')
    const history = msgs
    setMsgs((m) => [...m, { role: 'user', content: question }])
    setBusy(true)
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question, history, inputs, result }),
      })
      const d = await r.json()
      setMsgs((m) => [...m, { role: 'assistant', content: d.answer ?? 'No answer came back.' }])
    } catch {
      setMsgs((m) => [...m, { role: 'assistant', content: 'The assistant is busy. Ask again in a moment.' }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.97 }}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-3 rounded-md bg-accent py-2.5 pl-3 pr-4 text-sm font-semibold text-white shadow-2xl shadow-black/50 transition hover:brightness-110 cursor-pointer"
      >
        <span className="grid h-7 w-7 place-items-center rounded bg-white/15 text-[13px] font-bold">V</span>
        <span className="text-left leading-tight">
          Ask Vantage
          <span className="block text-[10px] font-medium uppercase tracking-wider text-white/70">Assistant · live data</span>
        </span>
        <span className="relative ml-1 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-[76px] right-5 z-30 flex h-[580px] w-[420px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-md border border-line-strong bg-panel shadow-2xl shadow-black/60"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded bg-accent text-[12px] font-bold text-white">V</span>
                <div>
                  <div className="text-sm font-semibold leading-none">Vantage assistant</div>
                  <div className="mono mt-1 text-[10px] uppercase tracking-wider text-muted">
                    {result ? 'Reads your plan and today’s market' : 'Reads today’s market'}
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-text cursor-pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {msgs.length === 0 && (
                <div>
                  <div className="rounded-md rounded-tl-sm bg-panel-2 px-3.5 py-2.5 text-sm leading-relaxed">
                    {result
                      ? 'I can see your plan, today’s prices and the news. Ask me anything about it.'
                      : 'I can see today’s prices and the news. Ask me anything, or run an analysis and I’ll read your plan too.'}
                  </div>
                  <div className="mt-3 flex flex-col gap-1.5">
                    {suggested.map((q) => (
                      <button
                        key={q}
                        onClick={() => send(q)}
                        className="rounded border border-line px-3 py-2 text-left text-[13px] text-muted transition-colors hover:border-accent/60 hover:text-text cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {msgs.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    data-role={m.role}
                    className={`max-w-[88%] px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user' ? 'rounded-md rounded-tr-sm bg-accent/20 text-text' : 'rounded-md rounded-tl-sm bg-panel-2'
                    }`}
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-md rounded-tl-sm bg-panel-2 px-3.5 py-3">
                    {[0, 1, 2].map((i) => (
                      <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-muted" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.18 }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                send(text)
              }}
              className="flex items-center gap-2 border-t border-line px-3 py-3"
            >
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ask about the market or your plan"
                className="flex-1 rounded border border-line bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <button type="submit" disabled={busy || !text.trim()} className="rounded bg-accent px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-40 cursor-pointer">
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
