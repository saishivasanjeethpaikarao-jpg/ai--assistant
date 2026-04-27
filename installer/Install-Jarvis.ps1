# Installs the PyInstaller-built EXE to %LOCALAPPDATA%\JarvisAI (no Python on the target PC).
# Run from project root after: package_windows.bat
#   powershell -ExecutionPolicy Bypass -File installer\Install-Jarvis.ps1

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$exeSrc = Join-Path $root "dist\PersonalAIAssistant.exe"
if (-not (Test-Path $exeSrc)) {
    Write-Error "Missing $exeSrc — run package_windows.bat first."
}
$install = Join-Path $env:LOCALAPPDATA "JarvisAI"
New-Item -ItemType Directory -Force -Path $install | Out-Null
$exeDest = Join-Path $install "PersonalAIAssistant.exe"
Copy-Item -LiteralPath $exeSrc -Destination $exeDest -Force

$shell = New-Object -ComObject WScript.Shell
$programs = [Environment]::GetFolderPath("Programs")
$startMenu = Join-Path $programs "Jarvis AI.lnk"
$s1 = $shell.CreateShortcut($startMenu)
$s1.TargetPath = $exeDest
$s1.WorkingDirectory = $install
$s1.WindowStyle = 1
$s1.Description = "Jarvis AI Assistant"
$s1.Save()

$desktop = [Environment]::GetFolderPath("Desktop")
$desk = Join-Path $desktop "Jarvis AI.lnk"
$s2 = $shell.CreateShortcut($desk)
$s2.TargetPath = $exeDest
$s2.WorkingDirectory = $install
$s2.Save()

Write-Host "Installed: $exeDest"
Write-Host "Start Menu: $startMenu"
Write-Host "Desktop:    $desk"
Write-Host "First run creates %LOCALAPPDATA%\JarvisAI\.env from the bundled template — add your API keys there or use in-app Settings."
