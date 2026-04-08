import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['page-flip'],
  },
  ssr: {
    // page-flip is a CJS browser library — keep it external in SSR so Node doesn't
    // try to execute its DOM code during static site generation.
    noExternal: [],
    external: ['page-flip'],
  },
  // SSG is run via `vite-react-ssg build` in the deploy script
})
