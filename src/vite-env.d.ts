/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_LEGACY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
