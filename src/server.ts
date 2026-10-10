import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { handleApiRequest } from "./server/api";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// Server-side in-memory DDoS protection & Sliding Window Rate Limiter
const ipRequestCounters = new Map<string, { count: number; resetAt: number }>();
const SERVER_RATE_LIMIT_WINDOW_MS = 10000; // 10 seconds
const SERVER_MAX_REQUESTS_PER_WINDOW = 120; // 120 requests / 10s per IP

function isDdosRateLimited(clientIp: string): { limited: boolean; retryAfter: number } {
  const now = Date.now();
  let item = ipRequestCounters.get(clientIp);

  if (!item || now > item.resetAt) {
    item = { count: 1, resetAt: now + SERVER_RATE_LIMIT_WINDOW_MS };
    ipRequestCounters.set(clientIp, item);
    return { limited: false, retryAfter: 0 };
  }

  item.count += 1;

  if (item.count > SERVER_MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((item.resetAt - now) / 1000);
    return { limited: true, retryAfter };
  }

  return { limited: false, retryAfter: 0 };
}

// Attach strict security headers to all responses (OWASP recommendations & Cloudflare-readiness)
function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-DDoS-Protection", "Reportix-Shield-Active");
  headers.set("X-Powered-By", "Reportix Enterprise Core");
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    // 1. Extract real client IP supporting Cloudflare & Reverse Proxies
    const clientIp =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";

    // 2. DDoS attack mitigation & request flood throttling
    const rateCheck = isDdosRateLimited(clientIp);
    if (rateCheck.limited) {
      return new Response(
        JSON.stringify({
          error: "Too Many Requests",
          message: "Превышен лимит сетевых запросов. Сработала автоматическая защита от DDoS-атак Reportix Shield.",
          retryAfter: rateCheck.retryAfter,
        }),
        {
          status: 429,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "Retry-After": String(rateCheck.retryAfter),
            "X-DDoS-Protection": "Reportix-Shield-Blocked",
          },
        }
      );
    }

    // 3. Handle internal Reportix API endpoints (/api/*)
    const apiResponse = await handleApiRequest(request, clientIp);
    if (apiResponse) {
      return applySecurityHeaders(apiResponse);
    }

    // 4. Default SSR / TanStack Start Page handler
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return applySecurityHeaders(normalized);
    } catch (error) {
      console.error(error);
      const errResp = new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
      return applySecurityHeaders(errResp);
    }
  },
};
