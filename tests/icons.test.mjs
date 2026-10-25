import { readFileSync } from "node:fs";
import { expect, test } from "bun:test";
import { validateSvg } from "../scripts/icons.mjs";

const source = readFileSync(new URL("../icons/check.svg", import.meta.url), "utf8");

test("rejects an unfinished path command", () => {
  const svg = source.replace(/<path d="[^"]+"\s*\/>/, '<path d="M5 12.5 L"/>');
  expect(() => validateSvg(svg, "check")).toThrow("invalid path data");
});

test("rejects an invalid arc flag", () => {
  const svg = source.replace(/<path d="[^"]+"\s*\/>/, '<path d="M1 1 A7 7 0 2 1 4 4"/>');
  expect(() => validateSvg(svg, "check")).toThrow("invalid path data");
});
