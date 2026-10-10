import { useEffect, useState } from "react";
import { logActivity } from "./support";
import { supabase } from "@/integrations/supabase/client";

export interface Plan {
  id: "free" | "pro";
  name: string;
  priceMonthly: number;
  priceYearlyMonthly: number;
  periodLabel: string;
  badge?: string;
  description: string;
  isPopular?: boolean;
  limits: {
    reportsPerMonth: number | "unlimited";
    historyDays: number | "unlimited";
  };
  features: string[];
  cta: string;
}

// Admin email only for internal checks — never show on public UI
export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string) || "";
// Admin password must be set via VITE_ADMIN_PASSWORD in .env (never hardcode)
export const ADMIN_DEFAULT_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "";

export const PLANS: Record<string, Plan> = {
  free: {
    id: "free",
    name: "Старт",
    priceMonthly: 0,
    priceYearlyMonthly: 0,
    periodLabel: "Бесплатно навсегда",
    description: "Для знакомства с сервисом",
    limits: {
      reportsPerMonth: 5,
      historyDays: 14,
    },
    features: [
      "До 5 отчётов в месяц",
      "Основные типы документов",
      "Скачивание PDF",
      "История за 14 дней",
    ],
    cta: "Текущий план",
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 690,
    priceYearlyMonthly: 490,
    periodLabel: "₽ / месяц",
    badge: "РЕКОМЕНДУЕМ",
    isPopular: true,
    description: "Для фрилансеров с постоянными клиентами",
    limits: {
      reportsPerMonth: 40,
      historyDays: "unlimited",
    },
    features: [
      "До 40 отчётов в месяц",
      "Без водяного знака",
      "Все типы документов",
      "Бессрочная история",
      "Приоритетная генерация",
    ],
    cta: "Подключить Pro",
  },
};

export interface GrantedPlanRecord {
  userEmail: string;
  planId: "free" | "pro";
  duration: string;
  grantedAt: string;
  grantedBy: string;
  expiresAt?: string | null;
}

const GRANTED_PLANS_KEY = "reportix_granted_plans_v3";
let memoryGrantedPlans: Record<string, GrantedPlanRecord> = {};

// Helper to compute exact expiration date
export function calculateExpirationDate(duration: string, baseDate = Date.now()): string | null {
  const norm = duration.toLowerCase();
  if (norm.includes("бессрочно") || norm.includes("навсегда") || norm.includes("lifetime") || norm.includes("vip")) {
    return null; // Lifetime access
  }
  if (norm.includes("1 месяц") || norm.includes("30 дней") || norm.includes("1 month")) {
    return new Date(baseDate + 30 * 86400 * 1000).toISOString();
  }
  if (norm.includes("3 месяца") || norm.includes("90 дней") || norm.includes("3 month")) {
    return new Date(baseDate + 90 * 86400 * 1000).toISOString();
  }
  if (norm.includes("6 месяцев") || norm.includes("180 дней") || norm.includes("6 month")) {
    return new Date(baseDate + 180 * 86400 * 1000).toISOString();
  }
  if (norm.includes("1 год") || norm.includes("365 дней") || norm.includes("1 year")) {
    return new Date(baseDate + 365 * 86400 * 1000).toISOString();
  }
  return new Date(baseDate + 30 * 86400 * 1000).toISOString();
}

export function getStoredUserEmail(): string {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("reportix_user_email") ||
    sessionStorage.getItem("reportix_user_email") ||
    ""
  );
}

export function getGrantedPlans(): Record<string, GrantedPlanRecord> {
  const result: Record<string, GrantedPlanRecord> = { ...memoryGrantedPlans };
  if (typeof window === "undefined") return result;

  try {
    const raw = localStorage.getItem(GRANTED_PLANS_KEY);
    if (raw) {
      const parsed: GrantedPlanRecord[] = JSON.parse(raw);
      for (const p of parsed) {
        result[p.userEmail.toLowerCase()] = p;
      }
    }
  } catch (e) {
    console.error("Failed to parse granted plans from localStorage", e);
  }

  memoryGrantedPlans = result;
  return result;
}

// Background sync from Server API and Supabase
let isSyncing = false;
let lastSyncTime = 0;

