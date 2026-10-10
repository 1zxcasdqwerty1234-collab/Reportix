import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Clock,
  Coins,
  FileCheck2,
  HelpCircle,
  Laptop,
  Sparkles,
  TrendingUp,
  UserCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage, UI_TEXT } from "@/lib/i18n";
import { Globe } from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "Как пользоваться Reportix — Экономия времени и руководство" },
      {
        name: "description",
        content: "Узнайте, как Reportix сокращает время на подготовку отчетов с 3 часов до 1 минуты и увеличивает конверсию коммерческих предложений.",
      },
      { property: "og:title", content: "Как пользоваться Reportix — Экономия времени" },
    ],
  }),
  component: GuidePage,
});

function GuidePage() {
  const [lang, setLang] = useLanguage();
  const [clientsCount, setClientsCount] = useState(8);
  const hourlyRate = 1500; // Average marketing specialist hourly rate in RUB

  const manualHoursPerMonth = clientsCount * 2.5;
  const reportixHoursPerMonth = Math.round((clientsCount * 2) / 60 * 10) / 10;
  const savedHours = Math.round((manualHoursPerMonth - reportixHoursPerMonth) * 10) / 10;
  const savedMoney = Math.round(savedHours * hourlyRate);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground pb-24">
      <div className="pointer-events-none absolute inset-0 bg-grid" />
      <div className="animate-glow pointer-events-none absolute -top-20 left-1/2 h-[450px] w-[650px] -translate-x-1/2 rounded-full bg-white/[0.08] blur-[120px]" />

      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
          <Link to="/">
            <Logo />
          </Link>
          <nav className="flex items-center gap-1.5">
            <Link
              to="/new"
              className="rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
            >
              Создать
            </Link>
            <Link
              to="/reports"
              className="rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
            >
              История
            </Link>
            <Link
              to="/pricing"
              className="rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
            >
              Тарифы
            </Link>
            <Link
              to="/guide"
              className="rounded-md px-3 py-1.5 text-sm text-white bg-zinc-800/90 border border-zinc-700/60 shadow-sm font-medium"
            >
              Как пользоваться
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "ru" : "en")}
              className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2 py-1 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white transition"
            >
              <Globe className="h-3 w-3 text-zinc-400" />
              <span className={lang !== "en" ? "text-white font-bold" : "text-zinc-500"}>RU</span>
              <span className="text-zinc-600">/</span>
              <span className={lang === "en" ? "text-white font-bold" : "text-zinc-500"}>EN</span>
            </button>
            <Link to="/pricing">
              <Button size="sm" className="bg-gradient-to-r from-zinc-100 via-white to-zinc-200 text-zinc-950 font-semibold shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:from-white hover:to-zinc-100 text-xs">
                {lang === "en" ? "View Pricing" : "Выбрать тариф"}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-6 pt-12">
        {/* Hero Section */}
        <div className="text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700/60 bg-zinc-900/80 px-3.5 py-1 text-xs text-zinc-300 backdrop-blur">
            <Clock className="h-3.5 w-3.5 text-emerald-400" />
            Сокращение рутины с 3 часов до 60 секунд
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl text-white">
            Как Reportix <span className="text-shimmer">экономит дни работы</span> и умножает прибыль
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-400 leading-relaxed">
            Перестаньте тратить выходные и вечера на сведение таблиц, скриншоты кабинетов и вёрстку отчётов. Сфокусируйтесь на стратегических задачах и ведите больше клиентов без выгорания.
          </p>
        </div>

        {/* Interactive Savings Calculator */}
        <div className="animate-fade-up mt-14 overflow-hidden rounded-2xl border border-zinc-700/80 bg-gradient-to-b from-zinc-800/80 via-zinc-900/90 to-zinc-950 p-8 shadow-2xl shadow-black/80 backdrop-blur">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800 pb-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-300">
                <Calculator className="h-4 w-4 text-amber-400" /> Интерактивный калькулятор экономии
              </div>
              <h2 className="mt-1 text-2xl font-bold text-white">Сколько времени и денег вы сохраните?</h2>
            </div>
            <div className="flex items-center gap-3 bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-2">
              <span className="text-xs text-zinc-400">Клиентов на ведении:</span>
              <span className="text-xl font-extrabold text-white font-mono">{clientsCount}</span>
            </div>
          </div>

          <div className="mt-8">
            <label className="text-sm font-medium text-zinc-300 flex justify-between">
              <span>Передвиньте ползунок, чтобы указать количество ваших клиентов:</span>
              <span className="font-bold text-white">{clientsCount} проектов</span>
            </label>
            <input
              type="range"
              min="1"
              max="30"
              value={clientsCount}
              onChange={(e) => setClientsCount(Number(e.target.value))}
              className="mt-3 w-full h-2.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          {/* Results Grid */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="text-xs text-zinc-400 uppercase font-semibold">Без Reportix (вручную)</div>
              <div className="mt-2 text-2xl font-bold text-rose-400 font-mono">~{manualHoursPerMonth} ч / мес</div>
              <div className="mt-1 text-xs text-zinc-500">Рутина в таблицах и редакторах</div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="text-xs text-zinc-400 uppercase font-semibold">С сервисом Reportix</div>
              <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono">{reportixHoursPerMonth} ч / мес</div>
              <div className="mt-1 text-xs text-zinc-500">Меньше минуты на один отчёт</div>
            </div>

            <div className="rounded-xl border border-white/20 bg-gradient-to-b from-zinc-700/60 to-zinc-900/90 p-5 shadow-lg">
              <div className="text-xs text-zinc-300 uppercase font-bold flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-amber-400" /> Чистая выгода в месяц
              </div>
              <div className="mt-2 text-2xl font-extrabold text-white font-mono">
                +{savedHours} ч ({savedMoney.toLocaleString("ru-RU")} ₽)
              </div>
              <div className="mt-1 text-xs text-emerald-400 font-medium">Окупаемость тарифа от 800%</div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800/80">
            <p className="text-xs text-zinc-400">
              Вы сэкономите <strong className="text-white">{savedHours} часов</strong> каждый месяц — это более двух полноценных рабочих дней, которые можно инвестировать в привлечение новых заказчиков.
            </p>
            <Link to="/pricing" className="shrink-0 w-full sm:w-auto">
              <Button size="sm" className="w-full sm:w-auto bg-gradient-to-r from-zinc-100 via-white to-zinc-300 text-zinc-950 font-bold hover:from-white hover:to-zinc-200">
                Зафиксировать выгоду на тарифе <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* 3 Steps Guide */}
        <div className="mt-20">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white">Как начать работу: 3 простых шага</h2>
            <p className="mt-2 text-sm text-zinc-400">Всё настолько интуитивно, что первый отчёт будет готов уже через 2 минуты</p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-card p-6 relative">
              <div className="font-mono text-3xl font-black text-zinc-700">01</div>
              <h3 className="mt-3 text-lg font-bold text-white">Выберите нужный формат</h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Доступны 10 типов документов: от SMM-отчёта и рекламы (Директ / VK) до коммерческих предложений и актов выполненных работ. Готовые шаблоны уже загружены в систему.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-card p-6 relative">
              <div className="font-mono text-3xl font-black text-zinc-700">02</div>
              <h3 className="mt-3 text-lg font-bold text-white">Вставьте сырые цифры</h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Скопируйте статистику из рекламных кабинетов, Яндекс Метрики или CRM в любом формате. Алгоритм Reportix сам распознает ключевые показатели, динамику и тренды.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-card p-6 relative">
              <div className="font-mono text-3xl font-black text-zinc-700">03</div>
              <h3 className="mt-3 text-lg font-bold text-white">Скачайте представительский PDF</h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Нажмите «Сгенерировать» — и за считанные секунды получите документ с наглядными KPI-блоками, таблицами, рекомендациями и выводами, готовый к отправке клиенту.
              </p>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mt-24">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Сравнение: как делают обычно vs Reportix</h2>
            <p className="mt-1 text-xs text-zinc-400">Почему агентства и специалисты переходят на Reportix</p>
          </div>

          <div className="mt-8 overflow-hidden rounded-xl border border-zinc-800 bg-card">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-400 font-semibold uppercase">
                <tr>
                  <th className="p-4">Критерий</th>
                  <th className="p-4 text-rose-400">Обычный ручной подход</th>
                  <th className="p-4 text-emerald-400">С сервисом Reportix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                <tr>
                  <td className="p-4 font-semibold text-white">Время на 1 документ</td>
                  <td className="p-4 text-zinc-400">2–3 часа мучений</td>
                  <td className="p-4 font-bold text-emerald-400">Менее 60 секунд</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Внешний вид и солидность</td>
                  <td className="p-4 text-zinc-400">Скриншоты и сухие таблицы в чатах</td>
                  <td className="p-4 text-emerald-400">Премиальный PDF с KPI-карточками</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Расчет динамики и трендов</td>
                  <td className="p-4 text-zinc-400">Вручную на калькуляторе</td>
                  <td className="p-4 text-emerald-400">Автоматически с определением тренда</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Удержание клиентов (Retention)</td>
                  <td className="p-4 text-zinc-400">Клиент не видит ценности и уходит</td>
                  <td className="p-4 text-emerald-400">Клиент видит прозрачный результат и продлевает контракт</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Коммерческие предложения</td>
                  <td className="p-4 text-zinc-400">Готовятся 2–3 дня, клиент остывает</td>
                  <td className="p-4 text-emerald-400">Отправляются в день звонка за 5 минут</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Why Clients Love It */}
        <div className="mt-20 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" /> Как отчёты Reportix защищают ваш бюджет перед клиентом
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs text-zinc-300 leading-relaxed">
            <div className="rounded-xl border border-zinc-800/80 bg-card p-4">
              <div className="font-bold text-white text-sm">Фокус на бизнес-результате, а не на «кликах»</div>
              <p className="mt-1 text-zinc-400">
                Заказчику не интересны технические термины. Ему важны охваты, заявки, конверсии и выручка. Крупные карточки показателей моментально дают ответ: «Маркетинг работает и приносит деньги».
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800/80 bg-card p-4">
              <div className="font-bold text-white text-sm">Конкретные рекомендации повышают экспертность</div>
              <p className="mt-1 text-zinc-400">
                Каждый документ содержит раздел практических рекомендаций и шагов на следующий период. Клиент видит план действий и продолжает сотрудничество без сомнений.
              </p>
            </div>
          </div>
        </div>

        {/* Final Conversion Call To Action */}
        <div className="mt-20 rounded-2xl border border-white/20 bg-gradient-to-r from-zinc-800 via-zinc-900 to-black p-10 text-center shadow-2xl">
          <h2 className="text-3xl font-extrabold text-white">Готовы автоматизировать отчётность уже сегодня?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-300">
            Подключите подходящий тариф и забудьте о рутинной вёрстке. Тариф «Агентство» включает полный White-Label и командный доступ для быстрого масштабирования.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/pricing">
              <Button size="lg" className="bg-gradient-to-r from-zinc-100 via-white to-zinc-300 text-zinc-950 font-bold shadow-[0_0_25px_rgba(255,255,255,0.35)] hover:from-white hover:to-zinc-200">
                Выбрать тариф <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/new">
              <Button size="lg" variant="outline" className="border-zinc-700 bg-zinc-900/80 text-white hover:bg-zinc-800">
                Создать первый отчёт бесплатно
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
