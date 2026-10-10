import { supabase } from "@/integrations/supabase/client";
import { getClientIp } from "./security";

export interface SupportTicket {
  id: string;
  userEmail: string;
  subject: string;
  category: "tech" | "billing" | "feature" | "other";
  message: string;
  adminReply?: string;
  repliedAt?: string;
  repliedBy?: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userEmail: string;
  action: string;
  details?: string;
  ip: string;
  timestamp: string;
}

const LOCAL_TICKETS_KEY = "reportix_support_tickets_v2";
const LOCAL_LOGS_KEY = "reportix_activity_logs_v2";
const LOCAL_USERS_KEY = "reportix_registered_users_v2";

// Clean, 100% real logs only — no fake mock accounts
function getStoredTickets(): SupportTicket[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_TICKETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredTickets(tickets: SupportTicket[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_TICKETS_KEY, JSON.stringify(tickets));
  } catch (e) {
    console.error("Failed to save tickets", e);
  }
}

export function getStoredLogs(): ActivityLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Log real actions with real client IP
export function logActivity(
  userEmail: string,
  action: string,
  details?: string,
  ipOverride?: string
): void {
  if (typeof window === "undefined") return;
  try {
    const logs = getStoredLogs();
    const ip = ipOverride || getClientIp();
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userEmail: userEmail.trim().toLowerCase(),
      action,
      details,
      ip,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // Keep last 500 real events
    localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(logs.slice(0, 500)));

    // Track real registered user
    recordRealUser(userEmail, ip);
  } catch (e) {
    console.error("Failed to write activity log", e);
  }
}

export interface RegisteredUserRecord {
  email: string;
  fullName?: string;
  registeredAt: string;
  lastLogin: string;
  ip: string;
  reportsCount: number;
}

export function getRegisteredUsers(): Record<string, RegisteredUserRecord> {
  const result: Record<string, RegisteredUserRecord> = {};
  if (typeof window === "undefined") return result;
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.assign(result, parsed);
    }
  } catch {
    // empty
  }
  return result;
}

export function recordRealUser(email: string, ip: string, fullName?: string): void {
  if (typeof window === "undefined") return;
  const norm = email.trim().toLowerCase();
  if (!norm || norm.includes("mock") || norm.includes("fake")) return;

  try {
    const users = getRegisteredUsers();
    const now = new Date().toISOString();
    const resolvedName = fullName || localStorage.getItem("reportix_user_name") || "";

    const existing = users[norm] || {
      email: norm,
      fullName: resolvedName,
      registeredAt: now,
      lastLogin: now,
      ip,
      reportsCount: 0,
    };

    if (fullName) existing.fullName = fullName;
    else if (!existing.fullName && resolvedName) existing.fullName = resolvedName;

    existing.lastLogin = now;
    existing.ip = ip;
    users[norm] = existing;
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("Failed to record real user", e);
  }
}

export function incrementUserReportsCount(email: string): void {
  if (typeof window === "undefined") return;
  const norm = email.trim().toLowerCase();
  try {
    const users = getRegisteredUsers();
    if (users[norm]) {
      users[norm].reportsCount = (users[norm].reportsCount || 0) + 1;
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    }
  } catch (e) {
    console.error("Failed to increment user reports count", e);
  }
}

export async function fetchAllTickets(): Promise<SupportTicket[]> {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data && data.length > 0) {
      return data.map((t: any) => ({
        id: t.id,
        userEmail: t.user_email,
        subject: t.subject,
        category: t.category,
        message: t.message,
        adminReply: t.admin_reply,
        repliedAt: t.replied_at,
        repliedBy: t.replied_by,
        status: t.status,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));
    }
  } catch {
    // fallback
  }
  return getStoredTickets();
}

export async function fetchUserTickets(userEmail: string): Promise<SupportTicket[]> {
  const norm = userEmail.trim().toLowerCase();
  const all = await fetchAllTickets();
  return all.filter((t) => t.userEmail.toLowerCase() === norm);
}

export async function createSupportTicket(params: {
  userEmail: string;
  subject: string;
  category: "tech" | "billing" | "feature" | "other";
  message: string;
}): Promise<SupportTicket> {
  const newTicket: SupportTicket = {
    id: `tkt-${Date.now()}`,
    userEmail: params.userEmail.trim().toLowerCase(),
    subject: params.subject.trim(),
    category: params.category,
    message: params.message.trim(),
    status: "open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await supabase.from("support_tickets").insert({
      user_email: newTicket.userEmail,
      subject: newTicket.subject,
      category: newTicket.category,
      message: newTicket.message,
      status: "open",
    });
  } catch {
    // handled locally
  }

  const current = getStoredTickets();
  current.unshift(newTicket);
  saveStoredTickets(current);

  logActivity(
    newTicket.userEmail,
    "Создан тикет поддержки",
    `Тема: «${newTicket.subject}» (${newTicket.category})`
  );

  return newTicket;
}

export async function replyToSupportTicket(
  ticketId: string,
  adminReply: string,
  adminEmail: string,
  status: "resolved" | "in_progress" = "resolved"
): Promise<SupportTicket | null> {
  const current = getStoredTickets();
  const ticket = current.find((t) => t.id === ticketId);
  if (!ticket) return null;

  ticket.adminReply = adminReply.trim();
  ticket.repliedAt = new Date().toISOString();
  ticket.repliedBy = adminEmail;
  ticket.status = status;
  ticket.updatedAt = new Date().toISOString();

  saveStoredTickets(current);

  try {
    await supabase
      .from("support_tickets")
      .update({
        admin_reply: ticket.adminReply,
        replied_at: ticket.repliedAt,
        replied_by: ticket.repliedBy,
        status: ticket.status,
        updated_at: ticket.updatedAt,
      })
      .eq("id", ticketId);
  } catch {
    // handled locally
  }

  logActivity(
    adminEmail,
    "Ответ администратора",
    `Ответ пользователю ${ticket.userEmail} на тикет «${ticket.subject}»`
  );

  return ticket;
}

// Download/Export functions for admin panel
export function downloadLogsAsCsv(logs: ActivityLog[]): void {
  if (typeof window === "undefined" || logs.length === 0) return;

  const headers = ["Дата и время", "Email", "IP-адрес", "Действие", "Подробности"];
  const rows = logs.map((l) => [
    new Date(l.timestamp).toLocaleString("ru-RU"),
    l.userEmail,
    l.ip,
    `"${(l.action || "").replace(/"/g, '""')}"`,
    `"${(l.details || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reportix_logs_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadLogsAsJson(logs: ActivityLog[]): void {
  if (typeof window === "undefined" || logs.length === 0) return;

  const jsonContent = JSON.stringify(logs, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reportix_logs_${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
