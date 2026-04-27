"""
Registry Manager
Manages Windows registry entries for installer
"""

import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class RegistryManager:
    """Manages Windows registry entries"""
    
    def __init__(self, app_name: str, manufacturer: str = 'Jarvis Development'):
        """
        Initialize registry manager
        
        Args:
            app_name: Application name
            manufacturer: Manufacturer name
        """
        self.app_name = app_name
        self.manufacturer = manufacturer
        self.registry_entries = {}
        
        logger.info(f"Registry manager initialized: {app_name}")
    
    def register_application(self, version: str = '1.0.0', install_path: str = '[INSTALLFOLDER]') -> Dict:
        """
        Register application in registry
        
        Args:
            version: Application version
            install_path: Installation path
            
        Returns:
            Registry entries
        """
        entries = {
            'DisplayName': self.app_name,
            'DisplayVersion': version,
            'Publisher': self.manufacturer,
            'InstallPath': install_path,
            'Version': version,
            'UninstallString': f'MsiExec.exe /X{{GUID}}',
        }
        
        self.registry_entries['application'] = entries
        logger.info(f"Registered application: {self.app_name}")
        
        return entries
    
    def add_run_entry(self, auto_run: bool = False) -> Dict:
        """
        Add Run registry entry for startup
        
        Args:
            auto_run: Enable auto-run
            
        Returns:
            Run entry
        """
        entry = {
            'enabled': auto_run,
            'path': f'{self.app_name} -autorun' if auto_run else self.app_name,
        }
        
        self.registry_entries['run'] = entry
        logger.info(f"Added Run entry: {self.app_name}")
        
        return entry
    
    def add_file_association(self, file_extension: str, description: str) -> Dict:
        """
        Add file association
        
        Args:
            file_extension: File extension (.jarvis)
            description: File type description
            
        Returns:
            Association entry
        """
        entry = {
            'extension': file_extension,
            'description': description,
            'action': 'open',
            'command': f'[INSTALLFOLDER]jarvis.exe "%1"',
        }
        
        if 'file_associations' not in self.registry_entries:
            self.registry_entries['file_associations'] = {}
        
        self.registry_entries['file_associations'][file_extension] = entry
        logger.info(f"Added file association: {file_extension}")
        
        return entry
    
    def add_context_menu(self, menu_text: str = 'Open with Jarvis') -> Dict:
        """
        Add context menu entry
        
        Args:
            menu_text: Menu item text
            
        Returns:
            Context menu entry
        """
        entry = {
            'text': menu_text,
            'command': '[INSTALLFOLDER]jarvis.exe "%1"',
            'icon': '[INSTALLFOLDER]jarvis.exe,0',
        }
        
        self.registry_entries['context_menu'] = entry
        logger.info(f"Added context menu: {menu_text}")
        
        return entry
    
    def get_registry_wxs(self) -> str:
        """
        Get WiX registry definition
        
        Returns:
            WiX XML content
        """
        registry_keys = []
        
        # Application registry
        if 'application' in self.registry_entries:
            entries = self.registry_entries['application']
            reg_entries = '\n      '.join([
                f'<RegistryValue Type="string" Name="{key}" Value="{value}" />'
                for key, value in entries.items()
            ])
            
            registry_keys.append(f'''
    <Component Id="RegistryApplication" Guid="*">
      <RegistryKey Root="HKLM" Key="Software\\{self.manufacturer}\\{self.app_name}" Action="createAndRemoveOnUninstall">
        {reg_entries}
      </RegistryKey>
    </Component>
''')
        
        # File associations
        if 'file_associations' in self.registry_entries:
            for ext, entry in self.registry_entries['file_associations'].items():
                registry_keys.append(f'''
    <Component Id="FileAssoc{ext.replace('.', '')}" Guid="*">
      <RegistryKey Root="HKCR" Key="{ext}" Action="createAndRemoveOnUninstall">
        <RegistryValue Type="string" Value="{entry['description']}" />
      </RegistryKey>
    </Component>
''')
        
        wxs = ''.join(registry_keys)
        return wxs
    
    def get_registry_info(self) -> Dict:
        """
        Get registry information
        
        Returns:
            Registry entries dictionary
        """
        return self.registry_entries
    
    def print_registry_summary(self) -> None:
        """Print registry summary"""
        print("\n" + "="*70)
        print("REGISTRY ENTRIES SUMMARY")
        print("="*70)
        
        for entry_type, entries in self.registry_entries.items():
            print(f"\n{entry_type.upper()}:")
            if isinstance(entries, dict):
                if all(isinstance(v, str) for v in entries.values()):
                    # Simple string dictionary
                    for key, value in entries.items():
                        print(f"  {key}: {value}")
                else:
                    # Nested dictionary
                    for key, value in entries.items():
                        print(f"  {key}:")
                        for k, v in value.items():
                            print(f"    {k}: {v}")
        
        print("="*70)
