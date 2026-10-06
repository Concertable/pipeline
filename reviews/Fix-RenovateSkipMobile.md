# Code review — Fix/RenovateSkipMobile

> **This file is a work order, not a discussion.** If you're handed this file, fix the open `[ ]`
> findings directly and report what changed. Tick each `[x]` as you land it. Pause only for a genuinely
> irreversible or ambiguous finding: record its durable disposition, take the safe path, and keep going.

**Review status:** `complete`
**Reviewed up to commit:** `1ed178ae6d34b4e6ddc145c584caadb731708ef1`  `(2026-10-06)`
**Judgment:** `approved`

## Review pass — 2026-10-06 — native-general

**Candidate base:** `fcbcbbcc856e3990f9153f6c2b38d8c838c327ea`
**Candidate head:** `451ab0efc7dbd33976369f5b7fd8b3ec589c10db`
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
