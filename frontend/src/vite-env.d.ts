/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WORKER_URL: string
  readonly VITE_ANALYTICS_TOKEN: string
  readonly VITE_ENABLE_INDEXING: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
