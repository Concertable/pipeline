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

### Renovate reads pins that Dependabot parses natively

The organization preset owns every dependency update in the estate, including seven custom managers for
the `Directory.Packages.props` release-train properties. Dependabot's NuGet updater evaluates MSBuild
properly since its 2025 rewrite, so those pins are a standard file format read by a bot that had to be
taught them by regex.

The durable split is by file format, not by tool preference: Dependabot owns what it natively parses
(`Directory.Packages.props`, workflow action pins, `package.json`), and Renovate is retained only for
`system/compatibility/local.yaml`, whose shape no Dependabot ecosystem can read. A regex manager is a
way to teach a tool a format it does not know; where the format is already standard, it is the wrong
mechanism.

Two things must be settled before the cut, and neither is proven yet:

- Whether Dependabot advances the *property declaration* (`<ConcertablePaymentVersion>`) or writes the
  resolved version onto the `PackageVersion` element instead. Test it against `payment` alone, which
  carries real drift, before touching any other repository.
- Whether Dependabot can read the private feed without a personal access token in an organization
  Dependabot secret. Renovate authenticates to `*.pkg.github.com` from its own installation token; if
  Dependabot needs a minted credential, that cost belongs in this decision.

The cut also loses a property nothing else replaces: one bot means a service's package pin and its image
digest move in a single pull request and cannot diverge. Two bots means two pull requests landing
independently. `system`'s `TECH_DEBT.md` carries the test that has to exist before that is safe.

**Resolves when:** `Directory.Packages.props`, workflow and npm pins are raised by Dependabot; the
preset retains only the manifest managers; Renovate's installation is scoped to the repositories that
still need it; and the two questions above are answered by an actual run rather than by documentation.
