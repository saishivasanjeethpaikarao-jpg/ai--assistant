@echo off
REM Run the Kivy UI app for the Personal AI Assistant.
where pythonw >nul 2>&1
if %ERRORLEVEL% == 0 (
    pythonw app.py
) else (
    python app.py
)
