# Code review — Fix/RenovateSilentMode

> **This file is a work order, not a discussion.** If you're handed this file, fix the open `[ ]`
> findings directly and report what changed. Tick each `[x]` as you land it. Pause only for a genuinely
> irreversible or ambiguous finding: record its durable disposition, take the safe path, and keep going.

**Review status:** `complete`
**Reviewed up to commit:** `a920714bd41b6cf8b8cd2d6bf58b3199347ed476`  `(2026-09-19)`
**Judgment:** `approved`

## Review pass — 2026-09-19 — native-general + renovate-config correctness

**Candidate base:** `ea6b494231ae0ea7c403d6933b952376164d04b2`
**Candidate head:** `a920714bd41b6cf8b8cd2d6bf58b3199347ed476`
**Candidate branch:** `Fix/RenovateSilentMode`
**Candidate scope:** `all`
**Candidate path-set:** `sha256:11e28e82c8f023b2dc4e6db24bc36a98f4ea2e07fe1e5a7b452d70bba289c336` `(3 paths)`
**Work-order path:** `reviews/Fix-RenovateSilentMode.md`
**Work-order mode:** `new`
**Pass judgment:** `approved`

### Findings

- [x] **HIGH — every repository was scanning and publishing nothing.** Mend onboards an organization
  as `Scan Only`, which is `mode: silent`. The org dashboard showed all fifteen repositories onboarded
  with jobs running, while GitHub showed no branches, no pull requests and no dependency dashboard.
  Nothing on the GitHub side distinguishes that from a bot that never started. Fixed by setting
  `mode: full` in the preset, which is Mend's own documented override, with a test pinning it.

- [x] **MEDIUM — the manifest managers silently extracted nothing from a CRLF checkout.** Each anchored
  on a bare `\n`, so the identical file materialised with Windows line endings matched zero
  dependencies and reported no error. It surfaced only because the fixture changed line endings between
  a freshly written file and a `git checkout`, making the suite pass or fail by environment. Fixed with
  `\r?\n`.

Checked and not retained:

- `mode` is a valid top-level option (`enum: ["full","silent"]`) in Renovate's published schema 44.103.3,
  and the preset validates against it. It is repository config rather than an admin-only setting, so a
  preset can carry it.
- Re-ran extraction against the real `origin/main` files after the CRLF change: `local.yaml` and
  `Directory.Packages.props` still yield the same six dependency names and values, which is what keeps
  a bump landing in one branch.
- The CRLF fix is the general form rather than a fixture-specific workaround — it holds for any
  consumer whose manifest is committed with Windows line endings.