export async function syncSubscriptionsFromServer(): Promise<Record<string, GrantedPlanRecord>> {
  if (typeof window === "undefined") return memoryGrantedPlans;
  const now = Date.now();
  if (isSyncing || now - lastSyncTime < 2000) return memoryGrantedPlans;

  isSyncing = true;
  lastSyncTime = now;

  try {
    // 1. Fetch from server API
    const resp = await fetch("/api/subscriptions", {
      headers: { Accept: "application/json" },
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.subscriptions) {
        const remoteSubs: Record<string, GrantedPlanRecord> = data.subscriptions;
        const current = getGrantedPlans();
        const merged = { ...current, ...remoteSubs };
        memoryGrantedPlans = merged;
        localStorage.setItem(GRANTED_PLANS_KEY, JSON.stringify(Object.values(merged)));
        window.dispatchEvent(new CustomEvent("reportix-plan-updated", { detail: merged }));
        return merged;
      }
    }
  } catch {
    // Fallback: try direct Supabase query
    try {
      const { data } = await supabase.from("user_subscriptions").select("*");
      if (data && Array.isArray(data)) {
        const merged = { ...getGrantedPlans() };
        for (const row of data) {
          if (row.user_email) {
            merged[row.user_email.toLowerCase()] = {
              userEmail: row.user_email.toLowerCase(),
              planId: (row.plan_id === 'pro' ? 'pro' : 'free'),
              duration: row.duration || "1 месяц",
              grantedAt: row.created_at || new Date().toISOString(),
              grantedBy: row.granted_by || "admin",
              expiresAt: row.expires_at || null,
            };
          }
        }
        memoryGrantedPlans = merged;
        localStorage.setItem(GRANTED_PLANS_KEY, JSON.stringify(Object.values(merged)));
        window.dispatchEvent(new CustomEvent("reportix-plan-updated", { detail: merged }));
        return merged;
      }
    } catch {
      // offline
    }
  } finally {
    isSyncing = false;
  }

  return memoryGrantedPlans;
}

