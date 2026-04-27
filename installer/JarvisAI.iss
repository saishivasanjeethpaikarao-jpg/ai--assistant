; Inno Setup 6 script — compile to produce a single Windows installer (no Python required on target PC).
; Install Inno Setup from https://jrsoftware.org/isdl.php then build with:
;   ISCC.exe installer\JarvisAI.iss
; Or run build_installer.bat from the project root after PyInstaller succeeds.

#define MyAppName "Jarvis AI"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Jarvis AI"
#define MyAppExeName "PersonalAIAssistant.exe"

[Setup]
AppId={{E8D4B9A1-3C7F-4E2B-9D5A-1B2C3D4E5F60}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={localappdata}\JarvisAI
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=..\dist_installer
OutputBaseFilename=JarvisAI_Setup_{#MyAppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64
UninstallDisplayIcon={app}\{#MyAppExeName}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Shortcuts:"; Flags: unchecked

[Files]
Source: "..\dist\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{userdesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Launch {#MyAppName}"; Flags: nowait postinstall skipifsilent
