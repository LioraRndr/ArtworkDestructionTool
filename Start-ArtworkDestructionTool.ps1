$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Url = "http://localhost:5173/"

Set-Location -LiteralPath $ProjectRoot

function Test-AppServer {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 1
    return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500)
  } catch {
    return $false
  }
}

function Update-App {
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) { return }
  if (-not (Test-Path (Join-Path $ProjectRoot ".git"))) { return }
  try {
    Write-Host "Checking for updates..."
    git -C $ProjectRoot pull --ff-only 2>&1 | Write-Host
  } catch {
    Write-Host "Update check skipped: $($_.Exception.Message)"
  }
}

if (Test-AppServer) {
  Start-Process $Url
  Write-Host "Artwork Destruction Tool is already running."
  Write-Host $Url
  return
}

Update-App

Start-Process powershell.exe -WindowStyle Hidden -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy", "Bypass",
  "-Command",
  "Start-Sleep -Seconds 2; Start-Process '$Url'"
)

Write-Host "Starting Artwork Destruction Tool..."
Write-Host $Url
npm start
