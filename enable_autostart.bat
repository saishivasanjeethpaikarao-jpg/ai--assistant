@echo off
setlocal

set "APP_NAME=Personal AI Assistant"
set "EXE_NAME=PersonalAIAssistant.exe"
set "DESKTOP_DIR=%USERPROFILE%\Desktop"
set "INSTALL_DIR=%DESKTOP_DIR%\%APP_NAME%"
set "DEST_EXE=%INSTALL_DIR%\%EXE_NAME%"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "STARTUP_SHORTCUT=%STARTUP_DIR%\%APP_NAME%.lnk"

if not exist "%DEST_EXE%" (
  echo App EXE not found at:
  echo %DEST_EXE%
  echo Run install_desktop_app.bat first.
  pause
  exit /b 1
)

powershell -NoLogo -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$s = $ws.CreateShortcut('%STARTUP_SHORTCUT%'); " ^
  "$s.TargetPath = '%DEST_EXE%'; " ^
  "$s.WorkingDirectory = '%INSTALL_DIR%'; " ^
  "$s.IconLocation = '%DEST_EXE%'; " ^
  "$s.Save()"

echo Auto-start enabled.
echo Startup shortcut: %STARTUP_SHORTCUT%
pause
