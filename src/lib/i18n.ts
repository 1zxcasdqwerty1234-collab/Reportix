// Internationalization (i18n) and Currency System for Reportix
import { useEffect, useState } from "react";

export type Language = "ru" | "en";

const LANG_STORAGE_KEY = "reportix_language_v1";

export function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "ru";
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === "en" || saved === "ru") return saved;
  } catch {}
  return "ru";
}

export function setStoredLanguage(lang: Language): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    window.dispatchEvent(new CustomEvent("reportix-lang-updated", { detail: lang }));
  } catch {}
}

export function useLanguage(): [Language, (lang: Language) => void] {
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());

  useEffect(() => {
    const handleUpdate = () => {
      setLang(getStoredLanguage());
    };
    window.addEventListener("reportix-lang-updated", handleUpdate);
    return () => {
      window.removeEventListener("reportix-lang-updated", handleUpdate);
    };
  }, []);

  const changeLang = (newLang: Language) => {
    setStoredLanguage(newLang);
    setLang(newLang);
  };

  return [lang, changeLang];
}

export interface LocalizedPlan {
  id: "free" | "pro";
  name: string;
  priceMonthly: number;
  priceYearlyMonthly: number;
  currencySymbol: string;
  currencyCode: "RUB" | "USD";
  periodLabel: string;
  badge?: string;
  description: string;
  features: string[];
  cta: string;
}

export const I18N_PLANS: Record<Language, Record<string, LocalizedPlan>> = {
  ru: {
    free: {
      id: "free",
      name: "Старт",
      priceMonthly: 0,
      priceYearlyMonthly: 0,
      currencySymbol: "₽",
      currencyCode: "RUB",
      periodLabel: "Бесплатно навсегда",
      description: "Для знакомства с сервисом",
      features: [
        "До 5 отчётов в месяц",
        "Основные типы документов",
        "Скачивание PDF",
        "История за 14 дней",
      ],
      cta: "Текущий план",
    },
    pro: {
      id: "pro",
      name: "Pro",
      priceMonthly: 690,
      priceYearlyMonthly: 490,
      currencySymbol: "₽",
      currencyCode: "RUB",
      periodLabel: "₽ / месяц",
      badge: "РЕКОМЕНДУЕМ",
      isPopular: true,
      description: "Для фрилансеров с постоянными клиентами",
      features: [
        "До 40 отчётов в месяц",
        "Без водяного знака",
        "Все типы документов",
        "Бессрочная история",
        "Приоритетная генерация",
      ],
      cta: "Подключить Pro",
    },
  },
  en: {
    free: {
      id: "free",
      name: "Starter",
      priceMonthly: 0,
      priceYearlyMonthly: 0,
      currencySymbol: "$",
      currencyCode: "USD",
      periodLabel: "Free forever",
      description: "Try the product",
      features: [
        "Up to 5 reports per month",
        "Core document types",
        "PDF download",
        "14-day history",
      ],
      cta: "Current plan",
    },
    pro: {
      id: "pro",
      name: "Pro",
      priceMonthly: 9,
      priceYearlyMonthly: 7,
      currencySymbol: "$",
      currencyCode: "USD",
      periodLabel: "/ month",
      badge: "RECOMMENDED",
      isPopular: true,
      description: "For freelancers with regular clients",
      features: [
        "Up to 40 reports per month",
        "No watermark",
        "All document types",
        "Unlimited history",
        "Priority generation",
      ],
      cta: "Get Pro",
    },
  },
};


export const UI_TEXT = {
  ru: {
    nav: {
      create: "Создать",
      history: "История",
      pricing: "Тарифы",
      guide: "Как пользоваться",
      demo: "Демо",
      admin: "Админ-панель",
      logout: "Выйти",
      signin: "Войти",
      signup: "Регистрация",
    },
    common: {
      save: "Сохранить",
      cancel: "Отмена",
      delete: "Удалить",
      edit: "Изменить",
      downloadPdf: "Скачать PDF",
      shareLink: "Поделиться ссылкой",
      client: "Клиент",
      period: "Период",
      loading: "Загрузка…",
      success: "Успешно",
      error: "Ошибка",
    },
  },
  en: {
    nav: {
      create: "Create",
      history: "History",
      pricing: "Pricing",
      guide: "How It Works",
      demo: "Live Demo",
      admin: "Admin Panel",
      logout: "Log out",
      signin: "Sign in",
      signup: "Sign up",
    },
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      downloadPdf: "Download PDF",
      shareLink: "Share Link",
      client: "Client",
      period: "Period",
      loading: "Loading…",
      success: "Success",
      error: "Error",
    },
  },
};
