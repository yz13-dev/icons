---
name: review-icons
description: Validate and visually review SVG icons or an icon PR in this repository before acceptance. Use for requests to check drawing quality, metadata, duplicate meaning, or release readiness; not for general website review.
---

# Review icons

Read `CONTRIBUTING.md` and inspect the changed SVG and metadata alongside nearby icons. Run `bun run validate` and `bun run preview`. If a baseline checkout exists, pass it with `--base` to compare changed icons before and after.

Check separately:

1. Mechanical contract: filenames, SVG root and allowed elements, metadata fields, uniqueness and current validator result.
2. Visual contract: recognition at 16/20/24 px, safe zone, spacing, balance, density and consistent stroke on light and dark backgrounds.
3. Product fit: distinct meaning, useful keywords, correct `draft` or `ready` status, documented origin, and `CHANGELOG.md` entry when an accepted icon changes.

Report concrete findings with icon names and the smallest corrective action. Do not claim that passing validation proves visual or legal acceptance. Do not mark a draft as `ready` or create a release unless that decision was requested.
