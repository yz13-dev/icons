import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadIcons } from "./icons.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const icons = await loadIcons(root);
process.stdout.write(`Validated ${icons.length} icons\n`);
