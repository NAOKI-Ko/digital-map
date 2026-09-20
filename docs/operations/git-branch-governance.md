# Git branch governance

## Branch roles

```text
feature/fix/chore WU branch -> dev -> explicit release approval -> main -> Production
```

- `dev` is the integration line for ordinary work and Windows QA.
- `main` is the Production source line. It moves only for an explicitly approved release.
- Hotfixes branch from `main`, release through `main`, and are then forward-ported to `dev`.

## Starting ordinary work

```bash
git fetch origin
git switch dev
git pull --ff-only origin dev
git switch -c <type>/wuXX-description-YYYYMMDD
```

Use one canonical clone for sequential WUs. Create a worktree only for genuinely parallel work, an emergency hotfix, or an explicit request.

## Integration and evidence

- Open a PR from the WU branch to `dev`.
- Require the GitHub Actions `verify` check.
- Prefer a merge commit so implementation and evidence commit SHAs remain reachable unchanged.
- Record the base SHA, implementation SHA, evidence SHA, CI run, merge commit, and deployed SHA where applicable.
- Do not rebase or squash an already evidenced WU when that changes recorded SHAs.

## Protected branches

Both `dev` and `main` require a PR and the `verify` status check. Force pushes and branch deletion are disabled. Linear history is not required because merge commits preserve exact-SHA evidence. A mandatory reviewer count is intentionally omitted for the solo repository.

## Historical cleanup

Before deleting a branch, re-query GitHub and confirm all of the following:

1. It is neither `main` nor `dev`.
2. It is not an active unmerged WU and no open PR depends on it.
3. `git merge-base --is-ancestor origin/<branch> origin/dev` succeeds.
4. The WU is closed/PASS-READY or the branch is known obsolete.
5. It has no exclusive unpushed or unmerged commit.

Create an intentional checkpoint tag before a major cleanup. Never delete a branch based on its name alone.

