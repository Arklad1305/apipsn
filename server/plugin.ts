/**
 * Vite plugin that mounts the apipsn JSON API on the dev server.
 * Everything runs in a single Node process — ideal for Bolt / StackBlitz.
 */
import type { Plugin, ViteDevServer } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handleRequest } from "./api";

export function apiPlugin(): Plugin {
  return {
    name: "apipsn-api",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(
        "/api",
        (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          handleRequest(req, res).catch((err) => {
            console.error("[api] unhandled", err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader("content-type", "application/json");
              res.end(
                JSON.stringify({
                  error: "internal_error",
                  message: String((err as Error)?.message || err),
                })
              );
            } else {
              res.end();
            }
          });
        }
      );
    },
  };
}
