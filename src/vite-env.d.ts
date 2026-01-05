/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_N8N_WEBHOOK_URL: string
  readonly VITE_SHOPEE_SITE_ID: string
  readonly VITE_SHOPEE_PARTNER_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
