# JARVIS AI - Universal Installer (PowerShell)
# Version: 9.2.0
# Date: April 20, 2026
# Usage: powershell -ExecutionPolicy Bypass -File install.ps1

# Color output helper
function Write-Status {
    param([string]$Message, [string]$Level = "INFO")
    $colors = @{
        "SUCCESS" = "Green"
        "ERROR" = "Red"
        "WARNING" = "Yellow"
        "INFO" = "Cyan"
    }
    $color = $colors[$Level] ?? "White"
    Write-Host "[$Level] " -ForegroundColor $color -NoNewline
    Write-Host $Message
}

Write-Host "`n" + ("=" * 60)
Write-Host "    JARVIS AI ASSISTANT - UNIVERSAL INSTALLER"
Write-Host "    Version: 9.2.0"
Write-Host "    Date: April 20, 2026"
Write-Host ("=" * 60) + "`n"

# Check admin rights
$isAdmin = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
$hasAdmin = $isAdmin.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $hasAdmin) {
    Write-Status "This script requires Administrator privileges" "ERROR"
    Write-Status "Please run PowerShell as Administrator" "WARNING"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Status "Administrator privileges detected" "SUCCESS"

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir
Write-Status "Working directory: $scriptDir"

# STEP 1: Check Python
Write-Host "`n[STEP 1] Checking Python installation..."

$pythonPath = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $pythonPath) {
    Write-Status "Python not found. Downloading..." "WARNING"
    
    # Download Python installer
    $pythonUrl = "https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe"
    $pythonInstaller = "$env:TEMP\python-installer.exe"
    
    try {
        Write-Status "Downloading Python 3.11.8..."
        Invoke-WebRequest -Uri $pythonUrl -OutFile $pythonInstaller -ErrorAction Stop
        Write-Status "Installing Python..."
        & $pythonInstaller /quiet InstallAllUsers=1 PrependPath=1
        
        # Wait for installation
        Start-Sleep -Seconds 30
        
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Status "Python installed successfully" "SUCCESS"
        Remove-Item $pythonInstaller -Force
    } catch {
        Write-Status "Failed to install Python: $_" "ERROR"
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Status "Python detected at: $pythonPath" "SUCCESS"
}

# Verify Python version
$pythonVersion = python --version 2>&1
Write-Status "Python version: $pythonVersion" "SUCCESS"

# STEP 2: Create virtual environment
Write-Host "`n[STEP 2] Creating virtual environment..."

$venvPath = Join-Path $scriptDir ".venv"
if (-not (Test-Path $venvPath)) {
    Write-Status "Creating .venv..."
    python -m venv .venv
    if ($LASTEXITCODE -ne 0) {
        Write-Status "Failed to create virtual environment" "ERROR"
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Status "Virtual environment created" "SUCCESS"
} else {
    Write-Status "Virtual environment already exists" "SUCCESS"
}

# STEP 3: Activate virtual environment
Write-Host "`n[STEP 3] Activating virtual environment..."

$activateScript = Join-Path $venvPath "Scripts\Activate.ps1"
if (Test-Path $activateScript) {
    & $activateScript
    Write-Status "Virtual environment activated" "SUCCESS"
} else {
    Write-Status "Activation script not found" "ERROR"
    Read-Host "Press Enter to exit"
    exit 1
}

# STEP 4: Upgrade pip
Write-Host "`n[STEP 4] Upgrading pip..."

python -m pip install --upgrade pip setuptools wheel --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Status "pip upgraded successfully" "SUCCESS"
} else {
    Write-Status "pip upgrade had issues, continuing..." "WARNING"
}

# STEP 5: Install dependencies
Write-Host "`n[STEP 5] Installing dependencies..."

$requirementsFile = Join-Path $scriptDir "requirements.txt"
if (Test-Path $requirementsFile) {
    Write-Status "Installing from requirements.txt..."
    pip install -r requirements.txt --quiet
    
    if ($LASTEXITCODE -eq 0) {
        Write-Status "All dependencies installed" "SUCCESS"
    } else {
        Write-Status "Some dependencies failed to install" "WARNING"
    }
} else {
    Write-Status "requirements.txt not found" "ERROR"
    Read-Host "Press Enter to exit"
    exit 1
}

# STEP 6: Install PyInstaller
Write-Host "`n[STEP 6] Installing PyInstaller..."

pip install pyinstaller --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Status "PyInstaller installed" "SUCCESS"
} else {
    Write-Status "Failed to install PyInstaller" "ERROR"
    Read-Host "Press Enter to exit"
    exit 1
}

# STEP 7: Build executable
Write-Host "`n[STEP 7] Building executable..."

