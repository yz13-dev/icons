---
name: draw-icon
description: Create or refine source SVG icons and metadata in this repository using its drawing contract. Use for requests to add, redraw, or rename an icon; not for catalog UI or package release work.
---

# Draw an icon

Read `CONTRIBUTING.md`, the relevant neighboring SVGs and metadata, and `scripts/icons.mjs` before editing. Start from the icon's intended meaning and compare existing names so the new symbol does not duplicate one already present.

Create the SVG in `icons/` and matching JSON in `metadata/`. Follow the current 24×24 source contract and draw original geometry; Lucide is a style reference, not a source file. Keep `status: "draft"` until the drawing has been visually accepted. Preserve the source and license attribution if a derivative is explicitly approved.

Run `bun run validate` and `bun run preview`. Inspect the HTML at 16, 20 and 24 px on both backgrounds, next to related icons. Check clarity, alignment, optical weight and spacing by eye; the validator cannot judge those. If the icon is accepted as `ready`, update `CHANGELOG.md` under `Unreleased` and report what changed.
