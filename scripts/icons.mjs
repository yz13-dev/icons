import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { SVGPathData } from "svg-pathdata";

const svgOpen =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
const svgClose = "</svg>";
const slugPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const pathPattern = /<path d="([^"]+)"\s*\/>/g;
const pathDataPattern = /^[MmLlHhVvCcSsQqTtAaZz0-9.,+\-\s]+$/;

export function validateSvg(svg, slug) {
  const source = svg.trim();
  if (!source.startsWith(svgOpen) || !source.endsWith(svgClose)) {
    throw new Error(`${slug}: SVG root must match the 24px outline contract`);
  }

  const body = source.slice(svgOpen.length, -svgClose.length);
  const paths = [...body.matchAll(pathPattern)];
  if (paths.length === 0 || body.replace(pathPattern, "").trim() !== "") {
    throw new Error(`${slug}: only path elements are supported in this first drawing pass`);
  }

  for (const [, data] of paths) {
    if (!pathDataPattern.test(data) || !/^[Mm]/.test(data.trim())) {
      throw new Error(`${slug}: invalid path data`);
    }
    try {
      new SVGPathData(data);
    } catch {
      throw new Error(`${slug}: invalid path data`);
    }
  }

  return source;
}

function validateMetadata(metadata, slug) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error(`${slug}: metadata must be an object`);
  }
  const allowed = new Set(["title", "category", "keywords", "status"]);
  if (Object.keys(metadata).some((key) => !allowed.has(key))) {
    throw new Error(`${slug}: metadata has unsupported fields`);
  }
  if (typeof metadata.title !== "string" || !metadata.title.trim()) {
    throw new Error(`${slug}: title is required`);
  }
  if (typeof metadata.category !== "string" || !slugPattern.test(metadata.category)) {
    throw new Error(`${slug}: category must be kebab-case`);
  }
  if (
    !Array.isArray(metadata.keywords) ||
    metadata.keywords.length === 0 ||
    metadata.keywords.some(
      (word) => typeof word !== "string" || !word.trim() || word !== word.trim(),
    )
  ) {
    throw new Error(`${slug}: nonempty keywords are required`);
  }
  if (
    new Set(metadata.keywords.map((word) => word.toLowerCase())).size !== metadata.keywords.length
  ) {
    throw new Error(`${slug}: keywords must be unique`);
  }
  if (!new Set(["draft", "ready"]).has(metadata.status)) {
    throw new Error(`${slug}: status must be draft or ready`);
  }
  return metadata;
}

export async function loadIcons(root) {
  const iconFiles = (await readdir(join(root, "icons")))
    .filter((name) => name.endsWith(".svg"))
    .sort();
  const metadataFiles = (await readdir(join(root, "metadata")))
    .filter((name) => name.endsWith(".json"))
    .sort();
  const iconNames = iconFiles.map((name) => name.slice(0, -4));
  const metadataNames = metadataFiles.map((name) => name.slice(0, -5));

  if (iconNames.length === 0) {
    throw new Error("No SVG icons found");
  }
  for (const slug of [...iconNames, ...metadataNames]) {
    if (!slugPattern.test(slug)) {
      throw new Error(`${slug}: filename must be kebab-case`);
    }
  }
  if (iconNames.join("\n") !== metadataNames.join("\n")) {
    throw new Error("Every SVG must have one matching metadata JSON file");
  }

  const icons = await Promise.all(
    iconNames.map(async (slug) => {
      const svg = validateSvg(await readFile(join(root, "icons", `${slug}.svg`), "utf8"), slug);
      const metadata = validateMetadata(
        JSON.parse(await readFile(join(root, "metadata", `${slug}.json`), "utf8")),
        slug,
      );
      return { slug, svg, ...metadata };
    }),
  );

  const titles = new Set();
  const drawings = new Map();
  for (const icon of icons) {
    const title = icon.title.toLowerCase();
    if (titles.has(title)) {
      throw new Error(`${icon.slug}: duplicate title`);
    }
    titles.add(title);

    const drawing = [...icon.svg.matchAll(pathPattern)]
      .map(([, data]) => data.replace(/\s+/g, " ").trim())
      .join("|");
    if (drawings.has(drawing)) {
      throw new Error(`${icon.slug}: same drawing as ${drawings.get(drawing)}`);
    }
    drawings.set(drawing, icon.slug);
  }

  return icons;
}
