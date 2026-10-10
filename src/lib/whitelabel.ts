// Agency White-Label Branding System for Reportix

export interface WhiteLabelConfig {
  userEmail: string;
  agencyName: string;
  agencySlogan?: string;
  logoBase64?: string;
  accentColor: "silver" | "sapphire" | "emerald" | "amber" | "purple";
  contacts?: string;
  website?: string;
  removeReportixBranding: boolean;
  updatedAt: string;
}

export const ACCENT_THEMES = {
  silver: {
    id: "silver",
    name: "Титановое серебро (Reportix Default)",
    primary: "#E4E4E7",
    glow: "rgba(255, 255, 255, 0.25)",
    border: "border-zinc-400/50",
    badgeBg: "bg-zinc-800/80 text-zinc-200 border-zinc-700",
    accentHex: "#A1A1AA",
  },
  sapphire: {
    id: "sapphire",
    name: "Сапфировый синий (Corporate Blue)",
    primary: "#38BDF8",
    glow: "rgba(56, 189, 248, 0.3)",
    border: "border-sky-500/50",
    badgeBg: "bg-sky-950/60 text-sky-300 border-sky-500/40",
    accentHex: "#0284C7",
  },
  emerald: {
    id: "emerald",
    name: "Изумрудный зелёный (Growth & ROI)",
    primary: "#34D399",
    glow: "rgba(52, 211, 153, 0.3)",
    border: "border-emerald-500/50",
    badgeBg: "bg-emerald-950/60 text-emerald-300 border-emerald-500/40",
    accentHex: "#059669",
  },
  amber: {
    id: "amber",
    name: "Янтарное золото (Premium Gold)",
    primary: "#FBBF24",
    glow: "rgba(251, 191, 36, 0.3)",
    border: "border-amber-500/50",
    badgeBg: "bg-amber-950/60 text-amber-300 border-amber-500/40",
    accentHex: "#D97706",
  },
  purple: {
    id: "purple",
    name: "Кибер-пурпур (Digital & Creative)",
    primary: "#C084FC",
    glow: "rgba(192, 132, 252, 0.3)",
    border: "border-purple-500/50",
    badgeBg: "bg-purple-950/60 text-purple-300 border-purple-500/40",
    accentHex: "#9333EA",
  },
} as const;

const WHITELABEL_STORAGE_PREFIX = "reportix_whitelabel_";

export function getWhiteLabelConfig(email?: string | null): WhiteLabelConfig | null {
  if (!email || typeof window === "undefined") return null;
  const normEmail = email.trim().toLowerCase();

  try {
    const raw = localStorage.getItem(`${WHITELABEL_STORAGE_PREFIX}${normEmail}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse whitelabel config", e);
  }
  return null;
}

export function saveWhiteLabelConfig(config: WhiteLabelConfig): void {
  if (typeof window === "undefined") return;
  const normEmail = config.userEmail.trim().toLowerCase();

  try {
    localStorage.setItem(
      `${WHITELABEL_STORAGE_PREFIX}${normEmail}`,
      JSON.stringify(config)
    );
    window.dispatchEvent(new CustomEvent("reportix-whitelabel-updated", { detail: config }));
  } catch (e) {
    console.error("Failed to save whitelabel locally", e);
  }

  // Background server sync
  fetch("/api/whitelabel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  }).catch(() => {});
}
