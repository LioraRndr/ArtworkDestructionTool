$ErrorActionPreference = "Stop"

$RepoUrl = "https://github.com/LioraRndr/ArtworkDestructionTool.git"
$InstallRoot = Join-Path $env:LOCALAPPDATA "ArtworkDestructionTool"
$SkillName = "artwork-destruction-tool"
$SkillSource = Join-Path $InstallRoot "skills\$SkillName"
$SkillTarget = Join-Path $HOME ".agents\skills\$SkillName"
$DesktopLink = Join-Path ([Environment]::GetFolderPath("Desktop")) "Artwork Destruction Tool.lnk"

function Require-Command($Name, $InstallHint) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required command '$Name'. $InstallHint"
  }
}

Require-Command git "Install Git for Windows first: https://git-scm.com/download/win"
Require-Command node "Install Node.js 20+ first: https://nodejs.org/"

if (Test-Path $InstallRoot) {
  Write-Host "Updating $InstallRoot"
  git -C $InstallRoot pull --ff-only
} else {
  Write-Host "Installing to $InstallRoot"
  git clone $RepoUrl $InstallRoot
}

New-Item -ItemType Directory -Force -Path (Join-Path $InstallRoot "data") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $InstallRoot "data\generated") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $InstallRoot "data\tmp") | Out-Null

if (-not (Test-Path (Join-Path $InstallRoot "data\records.json"))) {
  "[]" | Set-Content -Path (Join-Path $InstallRoot "data\records.json") -Encoding UTF8
}
if (-not (Test-Path (Join-Path $InstallRoot "data\generations.json"))) {
  "[]" | Set-Content -Path (Join-Path $InstallRoot "data\generations.json") -Encoding UTF8
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $SkillTarget) | Out-Null
if (Test-Path $SkillTarget) {
  Remove-Item -LiteralPath $SkillTarget -Recurse -Force
}
Copy-Item -LiteralPath $SkillSource -Destination $SkillTarget -Recurse
Write-Host "Installed skill to $SkillTarget"

if (-not (Get-Command gpt-image -ErrorAction SilentlyContinue)) {
  if (Get-Command uv -ErrorAction SilentlyContinue) {
    Write-Host "Installing gpt-image CLI through uv..."
    uv tool install git+https://github.com/wuyoscar/gpt_image_2_skill
  } else {
    Write-Warning "gpt-image CLI was not found. Install uv, then run: uv tool install git+https://github.com/wuyoscar/gpt_image_2_skill"
  }
}

$ws = New-Object -ComObject WScript.Shell
$link = $ws.CreateShortcut($DesktopLink)
$link.TargetPath = "powershell.exe"
$link.Arguments = "-NoExit -ExecutionPolicy Bypass -File `"$InstallRoot\Start-ArtworkDestructionTool.ps1`""
$link.WorkingDirectory = $InstallRoot
$link.IconLocation = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe,0"
$link.Description = "Start Artwork Destruction Tool local server"
$link.Save()

Write-Host ""
Write-Host "Artwork Destruction Tool installed."
Write-Host "Shortcut: $DesktopLink"
Write-Host "Run: powershell -ExecutionPolicy Bypass -File `"$InstallRoot\Start-ArtworkDestructionTool.ps1`""

