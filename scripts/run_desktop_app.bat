@echo off
setlocal

if exist "dist\PersonalAIAssistant.exe" (
  start "" "dist\PersonalAIAssistant.exe"
) else (
  echo App EXE not found.
  echo Run package_windows.bat first to build it.
  pause
)
