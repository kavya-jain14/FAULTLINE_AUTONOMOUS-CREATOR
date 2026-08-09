import { readFile, stat } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = resolve(
  fileURLToPath(new URL("../../web/dist/", import.meta.url)),
);

const CONTENT_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function safePath(pathname: string): string | null {
  let relative: string;

  try {
    relative = decodeURIComponent(pathname).replace(/^\/+/, "");
  } catch {
    return null;
  }
  const target = resolve(webRoot, relative || "index.html");

  if (target !== webRoot && !target.startsWith(`${webRoot}${sep}`)) {
    return null;
  }

  return target;
}

async function existingFile(path: string): Promise<string | null> {
  try {
    return (await stat(path)).isFile() ? path : null;
  } catch {
    return null;
  }
}

export async function serveWebApp(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<boolean> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return false;
  }

  const url = new URL(
    request.url ?? "/",
    `http://${request.headers.host ?? "localhost"}`,
  );

  if (url.pathname === "/health" || url.pathname.startsWith("/api/")) {
    return false;
  }

  const requested = safePath(url.pathname);

  if (!requested) {
    response.statusCode = 400;
    response.end("Invalid path.");
    return true;
  }

  const asset = await existingFile(requested);
  const file = asset ?? (await existingFile(resolve(webRoot, "index.html")));

  if (!file) {
    return false;
  }

  const body = await readFile(file);
  const extension = extname(file).toLowerCase();
  response.statusCode = 200;
  response.setHeader(
    "Content-Type",
    CONTENT_TYPES[extension] ?? "application/octet-stream",
  );
  response.setHeader(
    "Cache-Control",
    asset && extension !== ".html"
      ? "public, max-age=31536000, immutable"
      : "no-cache",
  );
  response.end(request.method === "HEAD" ? undefined : body);
  return true;
}
