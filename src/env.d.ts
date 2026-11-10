/// <reference types="vite/client" />

/**
 * Environment variables that are safe to expose to the browser bundle.
 * Vite inlines `VITE_*` values at build time, so anything listed here is public.
 * Never add a secret to this file — server-only secrets belong in non-`VITE_`
 * variables read from `process.env` at runtime.
 */
interface ImportMetaEnv {
  /** Public origin of this deployment, e.g. `https://treeviz.example.com`. Used for canonical URLs. */
  readonly VITE_PUBLIC_SITE_URL?: string;
}
