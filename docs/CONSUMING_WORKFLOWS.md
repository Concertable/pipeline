# Consuming the organization workflows

Consumer repositories call these workflows from thin repository-owned workflows. Pin every call to a full
commit SHA; Renovate updates that SHA after the consumer's own CI passes.

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
