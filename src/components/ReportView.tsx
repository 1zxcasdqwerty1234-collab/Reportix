import { forwardRef } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReportContent, Metric } from "@/lib/report-types";
import { docTypeLabel } from "@/lib/report-types";
import { type WhiteLabelConfig, ACCENT_THEMES } from "@/lib/whitelabel";

function MetricCard({ m, accentHex }: { m: Metric; accentHex?: string }) {
  const Icon = m.trend === "up" ? ArrowUpRight : m.trend === "down" ? ArrowDownRight : Minus;
  const tone =
    m.trend === "up"
      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
      : m.trend === "down"
        ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
        : "bg-zinc-800 text-zinc-400 border border-zinc-700/50";
  return (
    <div
      data-pdf-block
      className="metric-card rounded-xl border border-zinc-800/90 bg-card/90 p-5 shadow-sm transition-all"
      style={accentHex ? { borderColor: `${accentHex}33` } : undefined}
    >
      <div className="metric-card-label text-xs font-semibold uppercase tracking-wider text-muted-foreground">{m.label}</div>
      <div className="metric-card-value mt-3 text-3xl font-bold tracking-tight tabular text-zinc-100">{m.value}</div>
      {(m.change || m.note) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {m.change && (
            <span className={`metric-change inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold tabular ${tone}`}>
              <Icon className="h-3 w-3" />
              {m.change}
            </span>
          )}
          {m.note && <span className="metric-note text-xs text-muted-foreground">{m.note}</span>}
        </div>
      )}
    </div>
  );
}

export const ReportView = forwardRef<
  HTMLDivElement,
  {
    content: ReportContent;
    clientName: string;
    docType: string;
    date: string;
    whitelabel?: Partial<WhiteLabelConfig> | null;
  }
>(function ReportView({ content: c, clientName, docType, date, whitelabel }, ref) {
  const theme = whitelabel?.accentColor ? ACCENT_THEMES[whitelabel.accentColor] : null;

  return (
    <div ref={ref} data-pdf-root className="report-document bg-card px-10 py-12 text-card-foreground sm:px-14">
      {/* Optional White-Label Agency Header */}
      {whitelabel?.agencyName && (
        <div data-pdf-block className="mb-6 flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            {whitelabel.logoBase64 ? (
              <img
                src={whitelabel.logoBase64}
                alt={whitelabel.agencyName}
                className="h-9 max-w-[140px] object-contain"
              />
            ) : (
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                style={{ backgroundColor: theme?.accentHex || "#71717A" }}
              >
                {whitelabel.agencyName.charAt(0)}
              </div>
            )}
            <div>
              <div className="text-sm font-bold text-zinc-100 tracking-tight">{whitelabel.agencyName}</div>
              {whitelabel.agencySlogan && (
                <div className="text-[11px] text-muted-foreground">{whitelabel.agencySlogan}</div>
              )}
            </div>
          </div>
          {whitelabel.website && (
            <div className="text-xs text-muted-foreground font-mono">{whitelabel.website}</div>
          )}
        </div>
      )}

      <div data-pdf-block className="report-header flex items-start justify-between gap-6 border-b border-border/80 pb-8">
        <div>
          <div
            className="report-type-badge text-xs font-semibold uppercase tracking-wider"
            style={{ color: theme?.primary || "var(--color-brand, #A1A1AA)" }}
          >
            {docTypeLabel(docType)}
          </div>
          <h1 className="report-title mt-3 text-3xl font-semibold tracking-tight text-zinc-100">{c.title}</h1>
          {c.subtitle && <p className="report-subtitle mt-2 text-muted-foreground">{c.subtitle}</p>}
        </div>
        <div className="report-meta shrink-0 text-right text-sm">
          <div className="report-meta-client font-medium text-zinc-200">{clientName}</div>
          {c.period && <div className="mt-1 text-muted-foreground">{c.period}</div>}
          <div className="mt-1 text-muted-foreground">{date}</div>
        </div>
      </div>

      <p data-pdf-block className="report-summary mt-8 text-[15px] leading-relaxed text-zinc-300">{c.summary}</p>

      {c.metrics?.length > 0 && (
        <div className="metrics-grid mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
          {c.metrics.map((m, i) => (
            <MetricCard key={i} m={m} accentHex={theme?.accentHex} />
          ))}
        </div>
      )}

      {c.sections?.map((s, i) => (
        <section key={i} className="mt-10">
          <h2 data-pdf-block className="report-section-heading text-lg font-semibold tracking-tight text-zinc-100">{s.heading}</h2>
          {s.paragraphs?.map((p, j) => (
            <p data-pdf-block key={j} className="report-paragraph mt-3 text-[15px] leading-relaxed text-zinc-300">{p}</p>
          ))}
          {s.bullets && s.bullets.length > 0 && (
            <ul className="mt-3 space-y-2">
              {s.bullets.map((b, j) => (
                <li data-pdf-block key={j} className="report-bullet flex gap-3 text-[15px] leading-relaxed text-zinc-300">
                  <span className="report-bullet-dot mt-2.5 h-1 w-1 shrink-0 rounded-full bg-zinc-400" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {c.table && c.table.rows?.length > 0 && (
        <section className="mt-10">
          {c.table.title && <h2 data-pdf-block className="report-section-heading text-lg font-semibold tracking-tight text-zinc-100">{c.table.title}</h2>}
          <div className="report-table mt-4 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  {c.table.columns.map((col, i) => (
                    <th key={i} className={`px-4 py-2.5 font-medium text-zinc-300 ${i === 0 ? "text-left" : "text-right"}`}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.table.rows.map((r, i) => (
                  <tr data-pdf-block key={i} className="border-t border-border">
                    {r.map((cell, j) => (
                      <td key={j} className={`px-4 py-2.5 tabular text-zinc-300 ${j === 0 ? "text-left font-medium text-zinc-200" : "text-right"}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {c.recommendations && c.recommendations.length > 0 && (
        <section className="mt-10">
          <h2 data-pdf-block className="report-section-heading text-lg font-semibold tracking-tight text-zinc-100">Рекомендации</h2>
          <ol className="mt-4 space-y-3">
            {c.recommendations.map((r, i) => (
              <li data-pdf-block key={i} className="flex gap-4 text-[15px] leading-relaxed">
                <span className="report-rec-number grid h-6 w-6 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold tabular text-zinc-200 border border-zinc-700/50">{i + 1}</span>
                <span className="report-rec-text pt-0.5 text-zinc-300">{r}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {c.conclusion && (
        <div data-pdf-block className="report-conclusion mt-10 rounded-lg border-l-2 border-brand bg-muted/80 px-5 py-4 text-[15px] leading-relaxed text-zinc-300">
          {c.conclusion}
        </div>
      )}

      <div data-pdf-block className="report-doc-footer mt-12 pt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {whitelabel?.agencyName ? (
            <>
              <span className="font-bold text-zinc-200">{whitelabel.agencyName}</span>
              {whitelabel.contacts && (
                <>
                  <span>·</span>
                  <span>{whitelabel.contacts}</span>
                </>
              )}
            </>
          ) : (
            <>
              <span className="font-bold text-zinc-200">Reportix</span>
              <span>·</span>
              <span>Профессиональный клиентский отчёт</span>
            </>
          )}
        </div>
        <div className="text-[11px] text-zinc-500">
          {whitelabel?.removeReportixBranding
            ? "Конфиденциально · Документ сформирован для клиента"
            : "Reportix · Сформировано автоматически"}
        </div>
      </div>
    </div>
  );
});
