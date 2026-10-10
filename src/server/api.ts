import {
  serverGetSubscriptions,
  serverSaveSubscription,
  serverRevokeSubscription,
  serverGetUsers,
  serverSaveUser,
  serverGetWhiteLabel,
  serverSaveWhiteLabel,
  serverGetPublicReport,
  serverSavePublicReport,
  calculateExpirationDate,
  type GrantedPlanRecord,
  type UserRecord,
  type WhiteLabelConfig,
  type PublicReportRecord,
} from "@/lib/server-storage";

function jsonResponse(data: any, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      ...headers,
    },
  });
}

export async function handleApiRequest(request: Request, clientIp: string): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (!pathname.startsWith("/api/")) {
    return null;
  }

  // Handle CORS Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    // 1. SUBSCRIPTIONS API (/api/subscriptions)
    if (pathname === "/api/subscriptions" || pathname.startsWith("/api/subscriptions/")) {
      if (request.method === "GET") {
        const email = url.searchParams.get("email");
        const all = await serverGetSubscriptions();
        if (email) {
          const normEmail = email.toLowerCase().trim();
          const rec = all[normEmail] || null;
          let isExpired = false;
          if (rec && rec.expiresAt) {
            isExpired = Date.now() > new Date(rec.expiresAt).getTime();
          }
          return jsonResponse({
            subscription: rec,
            isExpired,
            active: rec ? !isExpired : false,
          });
        }
        return jsonResponse({ subscriptions: all });
      }

      if (request.method === "POST") {
        const body = (await request.json()) as Partial<GrantedPlanRecord>;
        if (!body.userEmail || !body.planId) {
          return jsonResponse({ error: "Missing userEmail or planId" }, 400);
        }
        const record: GrantedPlanRecord = {
          userEmail: body.userEmail.toLowerCase().trim(),
          planId: body.planId as any,
          duration: body.duration || "1 месяц",
          grantedAt: body.grantedAt || new Date().toISOString(),
          grantedBy: body.grantedBy || "admin",
          expiresAt: body.expiresAt ?? calculateExpirationDate(body.duration || "1 месяц"),
        };
        await serverSaveSubscription(record);
        return jsonResponse({ ok: true, subscription: record });
      }

      if (request.method === "DELETE") {
        const email = url.searchParams.get("email");
        if (!email) {
          return jsonResponse({ error: "Missing email param" }, 400);
        }
        await serverRevokeSubscription(email);
        return jsonResponse({ ok: true, revokedEmail: email });
      }
    }

    // 2. USERS API (/api/users)
    if (pathname === "/api/users") {
      if (request.method === "GET") {
        const users = await serverGetUsers();
        return jsonResponse({ users });
      }

      if (request.method === "POST") {
        const body = (await request.json()) as Partial<UserRecord>;
        if (!body.email || !body.fullName) {
          return jsonResponse({ error: "Missing email or fullName" }, 400);
        }
        const user: UserRecord = {
          email: body.email.toLowerCase().trim(),
          fullName: body.fullName.trim(),
          ip: body.ip || clientIp,
          registeredAt: body.registeredAt || new Date().toISOString(),
          planId: body.planId || "free",
        };
        await serverSaveUser(user);
        return jsonResponse({ ok: true, user });
      }
    }

    // 3. WHITE-LABEL BRANDING API (/api/whitelabel)
    if (pathname === "/api/whitelabel") {
      if (request.method === "GET") {
        const email = url.searchParams.get("email");
        if (!email) return jsonResponse({ error: "Missing email" }, 400);
        const config = await serverGetWhiteLabel(email);
        return jsonResponse({ config });
      }

      if (request.method === "POST") {
        const body = (await request.json()) as WhiteLabelConfig;
        if (!body.userEmail || !body.agencyName) {
          return jsonResponse({ error: "Missing required fields" }, 400);
        }
        await serverSaveWhiteLabel(body);
        return jsonResponse({ ok: true, config: body });
      }
    }

    // 4. PUBLIC REPORT WEB-VIEW API (/api/public-report)
    if (pathname.startsWith("/api/public-report")) {
      const id = pathname.replace("/api/public-report/", "").replace("/api/public-report", "") || url.searchParams.get("id");
      if (request.method === "GET") {
        if (!id) return jsonResponse({ error: "Missing report id" }, 400);
        const report = await serverGetPublicReport(id);
        if (!report) return jsonResponse({ error: "Report not found" }, 404);
        return jsonResponse({ report });
      }

      if (request.method === "POST") {
        const body = (await request.json()) as PublicReportRecord;
        if (!body.id || !body.title || !body.content) {
          return jsonResponse({ error: "Missing report fields" }, 400);
        }
        await serverSavePublicReport(body);
        return jsonResponse({ ok: true, id: body.id, publicUrl: `/view/${body.id}` });
      }
    }

    // 5. SYSTEM HEALTH AND STATUS (/api/system/status)
    if (pathname === "/api/system/status") {
      return jsonResponse({
        status: "operational",
        service: "Reportix Enterprise Core",
        version: "2.5.0",
        shield: "active",
        clientIp,
        timestamp: new Date().toISOString(),
      });
    }

    return null;
  } catch (err: any) {
    console.error("API Route Error:", err);
    return jsonResponse({ error: "Internal Server Error", details: err?.message }, 500);
  }
}
