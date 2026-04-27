[Setup]
AppName=Personal AI Assistant
AppVersion=1.0.0
DefaultDirName={autopf}\Personal AI Assistant
DefaultGroupName=Personal AI Assistant
UninstallDisplayIcon={app}\PersonalAIAssistant.exe
Compression=lzma2
SolidCompression=yes
OutputDir=Output
OutputBaseFilename=PersonalAIAssistant_Setup
SetupIconFile=assets\app.ico

[Files]
Source: "dist\PersonalAIAssistant.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: ".env.template"; DestDir: "{app}"; Flags: ignoreversion
Source: "assets\*"; DestDir: "{app}\assets\"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\Personal AI Assistant"; Filename: "{app}\PersonalAIAssistant.exe"
Name: "{autodesktop}\Personal AI Assistant"; Filename: "{app}\PersonalAIAssistant.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop icon"; GroupDescription: "Additional icons:"

[Run]
Filename: "{app}\PersonalAIAssistant.exe"; Description: "Launch Personal AI Assistant"; Flags: nowait postinstall skipifsilent
