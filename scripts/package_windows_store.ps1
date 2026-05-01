$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$PackageName = "PersonalAIAssistant"
$SourceDir = Join-Path $Root "dist\$PackageName"
$SourceExe = Join-Path $Root "dist\$PackageName.exe"
$PackageDir = Join-Path $Root "temp\${PackageName}Package"
$OutputMsix = Join-Path $Root "dist\$PackageName.msix"
$ManifestPath = Join-Path $Root "AppxManifest.xml"
$LogoPath = Join-Path $Root "images\logo.png"
$CertDir = Join-Path $Root "cert"
$PfxPath = Join-Path $CertDir "$PackageName.pfx"
$CerPath = Join-Path $CertDir "$PackageName.cer"
$PfxPassword = "TempStoreSign123!"

Write-Host "[Store packaging] Building the desktop app first..."
$buildResult = & "$Root\package_windows.bat"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Desktop app build failed. Fix build errors before packaging." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $ManifestPath)) {
    Write-Host "ERROR: AppxManifest.xml not found at $ManifestPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $SourceDir) -and -not (Test-Path $SourceExe)) {
    Write-Host "ERROR: Built app output not found. Expected folder '$SourceDir' or executable '$SourceExe'." -ForegroundColor Red
    exit 1
}

if (Test-Path $PackageDir) {
    Remove-Item -Recurse -Force $PackageDir
}
New-Item -ItemType Directory -Force -Path $PackageDir | Out-Null

Write-Host "[Store packaging] Copying app files to staging directory..."
if (Test-Path $SourceDir) {
    Copy-Item -Path (Join-Path $SourceDir '*') -Destination $PackageDir -Recurse -Force
} else {
    Copy-Item -Path $SourceExe -Destination $PackageDir -Force
}
Copy-Item -Path $ManifestPath -Destination $PackageDir -Force

# Create a placeholder logo if missing.
if (-not (Test-Path $LogoPath)) {
    New-Item -ItemType Directory -Force -Path (Split-Path $LogoPath) | Out-Null
    $logoBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAr8B9aFLP0AAAAASUVORK5CYII="
    [System.IO.File]::WriteAllBytes($LogoPath, [Convert]::FromBase64String($logoBase64))
    Copy-Item -Path $LogoPath -Destination $PackageDir -Force
    Write-Host "[Store packaging] Generated placeholder logo at images\logo.png"
} else {
    Copy-Item -Path $LogoPath -Destination $PackageDir -Force
}

$makeappx = Get-Command makeappx -ErrorAction SilentlyContinue
if (-not $makeappx) {
    Write-Host "ERROR: makeappx.exe not found in PATH. Install the Windows 10/11 SDK or add makeappx to PATH." -ForegroundColor Red
    exit 1
}

if (Test-Path $OutputMsix) { Remove-Item -Force $OutputMsix }
Write-Host "[Store packaging] Creating MSIX package at $OutputMsix"
& $makeappx.Source pack /d $PackageDir /p $OutputMsix
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: makeappx.exe failed." -ForegroundColor Red
    exit 1
}

$signtool = Get-Command signtool -ErrorAction SilentlyContinue
if (-not $signtool) {
    Write-Host "WARNING: signtool.exe not found. The package is unsigned and may not install on all systems." -ForegroundColor Yellow
    Write-Host "Install the Windows SDK or use Partner Center to sign the package before publishing."
    Write-Host "MSIX output: $OutputMsix"
    exit 0
}

if (-not (Test-Path $CertDir)) { New-Item -ItemType Directory -Force -Path $CertDir | Out-Null }
if (-not (Test-Path $PfxPath)) {
    Write-Host "[Store packaging] Generating temporary code signing certificate..."
    $cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=$PackageName" -CertStoreLocation "Cert:\CurrentUser\My" -NotAfter (Get-Date).AddYears(2)
    Export-PfxCertificate -Cert $cert -FilePath $PfxPath -Password (ConvertTo-SecureString -String $PfxPassword -Force -AsPlainText)
    Export-Certificate -Cert $cert -FilePath $CerPath | Out-Null
    Write-Host "[Store packaging] Certificate created: $PfxPath"
}

Write-Host "[Store packaging] Signing MSIX package..."
& $signtool.Source sign /fd SHA256 /a /f $PfxPath /p $PfxPassword $OutputMsix
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: signtool failed to sign the package." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "SUCCESS: Store package created at $OutputMsix" -ForegroundColor Green
Write-Host "If this is for local testing, install it with:`n  Add-AppxPackage -Path '$OutputMsix'"
Write-Host "If you publish to Microsoft Store, upload the signed MSIX in Partner Center."