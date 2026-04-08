/**
 * embed.ts — WordPress embed bootstrap script
 *
 * This script is compiled to a standalone IIFE bundle (embed.js) and served
 * from Cloudflare Pages CDN. It mounts the KHSBHOF React app into any page
 * containing <div id="khsbhof-app"></div>.
 *
 * WordPress usage:
 *   <div id="khsbhof-app"></div>
 *   <script src="https://khsbhof.pages.dev/embed.js" defer></script>
 *
 * The script:
 *   1. Waits for DOMContentLoaded
 *   2. Finds #khsbhof-app
 *   3. Dynamically injects the app CSS (scoped to avoid WP theme conflicts)
 *   4. Dynamically imports the React app bundle and mounts it
 *   5. Exposes a global KHSBHOF API for optional programmatic control
 */

const APP_BASE_URL = 'https://khsbhof.pages.dev'
const MOUNT_ID = 'khsbhof-app'

interface KHSBHOFApi {
  ask: (question: string) => void
  navigate: (path: string) => void
}

declare global {
  interface Window {
    KHSBHOF?: KHSBHOFApi
  }
}

function log(msg: string) {
  console.log(`[KHSBHOF] ${msg}`)
}

function injectStyles(baseUrl: string) {
  // Check if already injected
  if (document.getElementById('khsbhof-styles')) return

  const link = document.createElement('link')
  link.id = 'khsbhof-styles'
  link.rel = 'stylesheet'
  link.href = `${baseUrl}/assets/index.css`
  link.onload = () => log('Styles loaded')
  link.onerror = () => log('Warning: styles failed to load')
  document.head.appendChild(link)

  // Add base styles for the container to isolate from WP theme
  const style = document.createElement('style')
  style.id = 'khsbhof-reset'
  style.textContent = `
    #${MOUNT_ID} {
      all: initial;
      display: block;
      font-family: 'Source Sans 3', Calibri, system-ui, sans-serif;
      font-size: 16px;
      line-height: 1.5;
      color: white;
      background: #0A1628;
      box-sizing: border-box;
    }
    #${MOUNT_ID} *, #${MOUNT_ID} *::before, #${MOUNT_ID} *::after {
      box-sizing: inherit;
    }
    #${MOUNT_ID} a {
      color: inherit;
      text-decoration: none;
    }
  `
  document.head.appendChild(style)
}

async function mount(container: HTMLElement, baseUrl: string) {
  try {
    log('Loading app bundle…')

    // Dynamically import the React app entry point
    // The app bundle is built as an ES module with a predictable entry point
    const appModule = await import(/* @vite-ignore */ `${baseUrl}/assets/main.js`)

    if (appModule && typeof appModule.mountApp === 'function') {
      await appModule.mountApp(container)
    } else if (appModule && appModule.default && typeof appModule.default === 'function') {
      appModule.default(container)
    } else {
      // Fallback: render an iframe pointing to the hosted app
      log('Bundle mount function not found — falling back to iframe embed')
      const iframe = document.createElement('iframe')
      iframe.src = baseUrl
      iframe.style.cssText = `
        width: 100%;
        min-height: 800px;
        border: none;
        display: block;
      `
      iframe.title = 'Kentucky High School Basketball Hall of Fame Encyclopedia'
      iframe.allow = 'fullscreen'
      container.appendChild(iframe)
    }

    log('App mounted successfully')
    setupGlobalApi()
  } catch (err) {
    log(`Error mounting app: ${err}`)
    // Last resort: show a link to the hosted app
    container.innerHTML = `
      <div style="padding:24px;text-align:center;background:#0A1628;font-family:Georgia,serif;">
        <p style="color:#C9993A;font-size:1.25rem;font-weight:bold;margin:0 0 12px;">
          Kentucky HS Basketball Hall of Fame Encyclopedia
        </p>
        <a href="${baseUrl}" target="_blank" rel="noopener"
           style="color:white;text-decoration:underline;">
          Open the Encyclopedia →
        </a>
      </div>
    `
  }
}

function setupGlobalApi() {
  window.KHSBHOF = {
    ask: (question: string) => {
      window.dispatchEvent(new CustomEvent('khsbhof:ask', { detail: { question } }))
    },
    navigate: (path: string) => {
      window.dispatchEvent(new CustomEvent('khsbhof:navigate', { detail: { path } }))
    },
  }
}

function init() {
  const container = document.getElementById(MOUNT_ID)
  if (!container) {
    log(`Mount target #${MOUNT_ID} not found — nothing to do`)
    return
  }

  log(`Mount target found — initializing`)
  injectStyles(APP_BASE_URL)
  mount(container, APP_BASE_URL)
}

// Initialize after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
