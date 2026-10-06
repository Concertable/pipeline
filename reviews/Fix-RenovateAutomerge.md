# Code review — Fix/RenovateAutomerge

> **This file is a work order, not a discussion.** If you're handed this file, fix the open `[ ]`
> findings directly and report what changed. Tick each `[x]` as you land it. Pause only for a genuinely
> irreversible or ambiguous finding: record its durable disposition, take the safe path, and keep going.

**Review status:** `in-progress`
**Reviewed up to commit:** `022bb95`  `(2026-10-06)`
**Judgment:** `pending`

## Review pass — 2026-10-06 — native-general + api-contract + workflow

**Candidate base:** `7b78840e1a2bb9cef76cc5d974caa0d801d5ed65`
**Candidate head:** `f6bca8cd564bf7dac13a36340273a0c3d5c4f449`
**Candidate branch:** `Fix/RenovateAutomerge`
**Candidate scope:** `all`
**Candidate path-set:** `sha256:11e28e82c8f023b2dc4e6db24bc36a98f4ea2e07fe1e5a7b452d70bba289c336` `(3 paths)`
**Candidate bundle:** `.git/agent-workflow/runs/renovate-automerge-review/review/731dd00b912d445e13c6335a0af8a93791b521a832feae18104aedbf3a148ac2` `(identity sha256:fc14b92fcee9b3b1f27db9359a7dad1f5da0b3c9f67f638b5225978d2ac75ce6)`
**Work-order path:** `reviews/Fix-RenovateAutomerge.md`
**Work-order mode:** `new`
**Native layer:** built-in `code-review` skill, effort `high`
**Pass judgment:** `changes-requested`

### Findings

- [x] **HIGH — a third-party minor below 1.0 now automerged.** Dropping the first-party filter let a
  0.x minor, which semver allows to break, merge on green CI alone. Renovate's own
  `:automergeStableNonMajor` excludes them. Fixed with a later rule that holds a third-party 0.x minor
  on the dashboard like a major, exempting the first-party trains, which are all 0.x prereleases.

- [x] **MEDIUM — the Expo hold missed packages versioned in lockstep with React Native and React.**
  `@react-native/*` (babel-preset, metro-config) moves with `react-native`, and `react-test-renderer`
  must equal `react`. Neither is in `bundledNativeModules.json`, so they still automerged alone. Added
  to the `expo sdk` group.

- [x] **LOW — the new tests dereferenced rules they had not asserted exist.** A missing rule threw a
  TypeError instead of failing a named assertion, and nothing pinned the set of automerge holds. Added
  `assert.ok` guards and an assertion that the only holds are major, 0.x minor and `expo sdk`, each on
  the dashboard.

- [x] **LOW — the docs omitted the 3-day `minimumReleaseAge` gate and over-claimed the Expo list.** The
  rule also holds every `expo-*` package, not only the bundled ones. Docs now state both, and when to
  refresh the list.

Checked and not retained:

- `react`/`react-dom` held in web apps (both lenses). Every b2b web app pins `react` 19.1.0 exactly
  in the same npm workspace and root lockfile as `app/mobile`, and platform-frontend pins one React
  at its root with overrides. React cannot move in a web app without moving the Expo app, so the hold
  matches how the estate already versions it; documented.
- `@types/react` and `typescript` left out of the hold: a mismatch is a type error the consumer's CI
  typecheck reports red, unlike a native-module mismatch that no CI check sees.
- GitHub Actions now automerging (both lenses). Every bump is digest-pinned, waits 3 days, and runs in
  the PR's own CI in a consumer. In this repository the reusable workflows are not exercised by its
  CI, but consumers call them by commit SHA (`b2b`: `require-jobs-green@13e26af…`), so a bad bump
  reaches a consumer only when that consumer moves its pin and runs its own CI. Documented.
- The `/^expo(-|$)/` regex holding community `expo-*` packages: those are built against one SDK's
  `expo-modules-core`, so holding them with the SDK is the safer side. Documented.
- Scoping the hold with `matchFileNames`: the Expo manifests sit at `app/mobile/`, `packages/mobile/`
  and a workspace root, so a path filter would silently miss the root that pins `react-native`.

## Review pass — 2026-10-06 — incremental `f6bca8c..022bb95` — native-general

**Candidate base:** `f6bca8cd564bf7dac13a36340273a0c3d5c4f449`
**Candidate head:** `022bb95`
**Candidate branch:** `Fix/RenovateAutomerge`
**Candidate scope:** `all`
**Work-order mode:** `append`
**Native layer:** built-in `code-review` skill, effort `high`
**Pass judgment:** `changes-requested`

### Findings

- [x] **HIGH — one held 0.x action would hold every GitHub Actions update.** Renovate 44 computes a
  grouped branch's `dependencyDashboardApproval` as `some` and `automerge` as `every` of its updates
  (`workers/repository/updates/generate.js`), so `aquasecurity/trivy-action` at `v0.36.0` reaching
  0.37 would have parked the whole `github actions` group. The hold now carries
  `matchManagers: ["!github-actions"]` (negation verified in `util/string-match.js`).

- [x] **MEDIUM — the regex hold missed 0.0.x patches and range-pinned versions, and hid 0.x patch
  fixes behind a held minor.** Root cause: "pre-1.0 is breaking" was rebuilt from a version-string
  regex. Renovate 44 has a first-class `matchIsBreaking` matcher fed by each versioning scheme's
  `isBreaking` (`util/package-rules/is-breaking.js`, `workers/repository/process/lookup/generate.js`);
  npm's treats every update below 1.0 or from a prerelease as breaking. The regex rule is replaced by
  `matchIsBreaking: true` over `minor` and `patch`, so pin and digest updates still flow.

- [x] **MEDIUM — `@types/react` was not held with `react`.** Added `@types/react` and
  `@types/react-dom` to the `expo sdk` group.

- [x] **LOW — the exemption test never proved a third-party name stays held, and the holds label could
  throw.** Added negative cases and a label that falls back through `matchIsBreaking` and
  `description`.

Checked and not retained:

- NuGet 0.x minors now automerge: Renovate's NuGet scheme defines no `isBreaking`, so it falls back to
  `major`. That is the ecosystem's own definition, not a gap in this rule.
- `typescript` stays out of the hold: a mismatch is a type error the consumer's CI typecheck reports.

## Review pass — 2026-10-06 — incremental `022bb95..1ba5984` — native-general

**Candidate base:** `022bb95`
**Candidate head:** `1ba5984`
**Candidate branch:** `Fix/RenovateAutomerge`
**Candidate scope:** `all`
**Work-order mode:** `append`
**Native layer:** built-in `code-review` skill, effort `medium`
**Pass judgment:** `changes-requested`

### Findings

- [x] **HIGH — third-party NuGet updates below 1.0 lost their hold.** Renovate 44 sets `isBreaking`
  from the versioning scheme only where one defines it (`workers/repository/process/lookup/generate.js:58`);
  NuGet does not, so it falls back to `major` and a `TngTech.ArchUnitNET.xUnit` or `PdfPig` 0.x minor
  automerged. NuGet versions are SemVer 2.0, so the previous pass's "not retained" note calling this
  the ecosystem's own definition was wrong. Added a NuGet hold on `matchCurrentVersion: /^0\./` over
  `minor` and `patch` for NuGet and docker (which also lacks `isBreaking`), mirroring npm's treatment, exempting the first-party trains and `Reunion`
  (published by the owner, `tomjseery/Reunion`), with a test.
