import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Crown, LayoutTemplate, Loader2, Zap, BarChart2, Palette, ArrowRight, Check } from "lucide-react";
import { DOC_TYPES, docTypeLabel, type DocType } from "@/lib/report-types";
import { TEMPLATES, NICHE_PRESETS, type NichePreset } from "@/lib/templates";
import { generateReport } from "@/lib/reports.functions";
import { canUserGenerateReport, useActivePlan } from "@/lib/subscription";
import { logActivity, incrementUserReportsCount } from "@/lib/support";
import { useLanguage } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdCabinetImporter } from "@/components/AdCabinetImporter";

export const Route = createFileRoute("/_authenticated/new")({
  head: () => ({ meta: [{ title: "Новый документ — Reportix" }] }),
  component: NewReport,
});

type WorkflowMode = "manual" | "cabinet" | "presets";

function NewReport() {
  const navigate = useNavigate();
  const [lang] = useLanguage();
  const isEn = lang === "en";

  const gen = useServerFn(generateReport);
  const [docType, setDocType] = useState<DocType>("smm");
  const [clientName, setClientName] = useState("");
  const [inputData, setInputData] = useState("");
  const [wishes, setWishes] = useState("");
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Workflow mode
  const [mode, setMode] = useState<WorkflowMode>("manual");

  // Modals state
  const [importerOpen, setImporterOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email || localStorage.getItem("reportix_user_email") || null;
      setUserEmail(email);
    });
  }, []);

  const planInfo = useActivePlan(userEmail);
  const templates = TEMPLATES[docType];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputData.trim().length < 10) {
      toast.error(isEn ? "Please enter at least 10 characters of report metrics" : "Добавьте данные для отчёта (минимум 10 символов)");
      return;
    }
    setLoading(true);
    try {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { count } = await supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfMonth);

      const usageCheck = canUserGenerateReport(userEmail, count || 0);
      if (!usageCheck.allowed) {
        toast.error(usageCheck.reason || (isEn ? "Monthly report limit reached." : "Достигнут лимит генераций тарифа. Обновите тариф."));
        setLoading(false);
        return;
      }

      const { id } = await gen({ data: { docType, clientName, inputData, wishes } });

      if (userEmail) {
        logActivity(userEmail, "Генерация отчёта", `${docTypeLabel(docType)} для клиента «${clientName}»`);
        incrementUserReportsCount(userEmail);
      }

      navigate({ to: "/reports/$id", params: { id } });
    } catch (err: any) {
      toast.error(err?.message ?? (isEn ? "Generation error" : "Ошибка формирования отчёта"));
      setLoading(false);
    }
  };

  const applyTemplate = (i: number) => {
    const t = templates[i];
    if (!t) return;
    setClientName(t.client);
    setInputData(t.data);
    setWishes(t.wishes ?? "");
    toast.success(isEn ? `Template "${t.name}" applied` : `Шаблон «${t.name}» подставлен`);
  };

  const applyNichePreset = (preset: NichePreset) => {
    setDocType(preset.docType);
    setClientName(preset.clientName);
    setInputData(preset.inputData);
    setWishes(preset.wishes);
    setMode("manual");
    toast.success(isEn ? `Preset "${preset.title}" applied!` : `Отраслевой пресет «${preset.title}» активирован!`);
  };

  const handleCabinetImport = (imported: {
    docType: DocType;
    clientName: string;
    inputData: string;
    wishes: string;
  }) => {
    setDocType(imported.docType);
    setClientName(imported.clientName);
    setInputData(imported.inputData);
    setWishes(imported.wishes);
    setMode("manual");
  };

  return (
    <main className="animate-soft-rise mx-auto max-w-4xl px-6 py-10">
      {/* Importer & White-Label Modals */}
      <AdCabinetImporter
        open={importerOpen}
        onOpenChange={setImporterOpen}
        onImport={handleCabinetImport}
      />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {isEn ? "Create Document" : "Новый документ"}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {isEn
              ? "Automated reporting engine: calculate key KPIs, build structured summaries, and export vector PDF."
              : "Автоматический расчёт ключевых показателей, структурирование выводов и экспорт в PDF."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {planInfo.isAdmin ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
              <Crown className="h-3.5 w-3.5 text-blue-400" /> Pro
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1 text-xs text-zinc-300">
              <Zap className="h-3 w-3 text-zinc-400" /> {isEn ? "Plan:" : "Тариф:"}{" "}
              <strong className="text-white">{planInfo.label}</strong>
              {planInfo.expiresAt && (
                <span className="text-[10px] text-zinc-400 font-mono">
                  ({new Date(planInfo.expiresAt).toLocaleDateString(isEn ? "en-US" : "ru-RU")})
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Clean Mode Switcher */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            mode === "manual"
              ? "bg-zinc-800 text-white shadow-sm border border-zinc-700 ring-1 ring-zinc-600/50"
              : "border border-zinc-800/80 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-900 hover:text-white"
          }`}
        >
          <span>✍️ {isEn ? "Manual Form" : "Быстрое заполнение"}</span>
        </button>

        <button
          type="button"
          onClick={() => setImporterOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/20 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-900/30 hover:border-emerald-500"
        >
          <BarChart2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>⚡ {isEn ? "Ad Cabinet Sync" : "Сбор из кабинетов (API)"}</span>
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "presets" ? "manual" : "presets")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            mode === "presets"
              ? "bg-zinc-800 text-white shadow-sm border border-zinc-700 ring-1 ring-zinc-600/50"
              : "border border-zinc-800/80 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-900 hover:text-white"
          }`}
        >
          <LayoutTemplate className="h-3.5 w-3.5 text-zinc-400" />
          <span>📋 {isEn ? "Industry Presets (6)" : "Готовые отраслевые шаблоны (6)"}</span>
        </button>
      </div>

      {/* Niche Presets Expandable Drawer */}
      {mode === "presets" && (
        <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 animate-fade-in shadow-xl">
          <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
            <div>
              <h3 className="text-sm font-semibold text-white">
                {isEn ? "Select an Industry Preset" : "Выберите отраслевой шаблон под вашу нишу"}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isEn
                  ? "Pre-configured metrics, client data, and recommended document type."
                  : "Готовые показатели, структура и правильный тип документа в один клик."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className="text-xs text-zinc-400 hover:text-white"
            >
              ✕ {isEn ? "Close" : "Закрыть"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {NICHE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyNichePreset(preset)}
                className="group relative flex flex-col items-start rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 text-left transition hover:border-zinc-600 hover:bg-zinc-900"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-300 uppercase">
                    {preset.category}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-500 transition group-hover:translate-x-1 group-hover:text-white" />
                </div>
                <div className="mt-2 text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {preset.title}
                </div>
                <div className="mt-1 text-[11px] text-zinc-400 line-clamp-2">
                  {preset.subtitle}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={submit} className="mt-8 space-y-8">
        {/* Step 1: Document Type with Fixed Clear Labels & High Contrast */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wider text-zinc-300 font-bold">
              {isEn ? "1. Document Type" : "1. Тип документа"}
            </Label>
            <span className="text-xs text-zinc-500 font-mono">
              {isEn ? "10 formats available" : "10 форматов отчётности"}
            </span>
          </div>

          {/* 10 Document Type Cards - Crisp, Legible, High-Contrast */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            {DOC_TYPES.map((t) => {
              const active = docType === t.id;
              const titleText = isEn ? t.enTitle : t.title || t.label;
              const descText = isEn ? t.enDescription : t.description || t.desc;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDocType(t.id)}
                  className={`group relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all duration-200 cursor-pointer min-h-[88px] ${
                    active
                      ? "border-zinc-200 bg-zinc-800 text-white shadow-lg ring-1 ring-zinc-300/80"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/80"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <div className="text-xs font-bold text-white tracking-tight leading-snug">
                        {titleText}
                      </div>
                      {active && (
                        <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-white text-zinc-950">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {descText}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Client Name */}
        <div className="space-y-2">
          <Label htmlFor="client" className="text-xs uppercase tracking-wider text-zinc-300 font-bold">
            {isEn ? "2. Client or Project Name" : "2. Название клиента или проекта"}
          </Label>
          <Input
            id="client"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder={isEn ? "e.g. Acme Coffee Co. or John Doe" : "Например: Сеть кофеен «Зерно» или ИП Иванов"}
            className="border-zinc-800 bg-zinc-900/60 text-white placeholder:text-zinc-500 h-10"
          />
        </div>

        {/* Step 3: Input Data */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="data" className="text-xs uppercase tracking-wider text-zinc-300 font-bold">
              {isEn ? "3. Metrics & Data" : "3. Данные и цифры для отчёта"}
            </Label>
            {templates && templates.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span>{isEn ? "Quick sample:" : "Быстрый пример:"}</span>
                {templates.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applyTemplate(i)}
                    className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300 hover:bg-zinc-700 hover:text-white"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Textarea
            id="data"
            rows={8}
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder={
              isEn
                ? "Paste numbers in any format:\nImpressions: 180,000\nClicks: 4,200, Spend $2,400\nLeads: 112 (CPL $21.40)\nConclusions: campaign exceeded plan..."
                : "Вставьте показатели в свободном формате:\nПоказы: 180 000\nКлики: 4 200, расход 65 000 ₽\nЗаявки: 112 (CPL 580 ₽)\nВыводы: кампания перевыполнила план..."
            }
            className="border-zinc-800 bg-zinc-900/60 font-mono text-xs text-white placeholder:text-zinc-500 leading-relaxed"
          />
          <p className="text-[11px] text-zinc-500">
            {isEn
              ? "Plain text, numbers from spreadsheet, or ad cabinet export — Reportix formats everything into clear metrics."
              : "Любой формат: текст, цифры из таблицы или выгрузка из кабинета — система автоматически рассчитает динамику."}
          </p>
        </div>

        {/* Step 4: Notes / Wishes */}
        <div className="space-y-2">
          <Label htmlFor="wishes" className="text-xs uppercase tracking-wider text-zinc-300 font-bold">
            {isEn ? "4. Key Takeaways & Focus (Optional)" : "4. Акценты и выводы (необязательно)"}
          </Label>
          <Input
            id="wishes"
            value={wishes}
            onChange={(e) => setWishes(e.target.value)}
            placeholder={
              isEn
                ? "e.g. Focus on CPL reduction, recommend budget scaling for next month"
                : "Например: Сделать акцент на снижении стоимости лида, предложить масштабирование"
            }
            className="border-zinc-800 bg-zinc-900/60 text-white placeholder:text-zinc-500 h-10"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="w-full bg-gradient-to-r from-zinc-100 via-white to-zinc-200 text-zinc-950 font-bold shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:from-white hover:to-zinc-100 h-12 text-sm cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isEn ? "Generating professional client document…" : "Формирование клиентского документа…"}
              </>
            ) : (
              <>
                {isEn ? "Generate Client Report" : "Сформировать клиентский отчёт"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </main>
  );
}
