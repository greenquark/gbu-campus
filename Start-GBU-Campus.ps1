$ErrorActionPreference = 'Stop'
$campusRoot = $PSScriptRoot
$campusUrl = 'http://127.0.0.1:5190/'
$campusNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if (-not (Test-Path -LiteralPath $campusNode)) { $campusNode = (Get-Command node -ErrorAction Stop).Source }
try { $campusResponse = Invoke-WebRequest -Uri $campusUrl -TimeoutSec 2 -UseBasicParsing } catch { $campusResponse = $null }
if ($campusResponse -and $campusResponse.Content -notmatch 'GBU Campus') { throw 'Port5190 is used by another app. Close that app before launching the campus.' }
if (-not $campusResponse) {
  $env:HOST = '127.0.0.1'
  Start-Process -FilePath $campusNode -ArgumentList ('"' + (Join-Path $campusRoot 'server.mjs') + '"') -WorkingDirectory $campusRoot -WindowStyle Hidden
  for ($campusAttempt=0; $campusAttempt -lt 20; $campusAttempt++) {
    Start-Sleep -Milliseconds 250
    try { $campusResponse=Invoke-WebRequest -Uri $campusUrl -TimeoutSec 1 -UseBasicParsing; break } catch {}
  }
}
if (-not $campusResponse) { throw 'The campus could not start. Check that the dist directory is present.' }
Start-Process $campusUrl
