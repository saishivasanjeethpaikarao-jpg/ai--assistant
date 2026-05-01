@echo off
setlocal

set "APP_NAME=Personal AI Assistant"
set "STARTUP_SHORTCUT=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\%APP_NAME%.lnk"

if exist "%STARTUP_SHORTCUT%" (
  del "%STARTUP_SHORTCUT%"
  echo Auto-start disabled.
) else (
  echo Auto-start shortcut not found.
)

pause
