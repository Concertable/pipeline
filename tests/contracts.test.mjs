import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const workflowsDirectory = new URL('../.github/workflows/', import.meta.url)
const workflowNames = readdirSync(workflowsDirectory).filter((name) => name.endsWith('.yml'))
const reusableNames = workflowNames.filter((name) => name !== 'ci.yml')

test('the repository exposes every required reusable workflow contract', () => {
  assert.deepEqual(reusableNames.sort(), [
    'apphost-smoke.yml',
    'compatibility-manifest.yml',
    'configuration-manifest.yml',
    'configuration-promotion.yml',
    'configuration-rollback.yml',
    'container-publish.yml',
    'dotnet-ci.yml',
    'node-ci.yml',
    'npm-publish.yml',
    'nuget-publish.yml',
    'terraform-ci.yml',
  ])
})

for (const name of reusableNames) {
  test(`${name} is callable and pins every external action`, () => {
    const workflow = readFileSync(new URL(name, workflowsDirectory), 'utf8')
    assert.match(workflow, /workflow_call:/)

    for (const [, reference] of workflow.matchAll(/^\s*-?\s*uses:\s*([^\s#]+).*$/gm)) {
      if (reference.startsWith('./')) continue
      const separator = reference.lastIndexOf('@')
      assert.notEqual(separator, -1, `${reference} has no ref`)
      assert.match(reference.slice(separator + 1), /^[0-9a-f]{40}$/, `${reference} is not SHA-pinned`)
    }
  })
}

test('policy templates and Renovate preset are valid JSON', () => {
  for (const path of [
    '../renovate-config.json',
    '../repository-settings/rulesets/main.json',
    '../repository-settings/rulesets/release-tags.json',
    '../repository-settings/environments/release.json',
    '../repository-settings/teams.json',
  ]) {
    assert.doesNotThrow(() => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')), path)
  }
})

test('CODEOWNERS routes organization policy to the platform team', () => {
  const codeowners = readFileSync(new URL('../.github/CODEOWNERS', import.meta.url), 'utf8')
  assert.match(codeowners, /^\* @Concertable\/platform-maintainers$/m)
})

test('required CI handles merge queues and emits the ruleset context', () => {
  const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8')
  assert.match(workflow, /^\s{2}merge_group:$/m)
  assert.match(workflow, /^\s{4}name: ci-complete$/m)
})

test('the aggregation gate survives a second required job', () => {
  const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8')
  const required = workflow.match(/^\s+needs: \[(.+)\]$/m)[1].split(',')
  assert.ok(required.length > 1)
  // join(needs.*.result) is "success,success" once a second job exists, so comparing it to the bare
  // literal fails a wholly green run - and fails it in the one check the ruleset requires.
  assert.doesNotMatch(workflow, /"\$RESULTS" = "success"/)
})

test('the complete durable owner-team roster is declared', () => {
  const teams = JSON.parse(readFileSync(new URL('../repository-settings/teams.json', import.meta.url), 'utf8'))
  assert.deepEqual(teams.map(({slug}) => slug).sort(), [
    'auth-maintainers', 'b2b-maintainers', 'configuration-maintainers', 'customer-maintainers',
    'frontend-platform-maintainers', 'infrastructure-maintainers', 'payment-maintainers',
    'platform-maintainers', 'search-maintainers', 'system-maintainers',
  ])
})

test('settings verification handles reviewer shapes and paginated teams', () => {
  const executable = process.platform === 'win32' ? 'powershell.exe' : 'pwsh'
  const fixture = fileURLToPath(new URL('./repository-settings.test.ps1', import.meta.url))
  const executionPolicy = process.platform === 'win32' ? ['-ExecutionPolicy', 'Bypass'] : []
  const result = spawnSync(executable, ['-NoProfile', '-NonInteractive', ...executionPolicy, '-File', fixture], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr || result.stdout)
})

// Selected by what each manager targets rather than by its index: the previous version read
// customManagers[0] and [1] positionally, so adding a manager ahead of them silently repointed
// every assertion at the wrong one.
const renovateConfig = () => JSON.parse(readFileSync(new URL('../renovate-config.json', import.meta.url), 'utf8'))
const managersFor = (config, fragment) =>
  config.customManagers.filter(({managerFilePatterns}) => managerFilePatterns.some((pattern) => pattern.includes(fragment)))

test('Renovate sees package versions and image digests in both manifest owners', () => {
  const config = renovateConfig()
  const compatibility = readFileSync(new URL('../fixtures/compatibility-manifest.json', import.meta.url), 'utf8')
  const environment = readFileSync(new URL('../fixtures/environment-manifest.json', import.meta.url), 'utf8')
  const [packages, images] = managersFor(config, 'manifest')
  assert.equal(managersFor(config, 'manifest').length, 2)
  const packageMatches = [...compatibility.matchAll(new RegExp(packages.matchStrings[0], 'g'))]
  assert.deepEqual(packageMatches.map(({groups}) => [groups.datasource, groups.depName, groups.currentValue]), [
    ['nuget', 'Concertable.Auth.Contracts', '1.2.3'],
    ['npm', '@concertable/shared', '1.2.3'],
  ])
  assert.match(compatibility, new RegExp(images.matchStrings[0]))
  assert.match(environment, new RegExp(images.matchStrings[0]))
})

test('Renovate reads every release-train pin a consumer declares', () => {
  const config = renovateConfig()
  const trains = managersFor(config, 'Directory')
  const declared = trains.map(({matchStrings}) => matchStrings[0].match(/<(Concertable\w+Version)>/)[1])
  assert.deepEqual(declared, [
    'ConcertableDotNetPlatformVersion',
    'ConcertableAuthVersion',
    'ConcertableB2BContractsVersion',
    'ConcertableCustomerVersion',
    'ConcertablePaymentVersion',
    'ConcertableSearchVersion',
    'ConcertableSystemVersion',
  ])
  // A train whose package does not resolve is a manager that reports no update and says nothing.
  assert.ok(trains.every(({depNameTemplate, datasourceTemplate, registryUrlTemplate}) =>
    depNameTemplate.startsWith('Concertable.') && datasourceTemplate === 'nuget' && registryUrlTemplate.includes('nuget.pkg.github.com')))
  const props = declared.map((property) => `    <${property}>0.2.0-alpha.0.1</${property}>`).join('\n')
  for (const {matchStrings} of trains) {
    assert.match(props, new RegExp(matchStrings[0]))
  }
})

test('the manifest managers reach a YAML manifest owner', () => {
  const config = renovateConfig()
  for (const {managerFilePatterns} of managersFor(config, 'manifest')) {
    const patterns = managerFilePatterns.map((pattern) => new RegExp(pattern.slice(1, -1)))
    assert.ok(patterns.some((pattern) => pattern.test('compatibility/local.yaml')),
      'system/compatibility/local.yaml is the only manifest in the estate and it is YAML')
  }
})

// Reaching the file is not reading it: these managers required a JSON-quoted canonical string, so
// against the one manifest the estate actually commits they matched nothing and reported nothing.
const qualifiedManifest = () => readFileSync(new URL('../fixtures/compatibility-local.yaml', import.meta.url), 'utf8')

test('every image in the YAML manifest owner extracts with its tag and digest', () => {
  const [, images] = managersFor(renovateConfig(), 'manifest')
  const matches = [...qualifiedManifest().matchAll(new RegExp(images.matchStrings[0], 'g'))]
  assert.deepEqual(matches.map(({groups}) => [groups.depName, groups.currentValue]), [
    ['ghcr.io/concertable/auth', '0.2.0-alpha.0.297'],
    ['ghcr.io/concertable/b2b-web', '0.2.0-alpha.0.292'],
    ['ghcr.io/concertable/payment-workers', '0.2.0-alpha.0.372'],
  ])
  assert.ok(matches.every(({groups}) => /^sha256:[0-9a-f]{64}$/.test(groups.currentDigest)))
})

test('the qualified trains extract under the same dependency name as the restored pin', () => {
  const config = renovateConfig()
  const manifest = qualifiedManifest()
  const qualified = managersFor(config, 'compatibility/local')
  assert.deepEqual(
    qualified.map(({depNameTemplate, matchStrings}) =>
      [depNameTemplate, manifest.match(new RegExp(matchStrings[0]))?.groups.currentValue]), [
      ['Concertable.Kernel', '0.2.0-alpha.0.5'],
      ['Concertable.Auth.Hosting', '0.2.0-alpha.0.297'],
      ['Concertable.B2B.Hosting', '0.2.0-alpha.0.292'],
      ['Concertable.Customer.Hosting', '0.2.0-alpha.0.338'],
      ['Concertable.Payment.Hosting', '0.2.0-alpha.0.372'],
      ['Concertable.Search.Hosting', '0.2.0-alpha.0.324'],
    ])
  // system's ReleaseTrainPinTests holds Directory.Packages.props equal to this manifest, so a bump
  // reaching one file and not the other lands red. One dependency name puts both in one branch.
  const restored = new Set(managersFor(config, 'Directory').map(({depNameTemplate}) => depNameTemplate))
  assert.ok(qualified.every(({depNameTemplate}) => restored.has(depNameTemplate)))
})

test('each producer train carries its own image', () => {
  const {packageRules} = renovateConfig()
  for (const train of ['auth', 'b2b', 'customer', 'payment', 'search']) {
    const {matchDatasources, matchPackageNames} = packageRules.find(({groupName}) => groupName === `${train} train`)
    assert.ok(matchDatasources.includes('docker'), `${train} train excludes the datasource its image comes from`)
    const image = matchPackageNames.find((name) => name.includes('ghcr'))
    assert.match(`ghcr.io/concertable/${train}`, new RegExp(image.slice(1, -1)))
  }
})

test('this repository does not treat its own fixtures as dependencies', () => {
  const config = renovateConfig()
  const fixtures = readdirSync(new URL('../fixtures/', import.meta.url)).map((name) => `fixtures/${name}`)
  assert.ok(fixtures.length > 0)
  // The manifest managers match on filename, and these samples are named after the shapes they
  // sample - so without this rule Renovate raises them to real versions and the assertions above,
  // which pin their exact values, go permanently red.
  const excluded = config.packageRules.find(({enabled, matchFileNames}) =>
    enabled === false && matchFileNames?.includes('**/fixtures/**'))
  assert.ok(excluded, 'no packageRule disables **/fixtures/**')
  for (const fixture of fixtures) {
    assert.ok(config.customManagers.some(({managerFilePatterns}) =>
      managerFilePatterns.some((pattern) => new RegExp(pattern.slice(1, -1)).test(fixture))),
      `${fixture} matches no manager, so this guard is testing nothing`)
  }
})

test('the preset opts out of the platform default of silent', () => {
  // Mend's onboarding defaults an organization to "Scan Only", which sets mode=silent: Renovate scans
  // every repository and opens nothing. That is indistinguishable from a bot that never ran.
  assert.equal(renovateConfig().mode, 'full')
})

test('a first-party train waits on nothing but its own green CI', () => {
  const firstParty = renovateConfig().packageRules
    .filter(({matchPackageNames}) => matchPackageNames?.includes('/^Concertable\\./'))
  const [age, merge] = firstParty
  assert.equal(firstParty.length, 2)
  // minimumReleaseAge is third-party supply-chain latency. Applied to a train that publishes per
  // commit it only delays the estate against itself.
  assert.equal(age.minimumReleaseAge, null)
  assert.equal(merge.automerge, true)
  assert.equal(merge.platformAutomerge, true)
  assert.ok(!merge.matchUpdateTypes.includes('major'))
})

test('publication authority is isolated from caller build code', () => {
  for (const name of ['nuget-publish.yml', 'npm-publish.yml', 'container-publish.yml']) {
    const workflow = readFileSync(new URL(name, workflowsDirectory), 'utf8')
    assert.match(workflow, /^\s{2}verify:\r?\n[\s\S]*?permissions: \{contents: read, packages: read\}/m)
    assert.match(workflow, /^\s{2}publish:\r?\n[\s\S]*?environment: release\r?\n\s+permissions: \{contents: read, packages: write, id-token: write, attestations: write\}/m)
    assert.match(workflow, /inputs\.publish && github\.ref_protected/)
  }
})

test('no flow-mapping declaration hides a stray key behind a comma', () => {
  // `{description: a, b, required: false}` is legal YAML - `b` parses as a null-valued key - so a comma
  // inside a description silently becomes an input option, and only GitHub's schema check rejects it.
  for (const name of reusableNames) {
    const workflow = readFileSync(new URL(name, workflowsDirectory), 'utf8')
    for (const [lineNumber, line] of workflow.split('\n').entries()) {
      const flow = line.match(/^\s+[\w-]+: \{(.+)\}$/)
      if (!flow) continue
      for (const entry of flow[1].split(', ')) {
        assert.match(entry, /:/,
          `${name}:${lineNumber + 1} declares '${entry.trim()}' as its own key - a comma inside a flow mapping starts a new entry`)
      }
    }
  }
})

test('a push can only publish where the caller opted in, and only from a protected ref', () => {
  const workflow = readFileSync(new URL('nuget-publish.yml', workflowsDirectory), 'utf8')
  assert.match(workflow, /publish-on-push: \{description: [^}]*required: false, default: false, type: boolean\}/)
  assert.match(workflow, /inputs\.publish-on-push && github\.event_name == 'push'/)
  for (const name of ['npm-publish.yml', 'container-publish.yml']) {
    const other = readFileSync(new URL(name, workflowsDirectory), 'utf8')
    assert.doesNotMatch(other, /event_name == 'push'/,
      `${name} has no opt-in, so a push must not reach its publish job`)
  }
})
