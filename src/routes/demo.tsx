import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Download, Zap, ShieldCheck, Globe, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportView } from "@/components/ReportView";
import { downloadPdf } from "@/lib/pdf";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import type { ReportContent } from "@/lib/report-types";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Интерактивное демо — Reportix" },
      { name: "description", content: "Попробуйте живой пример клиентского отчёта Reportix в 1 клик без регистрации." },
      { property: "og:title", content: "Интерактивное демо — Reportix" },
      { property: "og:description", content: "Посмотрите качество оформления и скачайте пример PDF." },
    ],
  }),
  component: DemoPage,
});

const DEMO_CONTENT_RU: ReportContent = {
  title: "Комплексный отчёт по таргетированной рекламе и продажам",
  subtitle: "Анализ эффективности рекламных каналов VK Реклама и Telegram Ads за Сентябрь 2026",
  period: "1–30 сентября 2026 г.",
  summary:
    "В сентябре 2026 года рекламные кампании перевыполнили план по заявкам на 17.7%, снизив среднюю стоимость лида (CPL) с плановых 420 ₽ до 351.94 ₽. Общая выручка от привлечённых клиентов составила 1 448 000 ₽ при рекламном бюджете 145 000 ₽ (ROMI +898%). Связка геотаргетинга в радиусе 3 км и вовлекающего видеоконтента показала наивысшую окупаемость.",
  metrics: [
    {
      label: "Рекламный бюджет",
      value: "145 000 ₽",
      change: "В рамках плана",
      trend: "neutral",
      note: "освоено 100%",
    },
    {
      label: "Получено заявок (Лидов)",
      value: "412",
      change: "+17.7%",
      trend: "up",
      note: "план был 350 лидов",
    },
    {
      label: "Стоимость лида (CPL)",
      value: "351.94 ₽",
      change: "−16.2%",
      trend: "up",
      note: "план был 420 ₽ (дешевле)",
    },
    {
      label: "Конверсия в покупку",
      value: "44.0%",
      change: "+6.5%",
      trend: "up",
      note: "181 оформленный заказ",
    },
    {
      label: "Выручка с рекламы",
      value: "1 448 000 ₽",
      change: "+28.4%",
      trend: "up",
      note: "прямые продажи",
    },
    {
      label: "Окупаемость (ROMI)",
      value: "+898%",
      change: "+142%",
      trend: "up",
      note: "чистая рентабельность",
    },
  ],
  sections: [
    {
      heading: "1. Анализ аудиторий и каналов привлечения",
      paragraphs: [
        "Наиболее результативной группой таргетинга стала гиперлокальная выборка жителей районов в радиусе 3 км от точек сети. Стоимость привлечения гостя составила 310 ₽ при конверсии в повторный визит более 38%.",
        "Кампании в Telegram Ads обеспечили привлечение платёжеспособной деловой аудитории с чеком на 24% выше среднего по сети.",
      ],
      bullets: [
        "Гиперлокальный таргет (радиус 3 км): 220 заявок по 310 ₽ (CPL)",
        "Таргетинг по прямым конкурентам: 142 заявки по 380 ₽ (CPL)",
        "Ретаргетинг на базу постоянных гостей: 50 заявок по 410 ₽ (CPL)",
      ],
    },
    {
      heading: "2. Тестирование креативов и форматы объявлений",
      paragraphs: [
        "Короткие динамичные видеоролики с процессом обжарки кофейных зерен и сезонными десертами показали CTR 2.45% (в 2.2 раза выше статичных баннеров). Отключены 6 неэффективных баннеров, бюджет направлен в лидирующие видеосвязки.",
      ],
    },
  ],
  table: {
    title: "Детализация показателей по рекламным источникам",
    columns: ["Рекламный канал", "Бюджет", "Показы", "Клики", "Лиды", "CPL", "ROMI"],
    rows: [
      ["VK Реклама (Гео-таргет)", "85 000 ₽", "680 000", "9 200", "274", "310.22 ₽", "+940%"],
      ["Telegram Ads (Тематика)", "45 000 ₽", "320 000", "3 900", "98", "459.18 ₽", "+780%"],
      ["Ретаргетинг (Сайт/Сети)", "15 000 ₽", "120 000", "1 500", "40", "375.00 ₽", "+960%"],
      ["Итого / Среднее", "145 000 ₽", "1 120 000", "14 600", "412", "351.94 ₽", "+898%"],
    ],
  },
  recommendations: [
    "Масштабировать рекламный бюджет на 20% в октябре для удержания лидерства в локации.",
    "Запустить отдельную кампанию с предложением корпоративного кейтеринга и подарочных наборов.",
    "Внедрить автоматическую рассылку в чат-боте для повторных заказов со скидкой 10%.",
  ],
  conclusion:
    "Сентябрь показал рекордную отдачу от маркетинговых инвестиций. Все поставленные бизнес-цели выполнены с опережением графика, создана прочная база для роста выручки в 4 квартале.",
};

