import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Briefcase, ClipboardList, FileText, LineChart, Mail, Megaphone, Search, CalendarDays, Target, Zap, Clock, ShieldCheck, Globe, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reportix — Платформа клиентской отчётности для агентств" },
      { name: "description", content: "Вставьте цифры или импортируйте из кабинета — получите аккуратный клиентский отчёт в PDF или онлайн-версии за минуту." },
      { property: "og:title", content: "Reportix — Платформа клиентской отчётности" },
      { property: "og:description", content: "10 типов документов, импорт из рекламных кабинетов и готовый PDF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const types = [
  { icon: BarChart3, ru: "SMM-отчёт", en: "SMM Report" },
  { icon: Megaphone, ru: "Реклама", en: "Paid Ads" },
  { icon: Search, ru: "SEO-отчёт", en: "SEO Audit" },
  { icon: FileText, ru: "Коммерческое предложение", en: "Proposal" },
  { icon: Mail, ru: "Email-рассылки", en: "Email Marketing" },
  { icon: LineChart, ru: "Веб-аналитика", en: "Web Analytics" },
  { icon: CalendarDays, ru: "Контент-план", en: "Content Plan" },
  { icon: Briefcase, ru: "Кейс", en: "Case Study" },
  { icon: ClipboardList, ru: "Отчёт о работах", en: "Work Progress" },
  { icon: Target, ru: "Бриф / стратегия", en: "Strategy Brief" },
];

