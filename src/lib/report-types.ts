export type DocType =
  | "smm"
  | "ads"
  | "seo"
  | "proposal"
  | "email"
  | "analytics"
  | "content_plan"
  | "case"
  | "act"
  | "brief";

export const DOC_TYPE_IDS = [
  "smm",
  "ads",
  "seo",
  "proposal",
  "email",
  "analytics",
  "content_plan",
  "case",
  "act",
  "brief",
] as const;

export interface DocTypeInfo {
  id: DocType;
  title: string;
  description: string;
  label: string;
  desc: string;
  enTitle: string;
  enDescription: string;
}

export const DOC_TYPES: DocTypeInfo[] = [
  {
    id: "smm",
    title: "SMM-отчёт",
    description: "Охваты, вовлечённость, подписчики",
    label: "SMM-отчёт",
    desc: "Охваты, вовлечённость, подписчики",
    enTitle: "SMM Report",
    enDescription: "Reach, engagement, followers",
  },
  {
    id: "ads",
    title: "Отчёт по рекламе",
    description: "Контекст и таргет: CTR, CPC, CPA, ROMI",
    label: "Отчёт по рекламе",
    desc: "Контекст и таргет: CTR, CPC, CPA, ROMI",
    enTitle: "Ad Campaign Report",
    enDescription: "Paid search & target: CTR, CPC, CPA, ROMI",
  },
  {
    id: "seo",
    title: "SEO-отчёт",
    description: "Позиции, трафик, видимость",
    label: "SEO-отчёт",
    desc: "Позиции, трафик, видимость",
    enTitle: "SEO Report",
    enDescription: "Rankings, organic traffic, visibility",
  },
  {
    id: "proposal",
    title: "Коммерческое предложение",
    description: "Услуги, этапы, стоимость",
    label: "Коммерческое предложение",
    desc: "Услуги, этапы, стоимость",
    enTitle: "Commercial Proposal",
    enDescription: "Services, deliverables, pricing table",
  },
  {
    id: "email",
    title: "Email-рассылки",
    description: "Open rate, CTR, отписки, выручка",
    label: "Email-рассылки",
    desc: "Open rate, CTR, отписки, выручка",
    enTitle: "Email Marketing Report",
    enDescription: "Open rate, CTR, revenue, unsubs",
  },
  {
    id: "analytics",
    title: "Веб-аналитика",
    description: "Трафик, источники, конверсии сайта",
    label: "Веб-аналитика",
    desc: "Трафик, источники, конверсии сайта",
    enTitle: "Web Analytics",
    enDescription: "Sessions, traffic channels, conversions",
  },
  {
    id: "content_plan",
    title: "Контент-план",
    description: "Рубрики, график, форматы публикаций",
    label: "Контент-план",
    desc: "Рубрики, график, форматы публикаций",
    enTitle: "Content Plan",
    enDescription: "Topics, publication schedule, KPIs",
  },
  {
    id: "case",
    title: "Кейс",
    description: "Задача, решение, результат в цифрах",
    label: "Кейс",
    desc: "Задача, решение, результат в цифрах",
    enTitle: "Case Study",
    enDescription: "Challenge, solution, hard metrics",
  },
  {
    id: "act",
    title: "Отчёт о работах",
    description: "Что сделано за период, часы, итоги",
    label: "Отчёт о работах",
    desc: "Что сделано за период, часы, итоги",
    enTitle: "Work Progress Report",
    enDescription: "Deliverables, hours spent, summary",
  },
  {
    id: "brief",
    title: "Бриф / стратегия",
    description: "Цели, аудитория, каналы, KPI",
    label: "Бриф / стратегия",
    desc: "Цели, аудитория, каналы, KPI",
    enTitle: "Brief / Strategy",
    enDescription: "Goals, target audience, channels, KPI",
  },
];

export const docTypeLabel = (t: string, lang = "ru") => {
  const item = DOC_TYPES.find((d) => d.id === t);
  if (!item) return t;
  return lang === "en" ? item.enTitle : item.title;
};

export interface Metric {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  note?: string;
}

export interface Section {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface ReportContent {
  title: string;
  subtitle?: string;
  period?: string;
  summary: string;
  metrics: Metric[];
  sections: Section[];
  table?: { title?: string; columns: string[]; rows: string[][] };
  recommendations?: string[];
  conclusion?: string;
}
