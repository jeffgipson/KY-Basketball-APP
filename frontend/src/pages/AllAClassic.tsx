import { Link } from 'react-router-dom'
import { SEOHead } from '../components/Layout/SEOHead'
import { ChatWidget } from '../components/Chatbot/ChatWidget'

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "All A Classic — Kentucky High School Basketball",
  "description": "Complete results from the Kentucky All A Classic (1980–2017) and other major invitational tournaments.",
}

export function AllAClassicPage() {
  return (
    <>
      <SEOHead
        title="All A Classic"
        description="Complete results from the Kentucky All A Classic (1980–2017), Louisville Invitational Tournament, King of the Bluegrass, and other major invitational tournaments in Kentucky high school basketball history."
        canonicalPath="/all-a-classic"
        jsonLd={jsonLd}
      />

      <div className="bg-gradient-to-b from-navy-400/20 to-navy border-b border-gold/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="section-subtitle mb-2">Invitational Tournaments</p>
          <h1 className="section-title text-5xl mb-4">All A Classic</h1>
          <p className="text-white/60 max-w-2xl leading-relaxed">
            The Kentucky All A Classic (1980–2017) brought together the Commonwealth's top small-school programs in a celebrated holiday tournament. The encyclopedia contains complete results — alongside the Louisville Invitational Tournament, King of the Bluegrass, and other major invitationals.
          </p>
          <div className="flex gap-3 mt-6">
            <Link to="/encyclopedia" className="btn-primary">Browse in Encyclopedia</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            {
              label: "All A Classic",
              years: "1980–2017",
              desc: "Boys' and girls' All A Classic results — champions, runners-up, and all-tournament teams.",
            },
            {
              label: "Louisville Invitational",
              years: "Historical",
              desc: "Results and champions from the prestigious Louisville Invitational Tournament.",
            },
            {
              label: "King of the Bluegrass",
              years: "Historical",
              desc: "The King of the Bluegrass holiday tournament — champions and notable performances.",
            },
          ].map((item) => (
            <div key={item.label} className="card p-5 text-center hover:border-gold/30 transition-colors">
              <div className="text-gold font-serif font-bold text-sm mb-2 uppercase tracking-wider">{item.years}</div>
              <h3 className="font-serif text-xl font-bold text-white mb-2">{item.label}</h3>
              <p className="text-white/50 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>

        <div id="chat">
          <div className="text-center mb-6">
            <p className="section-subtitle mb-2">Ask the Encyclopedia</p>
            <h2 className="font-serif text-2xl font-bold text-white">Invitational Questions?</h2>
          </div>
          <ChatWidget />
        </div>
      </div>
    </>
  )
}
