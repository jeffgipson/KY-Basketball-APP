import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'embed.ts'),
      name: 'KHSBHOF',
      fileName: 'embed',
      formats: ['iife'],
    },
    outDir: '../frontend/public',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        // Single self-contained file
        inlineDynamicImports: false,
        entryFileNames: 'embed.js',
      },
    },
    minify: 'esbuild',
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../frontend/src'),
    },
  },
})
