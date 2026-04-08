import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/encyclopedia', label: 'Encyclopedia' },
  { href: '/sweet-16', label: 'Sweet 16' },
  { href: '/miss-basketball', label: 'Miss Basketball' },
  { href: '/mister-basketball', label: 'Mister Basketball' },
  { href: '/records', label: 'Records' },
  { href: '/hall-of-fame', label: 'Hall of Fame' },
  { href: '/all-a-classic', label: 'All A Classic' },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-50 bg-navy/95 backdrop-blur-md border-b border-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center group-hover:bg-gold/30 transition-colors">
              <span className="text-gold text-lg font-serif font-bold leading-none">K</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-serif font-bold text-white text-sm leading-tight block">
                Kentucky HS Basketball
              </span>
              <span className="text-gold text-xs font-semibold tracking-wider uppercase">
                Hall of Fame
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`nav-link px-3 py-2 text-sm rounded-sm transition-colors ${
                  pathname === link.href ? 'active text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side — Chat CTA */}
          <div className="flex items-center gap-3">
            <button
              className="hidden sm:flex items-center gap-2 btn-primary py-2 text-sm"
              onClick={() => {
                const chatEl = document.getElementById('chat-widget')
                chatEl?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Ask AI
            </button>

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden p-2 text-white/70 hover:text-white transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="lg:hidden border-t border-white/10 py-3 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`block px-3 py-2.5 text-sm rounded-sm transition-colors ${
                  pathname === link.href
                    ? 'text-gold bg-gold/10'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
