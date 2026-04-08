/**
 * pdf-to-images.ts
 *
 * Build-time script: converts a PDF encyclopedia into individual WebP images,
 * one per page. Output images are placed in public/pages/ and numbered 001.webp,
 * 002.webp, etc.
 *
 * Usage:
 *   npm run pdf-to-images -- --pdf /path/to/encyclopedia.pdf [--dpi 150] [--quality 85]
 *
 * Prerequisites:
 *   - Python 3.x with pdf2image installed: pip install pdf2image
 *   - poppler installed: brew install poppler (macOS) or apt-get install poppler-utils
 */

import { execSync, spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2)
function getArg(flag: string, defaultVal: string): string {
  const idx = args.indexOf(flag)
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultVal
}

const pdfPath = getArg('--pdf', '')
const dpi = parseInt(getArg('--dpi', '150'), 10)
const quality = parseInt(getArg('--quality', '85'), 10)
const outputDir = path.resolve(__dirname, '../public/pages')

if (!pdfPath) {
  console.error('Error: --pdf <path> is required')
  console.error('Usage: npm run pdf-to-images -- --pdf /path/to/encyclopedia.pdf [--dpi 150] [--quality 85]')
  process.exit(1)
}

if (!fs.existsSync(pdfPath)) {
  console.error(`Error: PDF not found at: ${pdfPath}`)
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Check dependencies
// ---------------------------------------------------------------------------
function checkDependency(cmd: string, hint: string) {
  const result = spawnSync(cmd, ['--version'], { stdio: 'pipe' })
  if (result.status !== 0) {
    console.error(`Missing dependency: ${cmd}`)
    console.error(`Install with: ${hint}`)
    process.exit(1)
  }
}

// Check Python and pdf2image
try {
  execSync('python3 -c "import pdf2image"', { stdio: 'pipe' })
} catch {
  console.error('Missing Python dependency: pdf2image')
  console.error('Install with: pip install pdf2image')
  process.exit(1)
}

checkDependency('pdftoppm', 'brew install poppler (macOS) or apt-get install poppler-utils (Linux)')

// ---------------------------------------------------------------------------
// Run conversion via Python
// ---------------------------------------------------------------------------
fs.mkdirSync(outputDir, { recursive: true })

console.log(`Converting PDF to WebP images…`)
console.log(`  PDF: ${pdfPath}`)
console.log(`  DPI: ${dpi}`)
console.log(`  Quality: ${quality}`)
console.log(`  Output: ${outputDir}`)
console.log()

const pythonScript = `
import sys
from pathlib import Path
from pdf2image import convert_from_path

pdf_path = sys.argv[1]
output_dir = Path(sys.argv[2])
dpi = int(sys.argv[3])
quality = int(sys.argv[4])

output_dir.mkdir(parents=True, exist_ok=True)

print(f"Loading PDF: {pdf_path}", flush=True)
pages = convert_from_path(pdf_path, dpi=dpi, fmt='ppm')
total = len(pages)
print(f"Total pages: {total}", flush=True)

for i, page in enumerate(pages, 1):
    filename = output_dir / f"{str(i).zfill(3)}.webp"
    page.save(str(filename), 'WEBP', quality=quality, method=6)
    pct = (i / total) * 100
    print(f"  [{i:>4}/{total}] {filename.name} ({pct:.0f}%)", flush=True)

print(f"\\nDone! {total} pages written to {output_dir}", flush=True)
`

const result = spawnSync(
  'python3',
  ['-c', pythonScript, pdfPath, outputDir, String(dpi), String(quality)],
  { stdio: 'inherit' }
)

if (result.status !== 0) {
  console.error('PDF conversion failed.')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Generate page manifest (used by the app to know total page count + TOC)
// ---------------------------------------------------------------------------
const webpFiles = fs
  .readdirSync(outputDir)
  .filter((f) => f.endsWith('.webp'))
  .sort()

const manifest = {
  totalPages: webpFiles.length,
  generatedAt: new Date().toISOString(),
  dpi,
  quality,
}

const manifestPath = path.join(outputDir, 'manifest.json')
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
console.log(`\nManifest written: ${manifestPath}`)
console.log(JSON.stringify(manifest, null, 2))
