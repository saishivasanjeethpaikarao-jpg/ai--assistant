@echo off
setlocal enableextensions
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0package_windows_store.ps1"
