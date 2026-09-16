import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { Analysis, Inputs } from '../lib/api'

type Msg = { role: 'user' | 'assistant'; content: string }
const START = ['Is today a good day to put money into the market?', 'What is moving Indian stocks right now?', 'Should a beginner start with an index fund or gold?']
const RESULT = ['Should I invest today or wait a few weeks?', 'Is this plan too risky for me?', 'Which of these picks would you buy first?']

export default function Chat({ result, inputs, open, setOpen }: { result: Analysis | null; inputs: Inputs | null; open: boolean; setOpen: (o: boolean) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [suggested, setSuggested] = useState<string[]>(result ? RESULT : START)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/chat/suggested?stage=${result ? 'result' : 'start'}`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d.questions) && setSuggested(d.questions.slice(0, 4)))
      .catch(() => {})
  }, [result])
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, busy, open])
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200)
  }, [open])

  async function send(q: string) {
    const question = q.trim()
    if (!question || busy) return
    setText('')
    const history = msgs
    setMsgs((m) => [...m, { role: 'user', content: question }])
    setBusy(true)
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question, history, inputs, result }) })
      const d = await r.json()
      setMsgs((m) => [...m, { role: 'assistant', content: d.answer ?? 'No answer came back.' }])
    } catch {
      setMsgs((m) => [...m, { role: 'assistant', content: 'The assistant is busy. Ask again in a moment.' }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.aside initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 30, opacity: 0 }} transition={{ duration: 0.18 }} className="fixed bottom-0 right-0 top-0 z-40 flex w-[400px] max-w-full flex-col border-l border-amber/40 bg-panel shadow-2xl shadow-black/70">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="mono grid h-7 w-7 place-items-center bg-amber text-[11px] font-bold text-bg">AI</span>
              <div>
                <div className="text-[13px] font-semibold leading-none">Vantage assistant</div>
                <div className="label mt-1">{result ? 'Context: plan + live market' : 'Context: live market'}</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="mono text-muted hover:text-text cursor-pointer" aria-label="Close">
              ESC
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {msgs.length === 0 && (
              <div>
                <p className="text-[13px] leading-relaxed text-muted">{result ? 'Ask about the plan, the stocks in it, or what the market is doing today.' : 'Ask about the market today. Build a plan and I read that too.'}</p>
                <div className="mt-3 flex flex-col gap-1.5">
                  {suggested.map((q) => (
                    <button key={q} onClick={() => send(q)} className="border border-line px-3 py-2 text-left text-[12.5px] transition-colors hover:border-amber/60 hover:bg-panel-2 cursor-pointer">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} data-role={m.role} className={m.role === 'user' ? 'ml-8 border border-line bg-panel-2 px-3.5 py-2.5 text-[13px]' : 'border-l-2 border-amber pl-3.5 text-[13px] leading-relaxed'}>
                {m.content}
              </div>
            ))}
            {busy && (
              <div className="mono text-[11px] text-amber">
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2 }}>
                  THINKING
                </motion.span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(text)
            }}
            className="border-t border-line p-3"
          >
            <div className="flex items-center gap-2 border border-line bg-bg pl-3 pr-1.5 focus-within:border-amber">
              <span className="mono text-[11px] text-amber">›</span>
              <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask Vantage" className="mono h-9 flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-subtle" />
              <button type="submit" disabled={busy || !text.trim()} className="mono bg-amber px-3 py-1 text-[11px] font-bold text-bg disabled:opacity-30 cursor-pointer">
                SEND
              </button>
            </div>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
