import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const tag = process.argv[2];
if (!/^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/.test(tag ?? "")) {
  throw new Error("Release tag must be a stable semver tag such as v0.1.0");
}

const packagePath = resolve("packages/react/package.json");
if (!existsSync(packagePath)) {
  throw new Error("React package is not built yet: packages/react/package.json is missing");
}

const manifest = JSON.parse(readFileSync(packagePath, "utf8"));
if (manifest.name !== "@yz13/icons" || manifest.private === true) {
  throw new Error("Only a public @yz13/icons package may be released");
}
if (tag !== `v${manifest.version}`) {
  throw new Error(`Tag ${tag} does not match package version ${manifest.version}`);
}
if (manifest.repository?.url !== "https://github.com/yz13-dev/icons.git") {
  throw new Error("Package repository URL must match github.com/yz13-dev/icons");
}
if (!existsSync(resolve("LICENSE"))) {
  throw new Error("Choose and add a LICENSE before publishing");
}
if (manifest.license !== "MIT") {
  throw new Error("Package license must match the repository MIT license");
}
for (const file of readdirSync(resolve("metadata"))) {
  if (file.endsWith(".json")) {
    const metadata = JSON.parse(readFileSync(resolve("metadata", file), "utf8"));
    if (metadata.status !== "ready") {
      throw new Error(`${file}: only ready icons can be published`);
    }
  }
}
if (!readFileSync(resolve("CHANGELOG.md"), "utf8").includes(`## [${manifest.version}]`)) {
  throw new Error(`CHANGELOG.md needs a section for ${manifest.version}`);
}

process.stdout.write(`Release ${manifest.name}@${manifest.version} verified\n`);
