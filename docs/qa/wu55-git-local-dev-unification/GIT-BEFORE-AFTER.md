# WU-55 Git before/after evidence

## Before

- GitHub default branch: `main`
- `origin/dev`: `db662f07490b7a2016ea27f3221cbf738f586fed`
- `origin/main`: `a58b4353bd108e6586f329080c772f69b8aaffda`
- WU-55 branch initially pointed to the same SHA as `dev`.
- Open PRs: none.
- The canonical clone had one clean worktree but was checked out on the historical WU-51 branch before switching to WU-55.
- Historical remote branches were retained pending ancestor and PR checks.

## After

- WU-55 PR #1 was merged to `dev` with merge commit `2a1200e0f01ab478c748c08f95353442c9ee9f75`; post-merge Verify run `35527732332` passed.
- GitHub default branch is `dev`; `main` remains unchanged at `a58b4353bd108e6586f329080c772f69b8aaffda`.
- `dev` and `main` require PRs and strict `verify`, including administrators; force pushes/deletion are disabled and linear history is not required.
- Annotated tag `qa-baseline-wu54-20260921` points to `db662f07490b7a2016ea27f3221cbf738f586fed`.
- All deleted remote branches had no open PR and were proven ancestors of `origin/dev`; final remote branches are `dev` and `main`.
- One canonical worktree remains. The old clean duplicate clone was moved to Trash only after its unique `.env` was retained with mode 600 and its Media/Public contents were proven identical.

Final SHAs, PR, CI, branch lists, and cleanup decisions are recorded in the WU-55 report and task handoff.
