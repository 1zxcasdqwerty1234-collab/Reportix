type PdfBlock = { top: number; bottom: number };

export interface DownloadPdfOptions {
  isFreePlan?: boolean;
  watermark?: boolean;
}

export async function downloadPdf(el: HTMLElement, filename: string, options: DownloadPdfOptions = {}) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  let blockBounds: PdfBlock[] = [];
  let exportWidth = el.getBoundingClientRect().width || el.scrollWidth;

  const canvas = await html2canvas(el, {
    scale: Math.min(3, Math.max(2, window.devicePixelRatio || 2)),
    backgroundColor: "#ffffff",
    useCORS: true,
    allowTaint: false,
    logging: false,
    imageTimeout: 15000,
    onclone: (clonedDocument) => {
      const root = clonedDocument.querySelector<HTMLElement>("[data-pdf-root]");
      if (!root) return;

      root.classList.add("pdf-export-mode");
      // Use stable executive print width
      root.style.width = "980px";
      root.style.maxWidth = "none";
      root.style.boxSizing = "border-box";
      root.style.padding = "44px 54px";
      root.style.background = "#ffffff";
      root.style.color = "#0f172a";
      root.style.fontFamily = "Geist, -apple-system, BlinkMacSystemFont, Arial, sans-serif";
      root.style.borderRadius = "0";
      root.style.boxShadow = "none";

      // If on Free plan, append an official watermark notice
      if (options.isFreePlan || options.watermark) {
        const watermark = clonedDocument.createElement("div");
        watermark.setAttribute("data-pdf-block", "true");
        watermark.style.cssText =
          "margin-top: 24px; padding: 10px 14px; text-align: center; font-size: 11px; color: #64748b; background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 6px;";
        watermark.textContent =
          "Сформировано в Reportix · Бесплатная версия (reportix.app). Для создания брендированных отчётов без водяного знака выберите тариф Pro.";
        root.appendChild(watermark);
      }

      const style = clonedDocument.createElement("style");
      style.setAttribute("data-pdf-export-style", "true");
      style.textContent = `
        .pdf-export-mode, .pdf-export-mode * { box-sizing: border-box !important; }
        .pdf-export-mode {
          width: 980px !important;
          max-width: none !important;
          padding: 44px 54px !important;
          color: #0f172a !important;
          background: #ffffff !important;
          font-family: Geist, -apple-system, BlinkMacSystemFont, Arial, sans-serif !important;
          font-size: 15px !important;
          line-height: 1.6 !important;
        }

        /* Top header divider */
        .pdf-export-mode .report-header {
          border-bottom: 2.5px solid #0f172a !important;
          padding-bottom: 20px !important;
        }
        .pdf-export-mode .report-type-badge {
          color: #2563eb !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          letter-spacing: 0.1em !important;
          text-transform: uppercase !important;
        }
        .pdf-export-mode .report-title {
          font-size: 30px !important;
          line-height: 1.2 !important;
          letter-spacing: -0.03em !important;
          color: #0f172a !important;
          font-weight: 800 !important;
          margin-top: 8px !important;
        }
        .pdf-export-mode .report-subtitle {
          font-size: 14px !important;
          color: #475569 !important;
          margin-top: 6px !important;
        }
        .pdf-export-mode .report-meta-client {
          font-size: 16px !important;
          color: #0f172a !important;
          font-weight: 700 !important;
        }
        .pdf-export-mode .report-meta div {
          color: #475569 !important;
          font-size: 13px !important;
        }

        /* Summary */
        .pdf-export-mode .report-summary {
          font-size: 15px !important;
          line-height: 1.65 !important;
          color: #1e293b !important;
          background: #f8fafc !important;
          border-left: 4px solid #2563eb !important;
          border-radius: 6px !important;
          padding: 14px 18px !important;
          margin-top: 24px !important;
        }

        /* Metrics grid */
        .pdf-export-mode .metrics-grid {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 14px !important;
          margin-top: 24px !important;
        }

        /* Metric cards */
        .pdf-export-mode .metric-card {
          background-color: #ffffff !important;
          border: 1.5px solid #cbd5e1 !important;
          border-radius: 12px !important;
          padding: 16px 18px !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
        }
        .pdf-export-mode .metric-card-label {
          color: #475569 !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          letter-spacing: 0.08em !important;
          text-transform: uppercase !important;
        }
        .pdf-export-mode .metric-card-value {
          color: #0f172a !important;
          font-size: 26px !important;
          font-weight: 800 !important;
          margin-top: 8px !important;
          line-height: 1.15 !important;
        }
        .pdf-export-mode .metric-change {
          font-size: 11px !important;
          font-weight: 700 !important;
          padding: 2px 7px !important;
          border-radius: 5px !important;
        }
        .pdf-export-mode .metric-change[class*="emerald"] {
          background-color: #ecfdf5 !important;
          color: #047857 !important;
          border: 1px solid #a7f3d0 !important;
        }
        .pdf-export-mode .metric-change[class*="rose"] {
          background-color: #fff1f2 !important;
          color: #b91c1c !important;
          border: 1px solid #fecdd3 !important;
        }
        .pdf-export-mode .metric-change[class*="zinc"] {
          background-color: #f1f5f9 !important;
          color: #475569 !important;
          border: 1px solid #cbd5e1 !important;
        }
        .pdf-export-mode .metric-note {
          color: #64748b !important;
          font-size: 11px !important;
          font-weight: 500 !important;
        }

        /* Section headings */
        .pdf-export-mode .report-section-heading {
          font-size: 18px !important;
          line-height: 1.35 !important;
          color: #0f172a !important;
          font-weight: 800 !important;
          border-bottom: 1.5px solid #e2e8f0 !important;
          padding-bottom: 6px !important;
          margin-top: 30px !important;
        }
        .pdf-export-mode .report-paragraph {
          font-size: 14.5px !important;
          line-height: 1.6 !important;
          color: #334155 !important;
          margin-top: 10px !important;
        }
        .pdf-export-mode .report-bullet {
          font-size: 14px !important;
          line-height: 1.55 !important;
          color: #334155 !important;
        }
        .pdf-export-mode .report-bullet-dot {
          background-color: #2563eb !important;
          border-radius: 50% !important;
        }

        /* Table */
        .pdf-export-mode .report-table {
          border: 1.5px solid #cbd5e1 !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          margin-top: 14px !important;
        }
        .pdf-export-mode table {
          border-collapse: collapse !important;
          width: 100% !important;
        }
        .pdf-export-mode th {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
          font-weight: 700 !important;
          font-size: 12.5px !important;
          border-bottom: 2px solid #cbd5e1 !important;
          padding: 10px 14px !important;
        }
        .pdf-export-mode td {
          border-bottom: 1px solid #e2e8f0 !important;
          color: #334155 !important;
          font-size: 13.5px !important;
          padding: 10px 14px !important;
        }
        .pdf-export-mode tbody tr:nth-child(even) {
          background-color: #f8fafc !important;
        }

        /* Recommendations */
        .pdf-export-mode .report-rec-number {
          background-color: #0f172a !important;
          color: #ffffff !important;
          font-weight: 700 !important;
          border: none !important;
          border-radius: 6px !important;
        }
        .pdf-export-mode .report-rec-text {
          color: #1e293b !important;
          font-weight: 500 !important;
          font-size: 14px !important;
        }

        /* Conclusion */
        .pdf-export-mode .report-conclusion {
          border-left: 4px solid #0f172a !important;
          border-top: 1px solid #e2e8f0 !important;
          border-right: 1px solid #e2e8f0 !important;
          border-bottom: 1px solid #e2e8f0 !important;
          background-color: #f8fafc !important;
          color: #1e293b !important;
          font-size: 14.5px !important;
          line-height: 1.6 !important;
          border-radius: 8px !important;
          margin-top: 28px !important;
          padding: 16px 20px !important;
        }

        /* In-document footer with Russian text rendered cleanly via HTML5 canvas */
        .pdf-export-mode .report-doc-footer {
          border-top: 1.5px solid #cbd5e1 !important;
          color: #64748b !important;
          font-size: 11px !important;
          padding-top: 14px !important;
          margin-top: 32px !important;
          display: flex !important;
          justify-content: space-between !important;
        }

        .pdf-export-mode [data-pdf-block] { break-inside: avoid; page-break-inside: avoid; }
        .pdf-export-mode p, .pdf-export-mode li { overflow-wrap: anywhere; }
      `;
      root.prepend(style);

      // Read block positions after print sizing so page breaks match the rendered layout.
      root.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      exportWidth = rootRect.width || 980;
      blockBounds = Array.from(root.querySelectorAll<HTMLElement>("[data-pdf-block]")).map((block) => {
        const rect = block.getBoundingClientRect();
        return { top: rect.top - rootRect.top, bottom: rect.bottom - rootRect.top };
      });
    },
  });

  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true, orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const footerLineY = pageH - 9;
  const imgW = pageW - margin * 2;
  const pxPerMm = canvas.width / imgW;
  const pageHpx = Math.floor((pageH - margin * 2) * pxPerMm);
  const layoutScale = canvas.width / (exportWidth || el.getBoundingClientRect().width || 1);
  const blocks = blockBounds.map((block) => ({
    top: block.top * layoutScale,
    bottom: block.bottom * layoutScale,
  }));

  let y = 0;
  let pageIndex = 0;
  while (y < canvas.height) {
    let end = Math.min(y + pageHpx, canvas.height);
    if (end < canvas.height) {
      const overlapping = blocks
        .filter((block) => block.top < end && block.bottom > end && block.top > y + 120)
        .sort((a, b) => a.top - b.top);
      const breakBefore = overlapping[0];
      if (breakBefore && breakBefore.top - y > pageHpx * 0.28) {
        end = Math.floor(breakBefore.top - 12);
      }
    }
    if (end <= y) end = Math.min(y + pageHpx, canvas.height);

    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = end - y;
    const ctx = slice.getContext("2d");
    if (!ctx) throw new Error("Не удалось подготовить страницу PDF");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, y, canvas.width, end - y, 0, 0, canvas.width, end - y);

    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(slice.toDataURL("image/jpeg", 0.98), "JPEG", margin, margin, imgW, (end - y) / pxPerMm, undefined, "FAST");
    y = end;
    pageIndex += 1;
  }

  // Pure Latin / ASCII footer to prevent Cyrillic Helvetica encoding bugs
  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.3);
    pdf.line(margin, footerLineY, pageW - margin, footerLineY);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(15, 23, 42);
    pdf.text("REPORTIX", margin, pageH - 4.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 116, 139);
    // Standard Latin string avoids garbled characters in jsPDF
    pdf.text("· Professional Client Report", margin + 17, pageH - 4.5);
    pdf.text(`Page ${page} of ${pageCount}`, pageW - margin, pageH - 4.5, { align: "right" });
  }

  pdf.save(`${filename.replace(/[\\/:*?"<>|]+/g, "_").trim() || "Отчёт"}.pdf`);
}
