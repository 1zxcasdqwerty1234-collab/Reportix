import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DOC_TYPE_IDS, type ReportContent } from "./report-types";
import { generateBuiltinReport } from "./report-generator";

const input = z.object({
  docType: z.enum(DOC_TYPE_IDS),
  clientName: z.string().trim().min(1).max(200),
  inputData: z.string().trim().min(10).max(20000),
  wishes: z.string().max(3000).optional().default(""),
  reportId: z.string().uuid().optional(),
});

const TYPE_HINT: Record<string, string> = {
  smm: "SMM-отчёт для клиента: охваты, показы, вовлечённость (ER), прирост подписчиков, лучшие публикации, выводы.",
  ads: "Отчёт по рекламным кампаниям (контекст/таргет): показы, клики, CTR, CPC, конверсии, CPA/CPL, расход, ROMI/ДРР, выводы по кампаниям.",
  seo: "SEO-отчёт: органический трафик, позиции и видимость, ТОП-3/ТОП-10, выполненные работы, технические улучшения, планы.",
  proposal:
    "Коммерческое предложение от digital-агентства/фрилансера: понимание задачи, решение, состав услуг, этапы и сроки, ожидаемые результаты, стоимость (таблица), почему мы.",
  email: "Отчёт по email-рассылкам: база, open rate, CTR, отписки, конверсии, выручка, лучшие письма, выводы.",
  analytics: "Отчёт по веб-аналитике сайта: визиты, источники трафика, отказы, конверсии, цели, выводы и точки роста.",
  content_plan: "Контент-план: цели, рубрики, форматы, частота, таблица графика публикаций, KPI.",
  case: "Кейс для портфолио: клиент и задача, решение, ход работ, результаты в цифрах, выводы.",
  act: "Отчёт о проделанной работе за период: перечень работ (таблица), затраченные часы, стоимость, итоги.",
  brief: "Бриф / стратегия продвижения: цели, аудитория, позиционирование, каналы, бюджет, KPI, план по этапам.",
};

const schema = {
  type: "object",
  properties: {
    title: { type: "string" },
    subtitle: { type: "string" },
    period: { type: "string", description: "Период отчёта или срок действия КП, если известен" },
    summary: { type: "string", description: "Краткое резюме 2–4 предложения" },
    metrics: {
      type: "array",
      description: "3–6 ключевых показателей. Для КП — ключевые цифры предложения (стоимость, срок, прогноз).",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          value: { type: "string", description: "Коротко: '12 480', '3,2%', '45 000 ₽'" },
          change: { type: "string", description: "Динамика: '+24%' или '−8%'. Пусто, если неизвестна" },
          trend: { type: "string", enum: ["up", "down", "neutral"], description: "up = хорошо для клиента, down = плохо" },
          note: { type: "string", description: "Короткое пояснение, напр. 'к прошлому месяцу'" },
        },
        required: ["label", "value", "trend"],
      },
    },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          heading: { type: "string" },
          paragraphs: { type: "array", items: { type: "string" } },
          bullets: { type: "array", items: { type: "string" } },
        },
        required: ["heading"],
      },
    },
    table: {
      type: "object",
      description: "Опциональная таблица: детализация по кампаниям/каналам или смета для КП",
      properties: {
        title: { type: "string" },
        columns: { type: "array", items: { type: "string" } },
        rows: { type: "array", items: { type: "array", items: { type: "string" } } },
      },
      required: ["columns", "rows"],
    },
    recommendations: { type: "array", items: { type: "string" } },
    conclusion: { type: "string" },
  },
  required: ["title", "summary", "metrics", "sections"],
};

export const generateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data, context }) => {
    let content: ReportContent | null = null;
    const key = process.env["LOVABLE_API_KEY"] || process.env["OPENAI_API_KEY"] || process.env["GEMINI_API_KEY"];

    if (key) {
      try {
        const system = `Ты — старший аккаунт-менеджер digital-агентства Reportix. Пишешь безупречные клиентские документы на русском языке: деловой, ясный, уверенный тон, без воды, без эмодзи и без markdown-разметки.
Тип документа: ${TYPE_HINT[data.docType]}
Правила:
- Используй ТОЛЬКО цифры из данных пользователя. Не выдумывай показатели. Можно вычислять производные (CTR, CPC, % изменения), если хватает данных.
- Числа форматируй по-русски: пробел между разрядами, запятая в дробях, ₽ после суммы.
- Разделы короткие и полезные: 3–5 разделов, абзацы по 1–3 предложения.
- Рекомендации — конкретные действия, 3–5 пунктов.`;

        const user = `Клиент / проект: ${data.clientName}

Данные:
${data.inputData}

${data.wishes ? `Дополнительные пожелания: ${data.wishes}` : ""}`;

        const apiUrl = process.env["OPENAI_API_KEY"]
          ? "https://api.openai.com/v1/chat/completions"
          : "https://ai.gateway.lovable.dev/v1/chat/completions";

        const model = process.env["OPENAI_API_KEY"] ? "gpt-4o-mini" : "google/gemini-3-flash-preview";

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            tools: [{ type: "function", function: { name: "build_document", description: "Собрать документ", parameters: schema } }],
            tool_choice: { type: "function", function: { name: "build_document" } },
          }),
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = (await res.json()) as any;
          const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
          if (args) {
            content = JSON.parse(args) as ReportContent;
          }
        }
      } catch (err) {
        console.warn("External AI call failed or timed out, falling back to built-in Reportix engine:", err);
      }
    }

    // Seamless fallback to the built-in intelligent Reportix engine
    if (!content) {
      content = generateBuiltinReport({
        docType: data.docType,
        clientName: data.clientName,
        inputData: data.inputData,
        wishes: data.wishes,
      });
    }

    const row = {
      doc_type: data.docType,
      client_name: data.clientName,
      input_data: data.inputData,
      wishes: data.wishes || null,
      content: content as any,
      updated_at: new Date().toISOString(),
    };

    if (data.reportId) {
      const { error } = await context.supabase.from("reports").update(row).eq("id", data.reportId);
      if (error) throw new Error(error.message);
      return { id: data.reportId };
    }
    const { data: ins, error } = await context.supabase
      .from("reports")
      .insert({ ...row, user_id: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: ins.id };
  });
