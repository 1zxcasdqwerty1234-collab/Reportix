import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  Crown,
  Download,
  FileSpreadsheet,
  FileText,
  Key,
  Lock,
  Mail,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import {
  ADMIN_DEFAULT_PASSWORD,
  ADMIN_EMAIL,
  PLANS,
  getGrantedPlans,
  saveGrantedPlan,
  revokeGrantedPlan,
  calculateExpirationDate,
  syncSubscriptionsFromServer,
} from "@/lib/subscription";
import {
  fetchAllTickets,
  replyToSupportTicket,
  getStoredLogs,
  logActivity,
  downloadLogsAsCsv,
  downloadLogsAsJson,
  getRegisteredUsers,
  type SupportTicket,
  type ActivityLog,
} from "@/lib/support";
import {
  getIpRegistry,
  resetIpAccountLimit,
  toggleBlockIp,
  getBlockedIps,
  MAX_ACCOUNTS_PER_IP,
  getSystemAnnouncement,
  setSystemAnnouncement,
} from "@/lib/security";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Панель управления — Reportix Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminEmailInput, setAdminEmailInput] = useState(ADMIN_EMAIL);

  const [activeTab, setActiveTab] = useState<"overview" | "tickets" | "tariffs" | "users" | "security" | "logs">("overview");

  // Tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [ticketFilter, setTicketFilter] = useState<"all" | "open" | "resolved">("all");

  // Tariffs grant state
  const [grantEmail, setGrantEmail] = useState("");
  const [grantPlanId, setGrantPlanId] = useState<"free" | "pro">("pro");
  const [grantDuration, setGrantDuration] = useState("1 год");
  const [grantedList, setGrantedList] = useState<any[]>([]);

  // Real users & logs state
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [logSearch, setLogSearch] = useState("");
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");

  // Security / IP Registry state
  const [ipRegistry, setIpRegistry] = useState<Record<string, any>>({});
  const [blockedIps, setBlockedIps] = useState<string[]>([]);
  const [manualBlockIp, setManualBlockIp] = useState("");

  // System Announcement state
  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [announcementType, setAnnouncementType] = useState<"info" | "warning" | "success">("info");
  const [announcementActive, setAnnouncementActive] = useState(false);

  const refreshData = async () => {
    // Tickets
    const tkts = await fetchAllTickets();
    setTickets(tkts);

    // Granted plans with server sync
    const plansMap = await syncSubscriptionsFromServer();
    setGrantedList(Object.values(plansMap));

    // Logs & Users with server API sync
    const lgs = getStoredLogs();
    setLogs(lgs);
    let usersCombined = { ...getRegisteredUsers() };
    try {
      const resp = await fetch("/api/users");
      if (resp.ok) {
        const uData = await resp.json();
        if (uData?.users && Array.isArray(uData.users)) {
          for (const u of uData.users) {
            usersCombined[u.email.toLowerCase()] = {
              ...usersCombined[u.email.toLowerCase()],
              ...u,
            };
          }
        }
      }
    } catch {}
    setUsersList(Object.values(usersCombined));

    // IP Registry & DDoS Shield
    setIpRegistry(getIpRegistry());
    setBlockedIps(getBlockedIps());

    // Announcement
    const currentAnn = getSystemAnnouncement();
    if (currentAnn) {
      setAnnouncementMsg(currentAnn.message);
      setAnnouncementType(currentAnn.type);
      setAnnouncementActive(currentAnn.active);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email || "";
      const localAdmin = localStorage.getItem("reportix_admin_auth") === "true";
      if (Boolean(ADMIN_EMAIL) && email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || localAdmin) {
        setIsAdminAuth(true);
        refreshData();
      }
    });
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ADMIN_DEFAULT_PASSWORD) {
      toast.error("Пароль администратора не настроен. Задайте VITE_ADMIN_PASSWORD в .env");
      return;
    }
    if (
      Boolean(ADMIN_EMAIL) && adminEmailInput.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
      adminPasswordInput === ADMIN_DEFAULT_PASSWORD
    ) {
      localStorage.setItem("reportix_admin_auth", "true");
      localStorage.setItem("reportix_user_email", ADMIN_EMAIL);
      setIsAdminAuth(true);
      toast.success("Авторизация администратора подтверждена!");
      logActivity(ADMIN_EMAIL, "Вход главного администратора", "Успешная авторизация в панели управления");
      refreshData();
    } else {
      toast.error("Неверный email или пароль администратора");
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) {
      toast.error("Введите текст ответа");
      return;
    }
    setReplying(true);
    try {
      await replyToSupportTicket(selectedTicket.id, replyText, ADMIN_EMAIL, "resolved");
      toast.success("Ответ отправлен клиенту!");
      setReplyText("");
      setSelectedTicket(null);
      refreshData();
    } catch {
      toast.error("Не удалось отправить ответ");
    } finally {
      setReplying(false);
    }
  };

  const handleGrantPlan = (e: React.FormEvent) => {
    e.preventDefault();
    const emailToGrant = grantEmail.trim().toLowerCase();
    if (!emailToGrant || !emailToGrant.includes("@")) {
      toast.error("Укажите корректный email");
      return;
    }

    const expiresAt = calculateExpirationDate(grantDuration);
    saveGrantedPlan({
      userEmail: emailToGrant,
      planId: grantPlanId,
      duration: grantDuration,
      grantedAt: new Date().toISOString(),
      grantedBy: ADMIN_EMAIL,
      expiresAt,
    });

    toast.success(`Тариф «${PLANS[grantPlanId].name}» выдан на ${emailToGrant} (${grantDuration})`);
    setGrantEmail("");
    refreshData();
  };

  const handleRevokePlan = (userEmail: string) => {
    if (!confirm(`Отозвать платный тариф у ${userEmail}?`)) return;
    revokeGrantedPlan(userEmail, ADMIN_EMAIL);
    toast.success(`Тариф пользователя ${userEmail} возвращен на «Старт»`);
    refreshData();
  };

  const handleResetIp = (ip: string) => {
    resetIpAccountLimit(ip);
    toast.success(`Лимит регистраций для IP ${ip} сброшен (0 / ${MAX_ACCOUNTS_PER_IP})`);
    refreshData();
  };

  const handleToggleBlock = (ip: string, block: boolean) => {
    toggleBlockIp(ip, block);
    toast.success(block ? `IP ${ip} заблокирован` : `IP ${ip} разблокирован`);
    refreshData();
  };

  const handleManualBlock = (e: React.FormEvent) => {
    e.preventDefault();
    const ip = manualBlockIp.trim();
    if (!ip) return;
    toggleBlockIp(ip, true);
    setManualBlockIp("");
    toast.success(`IP-адрес ${ip} добавлен в чёрный список`);
    refreshData();
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (announcementActive && !announcementMsg.trim()) {
      toast.error("Введите текст уведомления");
      return;
    }

    setSystemAnnouncement(
      announcementActive
        ? {
            id: `ann-${Date.now()}`,
            message: announcementMsg.trim(),
            type: announcementType,
            active: true,
            createdAt: new Date().toISOString(),
          }
        : null
    );

    toast.success(announcementActive ? "Глобальное объявление опубликовано на сайте!" : "Объявление отключено");
    refreshData();
  };

  const handleClearLogs = () => {
    if (!confirm("Очистить журнал логов? Это действие необратимо.")) return;
    localStorage.removeItem("reportix_activity_logs_v2");
    refreshData();
    toast.success("Журнал логов очищен");
  };

  // If not authenticated as Admin:
  if (!isAdminAuth) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-background px-4 text-foreground">
        <div className="pointer-events-none absolute inset-0 bg-grid" />
        <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-card p-8 shadow-2xl shadow-black">
          <div className="mx-auto flex justify-center mb-6">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <Crown className="h-6 w-6" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-center text-white">Вход в панель управления Reportix</h1>
          <p className="mt-2 text-center text-xs text-zinc-400">
            Доступ разрешён только главному администратору платформы ({ADMIN_EMAIL}).
          </p>

          <form onSubmit={handleAdminLogin} className="mt-6 space-y-4">
            <div>
              <Label className="text-xs text-zinc-300">Email администратора</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <Input
                  type="email"
                  required
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  className="pl-9 h-10 border-zinc-800 bg-zinc-900 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-zinc-300">Пароль доступа</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <Input
                  type="password"
                  required
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="Введите пароль администратора"
                  className="pl-9 h-10 border-zinc-800 bg-zinc-900 text-xs text-white"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-zinc-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:from-amber-300 hover:to-amber-500"
            >
              Войти в панель управления
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-xs text-zinc-500 hover:text-white transition-colors">
              Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const openTicketsCount = tickets.filter((t) => t.status === "open").length;
  const filteredTickets = tickets.filter((t) => {
    if (ticketFilter === "open") return t.status === "open";
    if (ticketFilter === "resolved") return t.status === "resolved";
    return true;
  });

  const filteredLogs = logs.filter(
    (l) =>
      l.userEmail.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.action.toLowerCase().includes(logSearch.toLowerCase()) ||
      (l.ip || "").toLowerCase().includes(logSearch.toLowerCase()) ||
      (l.details || "").toLowerCase().includes(logSearch.toLowerCase())
  );

  const filteredUsers = usersList.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.ip || "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const ipList = Object.values(ipRegistry);

  return (
    <div className="relative min-h-screen bg-background text-foreground pb-24">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />

      {/* Admin Top Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <Logo size="sm" />
            </Link>
            <span className="hidden sm:inline-block h-4 w-px bg-zinc-800" />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-300">
              <Crown className="h-3.5 w-3.5 text-amber-400" /> Панель управления Reportix
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/new">
              <Button size="sm" variant="outline" className="border-zinc-800 text-xs text-zinc-300 hover:text-white">
                Создать отчёт
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                localStorage.removeItem("reportix_admin_auth");
                setIsAdminAuth(false);
                toast.success("Вы вышли из админ-панели");
                navigate({ to: "/" });
              }}
              className="text-xs text-zinc-400 hover:text-rose-400"
            >
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 pt-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            📊 Обзор и статистика
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "tickets"
                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <span>💬 Тикеты поддержки</span>
            {openTicketsCount > 0 && (
              <span className="rounded-full bg-rose-500/80 px-1.5 py-0.2 text-[10px] font-bold text-white">
                {openTicketsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("tariffs")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "tariffs"
                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            💎 Выдача тарифов ({grantedList.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "users"
                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            👥 Пользователи ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "security"
                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span>🛡️ Защита от DDoS и IP ({ipList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "logs"
                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <span>📋 Реальные логи ({logs.length})</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="mt-8 space-y-8 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-zinc-800 bg-card p-5 shadow-lg">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase">
                  <span>Реальные пользователи</span>
                  <Users className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="mt-3 text-3xl font-extrabold text-white">{usersList.length || 1}</div>
                <div className="mt-1 text-[11px] text-emerald-400 font-medium">Только настоящие аккаунты</div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-card p-5 shadow-lg">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase">
                  <span>Записей в логах</span>
                  <FileText className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="mt-3 text-3xl font-extrabold text-white">{logs.length}</div>
                <div className="mt-1 text-[11px] text-emerald-400 font-medium">Фиксация реальных IP и событий</div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-card p-5 shadow-lg">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase">
                  <span>Тикеты поддержки</span>
                  <MessageSquare className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="mt-3 text-3xl font-extrabold text-white">{openTicketsCount}</div>
                <div className="mt-1 text-[11px] text-amber-400 font-medium">
                  {openTicketsCount > 0 ? "Требуют ответа администратора" : "Все обращения закрыты"}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-zinc-800/80 to-zinc-950 p-5 shadow-lg">
                <div className="flex items-center justify-between text-xs text-amber-300 font-semibold uppercase">
                  <span>DDoS защита</span>
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="mt-3 text-3xl font-extrabold text-white">АКТИВНА</div>
                <div className="mt-1 text-[11px] text-emerald-400 font-medium">Лимит: {MAX_ACCOUNTS_PER_IP} акк/IP</div>
              </div>
            </div>

            {/* Quick Actions & System Announcements */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Broadcast announcement widget */}
              <div className="rounded-2xl border border-zinc-800 bg-card p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Bell className="h-4 w-4 text-amber-400" /> Глобальное системное оповещение
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${announcementActive ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400"}`}>
                    {announcementActive ? "АКТИВНО" : "ВЫКЛЮЧЕНО"}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Текст появится в верхней плашке сайта для всех пользователей.
                </p>

                <form onSubmit={handleSaveAnnouncement} className="mt-4 space-y-3">
                  <div>
                    <Input
                      value={announcementMsg}
                      onChange={(e) => setAnnouncementMsg(e.target.value)}
                      placeholder="Например: Внимание! Обновление серверов сегодня в 23:00..."
                      className="border-zinc-800 bg-zinc-900 text-xs text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <select
                      value={announcementType}
                      onChange={(e) => setAnnouncementType(e.target.value as any)}
                      className="h-8 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-white"
                    >
                      <option value="info">Информационное (синий)</option>
                      <option value="warning">Предупреждение (жёлтый)</option>
                      <option value="success">Акция / Успех (зелёный)</option>
                    </select>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAnnouncementActive(!announcementActive);
                        }}
                        className="h-8 text-xs border-zinc-800"
                      >
                        {announcementActive ? "Отключить" : "Включить"}
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        className="h-8 text-xs bg-gradient-to-r from-zinc-100 via-white to-zinc-300 text-zinc-950 font-bold"
                      >
                        Сохранить
                      </Button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Data Export Center */}
              <div className="rounded-2xl border border-zinc-800 bg-card p-6 shadow-xl">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Download className="h-4 w-4 text-emerald-400" /> Выгрузка и экспорт данных
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Скачивайте реальные логи активности и данные пользователей в удобных форматах.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => downloadLogsAsCsv(logs)}
                    disabled={logs.length === 0}
                    className="h-10 text-xs bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800 flex items-center justify-center gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                    <span>Скачать логи (CSV)</span>
                  </Button>
                  <Button
                    onClick={() => downloadLogsAsJson(logs)}
                    disabled={logs.length === 0}
                    className="h-10 text-xs bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800 flex items-center justify-center gap-2"
                  >
                    <FileText className="h-4 w-4 text-amber-400" />
                    <span>Скачать логи (JSON)</span>
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                  <span>Всего реальных записей: <strong className="text-white">{logs.length}</strong></span>
                  <button
                    onClick={handleClearLogs}
                    className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                  >
                    Очистить старые логи
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SUPPORT TICKETS */}
        {activeTab === "tickets" && (
          <div className="mt-8 space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Центр поддержки клиентов</h2>
                <p className="text-xs text-zinc-400">Только реальные обращения от пользователей Reportix</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Фильтр:</span>
                <select
                  value={ticketFilter}
                  onChange={(e) => setTicketFilter(e.target.value as any)}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white"
                >
                  <option value="all">Все ({tickets.length})</option>
                  <option value="open">Открытые ({openTicketsCount})</option>
                  <option value="resolved">Решённые</option>
                </select>
                <Button size="sm" variant="outline" onClick={refreshData} className="border-zinc-800 text-xs">
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Tickets Table */}
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-card">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-400 font-semibold uppercase">
                  <tr>
                    <th className="p-3.5">Статус</th>
                    <th className="p-3.5">Email автора</th>
                    <th className="p-3.5">Тема / Сообщение</th>
                    <th className="p-3.5">Дата</th>
                    <th className="p-3.5 text-right">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-zinc-500">
                        Обращений от реальных пользователей пока нет. Они появятся здесь, когда клиенты воспользуются кнопкой «Поддержка».
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              t.status === "resolved"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : t.status === "in_progress"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-rose-500/20 text-rose-400"
                            }`}
                          >
                            {t.status === "resolved" ? "Решён" : t.status === "in_progress" ? "В работе" : "Открыт"}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium text-white font-mono">{t.userEmail}</td>
                        <td className="p-3.5 max-w-md">
                          <div className="font-semibold text-white truncate">{t.subject}</div>
                          <div className="text-zinc-400 truncate mt-0.5">{t.message}</div>
                          {t.adminReply && (
                            <div className="text-emerald-400 text-[11px] mt-1 truncate">
                              ✓ Ваш ответ: {t.adminReply}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-zinc-500">
                          {new Date(t.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedTicket(t);
                              setReplyText(t.adminReply || "");
                            }}
                            className="h-8 text-xs bg-zinc-800 text-white hover:bg-zinc-700"
                          >
                            {t.adminReply ? "Изменить ответ" : "Ответить"}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal for replying to a ticket */}
            {selectedTicket && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
                <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-card p-6 shadow-2xl shadow-black text-foreground">
                  <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
                    <div>
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Тикет #{selectedTicket.id}</span>
                      <h3 className="text-lg font-bold text-white mt-1">{selectedTicket.subject}</h3>
                      <div className="text-xs text-zinc-400 font-mono mt-0.5">От: {selectedTicket.userEmail}</div>
                    </div>
                    <button onClick={() => setSelectedTicket(null)} className="text-zinc-400 hover:text-white p-1">✕</button>
                  </div>

                  <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {selectedTicket.message}
                  </div>

                  <div className="mt-4">
                    <Label className="text-xs text-zinc-200">Ваш ответ пользователю</Label>
                    <Textarea
                      required
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Здравствуйте! Мы рассмотрели ваше обращение..."
                      className="mt-1.5 min-h-[120px] border-zinc-800 bg-zinc-900 text-xs text-white"
                    />
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-zinc-800">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setGrantEmail(selectedTicket.userEmail);
                        setActiveTab("tariffs");
                        setSelectedTicket(null);
                      }}
                      className="border-zinc-700 text-xs text-zinc-300 hover:text-white"
                    >
                      <Crown className="mr-1.5 h-3.5 w-3.5 text-amber-400" /> Выдать тариф автору
                    </Button>

                    <Button
                      type="button"
                      disabled={replying}
                      onClick={handleSendReply}
                      className="bg-gradient-to-r from-zinc-100 via-white to-zinc-300 text-zinc-950 font-bold hover:from-white hover:to-zinc-200 text-xs"
                    >
                      {replying ? "Отправка…" : <><Send className="mr-1.5 h-3.5 w-3.5" /> Отправить ответ</>}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TARIFFS MANAGEMENT */}
        {activeTab === "tariffs" && (
          <div className="mt-8 space-y-8 animate-fade-in">
            {/* Grant Tariff Form */}
            <div className="rounded-2xl border border-zinc-800 bg-card p-6 shadow-xl">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Выдать тариф пользователю</h2>
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                Укажите email пользователя — назначенный тариф и все его возможности активируются немедленно.
              </p>

              <form onSubmit={handleGrantPlan} className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div className="sm:col-span-2">
                  <Label htmlFor="grant-email" className="text-xs text-zinc-300">Email пользователя</Label>
                  <Input
                    id="grant-email"
                    type="email"
                    required
                    value={grantEmail}
                    onChange={(e) => setGrantEmail(e.target.value)}
                    placeholder="client@agency.ru"
                    className="mt-1 h-10 border-zinc-800 bg-zinc-900 text-xs text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="grant-plan" className="text-xs text-zinc-300">Тариф</Label>
                  <select
                    id="grant-plan"
                    value={grantPlanId}
                    onChange={(e) => setGrantPlanId(e.target.value as any)}
                    className="mt-1 w-full h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs text-white focus:outline-none"
                  >
                    <option value="pro">Фриланс / Pro</option>
                    <option value="pro">Pro</option>
                    
                    <option value="free">Старт (Сброс)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="grant-dur" className="text-xs text-zinc-300">Срок доступа</Label>
                  <select
                    id="grant-dur"
                    value={grantDuration}
                    onChange={(e) => setGrantDuration(e.target.value)}
                    className="mt-1 w-full h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs text-white focus:outline-none"
                  >
                    <option value="1 месяц">1 месяц</option>
                    <option value="3 месяца">3 месяца</option>
                    <option value="1 год">1 год</option>
                    <option value="Бессрочно / Навсегда">Бессрочно / Навсегда</option>
                  </select>
                </div>

                <div className="sm:col-span-4 mt-2">
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md hover:from-amber-300 hover:to-amber-500 h-10 text-xs px-6"
                  >
                    <Plus className="mr-1.5 h-4 w-4" /> Назначить тариф
                  </Button>
                </div>
              </form>
            </div>

            {/* Active Granted Plans Table */}
            <div>
              <h3 className="text-base font-bold text-white mb-3">Список активных выданных тарифов</h3>
              <div className="overflow-hidden rounded-xl border border-zinc-800 bg-card">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-400 font-semibold uppercase">
                    <tr>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Тариф</th>
                      <th className="p-3.5">Срок</th>
                      <th className="p-3.5">Кем выдан</th>
                      <th className="p-3.5">Дата выдачи</th>
                      <th className="p-3.5 text-right">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                    {/* Always display the Admin permanent VIP account */}
                    <tr className="bg-amber-950/20">
                      <td className="p-3.5 font-bold text-amber-300 font-mono">{ADMIN_EMAIL}</td>
                      <td className="p-3.5">
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                          Агентство / Team (VIP)
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-amber-300">Бессрочно (Навсегда)</td>
                      <td className="p-3.5 text-zinc-400">Система (Главный админ)</td>
                      <td className="p-3.5 text-zinc-400">Всегда активен</td>
                      <td className="p-3.5 text-right text-zinc-500 font-semibold">Основной владелец</td>
                    </tr>

                    {grantedList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-zinc-500">
                          Других выданных тарифов пока нет. Все обычные пользователи начинают с тарифа «Старт».
                        </td>
                      </tr>
                    ) : (
                      grantedList.map((g) => (
                        <tr key={g.userEmail} className="hover:bg-zinc-800/40">
                          <td className="p-3.5 font-medium text-white font-mono">{g.userEmail}</td>
                          <td className="p-3.5">
                            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                              {PLANS[g.planId]?.name || g.planId}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div>{g.duration}</div>
                            {g.expiresAt ? (
                              <div className="text-[10px] text-zinc-400 font-mono">
                                до {new Date(g.expiresAt).toLocaleDateString("ru-RU")}
                              </div>
                            ) : (
                              <div className="text-[10px] text-amber-300 font-mono">Бессрочно</div>
                            )}
                          </td>
                          <td className="p-3.5 text-zinc-400">{g.grantedBy}</td>
                          <td className="p-3.5 text-zinc-400">
                            {new Date(g.grantedAt).toLocaleDateString("ru-RU")}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => handleRevokePlan(g.userEmail)}
                              className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                            >
                              Отозвать
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: USERS (REAL ACCOUNTS) */}
        {activeTab === "users" && (
          <div className="mt-8 space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Реальные пользователи</h2>
                <p className="text-xs text-zinc-400">База настоящих людей и аккаунтов, зарегистрированных в Reportix</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Поиск по email или IP..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-8 h-8 text-xs border-zinc-800 bg-zinc-900 text-white"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-card">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-400 font-semibold uppercase">
                  <tr>
                    <th className="p-3.5">Имя (Full Name)</th>
                    <th className="p-3.5">Email аккаунта</th>
                    <th className="p-3.5">IP адрес</th>
                    <th className="p-3.5">Дата регистрации</th>
                    <th className="p-3.5">Создано отчётов</th>
                    <th className="p-3.5 text-right">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                  {/* Admin row */}
                  <tr className="bg-amber-950/20">
                    <td className="p-3.5 font-bold text-amber-300">Master Admin</td>
                    <td className="p-3.5 font-bold text-amber-300 font-mono flex items-center gap-1.5">
                      <Crown className="h-3.5 w-3.5 text-amber-400" />
                      {ADMIN_EMAIL}
                    </td>
                    <td className="p-3.5 font-mono text-zinc-400">127.0.0.1 (Локальный)</td>
                    <td className="p-3.5 text-zinc-400">Основной владелец</td>
                    <td className="p-3.5 font-bold text-white">Безлимит</td>
                    <td className="p-3.5 text-right text-amber-400 font-bold">Главный админ</td>
                  </tr>

                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-500">
                        Других пользователей пока нет. При регистрации новых людей их данные сразу появятся в этом реестре.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.email} className="hover:bg-zinc-800/40">
                        <td className="p-3.5 font-medium text-white">
                          {u.fullName || <span className="text-zinc-500 italic">Не указано</span>}
                        </td>
                        <td className="p-3.5 font-medium text-zinc-200 font-mono">{u.email}</td>
                        <td className="p-3.5 font-mono text-zinc-400">{u.ip || "—"}</td>
                        <td className="p-3.5 text-zinc-400">
                          {new Date(u.registeredAt).toLocaleDateString("ru-RU")}
                        </td>
                        <td className="p-3.5 font-semibold text-white">{u.reportsCount || 0}</td>
                        <td className="p-3.5 text-right">
                          <Button
                            size="sm"
                            onClick={() => {
                              setGrantEmail(u.email);
                              setActiveTab("tariffs");
                            }}
                            className="h-7 text-[11px] bg-zinc-800 text-white hover:bg-zinc-700"
                          >
                            Выдать тариф
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: DDOS & SECURITY */}
        {activeTab === "security" && (
          <div className="mt-8 space-y-8 animate-fade-in">
            {/* DDoS Shield Status Card */}
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-zinc-900/60 to-zinc-950 p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      Reportix DDoS Shield & WAF
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">АКТИВЕН</span>
                    </h2>
                    <p className="text-xs text-zinc-300 mt-0.5">
                      Сетевое дросселирование: максимум 80 запросов / 10 сек на IP. Автоматическая блокировка аномальных всплесков.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-lg text-center">
                    <div className="text-[10px] text-zinc-400">Лимит аккаунтов на IP</div>
                    <div className="font-bold text-white font-mono mt-0.5">{MAX_ACCOUNTS_PER_IP} аккаунта</div>
                  </div>
                  <div className="bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-lg text-center">
                    <div className="text-[10px] text-zinc-400">Заблокировано IP</div>
                    <div className="font-bold text-rose-400 font-mono mt-0.5">{blockedIps.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Manual IP Block Form */}
            <div className="rounded-2xl border border-zinc-800 bg-card p-6 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="h-4 w-4 text-rose-400" /> Ручная блокировка IP-адреса
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Заблокированные IP мгновенно получают ответ 403 Forbidden при любых попытках обращения к сайту.
              </p>

              <form onSubmit={handleManualBlock} className="mt-4 flex gap-3 max-w-md">
                <Input
                  value={manualBlockIp}
                  onChange={(e) => setManualBlockIp(e.target.value)}
                  placeholder="Например: 194.26.29.112"
                  className="h-9 text-xs border-zinc-800 bg-zinc-900 text-white font-mono"
                />
                <Button type="submit" size="sm" className="h-9 text-xs bg-rose-600 hover:bg-rose-500 text-white font-bold shrink-0">
                  Заблокировать
                </Button>
              </form>
            </div>

            {/* IP Registry Table */}
            <div>
              <h3 className="text-base font-bold text-white mb-3">
                Реестр IP-адресов и количество созданных аккаунтов (Лимит: максимум 3 на IP)
              </h3>
              <div className="overflow-hidden rounded-xl border border-zinc-800 bg-card">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-400 font-semibold uppercase">
                    <tr>
                      <th className="p-3.5">IP-адрес</th>
                      <th className="p-3.5">Создано аккаунтов</th>
                      <th className="p-3.5">Привязанные почты</th>
                      <th className="p-3.5">Статус IP</th>
                      <th className="p-3.5 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                    {ipList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-zinc-500">
                          Реестр IP пока пуст. Он заполняется автоматически при каждой новой регистрации пользователя.
                        </td>
                      </tr>
                    ) : (
                      ipList.map((rec) => {
                        const isBlocked = blockedIps.includes(rec.ip) || rec.blocked;
                        const isAtLimit = rec.count >= MAX_ACCOUNTS_PER_IP;

                        return (
                          <tr key={rec.ip} className="hover:bg-zinc-800/40">
                            <td className="p-3.5 font-mono font-bold text-white">{rec.ip}</td>
                            <td className="p-3.5">
                              <span
                                className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                                  isAtLimit
                                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                    : "bg-zinc-800 text-zinc-300"
                                }`}
                              >
                                {rec.count} / {MAX_ACCOUNTS_PER_IP}
                              </span>
                            </td>
                            <td className="p-3.5 font-mono text-[11px] text-zinc-400 max-w-xs truncate">
                              {(rec.accounts || []).join(", ") || "—"}
                            </td>
                            <td className="p-3.5">
                              {isBlocked ? (
                                <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                                  ЗАБЛОКИРОВАН
                                </span>
                              ) : isAtLimit ? (
                                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                                  ЛИМИТ ИСЧЕРПАН (3/3)
                                </span>
                              ) : (
                                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                                  В НОРМЕ
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right whitespace-nowrap space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResetIp(rec.ip)}
                                className="h-7 text-[11px] border-zinc-800 text-zinc-300 hover:text-white"
                              >
                                Сбросить (0/3)
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleBlock(rec.ip, !isBlocked)}
                                className={`h-7 text-[11px] ${
                                  isBlocked
                                    ? "border-emerald-600 text-emerald-400 hover:bg-emerald-950"
                                    : "border-rose-800 text-rose-400 hover:bg-rose-950"
                                }`}
                              >
                                {isBlocked ? "Разблокировать" : "Блок"}
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: LOGS */}
        {activeTab === "logs" && (
          <div className="mt-8 space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Журнал активности (только реальные события)</h2>
                <p className="text-xs text-zinc-400">Полная фиксация реальных действий пользователей и IP-адресов</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Поиск по почте, IP или действию..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="pl-8 h-8 text-xs border-zinc-800 bg-zinc-900 text-white"
                  />
                </div>

                <Button
                  size="sm"
                  onClick={() => downloadLogsAsCsv(filteredLogs)}
                  className="h-8 text-xs bg-gradient-to-r from-zinc-100 via-white to-zinc-300 text-zinc-950 font-bold shrink-0"
                >
                  <Download className="mr-1 h-3.5 w-3.5" /> Скачать логи
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-card">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-400 font-semibold uppercase">
                  <tr>
                    <th className="p-3.5">Время</th>
                    <th className="p-3.5">Email аккаунта</th>
                    <th className="p-3.5">IP-адрес</th>
                    <th className="p-3.5">Действие</th>
                    <th className="p-3.5">Подробности</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-zinc-500">
                        В журнале пока нет событий. Он будет наполняться в реальном времени при взаимодействии пользователей с сайтом.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((l) => (
                      <tr key={l.id} className="hover:bg-zinc-800/40 font-mono text-[11px]">
                        <td className="p-3.5 text-zinc-500 whitespace-nowrap">
                          {new Date(l.timestamp).toLocaleString("ru-RU")}
                        </td>
                        <td className="p-3.5 font-bold text-white">{l.userEmail}</td>
                        <td className="p-3.5 text-zinc-400 font-mono">{l.ip || "127.0.0.1"}</td>
                        <td className="p-3.5 text-amber-300 font-medium">{l.action}</td>
                        <td className="p-3.5 text-zinc-300">{l.details || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
