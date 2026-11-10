import { createFileRoute } from "@tanstack/react-router";

/**
 * Liveness endpoint for uptime monitors, container health checks and reverse
 * proxies. Deliberately dependency-free: it must keep answering even when the
 * rest of the app is misbehaving.
 *
 * Server-only. TanStack Start strips `server.handlers` from the client bundle.
 */
export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: () =>
        Response.json(
          {
            status: "ok",
            service: "treeviz",
            uptime: Math.round(process.uptime() * 1000) / 1000,
            timestamp: new Date().toISOString(),
          },
          { headers: { "cache-control": "no-store" } },
        ),
    },
  },
});
