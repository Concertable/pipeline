# Tech debt

## MED

### A reusable-workflow call pinned to a bare SHA cannot be advanced automatically

Every consumer pins its call as `uses: Concertable/pipeline/.github/workflows/<name>.yml@<40-hex>`, and
this repository publishes no tag or release. Renovate's `github-actions` manager needs a version to
advance a reference to; a bare digest with no `# <tag>` comment gives it none, so it reports nothing and
the pin sits at whatever commit a human last pasted.

The `Immutable release tags` ruleset in `repository-settings/rulesets/release-tags.json` already protects
`refs/tags/v*`, so the guard the fix needs exists and only the release cadence is missing.

**Resolves when:** this repository cuts `v*` release tags, consumers pin as `@<sha> # <tag>`, and a
Renovate run raises one of those pins.
