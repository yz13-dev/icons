---
name: release-icons
description: Prepare and verify a versioned release of @yz13/icons. Use for release preparation, npm archive review, or publishing handoff; not for drawing or reviewing individual icons.
---

# Release @yz13/icons

Read `docs/RELEASING.md`, `AGENTS.md`, `packages/react/package.json`, and `CHANGELOG.md`. Use the current repository state and user instructions to determine whether the task is preparation, the first manual npm publication, or a later Trusted Publisher release. A request to prepare a release does not authorize publishing it.

Before changing files, inspect the branch, working tree, package version, npm publishing state when relevant, and whether `main` has commits. Preserve unrelated changes. Keep the ignored `docs/private/` directory out of Git. Version and date changes belong in a release PR when the repository has a PR base.

For a release candidate, ensure every icon in `metadata/` is `ready`; record added and changed icons under the target version in `CHANGELOG.md`; update the package version and `bun.lock`; check the release date and MIT copyright holder. Do not change the SVG contract or accept draft icons as part of release preparation. If artwork needs review, use `review-icons` before marking it `ready`.

Run `bun install --frozen-lockfile`, `bun run check`, `bun run preview`, and `node scripts/assert-release.mjs v<version>`. Inspect the preview at 16, 20, and 24 px on both backgrounds if icons changed since their last visual acceptance. Run `npm pack --dry-run` in `packages/react` and inspect the file list for React modules, types, metadata, SVGs, README, LICENSE, and the expected version. If npm's default cache is unwritable, use a task-local cache under `/private/tmp` without changing ownership of the user's global cache.

When the task includes a release commit, make it after these checks. Stage only the release files, review `git diff --cached`, and use the short English one-line message `chore: prepare v<version> release` with no body or trailers. Keep `docs/private/`, `preview/`, `packages/react/dist/`, and the generated package `LICENSE` out of the commit. A commit, a Git push, and a release tag are separate actions; do not treat the commit as authorization for the other two.

For the first publication, a GitHub Release may use tag `v0.1.0` only after verifying that `.github/workflows/publish.yml` excludes it from npm publication. Hand the verified candidate to the user for manual `npm stage publish --access public` and 2FA approval as described in `docs/RELEASING.md`. After the package exists, the user can configure Trusted Publisher for subsequent versions.

For later releases, verify Trusted Publisher settings and that the release commit is on `main` before sending a version tag, since pushing it triggers npm publication. Never infer authorization to publish, push a release tag, or approve an npm stage from a request to prepare or check a release. Report the exact validated version, checks, archive contents, and remaining human actions.
