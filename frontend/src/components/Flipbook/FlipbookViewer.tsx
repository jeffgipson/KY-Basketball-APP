import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
// page-flip is CJS — Vite's optimizer exposes it as named exports in dev/client builds.
// It is listed in ssr.external so it is skipped during SSG rendering.
import { PageFlip } from 'page-flip'
import type { SizeType } from 'page-flip'

export interface TocEntry {
  label: string
  page: number
}

interface FlipbookViewerProps {
  totalPages: number
  /** Base URL for page images, e.g. "/pages/". Images are named 001.webp, 002.webp, ... */
  pageBaseUrl?: string
  toc?: TocEntry[]
  onPageChange?: (page: number) => void
}

type Orientation = 'portrait' | 'landscape'

const DEFAULT_BASE_URL = '/pages/'

function padPage(n: number) {
  return String(n).padStart(3, '0')
}

export function FlipbookViewer({
  totalPages,
  pageBaseUrl = DEFAULT_BASE_URL,
  toc = [],
  onPageChange,
}: FlipbookViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const flipbookRef = useRef<PageFlip | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [inputPage, setInputPage] = useState('1')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isTocOpen, setIsTocOpen] = useState(false)
  const [orientation, setOrientation] = useState<Orientation>('landscape')
  const [isLoading, setIsLoading] = useState(true)

  // Detect orientation
  useEffect(() => {
    function check() {
      setOrientation(window.innerWidth < window.innerHeight ? 'portrait' : 'landscape')
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Initialize PageFlip
  useEffect(() => {
    if (!containerRef.current) return

    const isPortrait = orientation === 'portrait'
    const width = isPortrait
      ? Math.min(window.innerWidth - 32, 400)
      : Math.min((window.innerWidth - 64) / 2, 550)
    const height = Math.min(window.innerHeight * 0.75, 750)

    const pf = new PageFlip(containerRef.current, {
      width,
      height,
      size: 'fixed' as SizeType,
      minWidth: 280,
      maxWidth: 600,
      minHeight: 400,
      maxHeight: 800,
      maxShadowOpacity: 0.5,
      showCover: true,
      mobileScrollSupport: false,
      usePortrait: isPortrait,
      autoSize: true,
      drawShadow: true,
      flippingTime: 700,
    })

    // Load pages as images
    const pageEls = Array.from(
      { length: totalPages },
      (_, i) => {
        const div = document.createElement('div')
        div.className = 'page-img-wrapper'
        div.style.cssText = 'background:#0A1628;display:flex;align-items:center;justify-content:center;'
        const img = document.createElement('img')
        img.src = `${pageBaseUrl}${padPage(i + 1)}.webp`
        img.alt = `Page ${i + 1}`
        img.style.cssText = 'width:100%;height:100%;object-fit:contain;'
        img.loading = 'lazy'
        img.onload = () => {
          if (i === 0) setIsLoading(false)
        }
        div.appendChild(img)
        return div
      }
    )

    pf.loadFromHTML(pageEls)

    pf.on('flip', (e: { data: number }) => {
      const page = e.data + 1
      setCurrentPage(page)
      setInputPage(String(page))
      onPageChange?.(page)
    })

    flipbookRef.current = pf
    setIsLoading(false)

    return () => {
      pf.destroy()
      flipbookRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages, pageBaseUrl, orientation])

  const flipPrev = useCallback(() => flipbookRef.current?.flipPrev(), [])
  const flipNext = useCallback(() => flipbookRef.current?.flipNext(), [])

  const jumpToPage = useCallback((page: number) => {
    const clamped = Math.max(1, Math.min(page, totalPages))
    flipbookRef.current?.flip(clamped - 1)
    setCurrentPage(clamped)
    setInputPage(String(clamped))
  }, [totalPages])

  const handlePageInput = (e: React.FormEvent) => {
    e.preventDefault()
    const n = parseInt(inputPage, 10)
    if (!isNaN(n)) jumpToPage(n)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.closest('.flipbook-shell')?.requestFullscreen().catch(() => null)
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => null)
      setIsFullscreen(false)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') flipNext()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') flipPrev()
      if (e.key === 'Escape') setIsTocOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flipNext, flipPrev])

  return (
    <div className={`flipbook-shell relative bg-navy rounded-sm border border-gold/20 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-navy-600/50 border-b border-gold/20 gap-3">
        {/* TOC toggle */}
        <button
          onClick={() => setIsTocOpen(!isTocOpen)}
          className="btn-ghost flex items-center gap-2 text-sm"
          title="Table of Contents"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10" />
          </svg>
          <span className="hidden sm:inline">Contents</span>
        </button>

        {/* Page controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={flipPrev}
            disabled={currentPage <= 1}
            className="btn-ghost p-2 disabled:opacity-30"
            title="Previous page (←)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <form onSubmit={handlePageInput} className="flex items-center gap-1">
            <input
              type="text"
              value={inputPage}
              onChange={(e) => setInputPage(e.target.value)}
              className="w-12 text-center bg-navy border border-white/20 rounded-sm py-1 text-sm text-white focus:border-gold focus:outline-none"
              aria-label="Current page"
            />
            <span className="text-white/40 text-sm">/ {totalPages}</span>
          </form>

          <button
            onClick={flipNext}
            disabled={currentPage >= totalPages}
            className="btn-ghost p-2 disabled:opacity-30"
            title="Next page (→)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Right controls */}
        <button
          onClick={toggleFullscreen}
          className="btn-ghost p-2"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9h4.5M15 9V4.5M15 9l5.25-5.25M9 15H4.5M9 15v4.5M9 15l-5.25 5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          )}
        </button>
      </div>

      {/* Main content area */}
      <div className="relative flex">
        {/* TOC sidebar */}
        {isTocOpen && toc.length > 0 && (
          <aside className="w-60 bg-navy border-r border-gold/20 overflow-y-auto max-h-[70vh] animate-fade-in z-10">
            <div className="p-3 border-b border-white/10">
              <h3 className="font-serif text-sm font-bold text-gold">Table of Contents</h3>
            </div>
            <nav className="p-2">
              {toc.map((entry) => (
                <button
                  key={`${entry.label}-${entry.page}`}
                  onClick={() => { jumpToPage(entry.page); setIsTocOpen(false) }}
                  className="w-full text-left px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 rounded-sm transition-colors flex justify-between items-center gap-2"
                >
                  <span className="truncate">{entry.label}</span>
                  <span className="text-gold/60 shrink-0">{entry.page}</span>
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* Flipbook canvas */}
        <div className="flex-1 flex items-center justify-center p-4 min-h-[500px] relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-navy z-10">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-3" />
                <p className="text-white/50 text-sm">Loading encyclopedia…</p>
              </div>
            </div>
          )}
          <div ref={containerRef} className="flipbook-container" />
        </div>
      </div>

      {/* Mobile landscape hint */}
      <div className="sm:hidden text-center py-2 text-white/30 text-xs border-t border-white/5">
        Tip: rotate to landscape for best reading experience
      </div>

      {/* Keyboard hint */}
      <div className="hidden sm:flex justify-center py-1.5 text-white/20 text-xs border-t border-white/5 gap-4">
        <span>← → arrow keys to flip</span>
        <span>Enter a page number to jump</span>
      </div>
    </div>
  )
}
