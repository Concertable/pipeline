# Code review — Fix/RenovateSkipMobile

> **This file is a work order, not a discussion.** If you're handed this file, fix the open `[ ]`
> findings directly and report what changed. Tick each `[x]` as you land it. Pause only for a genuinely
> irreversible or ambiguous finding: record its durable disposition, take the safe path, and keep going.

**Review status:** `complete`
**Reviewed up to commit:** `6accb3ddb0f7a5421b19dd0eb3b123fc79466085`  `(2026-10-06)`
**Judgment:** `approved`

## Review pass — 2026-10-06 — native-general

**Candidate base:** `c0b7a06d24f1119754d804d8a2b544c3db779f34`
**Candidate head:** `a788a2846384791273620c6347cc48699b50756e`
**Candidate branch:** `Fix/RenovateSkipMobile`
**Candidate scope:** `all`
**Candidate path-set:** `sha256:5fea8ed2f6b324261628427b42ce09a21cf191887de916e07200efe4f3b32998` `(4 paths)`
**Candidate bundle:** `.git/agent-workflow/runs/renovate-skip-mobile-review/review/a82dd7a5554eb1b4eb50a01947bdb29015236cb4efcec2292d281f3ea84e0591` `(identity sha256:7f1824e430de0b8b4de47a1b07374832c495362b5e15c4db31b92df364318515)`
**Work-order path:** `reviews/Fix-RenovateSkipMobile.md`
**Work-order mode:** `new`
**Native layer:** built-in `code-review` skill, effort `medium`
**Pass judgment:** `approved`

### Findings

- [x] **MEDIUM — the debt entry claimed the mobile dependencies were frozen.** `matchFileNames` checks
  only a dependency's own package and lock files (`util/package-rules/files.js`), so root-level
  `overrides` of `react`/`react-dom` (b2b, customer) and platform-frontend's root `expo` and
  `react-native` still move and reach the mobile workspaces. The owner does not want mobile protected,
  so the wording was corrected rather than the rule widened.
