import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Crown, FileText, Plus, Trash2, Zap, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { docTypeLabel } from "@/lib/report-types";
import { useActivePlan } from "@/lib/subscription";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/reports/")({
  head: () => ({ meta: [{ title: "История — Reportix" }] }),
  component: History,
});

function History() {
  const [lang] = useLanguage();
  const isEn = lang === "en";
  const qc = useQueryClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email || localStorage.getItem("reportix_user_email") || null;
      setUserEmail(email);
    });
  }, []);

  const planInfo = useActivePlan(userEmail);

  const { data, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("id, doc_type, client_name, content, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const remove = async (id: string) => {
    if (!confirm("Удалить документ?")) return;
    const { error } = await supabase.from("reports").delete().eq("id", id);
    if (error) {
      toast.error("Не удалось удалить");
      return;
    }
    qc.invalidateQueries({ queryKey: ["reports"] });
  };

  const isFree = planInfo.plan.id === "free" && !planInfo.isAdmin;
  const isAtLimit = isFree && (data?.length || 0) >= 5;

  return (
    <main className="animate-soft-rise mx-auto max-w-4xl px-6 py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">{isEn ? "Document History" : "История документов"}</h1>
          <p className="mt-1 text-sm text-zinc-400">{isEn ? "All created client reports and proposals" : "Все созданные отчёты и коммерческие предложения"}</p>
        </div>
        <div className="flex items-center gap-3">
          {planInfo.isAdmin ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
              <Crown className="h-3.5 w-3.5 text-amber-400" /> VIP Безлимит
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1 text-xs text-zinc-300">
              <Zap className="h-3 w-3 text-zinc-400" /> Тариф: <strong className="text-white">{planInfo.label}</strong>
              {planInfo.expiresAt && (
                <span className="text-[10px] text-zinc-400 font-mono">
                  (до {new Date(planInfo.expiresAt).toLocaleDateString("ru-RU")})
                </span>
              )}
            </span>
          )}
          <Link to="/new">
            <Button
              size="sm"
              disabled={isAtLimit}
              className="bg-gradient-to-r from-zinc-100 via-white to-zinc-200 text-zinc-950 font-semibold shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:from-white hover:to-zinc-100"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Создать
            </Button>
          </Link>
        </div>
      </div>

      {isAtLimit && (
        <div className="mt-6 rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 text-xs text-amber-300">
          Вы достигли лимита в 5 документов для бесплатного тарифа «Старт».
          <Link to="/pricing" className="ml-2 font-bold underline hover:text-white">
            Перейти на тариф Pro или Агентство →
          </Link>
        </div>
      )}

      <div className="mt-8 divide-y divide-zinc-800/80 rounded-xl border border-zinc-800/90 bg-card">
        {isLoading && <div className="p-8 text-center text-sm text-zinc-400">Загрузка…</div>}
        {!isLoading && (!data || data.length === 0) && (
          <div className="p-12 text-center">
            <FileText className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
            <p className="text-sm text-zinc-400">Пока нет созданных документов</p>
            <Link to="/new">
              <Button size="sm" className="mt-4 bg-zinc-800 text-zinc-200 hover:bg-zinc-700">
                Создать первый отчёт
              </Button>
            </Link>
          </div>
        )}
        {data?.map((r) => {
          const title = (r.content as any)?.title || "Без названия";
          const date = new Date(r.created_at).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "short",
          });
          return (
            <div
              key={r.id}
              className="flex items-center justify-between p-4 transition-colors hover:bg-zinc-900/60"
            >
              <Link to="/reports/$id" params={{ id: r.id }} className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                    {docTypeLabel(r.doc_type)}
                  </span>
                  <span className="text-xs text-zinc-600">·</span>
                  <span className="text-xs text-zinc-400 font-medium">{r.client_name}</span>
                </div>
                <div className="mt-1 truncate text-sm font-semibold text-zinc-100 hover:text-white">
                  {title}
                </div>
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500 tabular">{date}</span>
                <Link
                  to="/view/$id"
                  params={{ id: r.id }}
                  target="_blank"
                  className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                  title="Открыть публичный Web-View"
                >
                  <Share2 className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-rose-400 transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
