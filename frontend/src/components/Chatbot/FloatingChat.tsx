import { useEffect, useRef, useState } from 'react'
import { ChatWidget } from './ChatWidget'

export function FloatingChat() {
  const [open, setOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Open and pre-fill a question when triggered from hero suggested questions
  useEffect(() => {
    function onAsk() {
      setOpen(true)
      setHasUnread(false)
    }
    window.addEventListener('khsbhof:ask', onAsk)
    return () => window.removeEventListener('khsbhof:ask', onAsk)
  }, [])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Trap focus inside panel when open
  useEffect(() => {
    if (open) {
      const el = panelRef.current?.querySelector<HTMLElement>('textarea')
      el?.focus()
    }
  }, [open])

  // Show unread dot after 3s if user hasn't opened yet
  useEffect(() => {
    const t = setTimeout(() => {
      if (!open) setHasUnread(true)
    }, 3000)
    return () => clearTimeout(t)
  }, [open])

  return (
    <>
      {/* Backdrop — click outside to close */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Floating panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Hall of Fame Encyclopedia AI Chat"
        aria-modal="true"
        className={`
          fixed z-50 transition-all duration-300 ease-out
          bottom-20 right-4 sm:right-6
          w-[calc(100vw-2rem)] sm:w-[420px]
          ${open
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-6 pointer-events-none'}
        `}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-3 bg-navy border border-gold/30 border-b-0 rounded-t-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span className="font-serif font-bold text-white text-sm">
              Encyclopedia AI
            </span>
            <span className="text-white/30 text-xs">· Ask anything</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-white/40 hover:text-white transition-colors p-1"
            aria-label="Close chat"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chat widget — rendered inside the panel */}
        <div className="rounded-b-sm overflow-hidden shadow-2xl shadow-black/50 border border-gold/30 border-t-0">
          <ChatWidget />
        </div>
      </div>

      {/* FAB — floating action button */}
      <button
        onClick={() => { setOpen((o) => !o); setHasUnread(false) }}
        aria-label={open ? 'Close AI chat' : 'Open AI chat'}
        aria-expanded={open}
        className={`
          fixed bottom-5 right-4 sm:right-6 z-50
          flex items-center gap-2.5
          bg-gold hover:bg-gold-400 text-navy
          px-4 py-3 rounded-full shadow-lg shadow-gold/30
          transition-all duration-200 hover:scale-105 active:scale-95
          font-semibold text-sm
          animate-pulse-gold
        `}
      >
        {open ? (
          <>
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Close</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.03 2 11c0 2.62 1.18 4.97 3.05 6.63L4 21l3.77-1.9C9.07 19.67 10.49 20 12 20c5.52 0 10-4.03 10-9S17.52 2 12 2zm1 13h-2v-2h2v2zm0-4h-2V7h2v4z"/>
            </svg>
            <span>Ask AI</span>
            {hasUnread && !open && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-navy" />
            )}
          </>
        )}
      </button>
    </>
  )
}
