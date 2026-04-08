import { Link } from 'react-router-dom'
import { SEOHead } from '../components/Layout/SEOHead'

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Records & Statistics — Kentucky High School Basketball",
  "description": "All-time scoring records, career statistics, championship game line scores, coaching records, and historical data from Kentucky high school basketball.",
}

const RECORD_CATEGORIES = [
  { icon: "📊", label: "Scoring Leaders", desc: "All-time individual and team scoring records for boys' and girls' programs." },
  { icon: "🏆", label: "Championship Records", desc: "Game-by-game championship scores, winning margins, and dynasty records." },
  { icon: "🎯", label: "Career Statistics", desc: "Career stats for standout players across all eras of Kentucky basketball." },
  { icon: "👨‍🏫", label: "Coaching Records", desc: "Win-loss records, championships, and career milestones for legendary coaches." },
  { icon: "🏫", label: "School Records", desc: "Which schools have won the most championships, appearances, and titles." },
  { icon: "📅", label: "Annual Records", desc: "Season-by-season records, scoring champions, and award winners." },
]

export function RecordsPage() {
  return (
    <>
      <SEOHead
        title="Records & Statistics"
        description="All-time records and statistics from Kentucky high school basketball — scoring leaders, championship game results, coaching records, career stats, and more spanning 100+ years."
        canonicalPath="/records"
        jsonLd={jsonLd}
      />

      <div className="bg-gradient-to-b from-navy-400/20 to-navy border-b border-gold/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="section-subtitle mb-2">Historical Data</p>
          <h1 className="section-title text-5xl mb-4">Records & Statistics</h1>
          <p className="text-white/60 max-w-2xl leading-relaxed">
            Over 100 years of Kentucky high school basketball history has produced extraordinary individual and team achievements. The encyclopedia is the definitive source for all-time records — from scoring leaders to coaching dynasties.
          </p>
          <div className="flex gap-3 mt-6">
            <Link to="/encyclopedia" className="btn-primary">Browse in Encyclopedia</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {RECORD_CATEGORIES.map((cat) => (
            <div key={cat.label} className="card p-5 hover:border-gold/30 transition-colors">
              <div className="text-2xl mb-3">{cat.icon}</div>
              <h3 className="font-serif font-bold text-white mb-2">{cat.label}</h3>
              <p className="text-white/50 text-sm">{cat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