const DEMO_CONTENT_EN: ReportContent = {
  title: "Performance Advertising & Revenue Generation Report",
  subtitle: "Multi-channel advertising analysis for Paid Social & Search across September 2026",
  period: "September 1–30, 2026",
  summary:
    "Across September 2026, advertising campaigns surpassed the target lead volume by +17.7%, reducing the average Cost Per Lead (CPL) from projected $5.60 to $4.80. Direct customer revenue reached $19,800 on an ad spend of $2,100 (ROMI +842%). The synergy of hyperlocal geo-targeting and video storytelling delivered the highest customer acquisition efficiency.",
  metrics: [
    {
      label: "Ad Spend",
      value: "$2,100",
      change: "On budget",
      trend: "neutral",
      note: "100% utilized",
    },
    {
      label: "Acquired Leads",
      value: "412",
      change: "+17.7%",
      trend: "up",
      note: "target was 350",
    },
    {
      label: "Cost Per Lead (CPL)",
      value: "$4.80",
      change: "−14.3%",
      trend: "up",
      note: "target was $5.60",
    },
    {
      label: "Conversion Rate",
      value: "44.0%",
      change: "+6.5%",
      trend: "up",
      note: "181 paying customers",
    },
    {
      label: "Attributed Revenue",
      value: "$19,800",
      change: "+28.4%",
      trend: "up",
      note: "verified purchases",
    },
    {
      label: "Return on Ad Spend (ROMI)",
      value: "+842%",
      change: "+135%",
      trend: "up",
      note: "net campaign return",
    },
  ],
  sections: [
    {
      heading: "1. Audience Breakdown & Acquisition Channels",
      paragraphs: [
        "The highest-converting audience segment was the hyperlocal cluster within 3 miles of retail locations. Cost per acquisition averaged $4.20 with a repeat visit rate exceeding 38%.",
        "Paid Telegram and Social campaigns engaged high-intent business professionals with an average order value 24% higher than baseline.",
      ],
      bullets: [
        "Hyperlocal Radius Targeting: 220 leads at $4.20 CPL",
        "Direct Competitor Audience: 142 leads at $5.10 CPL",
        "Retargeting 30-day website visitors: 50 leads at $5.40 CPL",
      ],
    },
    {
      heading: "2. Creative Testing & Format Efficiency",
      paragraphs: [
        "Short-form dynamic video reels highlighting roasting craft and specialty menus produced a 2.45% CTR (2.2x higher than static banners). Six underperforming creatives were paused, allocating budget to winning video variants.",
      ],
    },
  ],
  table: {
    title: "Channel Performance Breakdown",
    columns: ["Ad Channel", "Budget", "Impressions", "Clicks", "Leads", "CPL", "ROMI"],
    rows: [
      ["Social Ads (Hyperlocal)", "$1,200", "680,000", "9,200", "274", "$4.38", "+880%"],
      ["Search & Messaging Ads", "$650", "320,000", "3,900", "98", "$6.63", "+760%"],
      ["Website Retargeting", "$250", "120,000", "1,500", "40", "$6.25", "+920%"],
      ["Total / Average", "$2,100", "1,120,000", "14,600", "412", "$4.80", "+842%"],
    ],
  },
  recommendations: [
    "Scale ad budget by 20% in October to solidify market presence in primary districts.",
    "Launch targeted campaign for corporate event bookings and seasonal packages.",
    "Deploy automated loyalty messaging to increase customer lifetime value.",
  ],
  conclusion:
    "September achieved stellar return on marketing investment. All quarterly objectives were met ahead of schedule, establishing strong operational momentum for Q4 revenue growth.",
};

