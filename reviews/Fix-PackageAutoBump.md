# Code review — Fix/PackageAutoBump

> **This file is a work order, not a discussion.** If you're handed this file, fix the open `[ ]`
> findings directly and report what changed. Tick each `[x]` as you land it. Pause only for a genuinely
> irreversible or ambiguous finding: record its durable disposition, take the safe path, and keep going.

**Review status:** `complete`
**Reviewed up to commit:** `9d446b52ceefcaeabfc87754740f7b16d746d316`  `(2026-09-19)`
**Judgment:** `approved`

## Review pass — 2026-09-19 — native-general + renovate-config correctness

**Candidate base:** `463f8548f9324a045c07fd8a98fb68954bbc5e08`
**Candidate head:** `9d446b52ceefcaeabfc87754740f7b16d746d316`
**Candidate branch:** `Fix/PackageAutoBump`
**Candidate scope:** `all`
**Candidate path-set:** `sha256:e728ab4d3fb799d8fa4dc6fd072be55dfcd6133b03beb3a8f68cee6ca9671328` `(7 paths)`
**Work-order path:** `reviews/Fix-PackageAutoBump.md`
**Work-order mode:** `new`
**Pass judgment:** `approved`

### Findings

- [x] **HIGH — this repository's own fixtures were dependency files.** The two manifest managers
  match on filename, and `fixtures/compatibility-manifest.json`, `fixtures/environment-manifest.json`
  and the new `fixtures/compatibility-local.yaml` all satisfy those patterns. Adding `renovate.json`
  to this repository in the same branch turned that from latent into live: Renovate would have raised
  the samples to real published versions, and `Renovate sees package versions and image digests in
  both manifest owners` pins their exact values, so each such pull request would have sat permanently
  red. Fixed in `9d446b5` with a `**/fixtures/**` exclusion in the preset and a test asserting both
  that the rule exists and that the fixtures still match a manager.

- [x] **HIGH — the aggregation gate failed a wholly green run.** `ci-complete` compared
  `join(needs.*.result, ',')` against the literal `success`, which held only while it had one need.
  Adding the preset-validator job made the join `success,success`, so the required context went red on
  a green run. Fixed in `9d8aea2`, with a test asserting the comparison form.

Checked and not retained:

- The relaxed package matcher cannot cross a JSON string boundary — `depName` excludes `"` and `@`, so
  `["nuget:A@1.2.3","npm:@concertable/shared@1.2.3"]` still yields exactly two dependencies, which the
  existing assertion pins.
- `semver` rather than `docker` versioning on the image manager is correct for these tags: the train
  tags are valid semver prereleases, the commit-SHA and `latest` tags are not parseable and are
  filtered out, and `ignoreUnstable` does not suppress a prerelease-to-prerelease move.
- The six manifest train managers are anchored to a two-space indent under `services:`. The `images:`
  block repeats those keys, but with no scalar on the line, so there is no collision. Verified by
  extracting against the real `origin/main` file: exactly six dependencies, identical in name and
  value to the six from `Directory.Packages.props`, which is what keeps `ReleaseTrainPinTests` green
  through a bump.
- A silent regex drift here fails loudly rather than silently: it lands as a red `ReleaseTrainPinTests`
  on the bump PR, not as a pin that quietly stops moving.
