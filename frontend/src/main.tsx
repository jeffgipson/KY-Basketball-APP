import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './routes'
import './styles/globals.css'

export const createRoot = ViteReactSSG(
  { routes },
  () => {
    // App-level setup (analytics, etc.)
  }
)