function DemoPage() {
  const [lang, setLang] = useLanguage();
  const isEn = lang === "en";
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      await downloadPdf(reportRef.current, "Urban_Roast_Demo_Reportix.pdf", { watermark: false });
      toast.success(isEn ? "Demo PDF report downloaded successfully!" : "Демо-отчёт успешно скачан в формате PDF!");
    } catch {
      toast.error(isEn ? "Error downloading PDF" : "Ошибка при скачивании PDF");
    } finally {
      setDownloading(false);
    }
  };

  const content = isEn ? DEMO_CONTENT_EN : DEMO_CONTENT_RU;
  const clientTitle = isEn ? "Urban Roast Specialty Coffee" : "Сеть кофеен «Urban Roast»";
  const dateFormatted = isEn ? "September 30, 2026" : "30 сентября 2026 г.";

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Banner */}
      <div className="border-b border-emerald-500/30 bg-emerald-950/40 px-6 py-2.5 text-center text-xs text-emerald-300">
        <span className="font-semibold">⚡ {isEn ? "Interactive Demo:" : "Интерактивное демо Reportix:"}</span>{" "}
        {isEn
          ? "You are viewing a real live client report without registration. Download the vector PDF or build your own!"
          : "Вы просматриваете реальный отчёт без регистрации. Попробуйте скачать PDF или создать свой собственный отчёт!"}
      </div>

      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link to="/">
            <Logo size="sm" />
          </Link>

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

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
              className="border-zinc-800 bg-zinc-900/60 text-xs text-zinc-300 hover:text-white"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {downloading ? (isEn ? "Building PDF…" : "Генерация PDF…") : (isEn ? "Download PDF" : "Скачать этот PDF")}
            </Button>
            <Link to="/auth">
              <Button
                size="sm"
                className="bg-gradient-to-r from-zinc-100 via-white to-zinc-200 text-zinc-950 font-semibold shadow-[0_0_15px_rgba(255,255,255,0.25)] hover:from-white text-xs"
              >
                <Zap className="mr-1.5 h-3.5 w-3.5" /> {isEn ? "Create Your Report" : "Создать свой отчёт"}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900/90 via-zinc-900/50 to-zinc-950 p-5">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" /> {isEn ? "Live Client Sample" : "Демонстрационный образец"}
            </div>
            <h1 className="mt-2 text-xl font-bold text-white">
              {isEn ? "Sample Client Report Result" : "Пример готового отчёта для клиента"}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              {isEn
                ? "This is how finished documents look in Reportix. Clean typography, verified metrics, actionable conclusions, and data tables."
                : "Так выглядит результат работы Reportix. Аккуратная верстка, четкие метрики, выводы и таблица."}
            </p>
          </div>
          <Link to="/auth">
            <Button className="bg-white text-zinc-950 font-semibold hover:bg-zinc-200 text-xs">
              {isEn ? "Try Free Now" : "Попробовать бесплатно"} <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-card shadow-2xl shadow-black/80">
          <ReportView
            ref={reportRef}
            content={content}
            clientName={clientTitle}
            docType="ads"
            date={dateFormatted}
          />
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-8 text-center shadow-xl">
          <h2 className="text-2xl font-bold text-white">
            {isEn ? "Ready to Automate Client Reports?" : "Понравился результат?"}
          </h2>
          <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
            {isEn
              ? "Save up to 4 hours on every client report. Deliver professional, high-converting documents in 60 seconds."
              : "Экономьте до 4 часов на каждом клиентском отчёте. Создавайте профессиональные документы за 60 секунд."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-to-r from-zinc-100 via-white to-zinc-200 text-zinc-950 font-bold shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:from-white text-xs">
                {isEn ? "Sign Up in 30 Seconds" : "Зарегистрироваться за 30 секунд"} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="border-zinc-800 text-zinc-300 hover:text-white text-xs">
                {isEn ? "View Pricing Plans" : "Посмотреть тарифы"}
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