$specFile = Join-Path $scriptDir "app.spec"
if (Test-Path $specFile) {
    Write-Status "Building from app.spec..."
    pyinstaller $specFile --clean --noconfirm
    
    if ($LASTEXITCODE -ne 0) {
        Write-Status "Build from spec failed, trying manual build..." "WARNING"
        pyinstaller --name=JARVIS `
                    --onefile `
                    --windowed `
                    --add-data "assets:assets" `
                    --add-data "ui:ui" `
                    --add-data "brain:brain" `
                    --add-data "memory:memory" `
                    app.py
    }
} else {
    Write-Status "Building manually (no spec file)..." "WARNING"
    pyinstaller --name=JARVIS `
                --onefile `
                --windowed `
                --add-data "assets:assets" `
                --add-data "ui:ui" `
                --add-data "brain:brain" `
                --add-data "memory:memory" `
                app.py
}

$exePath = Join-Path $scriptDir "dist\JARVIS.exe"
if (Test-Path $exePath) {
    Write-Status "Executable created successfully" "SUCCESS"
} else {
    Write-Status "Build failed: JARVIS.exe not found" "ERROR"
    Read-Host "Press Enter to exit"
    exit 1
}

# STEP 8: Create installation directory
Write-Host "`n[STEP 8] Setting up installation directory..."

$installDir = "C:\Program Files\JARVIS"
try {
    if (-not (Test-Path $installDir)) {
        New-Item -ItemType Directory -Path $installDir -Force | Out-Null
        Write-Status "Created install directory: $installDir" "SUCCESS"
    } else {
        Write-Status "Install directory exists" "SUCCESS"
    }
    
    # Copy executable
    Copy-Item $exePath "$installDir\JARVIS.exe" -Force
    Write-Status "Executable copied to install directory" "SUCCESS"
} catch {
    Write-Status "Cannot write to Program Files, using local directory" "WARNING"
    $installDir = $scriptDir
}

# STEP 9: Create shortcuts
Write-Host "`n[STEP 9] Creating shortcuts..."

try {
    $WshShell = New-Object -ComObject WScript.Shell
    
    # Desktop shortcut
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    $shortcutPath = Join-Path $desktopPath "JARVIS.lnk"
    $shortcut = $WshShell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = "$installDir\JARVIS.exe"
    $shortcut.WorkingDirectory = $installDir
    $shortcut.Save()
    Write-Status "Desktop shortcut created" "SUCCESS"
    
    # Start Menu shortcut
    $startMenuPath = "$env:ProgramData\Microsoft\Windows\Start Menu\Programs"
    $startMenuShortcut = Join-Path $startMenuPath "JARVIS.lnk"
    if (Test-Path $startMenuPath) {
        $shortcut = $WshShell.CreateShortcut($startMenuShortcut)
        $shortcut.TargetPath = "$installDir\JARVIS.exe"
        $shortcut.WorkingDirectory = $installDir
        $shortcut.Save()
        Write-Status "Start Menu shortcut created" "SUCCESS"
    }
} catch {
    Write-Status "Could not create shortcuts: $_" "WARNING"
}

# STEP 10: Setup environment
Write-Host "`n[STEP 10] Setting up environment..."

$envFile = Join-Path $scriptDir ".env"
if (-not (Test-Path $envFile)) {
    Write-Status "Creating .env template..."
    @"
# JARVIS AI - Environment Configuration
# Add your API keys here

# Groq API (Free)
GROQ_API_KEY=your_groq_key_here

# OpenAI (Optional)
OPENAI_API_KEY=your_openai_key_here

# Google APIs (Gmail, Calendar, Gemini)
GOOGLE_API_KEY=your_google_key_here
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Firebase (Authentication)
FIREBASE_PROJECT_ID=your_firebase_project
FIREBASE_API_KEY=your_firebase_key

# ElevenLabs (Premium Voice)
ELEVENLABS_API_KEY=your_elevenlabs_key

# Ollama (Local AI)
OLLAMA_URL=http://localhost:11434

# Application Settings
APP_THEME=dark
APP_LANGUAGE=en
APP_DEBUG=false
"@ | Out-File $envFile -Encoding UTF8
    Write-Status ".env template created" "SUCCESS"
}

# STEP 11: Create user directories
Write-Host "`n[STEP 11] Creating user data directories..."

$userDataDir = "$env:USERPROFILE\.jarvis"
@($userDataDir, "$userDataDir\memory", "$userDataDir\brain", "$userDataDir\backups") | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
}
Write-Status "User directories created" "SUCCESS"

# STEP 12: Create uninstaller
Write-Host "`n[STEP 12] Creating uninstaller..."

$uninstallScript = @"
@echo off
echo Uninstalling JARVIS AI...
echo.
rmdir /s /q "$installDir"
echo JARVIS has been uninstalled.
pause
"@

$uninstallFile = Join-Path $installDir "Uninstall.bat"
$uninstallScript | Out-File $uninstallFile -Encoding ASCII
Write-Status "Uninstaller created" "SUCCESS"

# STEP 13: Final verification
Write-Host "`n[STEP 13] Verifying installation..."

$success = $true
@(
    @{ Path = $exePath; Name = "JARVIS.exe" },
    @{ Path = $envFile; Name = ".env" }
) | ForEach-Object {
    if (Test-Path $_.Path) {
        Write-Status "$($_.Name) verified" "SUCCESS"
    } else {
        Write-Status "$($_.Name) NOT FOUND" "ERROR"
        $success = $false
    }
}

if ($success) {
    Write-Host "`n" + ("=" * 60)
    Write-Host "    INSTALLATION COMPLETE!"
    Write-Host ("=" * 60)
    Write-Host "`nLocation: $installDir`n"
    Write-Host "Next steps:`n"
    Write-Host "1. Edit .env file with your API keys"
    Write-Host "   - Groq: Free API at https://console.groq.com"
    Write-Host "   - Ollama: Install from https://ollama.ai (optional)"
    Write-Host "`n2. Launch JARVIS from:"
    Write-Host "   - Start Menu"
    Write-Host "   - Desktop shortcut"
    Write-Host "   - Or run: $installDir\JARVIS.exe"
    Write-Host "`n3. Configure voice settings (optional)"
    Write-Host "`n" + ("=" * 60) + "`n"
    
    # Ask to launch
    $response = Read-Host "Launch JARVIS now? (y/n)"
    if ($response -eq "y" -or $response -eq "yes") {
        & "$installDir\JARVIS.exe"
    }
} else {
    Write-Status "Installation verification failed" "ERROR"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Status "Installation script completed" "SUCCESS"
