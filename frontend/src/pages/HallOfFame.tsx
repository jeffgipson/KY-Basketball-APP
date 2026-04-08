import { Link } from 'react-router-dom'
import { SEOHead } from '../components/Layout/SEOHead'
import { ChatWidget } from '../components/Chatbot/ChatWidget'

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Hall of Fame Inductees — Kentucky High School Basketball",
  "description": "Profiles of Kentucky High School Basketball Hall of Fame inductees — the players, coaches, and contributors who shaped the history of basketball in the Commonwealth.",
}

export function HallOfFamePage() {
  return (
    <>
      <SEOHead
        title="Hall of Fame Inductees"
        description="Profiles of Kentucky High School Basketball Hall of Fame inductees — players, coaches, officials, and contributors who shaped over 100 years of basketball history in the Commonwealth."
        canonicalPath="/hall-of-fame"
        jsonLd={jsonLd}
      />

      <div className="bg-gradient-to-b from-navy-400/20 to-navy border-b border-gold/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="section-subtitle mb-2">Legends of the Game</p>
          <h1 className="section-title text-5xl mb-4">Hall of Fame</h1>
          <p className="text-white/60 max-w-2xl leading-relaxed">
            The Kentucky High School Basketball Hall of Fame honors the players, coaches, officials, and contributors who have made an indelible mark on the sport in the Commonwealth. Their stories — preserved in the official encyclopedia — are a testament to a century of excellence.
          </p>
          <div className="flex gap-3 mt-6">
            <Link to="/encyclopedia" className="btn-primary">Browse in Encyclopedia</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {[
            {
              icon: "🏅",
              label: "Player Inductees",
              desc: "Profiles of the players who elevated Kentucky high school basketball to national prominence — their records, schools, and careers after graduation.",
            },
            {
              icon: "👨‍🏫",
              label: "Coach Inductees",
              desc: "The legendary coaches who built championship programs, developed future stars, and dedicated their careers to Kentucky basketball.",
            },
            {
              icon: "📋",
              label: "Contributor Inductees",
              desc: "Officials, administrators, writers, and supporters whose work sustained and grew the sport across decades.",
            },
            {
              icon: "📅",
              label: "Induction Classes",
              desc: "Browse inductees by their induction year and class, from the inaugural class through the most recent ceremony.",
            },
          ].map((item) => (
            <div key={item.label} className="card p-6 hover:border-gold/30 transition-colors">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-serif text-xl font-bold text-white mb-2">{item.label}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div id="chat">
          <div className="text-center mb-6">
            <p className="section-subtitle mb-2">Ask the Encyclopedia</p>
            <h2 className="font-serif text-2xl font-bold text-white">Hall of Fame Questions?</h2>
          </div>
          <ChatWidget />
        </div>
      </div>
    </>
  )
}
