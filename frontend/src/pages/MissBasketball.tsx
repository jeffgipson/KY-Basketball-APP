import { Link } from 'react-router-dom'
import { SEOHead } from '../components/Layout/SEOHead'

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Miss Basketball Award — Kentucky High School Basketball",
  "description": "Complete history of Kentucky's Miss Basketball award, honoring the top girls' basketball player in the state each year.",
  "provider": {
    "@type": "Organization",
    "name": "Kentucky High School Basketball Hall of Fame"
  }
}

export function MissBasketballPage() {
  return (
    <>
      <SEOHead
        title="Miss Basketball Award"
        description="Complete history of Kentucky's Miss Basketball award — honoring the top girls' high school basketball player in the Commonwealth each year, including award winners, their schools, and their paths to college and professional basketball."
        canonicalPath="/miss-basketball"
        jsonLd={jsonLd}
      />

      <div className="bg-gradient-to-b from-navy-400/20 to-navy border-b border-gold/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="section-subtitle mb-2">Girls' Basketball Award</p>
          <h1 className="section-title text-5xl mb-4">Miss Basketball</h1>
          <p className="text-white/60 max-w-2xl leading-relaxed">
            Kentucky's Miss Basketball award recognizes the top female high school basketball player in the Commonwealth each year. The complete award history — winner, school, and legacy — is preserved in the encyclopedia.
          </p>
          <div className="flex gap-3 mt-6">
            <Link to="/encyclopedia" className="btn-primary">Browse in Encyclopedia</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="card p-6">
            <h2 className="font-serif text-xl font-bold text-white mb-3">Award History</h2>
            <p className="text-white/60 text-sm leading-relaxed">
              The Miss Basketball award is one of Kentucky's most prestigious individual honors in high school sports. The encyclopedia contains the complete list of award winners with their school, year, and biographical notes.
            </p>
          </div>
          <div className="card p-6">
            <h2 className="font-serif text-xl font-bold text-white mb-3">Beyond High School</h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Many Miss Basketball recipients went on to college All-American careers and professional basketball. The encyclopedia tracks the career paths of these exceptional athletes.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
