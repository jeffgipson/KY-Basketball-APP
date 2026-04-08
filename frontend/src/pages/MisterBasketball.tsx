import { Link } from 'react-router-dom'
import { SEOHead } from '../components/Layout/SEOHead'
import { ChatWidget } from '../components/Chatbot/ChatWidget'

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Mister Basketball Award — Kentucky High School Basketball",
  "description": "Complete history of Kentucky's Mister Basketball award, honoring the top boys' basketball player in the state each year.",
  "provider": {
    "@type": "Organization",
    "name": "Kentucky High School Basketball Hall of Fame"
  }
}

export function MisterBasketballPage() {
  return (
    <>
      <SEOHead
        title="Mister Basketball Award"
        description="Complete history of Kentucky's Mister Basketball award — honoring the top boys' high school basketball player in the Commonwealth each year, including award winners, their schools, and their paths to college and professional basketball."
        canonicalPath="/mister-basketball"
        jsonLd={jsonLd}
      />

      <div className="bg-gradient-to-b from-navy-400/20 to-navy border-b border-gold/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="section-subtitle mb-2">Boys' Basketball Award</p>
          <h1 className="section-title text-5xl mb-4">Mister Basketball</h1>
          <p className="text-white/60 max-w-2xl leading-relaxed">
            Kentucky's Mister Basketball award — among the most coveted individual honors in high school sports — recognizes the Commonwealth's top male player each year. The encyclopedia preserves the complete award history alongside each recipient's legacy.
          </p>
          <div className="flex gap-3 mt-6">
            <Link to="/encyclopedia" className="btn-primary">Browse in Encyclopedia</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            { label: "Award Winners", icon: "🏅", desc: "Complete year-by-year list of Mister Basketball recipients." },
            { label: "College Careers", icon: "🎓", desc: "Where each winner went to college and how they performed." },
            { label: "Pro Players", icon: "⭐", desc: "Winners who went on to NBA or professional careers." },
          ].map((item) => (
            <div key={item.label} className="card p-5 text-center">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-serif font-bold text-white mb-2">{item.label}</h3>
              <p className="text-white/50 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>

        <div id="chat">
          <div className="text-center mb-6">
            <p className="section-subtitle mb-2">Ask the Encyclopedia</p>
            <h2 className="font-serif text-2xl font-bold text-white">Mister Basketball Questions?</h2>
          </div>
          <ChatWidget />
        </div>
      </div>
    </>
  )
}
