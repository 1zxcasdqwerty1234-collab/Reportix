import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Copy, Download, FileText, Share2, ShieldCheck, Sparkles, Globe } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ReportView } from "@/components/ReportView";
import { downloadPdf } from "@/lib/pdf";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import type { ReportContent } from "@/lib/report-types";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/view/$id")({
  head: () => ({
    meta: [
      { title: "Онлайн-отчёт — Reportix" },
      { name: "description", content: "Официальный клиентский отчёт в интерактивном онлайн-формате." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PublicReportPage,
});

function PublicReportPage() {
  const [lang, setLang] = useLanguage();
  const isEn = lang === "en";
  const { id } = Route.useParams();
  const reportRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [report, setReport] = useState<{
    id: string;
    client_name: string;
    doc_type: string;
    created_at: string;
    content: ReportContent;
    whitelabel?: any;
  } | null>(null);

  useEffect(() => {
    let active = true;

    async function loadReport() {
      setLoading(true);

      // 1. Try server public report API
      try {
        const resp = await fetch(`/api/public-report/${id}`);
        if (resp.ok) {
          const data = await resp.json();
          if (active && data?.report) {
            setReport({
              id: data.report.id,
              client_name: data.report.clientName,
              doc_type: data.report.docType,
              created_at: data.report.createdAt,
              content: data.report.content,
              whitelabel: data.report.whitelabel,
            });
            setLoading(false);
            return;
          }
        }
      } catch {}

      // 2. Try Supabase
      try {
        const { data, error } = await supabase
          .from("reports")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (active && !error && data) {
          setReport({
            id: data.id,
            client_name: data.client_name,
            doc_type: data.doc_type,
            created_at: data.created_at,
            content: data.content as unknown as ReportContent,
          });
          setLoading(false);
          return;
        }
      } catch {}

      // 3. Try LocalStorage cached reports
      try {
        const raw = localStorage.getItem(`reportix_report_${id}`);
        if (raw && active) {
          const parsed = JSON.parse(raw);
          setReport(parsed);
          setLoading(false);
          return;
        }
      } catch {}

      if (active) setLoading(false);
    }

    loadReport();
    return () => {
      active = false;
    };
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Ссылка скопирована в буфер обмена!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = async () => {
    if (!reportRef.current || !report) return;
    setDownloading(true);
    try {
      const filename = `${report.client_name}_${report.doc_type}_reportix.pdf`.replace(/\s+/g, "_");
      await downloadPdf(reportRef.current, filename, {
        watermark: !report.whitelabel?.removeReportixBranding,
      });
      toast.success("PDF-отчёт успешно сохранён!");
    } catch {
      toast.error("Не удалось скачать PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-500 border-t-white" />
        <p className="mt-4 text-sm text-zinc-400">Загрузка онлайн-отчёта…</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center text-foreground">
        <FileText className="h-12 w-12 text-zinc-600 mb-3" />
        <h1 className="text-xl font-semibold text-white">Отчёт не найден</h1>
        <p className="mt-2 max-w-sm text-sm text-zinc-400">
          Возможно, срок действия ссылки истёк или ссылка указана с ошибкой.
        </p>
        <Link to="/" className="mt-6">
          <Button variant="outline" className="border-zinc-800 text-zinc-300 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" /> На главную Reportix
          </Button>
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(report.created_at).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Bar for client view */}
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Logo size="sm" />
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
              <ShieldCheck className="h-3 w-3" /> Reportix Verified
            </span>
          </div>

          <div className="flex items-center gap-2">
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
              onClick={handleCopyLink}
              className="border-zinc-800 bg-zinc-900/60 text-xs text-zinc-300 hover:text-white"
            >
              {copied ? <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="mr-1.5 h-3.5 w-3.5" />}
              {copied ? (isEn ? "Copied!" : "Скопировано") : (isEn ? "Share Link" : "Поделиться")}
            </Button>
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
              className="bg-gradient-to-r from-zinc-100 via-white to-zinc-200 text-zinc-950 font-semibold shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:from-white text-xs"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {downloading ? (isEn ? "Building PDF…" : "Создание PDF…") : (isEn ? "Download PDF" : "Скачать PDF")}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Report Container */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-8">
        <div className="mb-4 flex items-center justify-between text-xs text-zinc-400">
          <span>Клиентский интерактивный просмотр</span>
          <span>Обновлено: {formattedDate}</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-card shadow-2xl shadow-black/80">
          <ReportView
            ref={reportRef}
            content={report.content}
            clientName={report.client_name}
            docType={report.doc_type}
            date={formattedDate}
            whitelabel={report.whitelabel}
          />
        </div>

        {/* Footer info for client */}
        <div className="mt-8 rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 text-center text-xs text-zinc-400">
          Документ подготовлен в Reportix. Вы можете скачать официальный PDF или сохранить эту интерактивную страницу в закладки.
        </div>
      </main>
    </div>
  );
}
