# WU-55 Git before/after evidence

## Before

- GitHub default branch: `main`
- `origin/dev`: `db662f07490b7a2016ea27f3221cbf738f586fed`
- `origin/main`: `a58b4353bd108e6586f329080c772f69b8aaffda`
- WU-55 branch initially pointed to the same SHA as `dev`.
- Open PRs: none.
- The canonical clone had one clean worktree but was checked out on the historical WU-51 branch before switching to WU-55.
- Historical remote branches were retained pending ancestor and PR checks.

## Required after state

- WU-55 is merged to `dev` through a PR and post-merge `verify` passes.
- GitHub default branch is `dev`; `main` remains unchanged.
- `dev` and `main` require PRs and `verify`, with force pushes/deletion disabled.
- Annotated tag `qa-baseline-wu54-20260921` points to `db662f07490b7a2016ea27f3221cbf738f586fed`.
- Only branches proven contained in `dev`, closed, and unused by open PRs are removed.
- No dirty or unique-artifact worktree is removed.

Final SHAs, PR, CI, branch lists, and cleanup decisions are recorded in the WU-55 report.

