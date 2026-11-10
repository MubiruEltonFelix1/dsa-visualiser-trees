import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Standalone Vite config. Builds the client bundle plus a server entry, using
// Nitro's `node-server` preset by default so the app can be self-hosted anywhere
// Node 20+ runs.
//
// `defaultPreset` is a FALLBACK, not a hard pin:
//   - On Vercel (VERCEL=1) Nitro auto-detects the `vercel` preset.
//   - `NITRO_PRESET=netlify` (or any other preset) overrides it explicitly.
export default defineConfig(({ command }) => ({
  css: {
    transformer: "lightningcss",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
    ignoreOutdatedRequests: true,
  },
  server: {
    host: true,
    port: 8080,
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // Fail the build if client code imports a server-only module.
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
      // Point TanStack Start's server entry at src/server.ts (our SSR error wrapper).
      server: { entry: "server" },
    }),
    ...(command === "build" ? [nitro({ defaultPreset: "node-server" })] : []),
    viteReact(),
  ],
}));
