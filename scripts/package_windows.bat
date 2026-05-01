@echo off
setlocal

python -m pip install --upgrade pip
pip install -r requirements.txt
pip install pyinstaller

echo Building desktop app with app.spec...
pyinstaller --noconfirm --clean app.spec

if exist "dist\PersonalAIAssistant.exe" (
  echo Build complete: dist\PersonalAIAssistant.exe
) else (
  echo Build failed. Check output above.
)
