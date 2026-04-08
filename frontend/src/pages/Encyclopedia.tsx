import { useEffect, useState } from 'react'
import { FlipbookViewer } from '../components/Flipbook'
import type { TocEntry } from '../components/Flipbook'

interface PageManifest {
  totalPages: number
  generatedAt: string
}

const DEFAULT_TOC: TocEntry[] = [
  { label: "Introduction & Foreword", page: 1 },
  { label: "Boys' Sweet 16 Championships", page: 15 },
  { label: "Girls' Sweet 16 Championships", page: 120 },
  { label: "Regional Tournament Results", page: 200 },
  { label: "Mister Basketball Award Winners", page: 300 },
  { label: "Miss Basketball Award Winners", page: 320 },
  { label: "All A Classic Results", page: 360 },
  { label: "Louisville Invitational Tournament", page: 410 },
  { label: "King of the Bluegrass", page: 440 },
  { label: "All-State Teams", page: 470 },
  { label: "Records & Statistics", page: 520 },
  { label: "Coaches of the Year", page: 580 },
  { label: "Players Who Went Pro", page: 610 },
  { label: "Black Athletic League History", page: 640 },
  { label: "Hall of Fame Inductees", page: 680 },
]

export function EncyclopediaPage() {
  const [manifest, setManifest] = useState<PageManifest | null>(null)
  const [totalPages, setTotalPages] = useState(768) // default from brief

  useEffect(() => {
    fetch('/pages/manifest.json')
      .then((r) => r.json())
      .then((data: PageManifest) => {
        setManifest(data)
        setTotalPages(data.totalPages)
      })
      .catch(() => {
        // Manifest not yet generated — use default page count
      })
  }, [])

  return (
    <>
      {/* SEO head tags injected at SSG time */}
      <title>Encyclopedia — KHSBHOF</title>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-6">
          <p className="section-subtitle mb-1">Interactive</p>
          <h1 className="section-title">Encyclopedia</h1>
          <p className="text-white/50 mt-2 text-sm max-w-2xl">
            Browse all {totalPages} pages of the official Kentucky High School Basketball Hall of Fame Encyclopedia. Use the table of contents to jump to any section, or flip through page by page.
            {manifest && (
              <span className="text-white/30 ml-2 text-xs">
                ({manifest.totalPages} pages)
              </span>
            )}
          </p>
        </div>

        {/* Flipbook */}
        <FlipbookViewer
          totalPages={totalPages}
          toc={DEFAULT_TOC}
          onPageChange={(page) => {
            // Update URL hash for bookmarking (without navigation)
            window.history.replaceState(null, '', `#page-${page}`)
          }}
        />

        {/* Hint */}
        <p className="text-center text-white/20 text-xs mt-4">
          Pages load automatically from the CDN. First load may take a moment.
        </p>
      </div>
    </>
  )
}
