# Code review — Fix/RenovateDigestAgeGate

> **This file is a work order, not a discussion.** If you're handed this file, fix the open `[ ]`
> findings directly and report what changed. Tick each `[x]` as you land it. Pause only for a genuinely
> irreversible or ambiguous finding: record its durable disposition, take the safe path, and keep going.

**Review status:** `complete`
**Reviewed up to commit:** `fd0c64c7228647c84893a94b989869724319e584`  `(2026-10-06)`
**Judgment:** `approved`

## Review pass — 2026-10-06 — native-general

**Candidate base:** `6abd4b81a65844785590b07d9583aefaf4207093`
**Candidate head:** `fd0c64c7228647c84893a94b989869724319e584`
**Candidate branch:** `Fix/RenovateDigestAgeGate`
**Candidate scope:** `all`
**Work-order mode:** `new`
**Native layer:** built-in `code-review` skill, effort `medium`, over `66238d2..a8d1a9e`; these
commits are cherry-picks of that reviewed patch (`b041832929819960d3ada51ca90260c8bc040ceb`) and its wording fix (`fd0c64c7228647c84893a94b989869724319e584`) after
Fix/RenovateSkipMobile merged without them.
**Pass judgment:** `approved`

### Findings

- [x] **LOW — the docs and rule description said every digest skips the age gate.** Only a digest
  whose tag has no release timestamp does; one with a timestamp still waits 3 days. Wording corrected.

Checked and not retained:

- `timestamp-optional` lets a third-party digest on a floating ref (`latest`, `@main`) merge without
  the 3-day wait. It changes only updates that have no timestamp, which under `timestamp-required`
  stayed pending on `renovate/stability-days` forever (pipeline#15, customer#19, agents#127,
  system#19, payment#23 since 2026-09-20). For those the choice is merging on green CI or never
  updating; the owner wants them merging.
