param([switch]$NoRestart)
$ErrorActionPreference = 'Stop'
# Only the existing Windows QA installation. Production has a fixed, managed origin.
. 'C:\DigitalMap\scripts\common.ps1'
$mutex = New-Object System.Threading.Mutex($false, 'Global\DigitalMap-QA-Origin-Sync')
$locked = $false
try {
$locked = $mutex.WaitOne(90000)
if (-not $locked) { throw 'QA origin synchronization is busy' }
$tunnelPid = Get-LivePid (Join-Path $RuntimeDir 'cloudflared.pid') 'cloudflared'
if (-not $tunnelPid) { throw 'QA tunnel is not running' }
$startedAt = (Get-Process -Id $tunnelPid).StartTime.ToUniversalTime().AddSeconds(-2)
$url = $null
for ($attempt = 0; $attempt -lt 60 -and -not $url; $attempt++) {
  # JSON log is append-only. Select only URL announcements from this process,
  # never URLs from old sessions or incoming request/error messages.
  foreach ($line in (Get-Content (Join-Path $LogsDir 'cloudflared.log') -ErrorAction SilentlyContinue)) {
    try { $entry = $line | ConvertFrom-Json } catch { continue }
    if ([datetime]::Parse($entry.time).ToUniversalTime() -lt $startedAt) { continue }
    if ($entry.message -match '^\|\s+(https://[a-z0-9-]+\.trycloudflare\.com)\s+\|$') { $url = $Matches[1] }
  }
  if (-not $url) { Start-Sleep -Seconds 1 }
}
if (-not $url) { throw 'Current QA tunnel URL was not announced' }
$originFile = Join-Path $RuntimeDir 'qa-tunnel-origin.ps1'
$assignments = @(
  'PUBLIC_BASE_URL', 'ADMIN_BASE_URL', 'NUXT_ADMIN_BASE_URL',
  'NUXT_PUBLIC_PUBLIC_BASE_URL', 'NUXT_PUBLIC_BASE_URL'
) | ForEach-Object { '$env:' + $_ + " = '$url'" }
$hostName = ([uri]$url).Host
$assignments += '$env:TRUSTED_HOSTS = ' + "'$hostName,localhost:3011,127.0.0.1:3011'"
$assignments += '$env:NUXT_TRUSTED_HOSTS = $env:TRUSTED_HOSTS'
$assignments += '$env:NUXT_TRUSTED_ORIGINS = ' + "'$url'"
$assignments += '$env:TRUST_PROXY = ''true'''
$assignments += '$env:NUXT_TRUST_PROXY = ''true'''
$assignments += '$env:DEPLOYMENT_ENV = ''qa'''
$assignments += '$env:NUXT_DEPLOYMENT_ENVIRONMENT = ''qa'''
$expected = $assignments -join "`r`n"
$changed = -not (Test-Path $originFile) -or (Get-Content $originFile -Raw).Trim() -ne $expected.Trim()
if ($changed) {
  # Replace complete files atomically; no credential file edits or snapshot writes.
  Set-Content ($originFile + '.tmp') $expected -Encoding ascii
  Move-Item ($originFile + '.tmp') $originFile -Force
}
$publicUrlFile = Join-Path $RuntimeDir 'public-url.txt'
Set-Content ($publicUrlFile + '.tmp') $url -NoNewline -Encoding ascii
Move-Item ($publicUrlFile + '.tmp') $publicUrlFile -Force
if ($changed -and -not $NoRestart) {
  & (Join-Path $ScriptsDir 'restart-app.ps1')
}
if (-not $NoRestart) {
  $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3011/' -TimeoutSec 15
  if (-not $response.Content.Contains($url)) { throw 'Effective Nuxt public origin is stale' }
  $public = Invoke-WebRequest -UseBasicParsing -Uri ($url + '/arimatsu-fon') -TimeoutSec 20
  if ($public.StatusCode -ne 200) { throw 'QA Public Viewer is not reachable on the current URL' }
}
Write-Output ('QA public origin synchronized: ' + $url)

} finally {
  if ($locked) { $mutex.ReleaseMutex() }
  $mutex.Dispose()
}