export function saveGrantedPlan(record: GrantedPlanRecord): void {
  const normEmail = record.userEmail.trim().toLowerCase();
  if (!record.expiresAt) {
    record.expiresAt = calculateExpirationDate(record.duration);
  }

  // 1. Update memory
  memoryGrantedPlans[normEmail] = record;

  // 2. Update localStorage immediately so client sees it without latency
  if (typeof window !== "undefined") {
    try {
      const map = getGrantedPlans();
      map[normEmail] = record;
      localStorage.setItem(GRANTED_PLANS_KEY, JSON.stringify(Object.values(map)));
      window.dispatchEvent(new CustomEvent("reportix-plan-updated", { detail: map }));

      // Also store dedicated user subscription key
      localStorage.setItem(`reportix_sub_${normEmail}`, JSON.stringify(record));
    } catch (e) {
      console.error("Failed to save granted plan locally", e);
    }
  }

  // 3. Persist to server disk storage via /api/subscriptions
  fetch("/api/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  }).catch((err) => console.warn("Background API sync error:", err));

  // 4. Persist to Supabase table
  try {
    supabase.from("user_subscriptions").upsert({
      user_email: normEmail,
      plan_id: record.planId,
      duration: record.duration,
      granted_by: record.grantedBy,
      expires_at: record.expiresAt,
      updated_at: new Date().toISOString(),
    }).then();
  } catch {
    // optional offline
  }

  logActivity(
    record.grantedBy,
    "Выдача тарифа",
    `Тариф «${PLANS[record.planId]?.name || record.planId}» выдан пользователю ${record.userEmail} на срок: ${record.duration} (до: ${record.expiresAt || "бессрочно"})`
  );
}

export function revokeGrantedPlan(userEmail: string, adminEmail: string): void {
  const normEmail = userEmail.trim().toLowerCase();
  delete memoryGrantedPlans[normEmail];

  if (typeof window !== "undefined") {
    try {
      const map = getGrantedPlans();
      delete map[normEmail];
      localStorage.setItem(GRANTED_PLANS_KEY, JSON.stringify(Object.values(map)));
      localStorage.removeItem(`reportix_sub_${normEmail}`);
      window.dispatchEvent(new CustomEvent("reportix-plan-updated", { detail: map }));
    } catch (e) {
      console.error("Failed to revoke plan locally", e);
    }
  }

  // Revoke on server
  fetch(`/api/subscriptions?email=${encodeURIComponent(normEmail)}`, {
    method: "DELETE",
  }).catch((err) => console.warn("Background API revoke error:", err));

  // Revoke in Supabase
  try {
    supabase.from("user_subscriptions").delete().eq("user_email", normEmail).then();
  } catch {
    // optional offline
  }

  logActivity(adminEmail, "Отзыв тарифа", `Тариф пользователя ${userEmail} возвращен на «Старт»`);
}

export interface ActiveUserPlanInfo {
  plan: Plan;
  isLifetime: boolean;
  isAdmin: boolean;
  label: string;
  badge: string;
  unlimited: boolean;
  watermark: boolean;
  customBranding: boolean;
  expiresAt?: string | null;
  duration?: string;
  isExpired?: boolean;
}

export function getActiveUserPlan(email?: string | null): ActiveUserPlanInfo {
  const normEmail = (email || getStoredUserEmail()).trim().toLowerCase();

  // 1. Permanent Pro access for admin (email from env only)
  if (ADMIN_EMAIL && normEmail === ADMIN_EMAIL.toLowerCase()) {
    return {
      plan: PLANS.pro,
      isLifetime: true,
      isAdmin: true,
      label: "Pro (Admin)",
      badge: "ADMIN",
      unlimited: true,
      watermark: false,
      customBranding: false,
      expiresAt: null,
      duration: "Бессрочно",
    };
  }

  // 2. Check if admin granted a plan to this email
  if (normEmail) {
    const grantedMap = getGrantedPlans();
    let granted = grantedMap[normEmail];

    // Check specific user cache if not in map
    if (!granted && typeof window !== "undefined") {
      try {
        const userSub = localStorage.getItem(`reportix_sub_${normEmail}`);
        if (userSub) granted = JSON.parse(userSub);
      } catch {}
    }

    if (granted && PLANS[granted.planId]) {
      const p = PLANS[granted.planId];

      // Check Expiration!
      if (granted.expiresAt) {
        const expTime = new Date(granted.expiresAt).getTime();
        if (Date.now() > expTime) {
          // EXPIRED: Gracefully fall back to free
          return {
            plan: PLANS.free,
            isLifetime: false,
            isAdmin: false,
            isExpired: true,
            expiresAt: granted.expiresAt,
            label: "Старт (Срок подписки истёк)",
            badge: "Подписка истекла",
            unlimited: false,
            watermark: true,
            customBranding: false,
          };
        }
      }

      const isLifetime =
        !granted.expiresAt ||
        granted.duration.includes("Навсегда") ||
        granted.duration.includes("Бессрочно") ||
        granted.duration.includes("Lifetime");

      return {
        plan: p,
        isLifetime,
        isAdmin: false,
        isExpired: false,
        expiresAt: granted.expiresAt,
        duration: granted.duration,
        label: p.name,
        badge: `Тариф ${p.name}`,
        unlimited: p.limits.reportsPerMonth === "unlimited",
        watermark: p.id === "free",
        customBranding: p.id !== "free",
      };
    }

    // Trigger background sync if on client
    if (typeof window !== "undefined") {
      syncSubscriptionsFromServer().catch(() => {});
    }
  }

  // 3. Default to Free plan for regular users
  return {
    plan: PLANS.free,
    isLifetime: false,
    isAdmin: false,
    isExpired: false,
    label: PLANS.free.name,
    badge: "Базовый",
    unlimited: false,
    watermark: true,
    customBranding: false,
  };
}

// React hook for responsive subscription changes
export function useActivePlan(email?: string | null): ActiveUserPlanInfo {
  const [currentEmail, setCurrentEmail] = useState(() => email || getStoredUserEmail());
  const [planInfo, setPlanInfo] = useState<ActiveUserPlanInfo>(() => getActiveUserPlan(currentEmail));

  useEffect(() => {
    if (email) {
      setCurrentEmail(email);
      setPlanInfo(getActiveUserPlan(email));
    } else {
      supabase.auth.getUser().then(({ data }) => {
        const resolvedEmail = data.user?.email || getStoredUserEmail();
        setCurrentEmail(resolvedEmail);
        setPlanInfo(getActiveUserPlan(resolvedEmail));
      });
    }

    const handler = () => {
      setPlanInfo(getActiveUserPlan(currentEmail));
    };

    window.addEventListener("reportix-plan-updated", handler);
    syncSubscriptionsFromServer().then(() => {
      setPlanInfo(getActiveUserPlan(currentEmail));
    });

    return () => {
      window.removeEventListener("reportix-plan-updated", handler);
    };
  }, [email, currentEmail]);

  return planInfo;
}

export function canUserGenerateReport(
  userEmail: string | null | undefined,
  reportsCountThisMonth: number
): { allowed: boolean; reason?: string } {
  const normEmail = (userEmail || getStoredUserEmail()).trim().toLowerCase();

  // Admin always has unlimited generation
  if (ADMIN_EMAIL && normEmail === ADMIN_EMAIL.toLowerCase()) {
    return { allowed: true };
  }

  const { plan, unlimited, isExpired } = getActiveUserPlan(normEmail);

  if (isExpired) {
    return {
      allowed: false,
      reason: `Срок действия вашей подписки истёк. Создайте тикет в поддержку для продления тарифа.`,
    };
  }

  if (unlimited) return { allowed: true };

  const limit = plan.limits.reportsPerMonth;
  if (typeof limit === "number" && reportsCountThisMonth >= limit) {
    return {
      allowed: false,
      reason: `Вы исчерпали лимит генераций для тарифа «${plan.name}» (${limit} отчётов в месяц). Перейдите на тариф Pro, чтобы снять лимит.`,
    };
  }

  return { allowed: true };
}
