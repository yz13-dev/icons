import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadIcons, validateSvg } from "./icons.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const icons = await loadIcons(root);
const baseOption = process.argv.indexOf("--base");
if (baseOption !== -1 && !process.argv[baseOption + 1]) {
  throw new Error("--base needs a directory containing icons/");
}
const baseRoot =
  baseOption === -1
    ? null
    : isAbsolute(process.argv[baseOption + 1])
      ? process.argv[baseOption + 1]
      : resolve(process.cwd(), process.argv[baseOption + 1]);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderSvg(svg, size) {
  return svg
    .replace('width="24" height="24"', `width="${size}" height="${size}"`)
    .replace("<svg ", '<svg aria-hidden="true" focusable="false" ');
}

function renderSamples(svg, theme) {
  return `<div class="sample ${theme}"><div class="sample-label">${theme === "light" ? "Светлый" : "Тёмный"}</div><div class="sizes">${[16, 20, 24].map((size) => `<div class="size"><span class="art">${renderSvg(svg, size)}</span><span class="size-label">${size}</span></div>`).join("")}</div></div>`;
}

function renderIcon(icon, previous) {
  const changed = previous && previous !== icon.svg;
  return `<section class="icon-row" aria-labelledby="${escapeHtml(icon.slug)}"><div class="details"><h2 id="${escapeHtml(icon.slug)}">${escapeHtml(icon.title)}</h2><code>${escapeHtml(icon.slug)}</code><p>${escapeHtml(icon.category)} / ${icon.keywords.map(escapeHtml).join(", ")}</p><p>${icon.status === "draft" ? "Черновик" : "Готово к выпуску"}</p></div><div class="comparison">${changed ? `<div class="version"><h3>До</h3><div class="surfaces">${renderSamples(previous, "light")}${renderSamples(previous, "dark")}</div></div>` : ""}<div class="version">${changed ? "<h3>После</h3>" : ""}<div class="surfaces">${renderSamples(icon.svg, "light")}${renderSamples(icon.svg, "dark")}</div></div></div></section>`;
}

const rows = [];
for (const icon of icons) {
  let previous = null;
  if (baseRoot) {
    try {
      previous = validateSvg(
        await readFile(join(baseRoot, "icons", `${icon.slug}.svg`), "utf8"),
        icon.slug,
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  rows.push(renderIcon(icon, previous));
}

const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Предпросмотр иконок</title>
  <style>
    :root{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#171717;background:#f8f8f7;font-synthesis:none}
    *{box-sizing:border-box}
    body{margin:0}
    main{max-width:1120px;margin:auto;padding:48px 24px 72px}
    header{border-bottom:1px solid #d8d8d5;padding-bottom:28px;margin-bottom:12px}
    h1{font-size:clamp(26px,3vw,36px);letter-spacing:-.035em;line-height:1.1;margin:0 0 10px}
    header p{color:#61615f;margin:0;font-size:14px}
    .icon-row{display:grid;grid-template-columns:190px minmax(0,1fr);gap:24px;padding:24px 0;border-bottom:1px solid #e0e0dd}
    .details{min-width:0}
    h2{font-size:17px;letter-spacing:-.02em;margin:0 0 5px}
    code{font-size:12px;color:#666}
    .details p{font-size:12px;line-height:1.5;color:#777;margin:14px 0 0;overflow-wrap:anywhere}
    .comparison{display:grid;gap:18px;min-width:0}
    .version{min-width:0}
    h3{font-size:12px;font-weight:600;margin:0 0 8px;color:#555}
    .surfaces{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .sample{min-width:0;border-radius:8px;padding:14px 16px 12px}
    .light{background:#fff;color:#171717;border:1px solid #e5e5e3}
    .dark{background:#1d1d1d;color:#f5f5f4;border:1px solid #1d1d1d}
    .sample-label{font-size:11px;color:inherit;opacity:.62;margin-bottom:17px}
    .sizes{display:flex;align-items:end;justify-content:space-between;gap:10px}
    .size{display:grid;justify-items:center;gap:10px;min-width:24px}
    .art{height:26px;display:grid;place-items:center}
    .size-label{font-size:11px;font-variant-numeric:tabular-nums;opacity:.55}
    @media(max-width:700px){main{padding:30px 16px 48px}.icon-row{grid-template-columns:1fr;gap:14px;padding:22px 0}.details p{margin-top:8px}}
    @media(max-width:390px){.surfaces{grid-template-columns:1fr}.sample-label{margin-bottom:12px}}
  </style>
</head>
<body><main><header><h1>Предпросмотр иконок</h1><p>Размеры 16, 20 и 24 px</p></header>${rows.join("")}</main></body>
</html>`;

const output = join(root, "preview", "index.html");
await mkdir(dirname(output), { recursive: true });
await writeFile(output, html);
process.stdout.write(`Built ${output}\n`);
