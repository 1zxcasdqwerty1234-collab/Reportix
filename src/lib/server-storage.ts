// Persistent server-side storage for Reportix (Node.js fs with in-memory & cloud fallback)
import { supabase } from "@/integrations/supabase/client";

export interface GrantedPlanRecord {
  userEmail: string;
  planId: "free" | "pro" | "agency" | "enterprise";
  duration: string;
  grantedAt: string;
  grantedBy: string;
  expiresAt?: string | null;
}

export interface UserRecord {
  email: string;
  fullName: string;
  ip: string;
  registeredAt: string;
  planId: string;
}

export interface WhiteLabelConfig {
  userEmail: string;
  agencyName: string;
  agencySlogan?: string;
  logoUrl?: string;
  accentColor: "silver" | "sapphire" | "emerald" | "amber" | "purple";
  contacts?: string;
  updatedAt: string;
}

export interface PublicReportRecord {
  id: string;
  clientName: string;
  docType: string;
  title: string;
  content: any;
  userEmail: string;
  whitelabel?: Partial<WhiteLabelConfig>;
  createdAt: string;
}

// In-memory fallback if filesystem is not accessible
const memoryStorage = {
  subscriptions: new Map<string, GrantedPlanRecord>(),
  users: new Map<string, UserRecord>(),
  whitelabel: new Map<string, WhiteLabelConfig>(),
  publicReports: new Map<string, PublicReportRecord>(),
};

function getFsModule() {
  if (typeof process !== "undefined" && process.versions?.node) {
    try {
      // Dynamic import / require to avoid bundler issues in browser
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require("path");
      const dataDir = path.resolve(process.cwd(), "data");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      return { fs, path, dataDir };
    } catch {
      return null;
    }
  }
  return null;
}

function readJsonFile<T>(fileName: string, fallback: T): T {
  const mod = getFsModule();
  if (!mod) return fallback;
  try {
    const filePath = mod.path.join(mod.dataDir, fileName);
    if (!mod.fs.existsSync(filePath)) {
      return fallback;
    }
    const data = mod.fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data) as T;
  } catch (e) {
    console.error(`Error reading ${fileName}:`, e);
    return fallback;
  }
}

function writeJsonFile<T>(fileName: string, data: T): boolean {
  const mod = getFsModule();
  if (!mod) return false;
  try {
    const filePath = mod.path.join(mod.dataDir, fileName);
    mod.fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error(`Error writing ${fileName}:`, e);
    return false;
  }
}

// ================= SUBSCRIPTIONS ================= //

export function calculateExpirationDate(duration: string, baseDate = Date.now()): string | null {
  const norm = duration.toLowerCase();
  if (norm.includes("бессрочно") || norm.includes("навсегда") || norm.includes("lifetime") || norm.includes("vip")) {
    return null; // No expiration
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

export async function serverGetSubscriptions(): Promise<Record<string, GrantedPlanRecord>> {
  const fileData = readJsonFile<Record<string, GrantedPlanRecord>>("subscriptions.json", {});
  const result: Record<string, GrantedPlanRecord> = { ...fileData };

  // Overlay memory storage
  for (const [key, val] of memoryStorage.subscriptions.entries()) {
    if (!result[key]) result[key] = val;
  }

  // Attempt Supabase fetch
  try {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("*");
    if (!error && Array.isArray(data)) {
      for (const row of data) {
        if (row.user_email) {
          const email = row.user_email.toLowerCase();
          result[email] = {
            userEmail: email,
            planId: row.plan_id || "free",
            duration: row.duration || "1 месяц",
            grantedAt: row.created_at || new Date().toISOString(),
            grantedBy: row.granted_by || "admin",
            expiresAt: row.expires_at || null,
          };
        }
      }
    }
  } catch {
    // Supabase optional offline fallback
  }

  return result;
}

export async function serverSaveSubscription(record: GrantedPlanRecord): Promise<void> {
  const normEmail = record.userEmail.toLowerCase();
  
  // 1. Calculate expiresAt if missing
  if (record.expiresAt === undefined) {
    record.expiresAt = calculateExpirationDate(record.duration);
  }

  // 2. In-memory
  memoryStorage.subscriptions.set(normEmail, record);

  // 3. File disk persistence
  const current = readJsonFile<Record<string, GrantedPlanRecord>>("subscriptions.json", {});
  current[normEmail] = record;
  writeJsonFile("subscriptions.json", current);

  // 4. Supabase cloud database persistence
  try {
    await supabase.from("user_subscriptions").upsert({
      user_email: normEmail,
      plan_id: record.planId,
      duration: record.duration,
      granted_by: record.grantedBy,
      expires_at: record.expiresAt,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Optional Supabase offline fallback
  }
}

export async function serverRevokeSubscription(userEmail: string): Promise<void> {
  const normEmail = userEmail.toLowerCase();
  memoryStorage.subscriptions.delete(normEmail);

  const current = readJsonFile<Record<string, GrantedPlanRecord>>("subscriptions.json", {});
  delete current[normEmail];
  writeJsonFile("subscriptions.json", current);

  try {
    await supabase.from("user_subscriptions").delete().eq("user_email", normEmail);
  } catch {
    // offline fallback
  }
}

// ================= USERS WITH ENGLISH NAMES ================= //

export async function serverGetUsers(): Promise<UserRecord[]> {
  const fileData = readJsonFile<UserRecord[]>("users.json", []);
  const map = new Map<string, UserRecord>();
  for (const u of fileData) map.set(u.email.toLowerCase(), u);
  for (const u of memoryStorage.users.values()) map.set(u.email.toLowerCase(), u);
  return Array.from(map.values());
}

export async function serverSaveUser(user: UserRecord): Promise<void> {
  const normEmail = user.email.toLowerCase();
  memoryStorage.users.set(normEmail, user);

  const current = readJsonFile<UserRecord[]>("users.json", []);
  const index = current.findIndex((u) => u.email.toLowerCase() === normEmail);
  if (index >= 0) {
    current[index] = { ...current[index], ...user };
  } else {
    current.push(user);
  }
  writeJsonFile("users.json", current);
}

// ================= WHITE-LABEL CONFIG ================= //

export async function serverGetWhiteLabel(userEmail: string): Promise<WhiteLabelConfig | null> {
  const normEmail = userEmail.toLowerCase();
  if (memoryStorage.whitelabel.has(normEmail)) {
    return memoryStorage.whitelabel.get(normEmail)!;
  }
  const all = readJsonFile<Record<string, WhiteLabelConfig>>("whitelabel.json", {});
  return all[normEmail] || null;
}

export async function serverSaveWhiteLabel(config: WhiteLabelConfig): Promise<void> {
  const normEmail = config.userEmail.toLowerCase();
  memoryStorage.whitelabel.set(normEmail, config);

  const all = readJsonFile<Record<string, WhiteLabelConfig>>("whitelabel.json", {});
  all[normEmail] = config;
  writeJsonFile("whitelabel.json", all);
}

// ================= PUBLIC WEB-VIEW REPORTS ================= //

export async function serverGetPublicReport(id: string): Promise<PublicReportRecord | null> {
  if (memoryStorage.publicReports.has(id)) {
    return memoryStorage.publicReports.get(id)!;
  }
  const all = readJsonFile<Record<string, PublicReportRecord>>("public_reports.json", {});
  return all[id] || null;
}

export async function serverSavePublicReport(report: PublicReportRecord): Promise<void> {
  memoryStorage.publicReports.set(report.id, report);

  const all = readJsonFile<Record<string, PublicReportRecord>>("public_reports.json", {});
  all[report.id] = report;
  writeJsonFile("public_reports.json", all);
}
