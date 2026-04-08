import { Link } from 'react-router-dom'
import { SEOHead } from '../components/Layout/SEOHead'

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Kentucky Sweet 16 State Basketball Championships",
  "description": "Complete history of the Kentucky Sweet 16 high school basketball state championships — boys' and girls' programs, tournament brackets, champions, and all-tournament teams.",
  "provider": {
    "@type": "Organization",
    "name": "Kentucky High School Basketball Hall of Fame"
  }
}

const ERA_HIGHLIGHTS = [
  { era: "1916–1950", label: "The Early Years", description: "The formative decades of Kentucky high school basketball, when regional rivalries were born and the Sweet 16 format took shape." },
  { era: "1950–1970", label: "The Golden Age", description: "An era of legendary coaches, dominant programs, and the players who would define Kentucky basketball for generations." },
  { era: "1970–1990", label: "Integration & Expansion", description: "Kentucky basketball transformed — integrated rosters, rising girls' programs, and new powers challenging old dynasties." },
  { era: "1990–Present", label: "Modern Era", description: "The modern Sweet 16: expanded coverage, Girls' Sweet 16, and a pipeline of talent to college and professional basketball." },
]

export function Sweet16Page() {
  return (
    <>
      <SEOHead
        title="Sweet 16 State Championships"
        description="Complete history of the Kentucky Sweet 16 high school basketball state championships — boys' and girls' programs, tournament brackets, champions, and all-tournament teams spanning 100+ years."
        canonicalPath="/sweet-16"
        jsonLd={jsonLd}
      />

      {/* Hero banner */}
      <div className="bg-gradient-to-b from-navy-400/20 to-navy border-b border-gold/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="section-subtitle mb-2">Kentucky High School Basketball</p>
          <h1 className="section-title text-5xl mb-4">Sweet 16</h1>
          <p className="text-white/60 max-w-2xl leading-relaxed">
            The Sweet 16 — Kentucky's premier high school basketball tournament — has been decided at Rupp Arena, Memorial Coliseum, and EKU's Alumni Coliseum. Complete bracket results, champions, all-tournament teams, and game-by-game scores for both boys' and girls' programs.
          </p>
          <div className="flex gap-3 mt-6">
            <Link to="/encyclopedia" className="btn-primary">Browse in Encyclopedia</Link>
            <button
              className="btn-secondary"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('khsbhof:ask', { detail: { question: 'Who has won the most Sweet 16 state championships?' } }))
                document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Ask AI
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Era overview */}
        <div className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-white mb-6">Tournament History by Era</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ERA_HIGHLIGHTS.map((era) => (
              <div key={era.era} className="card p-5 hover:border-gold/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-16 text-center shrink-0">
                    <span className="text-gold font-serif text-xs font-bold">{era.era}</span>
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-white mb-1">{era.label}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{era.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            { label: "State Champions", icon: "🏆", desc: "Every boys' and girls' champion by year, school, and coach." },
            { label: "All-Tournament Teams", icon: "⭐", desc: "All-Tournament selections with player name, school, height, and class." },
            { label: "Bracket Results", icon: "📋", desc: "Full game-by-game bracket results including overtime results." },
          ].map((item) => (
            <div key={item.label} className="card p-5 text-center">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-serif font-bold text-white mb-2">{item.label}</h3>
              <p className="text-white/50 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
