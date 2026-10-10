import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, Download, ExternalLink, Loader2, RefreshCw, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateReport } from "@/lib/reports.functions";
import { downloadPdf } from "@/lib/pdf";
import { useActivePlan } from "@/lib/subscription";
import { useLanguage } from "@/lib/i18n";
import { getWhiteLabelConfig } from "@/lib/whitelabel";
import type { DocType, ReportContent } from "@/lib/report-types";
import { ReportView } from "@/components/ReportView";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/reports/$id")({
  head: () => ({ meta: [{ title: "Документ — Reportix" }] }),
  component: ReportPage,
});

function ReportPage() {
  const [lang] = useLanguage();
  const isEn = lang === "en";
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const gen = useServerFn(generateReport);
  const ref = useRef<HTMLDivElement>(null);
  const [regen, setRegen] = useState(false);
  const [pdf, setPdf] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email || localStorage.getItem("reportix_user_email") || null;
      setUserEmail(email);
    });
  }, []);

  const planInfo = useActivePlan(userEmail);
  const whitelabel = null // white-label disabled
  const _wlDisabled = userEmail && false
    ? getWhiteLabelConfig(userEmail)
    : null;

  const { data: r, isLoading } = useQuery({
    queryKey: ["report", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("reports").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Keep report available for public web-view
  useEffect(() => {
    if (r) {
      // 1. Store in localStorage
      localStorage.setItem(
        `reportix_report_${r.id}`,
        JSON.stringify({
          id: r.id,
          client_name: r.client_name,
          doc_type: r.doc_type,
          created_at: r.created_at,
          content: r.content,
          whitelabel,
        })
      );

      // 2. Publish to server storage
      fetch("/api/public-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: r.id,
          clientName: r.client_name,
          docType: r.doc_type,
          title: (r.content as any)?.title || "Отчёт",
          content: r.content,
          userEmail: userEmail || "anonymous",
          whitelabel,
          createdAt: r.created_at,
        }),
      }).catch(() => {});
    }
  }, [r, whitelabel, userEmail]);

  const regenerate = async () => {
    if (!r) return;
    setRegen(true);
    try {
      await gen({
        data: {
          docType: r.doc_type as DocType,
          clientName: r.client_name,
          inputData: r.input_data,
          wishes: r.wishes ?? "",
          reportId: r.id,
        },
      });
      await qc.invalidateQueries({ queryKey: ["report", id] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Документ обновлён");
    } catch (e: any) {
      toast.error(e?.message ?? "Ошибка генерации");
    } finally {
      setRegen(false);
    }
  };

  const download = async () => {
    if (!ref.current || !r) return;
    setPdf(true);
    try {
      const filename = `${r.client_name} — ${(r.content as any).title}`.replace(/\s+/g, "_");
      await downloadPdf(ref.current, filename, {
        watermark: planInfo.watermark && !whitelabel?.removeReportixBranding,
      });
      toast.success("PDF успешно скачан!");
    } catch (e) {
      console.error(e);
      toast.error("Не удалось создать PDF");
    } finally {
      setPdf(false);
    }
  };

  const handleShareLink = () => {
    const publicUrl = `${window.location.origin}/view/${id}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    toast.success("Ссылка для клиента скопирована!", {
      description: "Клиент сможет открыть интерактивный отчёт со смартфона или компьютера.",
    });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (isLoading) return <div className="p-16 text-center text-sm text-zinc-400">Загрузка…</div>;
  if (!r)
    return (
      <div className="p-16 text-center">
        <p className="text-sm text-zinc-400">Документ не найден</p>
        <Link to="/reports">
          <Button variant="outline" size="sm" className="mt-4 border-zinc-800 bg-zinc-900 text-zinc-200">
            К истории
          </Button>
        </Link>
      </div>
    );

  const date = new Date(r.updated_at).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="animate-soft-rise mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link
          to="/reports"
          className="mr-auto inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> История
        </Link>

        {/* Share Web-View Link */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleShareLink}
          className="border-zinc-800 bg-zinc-900/80 text-zinc-200 hover:text-white hover:border-zinc-600 text-xs"
        >
          {copiedLink ? <Check className="mr-1.5 h-4 w-4 text-emerald-400" /> : <Share2 className="mr-1.5 h-4 w-4" />}
          {copiedLink ? (isEn ? "Link Copied!" : "Ссылка скопирована!") : (isEn ? "Share Web-View" : "Поделиться (Web-View)")}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={regenerate}
          disabled={regen}
          className="border-zinc-800 bg-zinc-900/80 text-zinc-200 hover:text-white hover:border-zinc-600 text-xs"
        >
          {regen ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}{" "}
          {isEn ? "Regenerate" : "Сгенерировать заново"}
        </Button>

        <Button
          size="sm"
          onClick={download}
          disabled={pdf || regen}
          className="bg-gradient-to-r from-zinc-100 via-white to-zinc-200 text-zinc-950 font-semibold shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:from-white hover:to-zinc-100 text-xs"
        >
          {pdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {isEn ? "Download PDF" : "Скачать PDF"}
        </Button>
      </div>

      <div
        className={`overflow-hidden rounded-xl border border-zinc-800/90 shadow-2xl shadow-black/80 transition-opacity ${
          regen ? "opacity-50" : ""
        }`}
      >
        <ReportView
          ref={ref}
          content={r.content as unknown as ReportContent}
          clientName={r.client_name}
          docType={r.doc_type}
          date={date}
          whitelabel={whitelabel}
        />
      </div>
    </main>
  );
}
