import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { rolldown } from "rolldown";
import { loadIcons } from "./icons.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "packages/react/dist");
const icons = await loadIcons(root);

function componentName(slug) {
  return `${slug
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("")}Icon`;
}

function componentSource(icon) {
  const name = componentName(icon.slug);
  const paths = [...icon.svg.matchAll(/<path d="([^"]+)"\s*\/>/g)]
    .map(([, data]) => `createElement("path", { d: ${JSON.stringify(data)} })`)
    .join(",\n    ");

  return `import { createElement, forwardRef } from "react";

export const ${name} = forwardRef(function ${name}(props, ref) {
  const {
    size = 24,
    strokeWidth = 2,
    children,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledby,
    "aria-hidden": ariaHidden,
    ...rest
  } = props;
  const hasName = Boolean(ariaLabel || ariaLabelledby);

  return createElement(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      role: hasName ? "img" : undefined,
      focusable: "false",
      ...rest,
      width: size,
      height: size,
      ref,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledby,
      "aria-hidden": ariaHidden ?? !hasName,
    },
    ${paths},
    children,
  );
});
`;
}

const names = new Set();
for (const icon of icons) {
  const name = componentName(icon.slug);
  if (names.has(name)) {
    throw new Error(`${icon.slug}: duplicate React component name ${name}`);
  }
  names.add(name);
}

await rm(output, { recursive: true, force: true });
await mkdir(join(output, "svg"), { recursive: true });

const sourceLicense = join(root, "LICENSE");
const packageLicense = join(root, "packages/react/LICENSE");
if (existsSync(sourceLicense)) {
  await copyFile(sourceLicense, packageLicense);
} else {
  await rm(packageLicense, { force: true });
}

const modules = new Map();
const input = { index: "virtual:yz13-icons/index" };

for (const icon of icons) {
  const name = componentName(icon.slug);
  const id = `virtual:yz13-icons/${icon.slug}`;
  input[icon.slug] = id;
  modules.set(id, componentSource(icon));
  await writeFile(
    join(output, `${icon.slug}.d.ts`),
    `import type { IconComponent } from "./types.js";\nexport declare const ${name}: IconComponent;\n`,
  );
  await copyFile(join(root, "icons", `${icon.slug}.svg`), join(output, "svg", `${icon.slug}.svg`));
}

modules.set(
  input.index,
  icons
    .map((icon) => `export { ${componentName(icon.slug)} } from "virtual:yz13-icons/${icon.slug}";`)
    .join("\n"),
);

const bundle = await rolldown({
  input,
  external: ["react"],
  experimental: { attachDebugInfo: "none" },
  plugins: [
    {
      name: "yz13-icon-components",
      resolveId(id) {
        return modules.has(id) ? `\0${id}` : null;
      },
      load(id) {
        return modules.get(id.slice(1)) ?? null;
      },
    },
  ],
});

try {
  await bundle.write({
    dir: output,
    format: "es",
    entryFileNames: "[name].js",
    chunkFileNames: "chunks/[name]-[hash].js",
  });
} finally {
  await bundle.close();
}

await writeFile(
  join(output, "types.d.ts"),
  `import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";\nexport type IconProps = Omit<SVGProps<SVGSVGElement>, "width" | "height"> & { size?: number | string };\nexport type IconComponent = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;\n`,
);
await writeFile(
  join(output, "index.d.ts"),
  `export type { IconComponent, IconProps } from "./types.js";\n${icons.map((icon) => `export { ${componentName(icon.slug)} } from "./${icon.slug}.js";`).join("\n")}\n`,
);
await writeFile(
  join(output, "metadata.json"),
  JSON.stringify(
    icons.map(({ slug, title, category, keywords, status }) => ({
      slug,
      title,
      category,
      keywords,
      status,
    })),
    null,
    2,
  ) + "\n",
);
await writeFile(
  join(output, "metadata.d.ts"),
  `export interface IconMetadata {\n  slug: string;\n  title: string;\n  category: string;\n  keywords: string[];\n  status: "draft" | "ready";\n}\ndeclare const metadata: IconMetadata[];\nexport default metadata;\n`,
);

process.stdout.write(`Built ${icons.length} React icons in ${output}\n`);
