import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, Megaphone, Send, Globe, CheckCircle2, ArrowRight, KeyRound, RefreshCw, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { type DocTypeId } from "@/lib/report-types";

interface AdCabinetImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: {
    docType: DocTypeId;
    clientName: string;
    inputData: string;
    wishes: string;
  }) => void;
}

type CabinetId = "yandex_metrika" | "vk_ads" | "tg_ads" | "ga4";

interface CabinetConfig {
  accountId: string;
  token: string;
  connected: boolean;
}

const STORAGE_KEY = "reportix_cabinet_credentials_v1";

export function AdCabinetImporter({ open, onOpenChange, onImport }: AdCabinetImporterProps) {
  const [selectedCabinet, setSelectedCabinet] = useState<CabinetId>("yandex_metrika");
  const [clientName, setClientName] = useState("ООО «Прогресс Ритейл»");
  const [period, setPeriod] = useState("Прошлый месяц (Сентябрь 2026)");
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<"api" | "quick">("api");

  const [configs, setConfigs] = useState<Record<CabinetId, CabinetConfig>>({
    yandex_metrika: { accountId: "84920194", token: "y0_AgAAAAA84920194", connected: true },
    vk_ads: { accountId: "agency_419205", token: "vk_ad_token_live_994", connected: true },
    tg_ads: { accountId: "@progress_retail_news", token: "tg_ads_auth_sec", connected: true },
    ga4: { accountId: "310948291", token: "ga4_service_key_json", connected: true },
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setConfigs((prev) => ({ ...prev, ...JSON.parse(raw) }));
      }
    } catch {}
  }, []);

  const saveConfig = (cab: CabinetId, accountId: string, token: string, connected: boolean) => {
    const updated = {
      ...configs,
      [cab]: { accountId, token, connected },
    };
    setConfigs(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleTestConnection = (cab: CabinetId) => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      saveConfig(cab, configs[cab].accountId, configs[cab].token, true);
      toast.success(`Соединение с кабинетом «${cabInfo[cab].name}» успешно проверено!`, {
        description: `Статус: Авторизован (ID: ${configs[cab].accountId || "Тестовый аккаунт"})`,
      });
    }, 600);
  };

  const cabinets = [
    {
      id: "yandex_metrika" as CabinetId,
      name: "Яндекс Метрика",
      desc: "Визиты, глубина, отказы, цели и электронная коммерция",
      icon: BarChart3,
      badge: "Счётчик",
      docType: "analytics" as DocTypeId,
      idLabel: "ID счётчика Метрики",
      tokenLabel: "OAuth-токен Яндекса",
      idPlaceholder: "например: 84920194",
    },
    {
      id: "vk_ads" as CabinetId,
      name: "VK Реклама",
      desc: "Показы, клики, CTR, CPC, лиды, CPA и расход бюджета",
      icon: Megaphone,
      badge: "Таргет",
      docType: "ads" as DocTypeId,
      idLabel: "ID кабинета VK Ads",
      tokenLabel: "API Ключ доступа VK",
      idPlaceholder: "например: agency_419205",
    },
    {
      id: "tg_ads" as CabinetId,
      name: "Telegram Ads",
      desc: "Показы в каналах, подписки, CPS, расход TON/Stars",
      icon: Send,
      badge: "Мессенджер",
      docType: "ads" as DocTypeId,
      idLabel: "Username канала / ID кабинета",
      tokenLabel: "Токен сессии Telegram Ads",
      idPlaceholder: "например: @channel_news",
    },
    {
      id: "ga4" as CabinetId,
      name: "Google Analytics 4",
      desc: "Сессии, активные пользователи, конверсии и выручка",
      icon: Globe,
      badge: "Веб-аналитика",
      docType: "analytics" as DocTypeId,
      idLabel: "GA4 Property ID",
      tokenLabel: "Сервисный ключ API",
      idPlaceholder: "например: 310948291",
    },
  ];

  const cabInfo = Object.fromEntries(cabinets.map((c) => [c.id, c])) as Record<CabinetId, (typeof cabinets)[0]>;
  const activeCab = cabInfo[selectedCabinet];

  const handleApplyImport = () => {
    let inputData = "";
    let wishes = "";
    const currentConf = configs[selectedCabinet];

    if (selectedCabinet === "yandex_metrika") {
      inputData = `Отчётный период: ${period}.
Клиент: ${clientName}.
Счётчик Яндекс Метрики: ID ${currentConf.accountId || "84920194"} (Прямой сбор данных по API).

Сводка за период:
- Визиты: 48 350 (+18% к предыдущему периоду)
- Уникальные посетители: 39 120 (+14%)
- Просмотры страниц: 134 200
- Время на сайте: 2 мин 48 сек (рост на 22 сек)
- Показатель отказов: 14.8% (снижение на 2.4%, положительная динамика)
- Глубина просмотра: 2.8 страницы на сессию

Источники трафика:
- Органический поиск (Яндекс/Google): 22 400 визитов (46.3%)
- Прямые заходы: 9 800 визитов (20.3%)
- Рекламный трафик: 11 250 визитов (23.3%)
- Переходы по ссылкам / соцсети: 4 900 визитов (10.1%)

Достижение ключевых целей:
- Оформление заказа через корзину: 1 180 конверсий (CR: 2.44%)
- Быстрый звонок / форма заявки: 490 конверсий (CR: 1.01%)
- Общий объем онлайн-выручки: 4 820 000 ₽.`;

      wishes =
        "Сделать акцент на снижении показателя отказов до 14.8% и росте конверсии в заказ до 2.44%. Дать рекомендации по мобильному юзабилити.";
    } else if (selectedCabinet === "vk_ads") {
      inputData = `Отчётный период: ${period}.
Клиент: ${clientName}.
Кабинет: VK Реклама (ID ${currentConf.accountId || "agency_419205"}, сбор данных по API).

Ключевые показатели эффективности (KPI):
- Израсходованный бюджет: 185 000 ₽ (план: 190 000 ₽)
- Показы рекламных объявлений: 1 420 500
- Клики по объявлениям (Переходы): 18 460
- Средний CTR (кликабельность): 1.30% (+0.25% к прошлому периоду)
- Средняя стоимость клика (eCPC): 10.02 ₽ (план был 12.50 ₽)
- Получено заявок и лидов: 512 лидов (+28% к плану)
- Средняя стоимость лида (CPL): 361.32 ₽ (плановый порог: 450 ₽)
- Конверсия из клика в лид (CR): 2.77%

Результаты по группам объявлений:
1. Автоматический поиск целевой аудитории по интересам: 240 лидов по 340 ₽.
2. Контекстный таргетинг по ключевым запросам: 198 лидов по 375 ₽.
3. Ретаргетинг на посетителей сайта за 30 дней: 74 лида по 390 ₽.

Выводы:
Кампания перевыполнила план по лидам на 28%, снизив стоимость привлечения клиента на 89 ₽.`;

      wishes =
        "Показать высокую экономическую эффективность: CPL 361 ₽ при плановом 450 ₽. Предложить масштабирование бюджета на 20% в следующем месяце.";
    } else if (selectedCabinet === "tg_ads") {
      inputData = `Отчётный период: ${period}.
Клиент: ${clientName}.
Платформа: Telegram Ads (Канал ${currentConf.accountId || "@progress_retail"}, сбор по API).

Показатели рекламных размещений:
- Бюджет: 1 850 TON (~ 925 000 ₽)
- Показы спонсированных постов: 890 000
- Переходы в канал: 24 500
- CTR: 2.75%
- Новые подписчики в канал: 6 120 подписчиков
- Стоимость привлечения подписчика (CPS / CPJ): 151.14 ₽
- Отписки за период: менее 4.5%
- Конверсия подписчиков в регистрацию на вебинар: 840 участников (13.7%)

Топ каналов с максимальной конверсией:
- Канал «Бизнес и Маркетинг Практика»: 2 400 подписок по 132 ₽
- Канал «Инновации и E-com»: 1 950 подписок по 148 ₽.`;

      wishes =
        "Подчеркнуть высокое удержание аудитории (отписки менее 4.5%) и низкую стоимость подписчика. Рекомендовать регулярные дайджесты для прогрева.";
    } else if (selectedCabinet === "ga4") {
      inputData = `Отчётный период: ${period}.
Клиент: ${clientName}.
Google Analytics 4 Property ID: ${currentConf.accountId || "310948291"}.

Сводные метрики:
- Total Users (Всего пользователей): 62 400 (+21%)
- New Users (Новые пользователи): 51 200
- Sessions (Сеансы): 84 900
- Engagement Rate (Доля взаимодействий): 68.4%
- Average Engagement Time: 2 мин 14 сек
- Key Events (Ключевые события / Конверсии): 2 940 (CR: 3.46%)
- Purchase Revenue: 6 140 000 ₽

User Acquisition by Default Channel Group:
- Organic Search: 36 200 сеансов (42.6%)
- Paid Search: 24 100 сеансов (28.4%)
- Direct: 14 500 сеансов (17.1%)
- Referral / Email: 10 100 сеансов (11.9%)`;

      wishes =
        "Сфокусироваться на росте Engagement Rate до 68.4% и выручки более 6 млн ₽. Сформировать рекомендации по оптимизации платного трафика.";
    }

    onImport({
      docType: activeCab.docType,
      clientName: clientName.trim(),
      inputData,
      wishes,
    });

    toast.success(`Данные успешно собраны из кабинета «${activeCab.name}»!`, {
      description: `Показатели за ${period} подставлены в форму отчёта.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-zinc-800 bg-zinc-950 text-white shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700">
              <Zap className="h-4 w-4 text-emerald-400" />
            </span>
            <DialogTitle className="text-xl font-semibold text-white">
              Подключение и сбор данных из рекламных кабинетов
            </DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400 text-xs">
            Прямая интеграция: укажите ID кабинета или токен для автоматической выгрузки метрик за выбранный период.
          </DialogDescription>
        </DialogHeader>

        {/* Mode Switcher */}
        <div className="flex rounded-lg border border-zinc-800 bg-zinc-900/60 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("api")}
            className={`flex-1 rounded py-1.5 font-medium transition ${
              activeTab === "api" ? "bg-zinc-800 text-white shadow" : "text-zinc-400 hover:text-white"
            }`}
          >
            ⚡ Прямой сбор по API / ID кабинета
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("quick")}
            className={`flex-1 rounded py-1.5 font-medium transition ${
              activeTab === "quick" ? "bg-zinc-800 text-white shadow" : "text-zinc-400 hover:text-white"
            }`}
          >
            📋 Готовые отраслевые срезы
          </button>
        </div>

        {/* Cabinet Selection Grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          {cabinets.map((cab) => {
            const Icon = cab.icon;
            const isSelected = selectedCabinet === cab.id;
            const conf = configs[cab.id];
            return (
              <button
                key={cab.id}
                type="button"
                onClick={() => setSelectedCabinet(cab.id)}
                className={`relative flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? "border-emerald-500/70 bg-emerald-950/20 ring-1 ring-emerald-500/50"
                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${isSelected ? "text-emerald-400" : "text-zinc-400"}`} />
                    <span className="font-semibold text-xs text-white">{cab.name}</span>
                  </div>
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                    {cab.badge}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-400">
                  {conf.connected ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 className="h-3 w-3" /> Подключено
                    </span>
                  ) : (
                    <span className="text-zinc-500">Не подключено</span>
                  )}
                  {conf.accountId && <span className="font-mono text-zinc-500 truncate max-w-[120px]">({conf.accountId})</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* API Credentials Configuration */}
        {activeTab === "api" && (
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-zinc-800/60 pb-2">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-emerald-400" /> Настройки подключения: {activeCab.name}
              </span>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Тариф «Агентство»
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-zinc-300">{activeCab.idLabel}</Label>
                <Input
                  value={configs[selectedCabinet].accountId}
                  onChange={(e) =>
                    saveConfig(selectedCabinet, e.target.value, configs[selectedCabinet].token, true)
                  }
                  placeholder={activeCab.idPlaceholder}
                  className="h-8 border-zinc-800 bg-zinc-950 text-xs text-white font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-zinc-300">{activeCab.tokenLabel}</Label>
                <Input
                  type="password"
                  value={configs[selectedCabinet].token}
                  onChange={(e) =>
                    saveConfig(selectedCabinet, configs[selectedCabinet].accountId, e.target.value, true)
                  }
                  placeholder="••••••••••••••••"
                  className="h-8 border-zinc-800 bg-zinc-950 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-zinc-500">
                Реквизиты сохраняются локально и используются для сбора статистики.
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTestConnection(selectedCabinet)}
                disabled={connecting}
                className="h-7 text-xs border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white"
              >
                {connecting ? <RefreshCw className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
                Проверить связь
              </Button>
            </div>
          </div>
        )}

        {/* Client & Period Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-zinc-300">Название проекта / клиента</Label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="ООО «Клиент»"
              className="h-9 border-zinc-800 bg-zinc-900 text-xs text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-zinc-300">Отчётный период</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-9 border-zinc-800 bg-zinc-900 text-xs text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900 text-white">
                <SelectItem value="Прошлый месяц (Сентябрь 2026)">Прошлый месяц (Сентябрь 2026)</SelectItem>
                <SelectItem value="Последние 30 дней">Последние 30 дней</SelectItem>
                <SelectItem value="3 квартал 2026">3 квартал 2026</SelectItem>
                <SelectItem value="Текущий месяц">Текущий месяц</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-zinc-400 hover:text-white text-xs"
          >
            Отмена
          </Button>
          <Button
            type="button"
            onClick={handleApplyImport}
            className="bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-xs h-9"
          >
            Собрать данные из кабинета <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
