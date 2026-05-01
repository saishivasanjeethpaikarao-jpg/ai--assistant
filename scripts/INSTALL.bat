@echo off
REM =====================================================
REM   JARVIS AI ASSISTANT - UNIVERSAL INSTALLER v9.2
REM   Works on ANY Windows 10/11 PC
REM =====================================================

setlocal enabledelayedexpansion

echo.
echo =========================================================
echo    JARVIS AI - COMPLETE SYSTEM INSTALLER
echo    Version: 9.2.0
echo    Date: April 20, 2026
echo =========================================================
echo.

REM Check for admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This installer requires Administrator privileges.
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

setlocal
cd /d "%~dp0"

echo [STEP 1] Checking system requirements...
timeout /t 1 /nobreak >nul

REM Check if Python is installed
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [WARNING] Python not found. Installing Python 3.11...
    
    REM Download Python installer
    echo Downloading Python 3.11...
    powershell -Command "Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe' -OutFile python-installer.exe"
    
    echo Installing Python...
    python-installer.exe /quiet InstallAllUsers=1 PrependPath=1
    if %errorLevel% neq 0 (
        echo [ERROR] Python installation failed
        pause
        exit /b 1
    )
    del python-installer.exe
    echo [OK] Python installed successfully
) else (
    echo [OK] Python detected
)

echo.
echo [STEP 2] Creating virtual environment...

if not exist ".venv" (
    python -m venv .venv
    if %errorLevel% neq 0 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
    echo [OK] Virtual environment created
) else (
    echo [OK] Virtual environment exists
)

echo.
echo [STEP 3] Activating virtual environment...

call .venv\Scripts\activate.bat
if %errorLevel% neq 0 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)
echo [OK] Virtual environment activated

echo.
echo [STEP 4] Upgrading pip...

python -m pip install --upgrade pip setuptools wheel
if %errorLevel% neq 0 (
    echo [WARNING] pip upgrade had issues, continuing...
)
echo [OK] pip upgraded

echo.
echo [STEP 5] Installing dependencies...

if exist "requirements.txt" (
    echo Installing from requirements.txt...
    pip install -r requirements.txt
    if %errorLevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [OK] All dependencies installed
) else (
    echo [ERROR] requirements.txt not found
    pause
    exit /b 1
)

echo.
echo [STEP 6] Installing PyInstaller...

pip install pyinstaller
if %errorLevel% neq 0 (
    echo [ERROR] Failed to install PyInstaller
    pause
    exit /b 1
)
echo [OK] PyInstaller installed

echo.
echo [STEP 7] Building executable...

if exist "app.spec" (
    echo Building JARVIS from app.spec...
    pyinstaller app.spec --clean --noconfirm
    
    if %errorLevel% neq 0 (
        echo [ERROR] Build failed
        echo Attempting manual build...
        pyinstaller --name=JARVIS ^
                    --onefile ^
                    --windowed ^
                    --icon=assets\icon.ico ^
                    --add-data "assets:assets" ^
                    --add-data "ui:ui" ^
                    --add-data "brain:brain" ^
                    --add-data "memory:memory" ^
                    --add-data "voice:voice" ^
                    --add-data "actions:actions" ^
                    app.py
    )
    
    if exist "dist\JARVIS.exe" (
        echo [OK] Executable created successfully
    ) else (
        echo [ERROR] Build output not found
        pause
        exit /b 1
    )
) else (
    echo [WARNING] app.spec not found, building manually...
    pyinstaller --name=JARVIS ^
                --onefile ^
                --windowed ^
                --add-data "assets:assets" ^
                --add-data "ui:ui" ^
                --add-data "brain:brain" ^
                --add-data "memory:memory" ^
                app.py
)

echo.
echo [STEP 8] Creating shortcuts...

set EXE_PATH=%cd%\dist\JARVIS.exe

if not exist "%ProgramFiles%\JARVIS" (
    mkdir "%ProgramFiles%\JARVIS"
)

copy /Y "%EXE_PATH%" "%ProgramFiles%\JARVIS\JARVIS.exe"
if %errorLevel% neq 0 (
    echo [WARNING] Could not copy to Program Files
    set INSTALL_DIR=%cd%\dist
) else (
    set INSTALL_DIR=%ProgramFiles%\JARVIS
)

REM Create desktop shortcut
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('[InstallDir]\JARVIS.lnk'); $Shortcut.TargetPath = '[ExePath]'; $Shortcut.Save()" 2>nul || echo [WARNING] Could not create desktop shortcut

REM Create Start Menu shortcut
set STARTMENU=%ProgramData%\Microsoft\Windows\Start Menu\Programs
if exist "%STARTMENU%" (
    powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%STARTMENU%\JARVIS.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\JARVIS.exe'; $Shortcut.Save()" 2>nul || echo [WARNING] Could not create Start Menu shortcut
)

echo [OK] Shortcuts created

echo.
echo [STEP 9] Setting up environment...

REM Create .env file if not exists
if not exist ".env" (
    echo Creating .env template...
    (
        echo # JARVIS AI - Environment Configuration
        echo # Add your API keys here
        echo.
        echo # Groq API
        echo GROQ_API_KEY=your_groq_key_here
        echo.
        echo # OpenAI
        echo OPENAI_API_KEY=your_openai_key_here
        echo.
        echo # Google APIs
        echo GOOGLE_API_KEY=your_google_key_here
        echo.
        echo # Firebase
        echo FIREBASE_PROJECT_ID=your_firebase_project
        echo.
        echo # ElevenLabs
        echo ELEVENLABS_API_KEY=your_elevenlabs_key
        echo.
        echo # Ollama
        echo OLLAMA_URL=http://localhost:11434
    ) > .env
    echo [OK] Created .env template
)

echo.
echo [STEP 10] Creating user data directories...

if not exist "%USERPROFILE%\.jarvis" mkdir "%USERPROFILE%\.jarvis"
if not exist "%USERPROFILE%\.jarvis\memory" mkdir "%USERPROFILE%\.jarvis\memory"
if not exist "%USERPROFILE%\.jarvis\brain" mkdir "%USERPROFILE%\.jarvis\brain"
if not exist "%USERPROFILE%\.jarvis\backups" mkdir "%USERPROFILE%\.jarvis\backups"

echo [OK] User directories created

echo.
echo [STEP 11] Creating uninstaller...

REM Create uninstaller script
(
    echo @echo off
    echo echo Uninstalling JARVIS AI...
    echo rmdir /s /q "%INSTALL_DIR%"
    echo echo Uninstall complete
    echo pause
) > "%INSTALL_DIR%\Uninstall.bat"

echo [OK] Uninstaller created

echo.
echo [STEP 12] Verification...

if exist "%INSTALL_DIR%\JARVIS.exe" (
    echo [OK] Installation completed successfully!
    echo.
    echo =========================================================
    echo    INSTALLATION COMPLETE
    echo =========================================================
    echo.
    echo Location: %INSTALL_DIR%
    echo.
    echo Next steps:
    echo 1. Edit .env file with your API keys
    echo 2. (Optional) Install Ollama for local AI: https://ollama.ai
    echo 3. Launch JARVIS from Start Menu or double-click JARVIS.exe
    echo.
    echo =========================================================
) else (
    echo [ERROR] Installation verification failed
    echo JARVIS.exe not found at expected location
    pause
    exit /b 1
)

echo.
echo Press any key to launch JARVIS...
pause

REM Launch JARVIS
start "" "%INSTALL_DIR%\JARVIS.exe"

endlocal
exit /b 0