function Index() {
  const [lang, setLang] = useLanguage();
  const isEn = lang === "en";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-grid" />
      <div className="animate-glow pointer-events-none absolute -top-20 left-1/2 h-[450px] w-[650px] -translate-x-1/2 rounded-full bg-white/[0.08] blur-[120px]" />
      <div className="pointer-events-none absolute top-40 left-1/2 h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-zinc-400/[0.06] blur-[100px]" />

      <header className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-6 animate-fade-up">
        <Logo size="default" />
        <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
          <Link to="/demo" className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" /> {isEn ? "Live Demo" : "Демо в 1 клик"}
          </Link>
          <Link to="/pricing" className="transition-colors hover:text-white">
            {isEn ? "Pricing" : "Тарифы"}
          </Link>
          <Link to="/guide" className="transition-colors hover:text-white">
            {isEn ? "How It Works" : "Как пользоваться"}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => setLang(isEn ? "ru" : "en")}
            className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2 py-1 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white transition"
          >
            <Globe className="h-3 w-3 text-zinc-400" />
            <span className={!isEn ? "text-white font-bold" : "text-zinc-500"}>RU</span>
            <span className="text-zinc-600">/</span>
            <span className={isEn ? "text-white font-bold" : "text-zinc-500"}>EN</span>
          </button>

          <Link to="/demo">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex border-zinc-800 bg-zinc-900/60 text-emerald-400 hover:text-white hover:bg-zinc-800 text-xs">
              {isEn ? "Demo Report" : "Демо-отчёт"}
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-zinc-800/60 text-xs">
              {isEn ? "Sign in" : "Войти"}
            </Button>
          </Link>
          <Link to="/auth">
            <Button size="sm" className="bg-gradient-to-r from-zinc-100 via-white to-zinc-200 text-zinc-950 font-semibold shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:from-white text-xs">
              {isEn ? "Get Started" : "Регистрация"}
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-6 pb-24 pt-14 text-center">
        {/* Glowing Logo Emblem */}
        <div className="animate-fade-up mx-auto mb-6 flex justify-center">
          <div className="group relative flex items-center justify-center">
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-r from-zinc-300/30 via-white/40 to-zinc-400/30 opacity-70 blur-2xl animate-pulse" />
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-b from-white/30 via-zinc-400/20 to-transparent opacity-80 blur-md" />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-2xl border border-white/25 bg-gradient-to-b from-zinc-800/90 to-zinc-950/95 p-3.5 shadow-[0_0_35px_rgba(255,255,255,0.3)] backdrop-blur-xl transition-all duration-500 group-hover:scale-105 group-hover:border-white/40 group-hover:shadow-[0_0_50px_rgba(255,255,255,0.5)]">
              <img
                src="/logo.png"
                alt="Reportix"
                className="h-full w-full object-contain filter drop-shadow-[0_0_14px_rgba(255,255,255,0.7)]"
              />
            </div>
          </div>
        </div>

        <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-zinc-700/60 bg-zinc-900/80 px-3.5 py-1 text-xs text-zinc-300 backdrop-blur">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          {isEn ? "For Agencies & Marketing Freelancers · Reportix" : "Для агентств и фрилансеров · Reportix"}
        </div>

        <h1 className="animate-fade-up mt-6 text-5xl font-extrabold tracking-tight sm:text-6xl text-white" style={{ animationDelay: "80ms" }}>
          {isEn ? (
            <>
              Client Reports<br /><span className="text-shimmer">In 60 Seconds</span>
            </>
          ) : (
            <>
              Клиентские отчёты<br /><span className="text-shimmer">за одну минуту</span>
            </>
          )}
        </h1>
        <p className="animate-fade-up mx-auto mt-6 max-w-xl text-lg text-zinc-400" style={{ animationDelay: "160ms" }}>
          {isEn
            ? "Sync metrics from ad cabinets or paste raw figures. The system automatically structures key KPIs, crafts executive summaries, and delivers clean PDF & web reports."
            : "Вставьте цифры или подключите рекламный кабинет — система автоматически рассчитает показатели, сформирует структуру и подготовит отчёт для отправки клиенту."}
        </p>

        <div className="animate-fade-up mt-10 flex flex-wrap justify-center gap-3" style={{ animationDelay: "240ms" }}>
          <Link to="/demo">
            <Button size="lg" className="group bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:from-emerald-400 hover:to-teal-400 cursor-pointer">
              <CheckCircle2 className="mr-2 h-4 w-4" /> {isEn ? "Interactive Demo (No sign up)" : "Демо в 1 клик (без регистрации)"}
            </Button>
          </Link>
          <Link to="/new">
            <Button size="lg" variant="outline" className="border-zinc-700 bg-zinc-900/70 text-zinc-200 hover:bg-zinc-800 hover:text-white cursor-pointer">
              {isEn ? "Create Report" : "Создать свой отчёт"}{" "}
              <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link to="/guide">
            <Button size="lg" variant="ghost" className="text-zinc-400 hover:text-white cursor-pointer">
              <Clock className="mr-2 h-4 w-4 text-emerald-400" /> {isEn ? "Time Savings Calculator" : "Калькулятор экономии времени"}
            </Button>
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-zinc-300" /> {isEn ? "60 sec per report" : "60 секунд на отчёт"}</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-zinc-300" /> {isEn ? "Print-ready vector PDF" : "Готовый PDF для печати"}</span>
          <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-zinc-300" /> {isEn ? "10 document types" : "10 форматов документов"}</span>
          <span className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 text-emerald-400" /> {isEn ? "Ad Cabinet Sync (Agency)" : "Сбор данных из кабинетов"}</span>
        </div>

        {/* Sample card */}
        <div className="animate-fade-up relative mx-auto mt-16 max-w-2xl" style={{ animationDelay: "320ms" }}>
          <div className="animate-float rounded-xl border border-zinc-700/60 bg-card/90 p-6 text-left shadow-2xl shadow-black/80 backdrop-blur">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {isEn ? "Paid Ad Campaign · September 2026" : "Таргетированная реклама · Сентябрь"}
            </div>
            <div className="mt-2 text-xl font-bold text-zinc-100">
              {isEn ? "Full Performance & Lead Generation Report" : "Комплексный отчёт по рекламе и лидогенерации"}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                <div className="text-[11px] text-zinc-400">{isEn ? "Leads" : "Лиды"}</div>
                <div className="text-xl font-bold text-zinc-100">412</div>
                <div className="text-[10px] text-emerald-400 font-semibold">+17.7%</div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                <div className="text-[11px] text-zinc-400">{isEn ? "CPL (Cost Per Lead)" : "CPL (Цена лида)"}</div>
                <div className="text-xl font-bold text-zinc-100">{isEn ? "$4.80" : "351.94 ₽"}</div>
                <div className="text-[10px] text-emerald-400 font-semibold">−16.2%</div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                <div className="text-[11px] text-zinc-400">ROMI</div>
                <div className="text-xl font-bold text-zinc-100">+898%</div>
                <div className="text-[10px] text-emerald-400 font-semibold">+142%</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between pt-2 border-t border-zinc-800">
              <span className="text-xs text-zinc-500">Urban Roast · 412 {isEn ? "orders" : "заявок"}</span>
              <Link to="/demo" className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold">
                {isEn ? "Open live client view →" : "Открыть интерактивный просмотр →"}
              </Link>
            </div>
          </div>
        </div>

        {/* 10 Types */}
        <section className="mt-28">
          <h2 className="text-2xl font-bold text-white">{isEn ? "10 Specialized Formats" : "10 форматов под любые задачи"}</h2>
          <p className="mt-2 text-sm text-zinc-400">{isEn ? "Ready-to-use structures for all agency services." : "Готовые структуры под ключевые услуги digital-агентств и специалистов."}</p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {types.map((x, i) => {
              const Icon = x.icon;
              return (
                <div key={i} className="group flex flex-col items-center rounded-xl border border-zinc-800 bg-card/60 p-4 text-center transition-all duration-300 hover:border-zinc-600 hover:bg-zinc-800/80 hover:-translate-y-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-300 transition-colors group-hover:bg-zinc-700 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-3 text-xs font-semibold text-zinc-200">{isEn ? x.en : x.ru}</div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800/80 bg-zinc-950/60 py-8 text-center text-xs text-zinc-500">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between px-6 gap-4">
          <Logo size="sm" />
          <div className="flex gap-4">
            <Link to="/demo" className="text-emerald-400 hover:underline">{isEn ? "Demo" : "Демо"}</Link>
            <Link to="/pricing" className="hover:underline">{isEn ? "Pricing" : "Тарифы"}</Link>
            <Link to="/guide" className="hover:underline">{isEn ? "Guide" : "Руководство"}</Link>
            <Link to="/auth" className="hover:underline">{isEn ? "Sign in" : "Вход"}</Link>
          </div>
          <div>© {new Date().getFullYear()} Reportix. {isEn ? "All rights reserved." : "Все права защищены."}</div>
        </div>
      </footer>
    </div>
  );
}
