<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- AI document generation runs in a `createServerFn` (src/lib/reports.functions.ts) via Lovable AI Gateway with tool-calling JSON; why: structured content renders consistently and the API key stays server-side.
- PDF export is client-side (html2canvas-pro + jsPDF) from the rendered report; elements marked `data-pdf-block` are not split across pages; why: Cyrillic and design fidelity without server PDF libs on Workers.
