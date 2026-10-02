$ErrorActionPreference = 'Stop'
$dir = 'C:\DigitalMap\scripts'
$backup = 'C:\DigitalMap\backups\wu68-qa-tunnel-origin-20261002'
New-Item $backup -ItemType Directory -Force | Out-Null
foreach ($name in @('run-app.ps1','run-tunnel.ps1','start-tunnel.ps1')) {
  if (-not (Test-Path (Join-Path $backup $name))) { Copy-Item (Join-Path $dir $name) (Join-Path $backup $name) }
}
$runApp = Join-Path $dir 'run-app.ps1'
$content = Get-Content $runApp -Raw
if (-not $content.Contains('qa-tunnel-origin.ps1')) {
  $needle = ". (Join-Path `$RuntimeDir 'secrets.ps1')"
  if (-not $content.Contains($needle)) { throw 'Unexpected QA app runner' }
  $content = $content.Replace($needle, $needle + "`r`n" + '$qaOriginFile = Join-Path $RuntimeDir ''qa-tunnel-origin.ps1''' + "`r`n" + 'if (Test-Path $qaOriginFile) { . $qaOriginFile }')
  Set-Content $runApp $content -Encoding utf8
}
$runTunnel = Join-Path $dir 'run-tunnel.ps1'
$content = Get-Content $runTunnel -Raw
if (-not $content.Contains('qa-sync-tunnel.ps1')) {
  $needle = '$process.WaitForExit()'
  if (-not $content.Contains($needle)) { throw 'Unexpected QA tunnel runner' }
  $content = $content.Replace($needle, "& 'C:\DigitalMap\scripts\qa-sync-tunnel.ps1'`r`n" + $needle)
  Set-Content $runTunnel $content -Encoding utf8
}
$startTunnel = Join-Path $dir 'start-tunnel.ps1'
@'
$ErrorActionPreference = 'Stop'
. 'C:\DigitalMap\scripts\common.ps1'
$livePid = Get-LivePid (Join-Path $RuntimeDir 'cloudflared.pid') 'cloudflared'
if (-not $livePid) {
  Remove-Item (Join-Path $RuntimeDir 'public-url.txt') -Force -ErrorAction SilentlyContinue
  Start-ScheduledTask -TaskName 'DigitalMap-CloudflareTunnel'
  for ($attempt = 0; $attempt -lt 60; $attempt++) {
    Start-Sleep -Seconds 1
    if (Get-LivePid (Join-Path $RuntimeDir 'cloudflared.pid') 'cloudflared') { break }
  }
}
& 'C:\DigitalMap\scripts\qa-sync-tunnel.ps1'
'@ | Set-Content $startTunnel -Encoding utf8
foreach ($name in @('run-app.ps1','run-tunnel.ps1','start-tunnel.ps1','qa-sync-tunnel.ps1')) {
  $tokens=$null; $parseErrors=$null
  [System.Management.Automation.Language.Parser]::ParseFile((Join-Path $dir $name),[ref]$tokens,[ref]$parseErrors) | Out-Null
  if ($parseErrors) { throw ($name + ': parse failed') }
}
& 'C:\DigitalMap\scripts\qa-sync-tunnel.ps1'
Get-Content C:\DigitalMap\runtime\deployed-sha.txt
