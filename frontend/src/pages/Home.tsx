import { Link } from 'react-router-dom'
import { ChatWidget } from '../components/Chatbot/ChatWidget'

const featuredSections = [
  {
    href: '/sweet-16',
    icon: '🏆',
    label: 'Sweet 16',
    description: 'State tournament brackets, champions, and all-tournament teams from every era.',
  },
  {
    href: '/miss-basketball',
    icon: '⭐',
    label: 'Miss Basketball',
    description: "Kentucky's top girls' player each year — a complete award history.",
  },
  {
    href: '/mister-basketball',
    icon: '⭐',
    label: 'Mister Basketball',
    description: "Kentucky's top boys' player each year — a complete award history.",
  },
  {
    href: '/records',
    icon: '📊',
    label: 'Records',
    description: 'All-time scoring leaders, career stats, championship game line scores, and more.',
  },
  {
    href: '/hall-of-fame',
    icon: '🏅',
    label: 'Hall of Fame',
    description: 'Inductee profiles celebrating the legends of Kentucky high school basketball.',
  },
  {
    href: '/all-a-classic',
    icon: '🎽',
    label: 'All A Classic',
    description: 'Complete results from the All A Classic (1980–2017) and other major invitationals.',
  },
]

const suggestedQuestions = [
  'Who won the Sweet 16 in 1966?',
  'Who was Miss Basketball in 1992?',
  'Which school has the most state championships?',
  'Who are the all-time scoring leaders in Kentucky?',
]

export function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy min-h-[85vh] flex items-center">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy to-navy-400/30 pointer-events-none" />
        {/* Gold accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <p className="section-subtitle mb-4">Est. over 100 Years of History</p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6">
            Kentucky High School Basketball
            <br />
            <span className="gold-shimmer">Hall of Fame</span>
          </h1>
          <p className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            One hundred years of Sweet 16 glory, Miss Basketball honorees, legendary coaches, and the players who put Kentucky basketball on the map. Explore the complete encyclopedia — or just ask.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/encyclopedia" className="btn-primary text-base">
              Open Encyclopedia
            </Link>
            <a
              href="#chat-widget"
              className="btn-secondary text-base"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('chat-widget')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Ask the AI
            </a>
          </div>

          {/* Suggested questions */}
          <div className="mt-12 flex flex-wrap justify-center gap-2">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                className="text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold/30 px-3 py-1.5 rounded-full transition-all"
                onClick={() => {
                  document.getElementById('chat-widget')?.scrollIntoView({ behavior: 'smooth' })
                  window.dispatchEvent(new CustomEvent('khsbhof:ask', { detail: { question: q } }))
                }}
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <p className="section-subtitle mb-2">Explore the Encyclopedia</p>
          <h2 className="section-title">100+ Years of History</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredSections.map((section) => (
            <Link
              key={section.href}
              to={section.href}
              className="card p-6 hover:border-gold/30 hover:bg-gold/5 transition-all duration-200 group"
            >
              <div className="text-3xl mb-3">{section.icon}</div>
              <h3 className="font-serif text-xl font-bold text-white mb-2 group-hover:text-gold transition-colors">
                {section.label}
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">{section.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Chatbot section */}
      <section
        id="chat-widget"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16"
      >
        <div className="text-center mb-8">
          <p className="section-subtitle mb-2">AI-Powered Search</p>
          <h2 className="section-title">Ask Anything</h2>
          <p className="text-white/50 mt-3 max-w-xl mx-auto text-sm">
            Our AI has read every page of the encyclopedia. Ask about players, games, seasons, records, and awards — it only answers from official encyclopedia content.
          </p>
        </div>
        <ChatWidget />
      </section>
    </>
  )
}
