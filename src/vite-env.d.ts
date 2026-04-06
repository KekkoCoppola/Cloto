/// <reference types="vite/client" />

/**
 * H-3 fix: VITE_GEMINI_API_KEY has been removed from this interface.
 * The Gemini API key is handled server-side only (server.ts via dotenv).
 * DO NOT add VITE_GEMINI_API_KEY here — doing so would expose the key in the browser bundle.
 *
 * Add here only non-sensitive env vars that the client legitimately needs.
 */
interface ImportMetaEnv {
  readonly VITE_APP_TITLE?: string; // example: safe to expose
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
