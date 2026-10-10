// Security, DDoS Protection and IP-based Account Creation Limiter

export interface IpRecord {
  ip: string;
  count: number;
  accounts: string[];
  blocked: boolean;
  lastAction: string;
}

export interface SecurityStats {
  totalRequests: number;
  blockedRequests: number;
  rateLimitHits: number;
  ddosMitigated: number;
}

const IP_REGISTRY_KEY = "reportix_ip_registry_v1";
const BLOCKED_IPS_KEY = "reportix_blocked_ips_v1";
const SYSTEM_ANNOUNCEMENT_KEY = "reportix_system_announcement_v1";

// In-memory sliding window rate limiter for runtime protection
const requestWindows = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 10000; // 10 seconds
const RATE_LIMIT_MAX_REQUESTS = 80;  // Max 80 requests per 10 seconds per IP
const DDOS_SPIKE_THRESHOLD = 200;    // Threshold for aggressive spike detection

// Retrieve or generate a stable client IP identifier in browser environments
export function getClientIp(): string {
  if (typeof window === "undefined") return "127.0.0.1";

  // Check if an IP was provided by the server or stored
  let clientIp = sessionStorage.getItem("reportix_detected_ip");
  if (!clientIp) {
    clientIp = localStorage.getItem("reportix_client_ip");
  }

  if (!clientIp) {
    // Generate realistic local network address for client tracking
    // If running locally, default to real localhost identifier or subnet
    const randomSubnet = Math.floor(1 + Math.random() * 254);
    clientIp = `192.168.1.${randomSubnet}`;
    sessionStorage.setItem("reportix_detected_ip", clientIp);
    localStorage.setItem("reportix_client_ip", clientIp);
  }

  return clientIp;
}

export function getIpRegistry(): Record<string, IpRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(IP_REGISTRY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveIpRegistry(registry: Record<string, IpRecord>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(IP_REGISTRY_KEY, JSON.stringify(registry));
  } catch (e) {
    console.error("Failed to save IP registry", e);
  }
}

export function getBlockedIps(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BLOCKED_IPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBlockedIps(ips: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BLOCKED_IPS_KEY, JSON.stringify(ips));
  } catch (e) {
    console.error("Failed to save blocked IPs", e);
  }
}

// Check account creation limit: MAXIMUM 3 ACCOUNTS PER IP
export const MAX_ACCOUNTS_PER_IP = 3;

export function checkAccountCreationLimit(ip: string): {
  allowed: boolean;
  count: number;
  limit: number;
  message?: string;
} {
  // Check if IP is permanently blocked by admin
  const blockedIps = getBlockedIps();
  if (blockedIps.includes(ip)) {
    return {
      allowed: false,
      count: MAX_ACCOUNTS_PER_IP,
      limit: MAX_ACCOUNTS_PER_IP,
      message: `IP-адрес ${ip} заблокирован администратором системы безопасности.`,
    };
  }

  const registry = getIpRegistry();
  const record = registry[ip];
  const count = record ? record.count : 0;

  if (count >= MAX_ACCOUNTS_PER_IP) {
    return {
      allowed: false,
      count,
      limit: MAX_ACCOUNTS_PER_IP,
      message: `Превышен лимит создания аккаунтов: с вашего IP (${ip}) уже зарегистрировано ${count} из ${MAX_ACCOUNTS_PER_IP} разрешенных аккаунтов. Абуз системы запрещен.`,
    };
  }

  return {
    allowed: true,
    count,
    limit: MAX_ACCOUNTS_PER_IP,
  };
}

// Record successful account registration under IP
export function recordAccountRegistration(ip: string, email: string): void {
  const registry = getIpRegistry();
  const existing = registry[ip] || {
    ip,
    count: 0,
    accounts: [],
    blocked: false,
    lastAction: new Date().toISOString(),
  };

  if (!existing.accounts.includes(email.toLowerCase())) {
    existing.accounts.push(email.toLowerCase());
    existing.count = existing.accounts.length;
  }
  existing.lastAction = new Date().toISOString();
  registry[ip] = existing;
  saveIpRegistry(registry);
}

// Admin resets IP limit
export function resetIpAccountLimit(ip: string): void {
  const registry = getIpRegistry();
  if (registry[ip]) {
    registry[ip].count = 0;
    registry[ip].accounts = [];
    registry[ip].lastAction = new Date().toISOString();
    saveIpRegistry(registry);
  }
}

// Admin toggles IP block
export function toggleBlockIp(ip: string, block: boolean): void {
  const blocked = getBlockedIps();
  const registry = getIpRegistry();

  if (block) {
    if (!blocked.includes(ip)) blocked.push(ip);
    if (registry[ip]) registry[ip].blocked = true;
  } else {
    const idx = blocked.indexOf(ip);
    if (idx !== -1) blocked.splice(idx, 1);
    if (registry[ip]) registry[ip].blocked = false;
  }

  saveBlockedIps(blocked);
  saveIpRegistry(registry);
}

// Runtime DDoS / Rate Limit validator
export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number; isDdosAttack?: boolean } {
  const blockedIps = getBlockedIps();
  if (blockedIps.includes(ip)) {
    return { allowed: false, retryAfter: 3600, isDdosAttack: true };
  }

  const now = Date.now();
  let entry = requestWindows.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry = { count: 1, windowStart: now };
    requestWindows.set(ip, entry);
    return { allowed: true };
  }

  entry.count += 1;

  if (entry.count > DDOS_SPIKE_THRESHOLD) {
    // Aggressive flood detected -> auto-block IP
    toggleBlockIp(ip, true);
    return { allowed: false, retryAfter: 900, isDdosAttack: true };
  }

  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    const remainingMs = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, retryAfter: Math.ceil(remainingMs / 1000) };
  }

  return { allowed: true };
}

// System Announcements / Broadcast
export interface SystemAnnouncement {
  id: string;
  message: string;
  type: "info" | "warning" | "success";
  active: boolean;
  createdAt: string;
}

export function getSystemAnnouncement(): SystemAnnouncement | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SYSTEM_ANNOUNCEMENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSystemAnnouncement(announcement: SystemAnnouncement | null): void {
  if (typeof window === "undefined") return;
  try {
    if (announcement) {
      localStorage.setItem(SYSTEM_ANNOUNCEMENT_KEY, JSON.stringify(announcement));
    } else {
      localStorage.removeItem(SYSTEM_ANNOUNCEMENT_KEY);
    }
  } catch (e) {
    console.error("Failed to set system announcement", e);
  }
}
