import { Link } from 'react-router-dom'

const sections = [
  { href: '/sweet-16', label: 'Sweet 16 Championships' },
  { href: '/miss-basketball', label: 'Miss Basketball' },
  { href: '/mister-basketball', label: 'Mister Basketball' },
  { href: '/records', label: 'Records & Statistics' },
  { href: '/hall-of-fame', label: 'Hall of Fame Inductees' },
  { href: '/all-a-classic', label: 'All A Classic' },
]

export function Footer() {
  return (
    <footer className="bg-navy-600/30 border-t border-gold/20 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
                <span className="text-gold text-xl font-serif font-bold leading-none">K</span>
              </div>
              <div>
                <p className="font-serif font-bold text-white text-sm">Kentucky HS Basketball</p>
                <p className="text-gold text-xs font-semibold tracking-wider uppercase">Hall of Fame</p>
              </div>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Preserving and celebrating more than 100 years of Kentucky high school basketball history — boys' and girls' programs alike.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-gold font-semibold text-xs uppercase tracking-widest mb-4">Encyclopedia</h3>
            <ul className="space-y-2">
              {sections.map((s) => (
                <li key={s.href}>
                  <Link to={s.href} className="text-white/50 hover:text-white text-sm transition-colors">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-gold font-semibold text-xs uppercase tracking-widest mb-4">About</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/encyclopedia" className="text-white/50 hover:text-white text-sm transition-colors">
                  Digital Encyclopedia
                </Link>
              </li>
              <li>
                <a
                  href="https://acclaimpress.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/50 hover:text-white text-sm transition-colors"
                >
                  Published by Acclaim Press
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="gold-rule mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Kentucky High School Basketball Hall of Fame. Published by Acclaim Press.
          </p>
          <p className="text-white/30 text-xs">
            Powered by AI — content strictly sourced from the official encyclopedia
          </p>
        </div>
      </div>
    </footer>
  )
}
