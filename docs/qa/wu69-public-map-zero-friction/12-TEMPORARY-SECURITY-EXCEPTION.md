# WU-69 / 69-10 — Temporary Security Advisory Allowlist

Authority: [WU-69](https://app.asana.com/1/1217082051589915/task/1219125292154655), [69-10](https://app.asana.com/1/1217082051589915/task/1219127989358025), and the user's explicit approval on 2026-10-03. Parent modified 2026-10-03T08:02:58.706Z; child modified 08:02:58.690Z. Starting PR #28 HEAD: `ffb0460a658fd2baab8afbceada8cf68489e3aad`.

## Approved exception

| Advisory | Locked package | Severity / risk | Owner | Approved | Expiry |
| --- | --- | --- | --- | --- | --- |
| [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | node-forge 1.4.0 | High; RSA PKCS#1 signature validation can accept invalid nested DigestAlgorithm content. | Digital Map maintainer NAOKI-Ko / 近藤直樹 | 2026-10-03 | 2026-11-02 |
| [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | braces 3.0.3 | High; deeply nested patterns can exhaust the stack and cause denial of service. | Digital Map maintainer NAOKI-Ko / 近藤直樹 | 2026-10-03 | 2026-11-02 |

This is accepted temporary risk for these two advisory IDs, not a finding that either package is safe or that the vulnerable code is unreachable. The owner owns removal, upstream release checks and expiry. It does not authorize a Production release, waive Windows exact-SHA QA or replace black-box acceptance.

Reason: these existing transitive vulnerabilities were the only High/Critical findings preventing PR #28's remaining Verify gates from running. At 2026-10-03T08:13:30Z, the official npm registry lists latest node-forge 1.4.0 and braces 3.0.3, with no versions beyond them. Explicit queries for node-forge@1.4.1 and braces@3.0.4 fail with no matching version. Current audit reports `patched_versions: null` and `patched_versions_unpublished: true` for both. No package version, lockfile, registry setting or fork is changed. Evidence: `69-10-evidence/`.

## Production dependency paths

The unfiltered `pnpm audit --prod --audit-level high --json` reports:

node-forge:

```text
.>nuxt>@nuxt/cli>listhen>node-forge
.>nuxt>@nuxt/nitro-server>nitropack>listhen>node-forge
```

braces:

```text
.>@nuxtjs/tailwindcss>tailwind-config-viewer>tailwindcss>chokidar>braces
.>@nuxtjs/tailwindcss>tailwind-config-viewer>tailwindcss>fast-glob>micromatch>braces
.>@nuxtjs/tailwindcss>tailwind-config-viewer>tailwindcss>micromatch>braces
.>@nuxtjs/tailwindcss>tailwindcss>chokidar>braces
.>@nuxtjs/tailwindcss>tailwindcss>fast-glob>micromatch>braces
.>@nuxtjs/tailwindcss>tailwindcss>micromatch>braces
.>nuxt>@nuxt/nitro-server>nitropack>globby>fast-glob>micromatch>braces
.>nuxt>@nuxt/nitro-server>nitropack>globby>micromatch>braces
```

## Verify implementation and CLI safety

Only the existing audit step changes. Its first command is the requested exact command; its second performs the actual failure check:

```yaml
- run: |
    pnpm audit --prod --audit-level high --ignore GHSA-86w9-cpqp-85rv --ignore GHSA-vfj7-8cjw-p6xm
    pnpm audit --prod --audit-level high
```

This second command is necessary: in the CI-pinned pnpm 11.9.0, `--ignore` saves the IDs into the runner checkout's `pnpm-workspace.yaml` and returns exit 0 without applying severity failure checks to other advisories. A one-command substitution would accidentally bypass other High/Critical findings. The subsequent audit reads that exact-ID allowlist and fails for remaining High/Critical. The shell retains failure propagation; no `continue-on-error`, broad ignore, `--ignore-unfixable`, `--ignore-registry-errors`, lowered audit level or package-wide exemption is added. [Official pnpm audit documentation](https://pnpm.io/cli/audit) describes the configuration-writing behavior.

The allowlist written during Verify is transient runner state; it is not committed to the repository's package.json, lockfile or pnpm-workspace.yaml. Every other Verify step, runtime version, permission and branch protection remains unchanged.

## Gate verification

Executed with actual pnpm 11.9.0, matching Verify, in disposable copies of the PR's package/lock/workspace files. No application or canonical database changes.

| Scenario | Registration exit | Actual audit exit | Result |
| --- | --- | --- | --- |
| Live registry, no exemption (baseline) | N/A | 1 | High2 detected |
| Live registry, only node-forge GHSA exempted | 0 | 1 | braces still blocks |
| Live registry, only braces GHSA exempted | 0 | 1 | node-forge still blocks |
| Live registry, both approved GHSA exempted | 0 | 0 | Only these two excluded |
| Replayed bulk response, only approved GHSA | 0 | 0 | Control PASS |
| Same response plus a different GHSA with High severity on braces | 0 | 1 | New High still blocks; package not exempted |
| Same response plus a different GHSA with Critical severity on braces | 0 | 1 | New Critical still blocks; package not exempted |

The last three cases use a loopback mock npm bulk endpoint and synthetic `GHSA-2222-3333-4444`, explicitly test data rather than a claim about a real advisory. Both approved advisories retain their original package versions. package.json and lockfile hashes remain unchanged in every test copy. Raw command outputs and gate-results.json are recorded in `69-10-evidence/`; the reproduction script is included there. The baseline live audit uses local pnpm 11.25.0; all registration/follow-up gate cases use CI-pinned 11.9.0.

## Removal and expiry

Remove the affected GHSA immediately when an official patched release becomes available, even before expiry, and update the affected dependency/lockfile to a verified safe published release through the normal review/Verify process. Re-run the unfiltered audit. When both advisories are removed, restore the original single audit command.

The owner must remove the exception no later than 2026-11-02. An extension requires a new explicit security decision; it must not silently renew. pnpm's ignore entries have no built-in expiry: this date is an explicit maintenance obligation, not a claim of automatic time enforcement. New High/Critical advisories remain blocking throughout. Never substitute unpublished versions, fabricated metadata or an unverified fork.

## Delivery gates

PR Verify must PASS before any Draft-to-ready or dev merge decision. After a permitted merge, require post-merge Verify, Windows exact merge SHA deployment and normal Public/LIVE/black-box acceptance. Production remains untouched until its separate normal release approval. Actual PR / CI / review / deployment results are recorded in the delivery evidence; local audit success alone is not a Verify PASS.
