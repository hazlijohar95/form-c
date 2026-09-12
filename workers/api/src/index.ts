export interface Env {
  DB: D1Database;
  /** Shared deploy token. When set, every /api/* route except /api/health
   *  requires `Authorization: Bearer <token>`. Unset = local dev only. */
  API_TOKEN?: string;
  /** Comma-separated CORS allowlist, e.g.
   *  "https://master.formc-studio.pages.dev,https://formc-studio.pages.dev". */
  ALLOWED_ORIGINS?: string;
}

const MAX_BODY_BYTES = 1_000_000;
const ID_RE = /^[A-Za-z0-9-]{1,64}$/;

function allowlist(env: Env): string[] {
  return (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function corsHeaders(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowed = allowlist(env);
  // Local dev (vite :5174, wrangler :8787) always allowed.
  const local = origin.startsWith("http://localhost:") || origin === "http://127.0.0.1:5174";
  if (origin && (local || allowed.includes(origin))) {
    return {
      "access-control-allow-origin": origin,
      vary: "Origin",
    };
  }
  return {};
}

function json(req: Request, env: Env, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      ...corsHeaders(req, env),
    },
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function authorized(req: Request, env: Env): boolean {
  const expected = env.API_TOKEN?.trim();
  if (!expected) return true; // secret not set — local dev only
  const got = req.headers.get("authorization") ?? "";
  return timingSafeEqual(got, `Bearer ${expected}`);
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-methods": "GET,PUT,DELETE,OPTIONS",
          "access-control-allow-headers": "authorization,content-type",
          "access-control-max-age": "86400",
          ...corsHeaders(req, env),
        },
      });
    }

    if (url.pathname === "/api/health") {
      if (url.searchParams.get("db") === "1") {
        if (!env.DB) return json(req, env, { ok: false, db: false, error: "db not bound" }, 500);
        try {
          await env.DB.prepare("SELECT 1 as ok").first();
          return json(req, env, { ok: true, db: true });
        } catch (e) {
          return json(req, env, { ok: false, db: false, error: e instanceof Error ? e.message : "db failed" }, 500);
        }
      }
      return json(req, env, { ok: true, db: Boolean(env.DB) });
    }

    if (!url.pathname.startsWith("/api/")) return json(req, env, { error: "not found" }, 404);
    if (!authorized(req, env)) return json(req, env, { error: "unauthorized" }, 401);

    if (url.pathname === "/api/engagements" && req.method === "GET") {
      if (!env.DB) return json(req, env, { error: "db not bound — run wrangler dev / deploy with D1" }, 500);
      try {
        const rows = await env.DB.prepare(
          "SELECT data FROM engagements ORDER BY updated_at DESC LIMIT 100"
        ).all<{ data: string }>();
        const list: unknown[] = [];
        let skipped = 0;
        for (const r of rows.results ?? []) {
          try {
            list.push(JSON.parse(r.data));
          } catch {
            skipped += 1;
          }
        }
        return json(req, env, list, 200);
      } catch (e) {
        return json(req, env, { error: "db query failed", detail: e instanceof Error ? e.message : "unknown" }, 500);
      }
    }

    const m = url.pathname.match(/^\/api\/engagements\/([^/]+)$/);
    if (m) {
      const id = m[1];
      if (!ID_RE.test(id)) return json(req, env, { error: "bad id" }, 400);
      if (!env.DB) return json(req, env, { error: "db not bound" }, 500);
      if (req.method === "GET") {
        try {
          const row = await env.DB.prepare("SELECT data FROM engagements WHERE id = ?")
            .bind(id)
            .first<{ data: string }>();
          if (!row) return json(req, env, { error: "not found" }, 404);
          return new Response(row.data, {
            headers: { "content-type": "application/json", "cache-control": "no-store", ...corsHeaders(req, env) },
          });
        } catch (e) {
          return json(req, env, { error: "db query failed", detail: e instanceof Error ? e.message : "unknown" }, 500);
        }
      }
      if (req.method === "PUT") {
        const len = Number(req.headers.get("content-length") ?? 0);
        if (len > MAX_BODY_BYTES) return json(req, env, { error: "body too large" }, 413);
        let body: { ya?: number; company_name?: string; companyName?: string };
        try {
          body = (await req.json()) as typeof body;
        } catch {
          return json(req, env, { error: "invalid json" }, 400);
        }
        if (typeof body !== "object" || body === null)
          return json(req, env, { error: "invalid json" }, 400);
        const raw = JSON.stringify(body);
        if (raw.length > MAX_BODY_BYTES) return json(req, env, { error: "body too large" }, 413);
        const ya = Number.isInteger(body.ya) ? (body.ya as number) : 2025;
        const name = body.company_name ?? body.companyName ?? "";
        try {
          await env.DB.prepare(
            "INSERT INTO engagements (id, ya, company_name, data, updated_at) VALUES (?, ?, ?, ?, datetime('now')) ON CONFLICT(id) DO UPDATE SET ya=excluded.ya, company_name=excluded.company_name, data=excluded.data, updated_at=datetime('now')"
          )
            .bind(id, ya, String(name).slice(0, 200), raw)
            .run();
        } catch (e) {
          return json(req, env, { error: "db write failed", detail: e instanceof Error ? e.message : "unknown" }, 500);
        }
        return json(req, env, { ok: true, id });
      }
      if (req.method === "DELETE") {
        try {
          await env.DB.prepare("DELETE FROM engagements WHERE id = ?").bind(id).run();
        } catch (e) {
          return json(req, env, { error: "db delete failed", detail: e instanceof Error ? e.message : "unknown" }, 500);
        }
        return json(req, env, { ok: true, id });
      }
    }
    return json(req, env, { error: "not found" }, 404);
  },
};
