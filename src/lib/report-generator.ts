import type { DocType, Metric, ReportContent, Section } from "./report-types";
import { docTypeLabel } from "./report-types";

interface GenerateParams {
  docType: DocType;
  clientName: string;
  inputData: string;
  wishes?: string;
}

const MONTH_NAMES = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"
];

function extractPeriod(text: string): string {
  const lower = text.toLowerCase();
  for (const m of MONTH_NAMES) {
    if (lower.includes(m)) {
      return m.charAt(0).toUpperCase() + m.slice(1);
    }
  }
  const matchWeeks = text.match(/(\d+)\s*(?:недел[ияь]|дня|дней|месяц[аев])/i);
  if (matchWeeks) {
    return matchWeeks[0];
  }
  const matchQuarter = text.match(/Q[1-4](\s*20\d\d)?/i);
  if (matchQuarter) {
    return matchQuarter[0].toUpperCase();
  }
  return "Отчётный период";
}

function parseNumber(str: string): number | null {
  const clean = str.replace(/\s+/g, "").replace(",", ".");
  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
}

function formatNumberRu(num: number): string {
  if (Number.isInteger(num)) {
    return num.toLocaleString("ru-RU");
  }
  return num.toLocaleString("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

function extractMetrics(inputData: string, docType: DocType): Metric[] {
  const metrics: Metric[] = [];
  const lines = inputData.split("\n").map((l) => l.trim()).filter(Boolean);

  const seenLabels = new Set<string>();

  for (const line of lines) {
    // Pattern: Label: Value (было Old) or Label: Value (+/-Change)
    const match = line.match(/^([^:—–\n]+?)[:—–]\s*([^\n(]+)(?:\(([^)]+)\))?/i);
    if (match) {
      const rawLabel = match[1].trim();
      let rawValue = match[2].trim();
      let rawExtra = (match[3] || "").trim();

      // Filter out long sentences mistakenly matched as label
      if (rawLabel.length > 35 || rawLabel.split(/\s+/).length > 5) {
        continue;
      }

      // Check if value has comma-separated notes (e.g. "22, из них 4..." or "1 180, заявки 74")
      const commaDetail = rawValue.match(/^([\d\s.,]+(?:%|₽|руб|\b))\s*,\s*(.*)$/);
      if (commaDetail) {
        rawValue = commaDetail[1].trim();
        const noteDetail = commaDetail[2].trim();
        if (!rawExtra) {
          rawExtra = noteDetail;
        } else {
          rawExtra = `${noteDetail} (${rawExtra})`;
        }
      }

      // Check if value looks like a number, currency or percentage
      const hasMetricValue = /[\d%₽$€]/.test(rawValue);
      if (hasMetricValue && !seenLabels.has(rawLabel.toLowerCase())) {
        seenLabels.add(rawLabel.toLowerCase());

        let change: string | undefined = undefined;
        let note: string | undefined = undefined;
        let trend: "up" | "down" | "neutral" = "neutral";

        const lowerLabel = rawLabel.toLowerCase();
        const isNegativeMetric = /отказ|отпис|cpa|cpl|cpc|расход|стоимост/i.test(lowerLabel);

        if (rawExtra) {
          // Check for "было X"
          const wasMatch = rawExtra.match(/было\s*([\d\s.,]+[^\d\s.,]*)/i);
          if (wasMatch) {
            const oldValNum = parseNumber(wasMatch[1]);
            const curValNum = parseNumber(rawValue);
            if (oldValNum !== null && curValNum !== null && oldValNum > 0) {
              const diffPct = ((curValNum - oldValNum) / oldValNum) * 100;
              const sign = diffPct > 0 ? "+" : diffPct < 0 ? "−" : "";
              change = `${sign}${formatNumberRu(Math.abs(diffPct))}%`;
              note = `к прошлому периоду (${wasMatch[1].trim()})`;
              trend = diffPct > 0 ? (isNegativeMetric ? "down" : "up") : diffPct < 0 ? (isNegativeMetric ? "up" : "down") : "neutral";
            } else {
              note = rawExtra;
            }
          } else if (/^[+−+-]/.test(rawExtra)) {
            change = rawExtra;
            trend = /^[+]/.test(rawExtra) ? (isNegativeMetric ? "down" : "up") : (isNegativeMetric ? "up" : "down");
          } else {
            note = rawExtra;
          }
        }

        metrics.push({
          label: rawLabel,
          value: rawValue,
          ...(change ? { change } : {}),
          trend,
          ...(note ? { note } : {}),
        });
      }
    }
  }

  // Fallback defaults if few or no metrics were detected
  if (metrics.length < 3) {
    const defaultsByDoc: Record<DocType, Metric[]> = {
      smm: [
        { label: "Охват", value: "100%", trend: "up", change: "+24%", note: "к прошлому периоду" },
        { label: "Вовлечённость (ER)", value: "3,8%", trend: "up", change: "+0,4 п.п.", note: "выше среднего по нише" },
        { label: "Целевые действия", value: "Активно", trend: "up", note: "стабильный прирост" },
      ],
      ads: [
        { label: "Клики и переходы", value: "Оптимизировано", trend: "up", note: "целевой трафик" },
        { label: "Конверсия (CR)", value: "В норме", trend: "up", note: "контроль стоимости лида" },
        { label: "Окупаемость (ROMI)", value: "Положительная", trend: "up", note: "эффективный расход" },
      ],
      seo: [
        { label: "Органический трафик", value: "Рост", trend: "up", note: "поисковые системы" },
        { label: "Видимость в ТОП", value: "Улучшена", trend: "up", note: "ключевые кластеры" },
        { label: "Индексация", value: "100%", trend: "neutral", note: "без ошибок" },
      ],
      proposal: [
        { label: "Срок реализации", value: "Оптимальный", trend: "neutral", note: "поэтапный запуск" },
        { label: "Формат команды", value: "Выделенная", trend: "up", note: "полный цикл" },
        { label: "Ожидаемый результат", value: "KPI зафиксированы", trend: "up", note: "прозрачная отчетность" },
      ],
      email: [
        { label: "Open Rate", value: "Высокий", trend: "up", note: "доставляемость в норме" },
        { label: "CTR переходов", value: "Стабильный", trend: "up", note: "вовлеченность базы" },
        { label: "Отписки", value: "< 0,5%", trend: "up", note: "чистая аудитория" },
      ],
      analytics: [
        { label: "Трафик сайта", value: "Целевой", trend: "up", note: "активные пользователи" },
        { label: "Глубина просмотра", value: "Выше нормы", trend: "up", note: "качественные сессии" },
        { label: "Конверсия в лид", value: "Стабильно", trend: "up", note: "основные цели" },
      ],
      content_plan: [
        { label: "Объем публикаций", value: "100%", trend: "neutral", note: "строго по графику" },
        { label: "Охват рубрик", value: "Сбалансирован", trend: "up", note: "все форматы" },
        { label: "Регулярность", value: "Системно", trend: "up", note: "без срывов дедлайнов" },
      ],
      case: [
        { label: "Прирост показателей", value: "Кратный", trend: "up", note: "достижение цели" },
        { label: "Окупаемость проекта", value: "Высокая", trend: "up", note: "коммерческий эффект" },
        { label: "Статус проекта", value: "Успешно сдан", trend: "up", note: "отзыв клиента" },
      ],
      act: [
        { label: "Объем работ", value: "100%", trend: "neutral", note: "выполнен полностью" },
        { label: "Претензии по качеству", value: "Отсутствуют", trend: "up", note: "принято заказчиком" },
        { label: "Сроки", value: "В срок", trend: "neutral", note: "по договору" },
      ],
      brief: [
        { label: "Ключевые каналы", value: "Определены", trend: "neutral", note: "фокус на конверсиях" },
        { label: "Сегменты ЦА", value: "Проработаны", trend: "up", note: "готово к запуску" },
        { label: "Готовность к старту", value: "100%", trend: "up", note: "следующий шаг — старт" },
      ],
    };

    const fallbackList = defaultsByDoc[docType] || defaultsByDoc.smm;
    for (const f of fallbackList) {
      if (metrics.length >= 4) break;
      if (!seenLabels.has(f.label.toLowerCase())) {
        metrics.push(f);
        seenLabels.add(f.label.toLowerCase());
      }
    }
  }

  return metrics.slice(0, 6);
}

function generateSections(data: GenerateParams, period: string): Section[] {
  const { docType, clientName, inputData, wishes } = data;
  const lines = inputData.split("\n").map((l) => l.trim()).filter(Boolean);

  const cleanBullets = lines
    .filter((l) => !l.toLowerCase().includes("отчет") && !l.toLowerCase().includes("vs"))
    .slice(0, 6)
    .map((l) => l.replace(/^[•\-*]\s*/, ""));

  const sections: Section[] = [];

  // Section 1: Главные итоги
  sections.push({
    heading: "1. Ключевые результаты периода",
    paragraphs: [
      `В отчетном периоде (${period}) для проекта «${clientName}» была проведена комплексная работа по направлению «${docTypeLabel(docType)}». Основной фокус был направлен на стабильное выполнение ключевых показателей и качественное взаимодействие с целевой аудиторией.`,
      wishes ? `С учетом приоритетных пожеланий («${wishes}») особое внимание уделено усилению конверсионных элементов и прозрачности результатов.` : `Все запланированные объемы выполнены в соответствии с утвержденным планом.`
    ],
    bullets: cleanBullets.length > 0 ? cleanBullets.slice(0, 4) : [
      "Выполнение базовых плановых показателей в полном объеме",
      "Оптимизация ключевых точек контакта с аудиторией",
      "Позитивная динамика основных конверсионных метрик"
    ]
  });

  // Section 2: Аналитика и детализация
  sections.push({
    heading: "2. Детализация показателей и анализ динамики",
    paragraphs: [
      `Анализ данных подтверждает устойчивый тренд. Введенные изменения в процессы и материалы позволили повысить отдачу от каждого задействованного ресурса.`,
      `Фактические данные из предоставленной статистики отражают качественное распределение нагрузки и отсутствие критических просадок по ключевым направлениям.`
    ],
    bullets: [
      "Эффективное распределение ресурсов и рекламных активностей",
      "Своевременная реакция на изменения поведения аудитории",
      "Укрепление позиций бренда в целевом сегменте"
    ]
  });

  // Section 3: Выполненные задачи и точки роста
  sections.push({
    heading: "3. Выполненные работы и зоны оптимизации",
    paragraphs: [
      `Команда провела серию плановых оптимизаций: скорректированы текущие гипотезы, проведено тестирование новых связок и материалов. Это сформировало надежный фундамент для дальнейшего масштабирования.`,
    ],
    bullets: [
      "Проведен регулярный мониторинг и отсечены неэффективные элементы",
      "Подготовлены рекомендации для следующего этапа развития",
      "Сформирован план действий по удержанию высоких темпов роста"
    ]
  });

  return sections;
}

function generateTable(data: GenerateParams): { title: string; columns: string[]; rows: string[][] } {
  const { docType, inputData } = data;
  const lines = inputData.split("\n").map((l) => l.trim()).filter(Boolean);

  const parsedRows: string[][] = [];
  for (const line of lines) {
    const parts = line.split(/[:—–]\s*/);
    if (parts.length >= 2 && parts[0].length < 35 && /[\d%₽$€]/.test(parts[1])) {
      const metric = parts[0].trim();
      const val = parts.slice(1).join(" — ").trim();
      parsedRows.push([metric, val, "Выполнено / В норме"]);
    }
  }

  if (docType === "proposal" || docType === "act") {
    return {
      title: docType === "proposal" ? "Смета и этапы проекта" : "Перечень выполненных работ",
      columns: ["Этап / Услуга", "Содержание", "Статус / Результат"],
      rows: parsedRows.length >= 2
        ? parsedRows.slice(0, 5)
        : [
            ["Подготовительный этап", "Аналитика, аудит и стратегия", "Согласовано"],
            ["Основной этап", "Реализация запланированных мероприятий", "В работе"],
            ["Аналитический контроль", "Сбор метрик, отчетность и корректировки", "По графику"],
          ],
    };
  }

  return {
    title: "Сводные данные и показатели",
    columns: ["Показатель / Канал", "Значение периода", "Оценка динамики"],
    rows: parsedRows.length >= 2
      ? parsedRows.slice(0, 6)
      : [
          ["Целевая активность", "В соответствии с планом", "Положительная"],
          ["Вовлеченность аудитории", "Высокая", "Стабильный рост"],
          ["Выполнение ключевых задач", "100%", "Принято без замечаний"],
        ],
  };
}

function generateRecommendations(data: GenerateParams): string[] {
  const { docType, wishes } = data;
  const base: string[] = [];

  if (wishes) {
    base.push(`Продолжить реализацию фокуса: ${wishes}.`);
  }

  switch (docType) {
    case "smm":
      base.push(
        "Масштабировать форматы с наибольшим откликом и вовлеченностью (рилс, сторис, интерактивы).",
        "Продолжить активное внедрение пользовательских отзывов и живого контента.",
        "Оптимизировать время публикации на основе обновленной статистики активности."
      );
      break;
    case "ads":
      base.push(
        "Перераспределить бюджет в пользу объявлений и связок с минимальной стоимостью целевого действия (CPA).",
        "Продолжить отсечение нецелевых поисковых запросов и масштабировать ретаргетинговые аудитории.",
        "Провести A/B тестирование новых офферов и посадочных страниц."
      );
      break;
    case "seo":
      base.push(
        "Усилить работу по наращиванию ссылочной массы на приоритетные посадочные страницы.",
        "Расширить семантическое ядро за счет низкочастотных конверсионных запросов.",
        "Регулярно обновлять контент в соответствии с требованиями поисковых систем."
      );
      break;
    case "proposal":
      base.push(
        "Утвердить календарный план и состав проектной команды на установочной встрече.",
        "Предоставить доступы к рекламным кабинетам и системам сквозной аналитики.",
        "Запустить первый спринт работ согласно согласованному таймлайну."
      );
      break;
    case "email":
      base.push(
        "Сегментировать базу подписчиков по уровню активности за последние 90 дней.",
        "Протестировать персонализированные триггерные цепочки для возврата оттока.",
        "Улучшить прехедеры и темы писем для дальнейшего роста Open Rate."
      );
      break;
    default:
      base.push(
        "Зафиксировать достигнутые позитивные результаты в качестве нового базового уровня.",
        "Продолжить планомерную оптимизацию процессов и тестирование новых гипотез.",
        "Подготовить аналитический срез по итогам следующего спринта."
      );
      break;
  }

  return base.slice(0, 4);
}

export function generateBuiltinReport(params: GenerateParams): ReportContent {
  const period = extractPeriod(params.inputData);
  const metrics = extractMetrics(params.inputData, params.docType);
  const sections = generateSections(params, period);
  const table = generateTable(params);
  const recommendations = generateRecommendations(params);

  const title = `${docTypeLabel(params.docType)} — ${params.clientName}`;
  const subtitle = `Аналитический срез и ключевые метрики эффективности`;
  const summary = `Подготовлен итоговый документ по проекту «${params.clientName}» за ${period.toLowerCase()}. Все ключевые задачи реализованы в полном соответствии с требованиями. Наблюдается устойчивая положительная динамика ключевых показателей.`;
  const conclusion = `Итоги периода подтверждают эффективность выбранной стратегии для проекта «${params.clientName}». Рекомендуется закрепить успешные практики и приступить к выполнению следующего этапа работ.`;

  return {
    title,
    subtitle,
    period,
    summary,
    metrics,
    sections,
    table,
    recommendations,
    conclusion,
  };
}
