import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Crown, HelpCircle, ShieldCheck, Zap, Send, X, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_EMAIL, useActivePlan } from "@/lib/subscription";
import { createSupportTicket } from "@/lib/support";
import { useLanguage, I18N_PLANS } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Тарифные планы — Reportix" },
      { name: "description", content: "Прозрачные тарифы Reportix для маркетологов, фрилансеров и digital-агентств. Создавайте профессиональные отчёты за секунды." },
      { property: "og:title", content: "Тарифные планы — Reportix" },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const [lang, setLang] = useLanguage();
  const isEn = lang === "en";
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isYearly, setIsYearly] = useState(true);

  // Modal for requesting a plan
  const [requestModalPlan, setRequestModalPlan] = useState<any | null>(null);
  const [requestEmail, setRequestEmail] = useState("");
  const [requestMsg, setRequestMsg] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email || localStorage.getItem("reportix_user_email") || null;
      setUserEmail(email);
      if (email) setRequestEmail(email);
    });
  }, []);

  const activePlan = useActivePlan(userEmail);
  const isAdmin = Boolean(ADMIN_EMAIL) && userEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const currentPlans = I18N_PLANS[lang];

  const handlePlanClick = (plan: any) => {
    if (isAdmin) {
      toast.success(isEn ? "You already have Pro access!" : "У вас уже есть доступ Pro!");
      return;
    }

    if (plan.id === "free") {
      toast.info(isEn ? "Starter plan is active by default for all users." : "Тариф «Старт» действует по умолчанию для всех новых пользователей.");
      return;
    }

    // Open request modal
    setRequestModalPlan(plan);
    const price = isYearly ? plan.priceYearlyMonthly : plan.priceMonthly;
    const priceStr = isEn ? `$${price}/mo` : `${price.toLocaleString("ru-RU")} ₽/мес`;
    setRequestMsg(
      isEn
        ? `Hello! I would like to activate the "${plan.name}" plan (${isYearly ? "Annual with 20% discount" : "Monthly"}, ${priceStr}). Please enable access for my account.`
        : `Здравствуйте! Хочу подключить тариф «${plan.name}» (${isYearly ? "Годовой со скидкой 20%" : "Помесячный"}, ${priceStr}). Прошу активировать доступ для моего аккаунта.`
    );
  };

  const handleSendPlanRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestEmail.trim() || !requestEmail.includes("@")) {
      toast.error(isEn ? "Please enter a valid email address" : "Укажите корректный email для связи");
      return;
    }

    setSendingRequest(true);
    try {
      await createSupportTicket({
        userEmail: requestEmail.trim().toLowerCase(),
        subject: isEn
          ? `Subscription Request: "${requestModalPlan?.name || "Paid"}"`
          : `Запрос на подключение тарифа «${requestModalPlan?.name || "Платный"}»`,
        category: "billing",
        message: requestMsg.trim(),
      });
      toast.success(isEn ? "Request sent to administrator!" : "Заявка успешно отправлена администратору!", {
        description: isEn
          ? "Your request has been sent. We will activate the plan shortly."
          : "Заявка отправлена. Мы активируем тариф в ближайшее время.",
      });
      setRequestModalPlan(null);
    } catch {
      toast.error(isEn ? "Failed to send request. Please try again." : "Не удалось отправить заявку. Попробуйте еще раз.");
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground pb-24">
      <div className="pointer-events-none absolute inset-0 bg-grid" />
      <div className="animate-glow pointer-events-none absolute -top-24 left-1/2 h-[500px] w-[750px] -translate-x-1/2 rounded-full bg-white/[0.07] blur-[140px]" />

      <header className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/">
          <Logo size="default" />
        </Link>
        <nav className="flex items-center gap-6 text-sm text-zinc-400">
          <Link to="/demo" className="text-emerald-400 hover:text-emerald-300 font-medium">
            {isEn ? "Live Demo" : "Демо в 1 клик"}
          </Link>
          <Link to="/guide" className="transition-colors hover:text-white">
            {isEn ? "How It Works" : "Как пользоваться"}
          </Link>
          <Link to="/new" className="transition-colors hover:text-white">
            {isEn ? "Create Report" : "Создать отчёт"}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => setLang(isEn ? "ru" : "en")}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white transition"
          >
            <Globe className="h-3 w-3 text-zinc-400" />
            <span className={!isEn ? "text-white font-bold" : "text-zinc-500"}>RUB (₽)</span>
            <span className="text-zinc-600">/</span>
            <span className={isEn ? "text-white font-bold" : "text-zinc-500"}>USD ($)</span>
          </button>

          {userEmail ? (
            <Link to="/new">
              <Button size="sm" className="bg-gradient-to-r from-zinc-100 via-white to-zinc-200 text-zinc-950 font-semibold shadow-md hover:from-white">
                {isEn ? "Workspace" : "Кабинет"}
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-zinc-800 text-white hover:bg-zinc-700">
                {isEn ? "Sign in" : "Войти"}
              </Button>
            </Link>
          )}
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 pt-10">
        {/* Admin VIP Banner (Permanent Lifetime) */}
        {isAdmin && (
          <div className="mb-10 rounded-2xl border border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-zinc-900/80 to-zinc-950 p-6 shadow-2xl shadow-black/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  <Crown className="h-6 w-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-300 border border-amber-500/40">
                    {isEn ? "SYSTEM OWNER" : "ГЛАВНЫЙ АДМИНИСТРАТОР"}
                  </div>
                  <h2 className="mt-1 text-lg font-bold text-white">
                    {isEn ? "Admin access" : "Доступ администратора"}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {isEn
                      ? "Permanent lifetime access with unlimited report generation, ad cabinet data sync, and full White-Label."
                      : "Вам выдан постоянный пожизненный VIP-доступ со всеми функциями, сбором данных из кабинетов и White-Label."}
                  </p>
                </div>
              </div>
              <Link to="/admin">
                <Button className="bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                  {isEn ? "Admin Dashboard →" : "Панель управления →"}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Regular User Active Plan Banner */}
        {!isAdmin && activePlan.plan.id !== "free" && (
          <div className="mb-10 rounded-2xl border border-emerald-500/50 bg-gradient-to-r from-emerald-950/40 via-zinc-900/80 to-zinc-950 p-6 shadow-2xl shadow-black/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/40">
                    {isEn ? `ACTIVE PLAN: ${activePlan.plan.name}` : `АКТИВНЫЙ ТАРИФ: ${activePlan.label}`}
                  </div>
                  <h2 className="mt-1 text-lg font-bold text-white">
                    {userEmail} · {isEn ? "Access Active" : "Доступ активен"}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {activePlan.isLifetime
                      ? (isEn ? "You have permanent lifetime access." : "У вас действует бессрочный доступ к тарифу.")
                      : activePlan.expiresAt
                      ? (isEn
                          ? `Valid until: ${new Date(activePlan.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`
                          : `Тариф активен и действует до: ${new Date(activePlan.expiresAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}.`)
                      : (isEn ? `Duration: ${activePlan.duration || "1 month"}.` : `Срок действия: ${activePlan.duration || "1 месяц"}.`)}
                  </p>
                </div>
              </div>
              <Link to="/new">
                <Button className="bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  {isEn ? "Create Report →" : "Создать отчёт →"}
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700/60 bg-zinc-900/80 px-3.5 py-1 text-xs text-zinc-300 backdrop-blur">
            <Zap className="h-3.5 w-3.5 text-zinc-300" />
            {isEn ? "Investment that pays off with your very first client" : "Инвестиция, которая окупается с первого же клиента"}
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl text-white">
            {isEn ? "Simple & Transparent " : "Простые и прозрачные "}
            <span className="text-shimmer">{isEn ? "Pricing" : "тарифы"}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-400">
            {isEn
              ? "Choose the plan tailored to your team scale. Save 15 to 40 hours every month and deliver executive client reports."
              : "Выберите тариф под масштаб ваших задач. Экономьте от 15 до 40 рабочих часов в месяц и защищайте результаты перед заказчиками."}
          </p>

          {/* Billing Switcher */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={`text-sm ${!isYearly ? "text-white font-semibold" : "text-zinc-400"}`}>
              {isEn ? "Monthly" : "Помесячно"}
            </span>
            <button
              type="button"
              onClick={() => setIsYearly(!isYearly)}
              className="relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border border-zinc-700 bg-zinc-900 p-1 transition-colors duration-200 ease-in-out focus:outline-none"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isYearly ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`text-sm flex items-center gap-1.5 ${isYearly ? "text-white font-semibold" : "text-zinc-400"}`}>
              {isEn ? "Annual" : "На год"}
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                {isEn ? "Save 20%" : "Скидка 20%"}
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(currentPlans).map((p) => {
            const isAgency = false;
            const price = isYearly ? p.priceYearlyMonthly : p.priceMonthly;
            const isUserCurrent = isAdmin ? isAgency : activePlan.plan.id === p.id;
            const priceFormatted = isEn
              ? (p.priceMonthly === 0 ? "$0" : `$${price}`)
              : (p.priceMonthly === 0 ? "0 ₽" : `${price.toLocaleString("ru-RU")} ₽`);

            return (
              <div
                key={p.id}
                className={`relative flex flex-col justify-between rounded-2xl border p-6 transition-all duration-300 ${
                  isAgency
                    ? "border-zinc-300/80 bg-gradient-to-b from-zinc-800/90 via-zinc-900/95 to-zinc-950/95 shadow-[0_0_35px_rgba(255,255,255,0.15)] ring-1 ring-zinc-300/40"
                    : "border-zinc-800 bg-card/90 hover:border-zinc-700/80 hover:shadow-xl"
                }`}
              >
                {/* Clean Top Badge */}
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-max max-w-[90%] pointer-events-none">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shadow-md ${
                        isAgency
                          ? "bg-gradient-to-r from-zinc-100 via-white to-zinc-300 text-zinc-950 shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                          : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                      }`}
                    >
                      {p.badge}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">{p.name}</h3>
                    {isUserCurrent && (
                      <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                        {isAdmin && isAgency ? (isEn ? "LIFETIME" : "НАВСЕГДА") : (isEn ? "ACTIVE" : "АКТИВЕН")}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-zinc-400 min-h-[34px] leading-relaxed">{p.description}</p>

                  <div className="mt-5 border-y border-zinc-800/80 py-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">
                        {priceFormatted}
                      </span>
                      {p.priceMonthly > 0 && (
                        <span className="text-xs text-zinc-400">{isEn ? "/ month" : "/ месяц"}</span>
                      )}
                    </div>
                    {isYearly && p.priceMonthly > 0 && (
                      <div className="mt-1 text-[11px] text-zinc-500">
                        {isEn
                          ? `Billed annually $${price * 12}`
                          : `Оплата за год ${(price * 12).toLocaleString("ru-RU")} ₽`}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      {isEn ? "What's included:" : "Что включено:"}
                    </div>
                    <ul className="space-y-2.5 text-xs text-zinc-300">
                      {p.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <Check className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                          <span className="leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  {isUserCurrent ? (
                    <Button
                      variant="outline"
                      className="w-full border-zinc-700 bg-zinc-800/80 text-zinc-200 cursor-default"
                      disabled
                    >
                      {isAdmin && isAgency
                        ? (isEn ? "👑 Lifetime VIP Access" : "👑 Ваш бессрочный тариф")
                        : (isEn ? "✓ Your Current Plan" : "✓ Ваш текущий тариф")}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handlePlanClick(p)}
                      className={`w-full font-semibold transition-all duration-300 cursor-pointer ${
                        isAgency
                          ? "bg-gradient-to-r from-zinc-100 via-white to-zinc-200 text-zinc-950 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:from-white hover:to-zinc-100"
                          : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white"
                      }`}
                    >
                      {p.cta}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <section className="mt-24 rounded-2xl border border-zinc-800 bg-card/60 p-8 sm:p-12 shadow-xl">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            <HelpCircle className="h-4 w-4" /> {isEn ? "Frequently Asked Questions" : "Частые вопросы по тарифам"}
          </div>
          <h2 className="mt-2 text-2xl font-bold text-white">
            {isEn ? "Everything you need to know" : "Всё, что нужно знать перед подключением"}
          </h2>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">
                {isEn ? "How is data collected from ad cabinets?" : "Как работает сбор данных из рекламных кабинетов?"}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isEn
                  ? "In Agency Plan, you can connect Yandex Metrika, VK Ads, Telegram Ads, and GA4 by Counter ID or API token. The platform fetches live campaign statistics and generates your report in one click."
                  : "На тарифе «Агентство» вы можете указать ID счётчика или токен кабинета Яндекс Метрики, VK Рекламы, TG Ads и GA4. Система автоматически собирает актуальные показатели и формирует отчёт за 60 секунд."}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">
                {isEn ? "What is White-Label branding?" : "Что такое White-Label в тарифе «Агентство»?"}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isEn
                  ? "You upload your agency logo and choose custom brand colors. Exported PDF documents and web-view links contain zero mentions of Reportix — your client sees only your agency brand."
                  : "Вы загружаете логотип своего агентства и выбираете акцентные цвета. Сгенерированные PDF и онлайн-отчёты не содержат упоминаний Reportix — клиент видит документ вашего бренда."}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">
                {isEn ? "Do my reports remain accessible if I switch plans?" : "Сохраняются ли отчёты при смене тарифа?"}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isEn
                  ? "Yes, all your generated reports, metrics, and document history remain permanently stored in your account archive."
                  : "Да, вся история сгенерированных отчётов, графиков и документов остаётся в вашем личном кабинете навсегда."}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">
                {isEn ? "How is the plan activated?" : "Как происходит активация тарифа?"}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isEn
                  ? "Click on any plan to submit a request. The administrator instantly grants plan access in the admin console, and it stays active until its expiration date."
                  : "Вы оставляете заявку в один клик. Главный администратор платформы мгновенно активирует тариф для вашей почты в панели управления, и он сохраняется на весь выбранный срок."}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Plan Request Modal */}
      {requestModalPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <button
              onClick={() => setRequestModalPlan(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-white font-bold">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {isEn ? "Activate Plan" : "Подключение тарифа"}
                </h3>
                <p className="text-xs text-zinc-400">«{requestModalPlan.name}»</p>
              </div>
            </div>

            <form onSubmit={handleSendPlanRequest} className="mt-5 space-y-4">
              <div>
                <Label htmlFor="req-email" className="text-xs text-zinc-300">
                  {isEn ? "Your Account Email" : "Ваш Email для активации"}
                </Label>
                <Input
                  id="req-email"
                  type="email"
                  required
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  placeholder="you@agency.com"
                  className="mt-1 h-9 border-zinc-800 bg-zinc-900 text-xs text-white"
                />
              </div>

              <div>
                <Label htmlFor="req-msg" className="text-xs text-zinc-300">
                  {isEn ? "Request Message" : "Текст заявки"}
                </Label>
                <Textarea
                  id="req-msg"
                  required
                  value={requestMsg}
                  onChange={(e) => setRequestMsg(e.target.value)}
                  className="mt-1 min-h-[90px] border-zinc-800 bg-zinc-900 text-xs text-white"
                />
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-[11px] text-zinc-400 leading-relaxed">
                {isEn
                  ? "Your request will be reviewed and the plan will be activated."
                  : "Заявка будет рассмотрена, после чего тариф активируют для вашего аккаунта."}
              </div>

              <Button
                type="submit"
                disabled={sendingRequest}
                className="w-full bg-gradient-to-r from-zinc-100 via-white to-zinc-300 text-zinc-950 font-bold shadow-md hover:from-white hover:to-zinc-200 h-10 text-xs"
              >
                {sendingRequest
                  ? (isEn ? "Sending request…" : "Отправка заявки…")
                  : <><Send className="mr-1.5 h-3.5 w-3.5" /> {isEn ? "Send Request to Admin" : "Отправить заявку администратору"}</>}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
