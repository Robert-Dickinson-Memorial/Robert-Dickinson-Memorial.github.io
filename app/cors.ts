import { env } from "cloudflare:workers";

function configuredOrigin(): string {
  const value = (env as unknown as Record<string, string | undefined>).PUBLIC_SITE_ORIGIN;
  return value?.trim().replace(/\/$/, "") || "https://robert-dickinson-memorial.github.io";
}

export function publicCorsHeaders(): Headers {
  return new Headers({
    "access-control-allow-origin": configuredOrigin(),
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "Origin",
  });
}

export function publicJson(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  publicCorsHeaders().forEach((value, key) => headers.set(key, value));
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("x-content-type-options", "nosniff");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function publicOptions(): Response {
  return new Response(null, { status: 204, headers: publicCorsHeaders() });
}

export function publicMediaResponse(body: BodyInit | null, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  publicCorsHeaders().forEach((value, key) => headers.set(key, value));
  headers.set("x-content-type-options", "nosniff");
  return new Response(body, { ...init, headers });
}

export function isAllowedPublicOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin.replace(/\/$/, "") === configuredOrigin() || origin === new URL(request.url).origin;
}
