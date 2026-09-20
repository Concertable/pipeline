# Consuming the organization workflows

Consumer repositories call these workflows from thin repository-owned workflows. Pin every call to a full
commit SHA. Nothing advances that pin for you: this repository publishes no release tag, so a bare SHA
gives Renovate no version to move to. Raise it by hand, or see the debt entry in
[TECH_DEBT.md](../TECH_DEBT.md).

```yaml
jobs:
  dotnet:
    uses: Concertable/pipeline/.github/workflows/dotnet-ci.yml@<full-commit-sha>
    with:
      solution: Concertable.Auth.slnx
    permissions:
      contents: read
      packages: read
```

The caller owns triggers, path selection, service-specific validation, environments, and the final
`ci-complete` aggregation job. Every required caller handles both `pull_request` and `merge_group`, and the
aggregation job's displayed `name` is exactly `ci-complete`; the shared ruleset relies on that check context.
Publication callers pass `publish: false` in pull requests and may set it to `true` only from an explicit
dispatch or release on a protected ref. Verification jobs remain read-only; release environments guard the
separately privileged publication jobs.

Available contracts:

- `dotnet-ci.yml`: restore, Release build, and optional tests for one solution or project.
- `node-ci.yml`: clean npm install followed by selected lint, typecheck, test, and build scripts.
- `nuget-publish.yml`: pack, attest, optionally publish, and retain NuGet packages. A caller whose
  package ids are still bound to a different repository passes `secrets: {PACKAGES_TOKEN: ...}`,
  because `GITHUB_TOKEN` only authorises packages bound to the calling repository. Publication runs
  from a dispatch or a release; a caller whose version advances per commit adds
  `publish-on-push: true` so a merge to its protected default branch publishes without a second
  manual step. The protected-ref requirement and the `release` environment still apply, so the
  opt-in widens the trigger and not the authority.
- `npm-publish.yml`: install/test, pack, clean-consumer install, attest, and optionally publish one npm package.
- `container-publish.yml`: BuildKit build, critical-vulnerability scan, SBOM/provenance, keyless signing, and optional GHCR push.
- `apphost-smoke.yml`: restore/build an AppHost and require a health endpoint before timeout.
- `terraform-ci.yml`: recursive formatting, backend-free initialization, validation, and optional plan.
- `compatibility-manifest.yml`: immutable service-image/package set and system-qualification evidence.
- `configuration-manifest.yml`: environment image pins, non-secret App Configuration values, and Key Vault references.
- `configuration-promotion.yml`: compatibility evidence, rollout order, and rollback linkage.
- `configuration-rollback.yml`: immutable last-known-good target and operator/runbook evidence.

`repository-settings/` contains declarative templates, not raw endpoint payloads. Run
`pwsh scripts/apply-repository-settings.ps1 -Repository Concertable/<name> -OwnerTeamSlug <declared-slug>` to create/update teams, grant the
declared owner team, create the release environment, and replace the main ruleset after resolving live team
and repository IDs. The script strips derived team slugs from create requests and verifies the returned
policy-bearing fields, including the repository settings in `repository-settings/repository.json` — a merge queue is unusable without `allow_auto_merge`, and the merge methods there are what the ruleset's `allowed_merge_methods` expects. Valid owner slugs are declared in `repository-settings/teams.json`. Templates contain no secret values.

The main ruleset requires no approving review, deliberately. GitHub forbids a pull request's author from
approving it, so in a single-maintainer organization an approval count of 1 is unsatisfiable: every merge
becomes an admin bypass, and a bypassed merge skips the merge queue and its required checks entirely.
Gating here is `ci-complete` plus the queue, which actually run. Restore the approval count when a second
maintainer exists, not before.

The accepted manifest shapes are documented in [MANIFEST_CONTRACTS.md](MANIFEST_CONTRACTS.md). They deliberately
record dependency names and immutable digests/versions in a Renovate-readable form.

## Dependency updates

`renovate-config.json` is the organization preset and the only owner of the policy. A repository opts in
with a `renovate.json` holding nothing but
`{"extends": ["github>Concertable/pipeline:renovate-config.json"]}`; it never restates a rule locally.

The preset reads three pin owners: every release-train property in `Directory.Packages.props`, the
`platform` and `services` trains in `compatibility/local.yaml`, and the canonical
`ghcr.io/concertable/<image>:<tag>@sha256:<digest>` references in that file and in a published manifest.
Each producer's packages and its images share one group, so a train's package pin and its image digest
move in one pull request — which is what keeps a consumer's two declarations of one version equal.

A first-party update waives `minimumReleaseAge`, because that delay is third-party supply-chain latency
and these trains publish per commit; it then automerges on its own green `ci-complete`. A major update
never automerges and waits on the dependency dashboard.

Renovate is a GitHub App. It updates nothing in a repository until the app is installed on the
organization with access to that repository, *and* the organization is onboarded on Mend's Developer
Platform — installing the app alone leaves every job unrun with nothing to see from GitHub.

Mend onboards an organization as `Scan Only`, which runs Renovate in `mode: silent`: it scans
everything and opens nothing, which reads exactly like a bot that never started. The preset sets
`mode: full` to override that default, so the platform setting does not silently decide whether any of
this works.
