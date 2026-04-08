import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  error?: boolean
  sourceRef?: string
}

interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
}

type ChatAction =
  | { type: 'ADD_USER_MSG'; message: ChatMessage }
  | { type: 'ADD_ASSISTANT_MSG'; message: ChatMessage }
  | { type: 'APPEND_CHUNK'; id: string; chunk: string }
  | { type: 'FINISH_STREAMING'; id: string; sourceRef?: string }
  | { type: 'SET_ERROR'; id: string }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'CLEAR' }

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_USER_MSG':
      return { ...state, messages: [...state.messages, action.message], isLoading: true }
    case 'ADD_ASSISTANT_MSG':
      return { ...state, messages: [...state.messages, action.message] }
    case 'APPEND_CHUNK':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id ? { ...m, content: m.content + action.chunk } : m
        ),
      }
    case 'FINISH_STREAMING':
      return {
        ...state,
        isLoading: false,
        messages: state.messages.map((m) =>
          m.id === action.id ? { ...m, streaming: false, sourceRef: action.sourceRef } : m
        ),
      }
    case 'SET_ERROR':
      return {
        ...state,
        isLoading: false,
        messages: state.messages.map((m) =>
          m.id === action.id ? { ...m, streaming: false, error: true } : m
        ),
      }
    case 'SET_LOADING':
      return { ...state, isLoading: action.loading }
    case 'CLEAR':
      return { messages: [], isLoading: false }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? 'http://localhost:8787'

const SUGGESTED_QUESTIONS = [
  'Who won the Sweet 16 in 1966?',
  'Who was Miss Basketball in 1992?',
  'Which school has the most state championships?',
  'Who won Mister Basketball in 2005?',
  'What players from Kentucky went on to the NBA?',
  'Who won the All A Classic in 1993?',
  'Which coach has the most state championships?',
  'Who holds the all-time scoring record?',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-gold text-xs font-serif font-bold">K</span>
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-sm px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-gold/20 border border-gold/30 text-white'
            : message.error
            ? 'bg-red-900/30 border border-red-500/30 text-red-200'
            : 'bg-navy-600/60 border border-white/10 text-white/90'
        }`}
      >
        {message.error ? (
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {message.content || 'Something went wrong. Please try again.'}
          </span>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{message.content}</p>
            {message.streaming && (
              <span className="inline-block w-1.5 h-4 bg-gold/70 ml-0.5 animate-pulse rounded-sm" />
            )}
            {message.sourceRef && (
              <p className="mt-2 text-xs text-white/30 italic border-t border-white/10 pt-2">
                Source: {message.sourceRef}
              </p>
            )}
          </>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ChatWidget() {
  const [state, dispatch] = useReducer(chatReducer, { messages: [], isLoading: false })
  const [input, setInput] = useState('')
  const threadRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [state.messages])

  // Listen for suggested question clicks from hero section
  useEffect(() => {
    function onAsk(e: Event) {
      const question = (e as CustomEvent<{ question: string }>).detail.question
      if (question) {
        setInput(question)
        inputRef.current?.focus()
      }
    }
    window.addEventListener('khsbhof:ask', onAsk)
    return () => window.removeEventListener('khsbhof:ask', onAsk)
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || state.isLoading) return

    setInput('')

    const userMsgId = uid()
    const assistantMsgId = uid()

    dispatch({
      type: 'ADD_USER_MSG',
      message: { id: userMsgId, role: 'user', content: trimmed },
    })

    dispatch({
      type: 'ADD_ASSISTANT_MSG',
      message: { id: assistantMsgId, role: 'assistant', content: '', streaming: true },
    })

    abortRef.current = new AbortController()

    try {
      const history = state.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch(`${WORKER_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let sourceRef: string | undefined

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data) as { delta?: string; source_ref?: string }
              if (parsed.delta) {
                dispatch({ type: 'APPEND_CHUNK', id: assistantMsgId, chunk: parsed.delta })
              }
              if (parsed.source_ref) {
                sourceRef = parsed.source_ref
              }
            } catch {
              // Non-JSON SSE data — treat as raw text chunk
              if (data && data !== '[DONE]') {
                dispatch({ type: 'APPEND_CHUNK', id: assistantMsgId, chunk: data })
              }
            }
          }
        }
      }

      dispatch({ type: 'FINISH_STREAMING', id: assistantMsgId, sourceRef })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        dispatch({ type: 'FINISH_STREAMING', id: assistantMsgId })
      } else {
        dispatch({ type: 'SET_ERROR', id: assistantMsgId })
      }
    }
  }, [state.isLoading, state.messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const stopStreaming = () => {
    abortRef.current?.abort()
  }

  const isEmpty = state.messages.length === 0

  return (
    <div className="card max-w-3xl mx-auto overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 bg-navy-600/50 border-b border-gold/20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
          <span className="font-serif font-bold text-white text-sm">Hall of Fame Encyclopedia AI</span>
        </div>
        {state.messages.length > 0 && (
          <button
            onClick={() => dispatch({ type: 'CLEAR' })}
            className="text-white/30 hover:text-white/70 text-xs transition-colors"
            title="Clear conversation"
          >
            Clear
          </button>
        )}
      </div>

      {/* Message thread */}
      <div
        ref={threadRef}
        className="p-4 space-y-4 overflow-y-auto"
        style={{ minHeight: '320px', maxHeight: '480px' }}
      >
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-gold/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-white/60 text-sm mb-1 font-medium">Ask me anything about Kentucky basketball</p>
            <p className="text-white/30 text-xs max-w-xs">
              I've read every page of the encyclopedia and answer strictly from official content — no speculation.
            </p>

            {/* Suggested questions */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTED_QUESTIONS.slice(0, 4).map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold/30 px-3 py-2.5 rounded-sm transition-all leading-snug"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          state.messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-white/10 p-3">
        {!isEmpty && (
          <div className="flex gap-1.5 flex-wrap mb-2">
            {SUGGESTED_QUESTIONS.slice(4).map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={state.isLoading}
                className="text-xs text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold/30 px-2.5 py-1 rounded-full transition-all disabled:opacity-30"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about players, games, records, awards…"
            rows={1}
            className="flex-1 bg-navy border border-white/20 rounded-sm px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-gold/50 focus:outline-none resize-none leading-relaxed"
            style={{ minHeight: '42px', maxHeight: '120px' }}
            disabled={state.isLoading}
          />
          {state.isLoading ? (
            <button
              type="button"
              onClick={stopStreaming}
              className="shrink-0 p-2.5 rounded-sm bg-red-900/40 border border-red-500/30 text-red-400 hover:bg-red-900/60 transition-colors"
              title="Stop"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="shrink-0 p-2.5 rounded-sm bg-gold hover:bg-gold-400 text-navy transition-colors disabled:opacity-40"
              title="Send (Enter)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          )}
        </form>
        <p className="text-white/20 text-xs mt-1.5 text-center">
          Answers sourced strictly from the official encyclopedia — no hallucinations
        </p>
      </div>
    </div>
  )
}
