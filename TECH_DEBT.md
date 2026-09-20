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

### HIGH — Renovate cannot read the private feed, so no first-party pin is ever raised

Third-party bumps work. Every `Concertable.*` lookup fails with `no-result`, in every repository, on
runs made after the `registryUrls` rule landed. That rule was necessary but not sufficient: it fixed
*which* feed is queried and nothing about being allowed to read it.

Measured directly against the feed:

| Request | Result |
|---|---|
| `GET nuget.pkg.github.com/Concertable/index.json`, no credential | **401** |
| same, with a `read:packages` token | **200** |

So `no-result` is a swallowed 401. Renovate auto-provisions a host rule for `*.pkg.github.com` from its
own platform token, but the Mend app's platform token is a GitHub App installation token, and GitHub
Packages' NuGet registry does not accept one — it wants a personal access token. Compounding it, 59 of
the 62 first-party packages are still bound to the **archived** `concertable` monorepo rather than to
the repositories that now publish them.

This is the gap the whole auto-bump effort exists to close: the pins that were hand-edited across
Payment, B2B, Search and System are exactly the ones still unreachable.

Closing it needs a credential, which is an account-level action:

- Mint a token with `read:packages` that can see the org's packages.
- Give it to Renovate as a `hostRules` entry for `nuget.pkg.github.com`, with the token encrypted at
  Mend's encryption endpoint so no secret enters this repository in plaintext — or set it in the Mend
  Developer Platform against the organization.

Worth weighing at the same time: rebinding the 59 packages to their owning repositories would make the
installation token's own `packages: read` sufficient and remove the credential entirely. That is the
larger, more durable fix, and it also removes an archived repository from the publishing path.

**Resolves when:** a Renovate run raises a `Concertable.*` pin in a consumer repository, and no
dependency dashboard reports `no-result` for a first-party package.
