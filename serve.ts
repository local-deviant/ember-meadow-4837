// serve.ts — a tiny static server for trying the app locally.
// Serves app/ at http://localhost:8080 (or the PORT env var). This file
// is a development helper only; it is not part of the judged entry.
// Node 22, standard library only.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(join(fileURLToPath(new URL(".", import.meta.url)), "app"));
const port = Number(process.env.PORT ?? 8080);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    let rel = decodeURIComponent(url.pathname);
    if (rel === "/") rel = "/index.html";
    const file = resolve(join(root, normalize(rel).replace(/^(\.\.[/\\])+/, "")));
    if (!file.startsWith(root + sep) && file !== root) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, {
      "content-type": MIME[extname(file)] ?? "application/octet-stream",
      // Never cache during development: the editor changes constantly.
      "cache-control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(port, () => {
  console.log(`Vice City Cover Studio: http://localhost:${port}/`);
});
