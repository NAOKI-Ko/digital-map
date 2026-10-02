# Windows QA tunnel lifecycle

Install `qa-sync-tunnel.ps1` into `C:\DigitalMap\scripts` with the existing QA runner.

In `run-app.ps1`, immediately after loading `runtime\secrets.ps1`, load the generated overlay when it exists:

```powershell
$qaOriginFile = Join-Path $RuntimeDir 'qa-tunnel-origin.ps1'
if (Test-Path $qaOriginFile) { . $qaOriginFile }
```

In `run-tunnel.ps1`, after recording the cloudflared PID and before `WaitForExit`, invoke:

```powershell
& 'C:\DigitalMap\scripts\qa-sync-tunnel.ps1'
```

In `start-tunnel.ps1`, when the tracked tunnel already runs, invoke the synchronization script before returning. After starting its scheduled task, invoke the same synchronization script instead of parsing arbitrary historic log URLs. The running task owns initial synchronization; repeated synchronization is idempotent. Serialize invocations with a named mutex when installing the lifecycle change.

Origin matching, trusted hosts and proxy validation remain enabled. Secrets, database, release SHA, public assets and Production are untouched. Existing copied links, previously sent mail and exported PDFs cannot change retroactively; new Publish/Home/QR links use the current effective origin.
