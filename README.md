# Concertable pipeline

Shared, reusable pipeline machinery: the reusable workflows and composite actions every repository
calls, the scripts those workflows run, the repository-policy templates, and the Renovate preset.

## What belongs here

One admission rule: **CI or a release runs it.** A reusable workflow, a composite action, a script a
workflow invokes, or the policy data that provisions a repository.

Developer-machine tooling does not qualify, however shared it is — `worktrees.ps1`, `docker-health.ps1`
and the agent bootstrap scripts belong to `agent-standards`. Code that ships inside a build does not
qualify either; that is a published package from `platform-dotnet` or `platform-frontend`, and build and
analyzer law reaches consumers through `Concertable.Build`.

Without that rule this repository becomes the estate's dumping ground.

## How consumers call it

Pin every call to a full commit SHA — never `@main`, which changes a consumer's build with no pull
request in that consumer. Consumers keep thin trigger workflows and their own `ci-complete` job; they do
not copy the shared implementation.

See [the consumer contracts](docs/CONSUMING_WORKFLOWS.md) before adopting a workflow, action or policy
template.
