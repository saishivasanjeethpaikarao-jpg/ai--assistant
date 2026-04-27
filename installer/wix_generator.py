"""
WiX Generator
Generates WiX files for MSI compilation
"""

import logging
import uuid
from pathlib import Path
from typing import List, Dict

from .config import InstallerConfig

logger = logging.getLogger(__name__)


class WiXGenerator:
    """Generates WiX files for MSI creation"""
    
    def __init__(self, config: InstallerConfig):
        """
        Initialize WiX generator
        
        Args:
            config: Installer configuration
        """
        self.config = config
        self.product_guid = str(uuid.uuid4())
        self.upgrade_guid = str(uuid.uuid4())
        self.output_dir = config.build_dir
        
        self.output_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"WiX generator initialized: {self.output_dir}")
    
    def generate_product_wxs(self) -> str:
        """
        Generate main product WiX file
        
        Returns:
            WiX XML content
        """
        wxs = f'''<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Product 
    Id="{{{self.product_guid}}}" 
    Name="{self.config.app_name}" 
    Language="1033" 
    Version="{self.config.version}" 
    Manufacturer="{self.config.manufacturer}">
    
    <Package 
      Id="*" 
      InstallerVersion="200" 
      Compressed="yes" 
      InstallScope="{self.config.install_scope}" />
    
    <Media Id="1" Cabinet="{self.config.app_name}.cab" EmbedCab="yes" />
    
    <!-- Installation directory -->
    <Directory Id="TARGETDIR" Name="SourceDir">
      <Directory Id="{self.config.install_dir}">
        <Directory Id="INSTALLFOLDER" Name="{self.config.app_name}" />
      </Directory>
      
      <!-- Start Menu -->
      <Directory Id="ProgramMenuFolder">
        <Directory Id="STARTMENUFOLDER" Name="{self.config.app_name}" />
      </Directory>
      
      <!-- Desktop -->
      <Directory Id="DesktopFolder" Name="Desktop" />
    </Directory>
    
    <!-- Features -->
    <Feature Id="ProductFeature" Title="{self.config.app_name}" Level="1">
      <ComponentRef Id="MainExecutable" />
      <ComponentRef Id="DesktopShortcut" />
      <ComponentRef Id="StartMenuShortcut" />
      <ComponentRef Id="RegistryEntries" />
    </Feature>
  </Product>
</Wix>
'''
        return wxs
    
    def generate_files_wxs(self) -> str:
        """
        Generate files component WiX
        
        Returns:
            WiX XML content
        """
        wxs = f'''<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Fragment>
    <ComponentGroup Id="ProductComponents" Directory="INSTALLFOLDER">
      
      <!-- Main executable -->
      <Component Id="MainExecutable" Guid="{{{uuid.uuid4()}}}">
        <File 
          Id="JarvisExe" 
          Source="$(var.SourceDir)jarvis.exe" 
          KeyPath="yes" 
          Checksum="yes">
          <Shortcut 
            Id="DesktopShortcut" 
            Directory="DesktopFolder" 
            Name="{self.config.app_name}" 
            WorkingDirectory="INSTALLFOLDER" 
            Icon="JarvisIcon.ico" 
            IconIndex="0"
            Advertise="yes" />
          <Shortcut 
            Id="StartMenuShortcut" 
            Directory="STARTMENUFOLDER" 
            Name="{self.config.app_name}" 
            WorkingDirectory="INSTALLFOLDER" 
            Icon="JarvisIcon.ico" 
            IconIndex="0"
            Advertise="yes" />
        </File>
      </Component>
      
    </ComponentGroup>
  </Fragment>
</Wix>
'''
        return wxs
    
    def generate_registry_wxs(self) -> str:
        """
        Generate registry component WiX
        
        Returns:
            WiX XML content
        """
        registry_entries = '\n    '.join([
            f'<RegistryValue Type="string" Name="{key}" Value="{value}" />'
            for key, value in self.config.registry_entries.items()
        ])
        
        wxs = f'''<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Fragment>
    <Component Id="RegistryEntries" Directory="INSTALLFOLDER" Guid="{{{uuid.uuid4()}}}">
      <RegistryKey 
        Root="HKLM" 
        Key="Software\\{self.config.manufacturer}\\{self.config.app_name}" 
        Action="createAndRemoveOnUninstall">
        {registry_entries}
      </RegistryKey>
    </Component>
  </Fragment>
</Wix>
'''
        return wxs
    
    def generate_ui_wxs(self) -> str:
        """
        Generate user interface WiX
        
        Returns:
            WiX XML content
        """
        wxs = '''<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wixui">
  <Fragment>
    <UI Id="WixUI_Installdir">
      <!-- Welcome dialog -->
      <TextStyle Id="WixUI_Font_Normal" FaceName="Tahoma" Size="8" />
      <TextStyle Id="WixUI_Font_Bigger" FaceName="Tahoma" Size="12" Bold="yes" />
      <TextStyle Id="WixUI_Font_Title" FaceName="Tahoma" Size="9" Bold="yes" />
      
      <!-- License dialog -->
      <DialogRef Id="LicenseDlg" />
      <DialogRef Id="InstallDirDlg" />
      <DialogRef Id="ProgressDlg" />
      <DialogRef Id="ResumeDlg" />
      <DialogRef Id="UserExit" />
      <DialogRef Id="ExitDlg" />
      
      <!-- UI flow -->
      <Publish Dialog="WelcomeDlg" Control="Next" Event="NewDialog" Value="LicenseDlg">1</Publish>
      <Publish Dialog="LicenseDlg" Control="Back" Event="NewDialog" Value="WelcomeDlg">1</Publish>
      <Publish Dialog="LicenseDlg" Control="Next" Event="NewDialog" Value="InstallDirDlg">LicenseAccepted = "1"</Publish>
      <Publish Dialog="InstallDirDlg" Control="Back" Event="NewDialog" Value="LicenseDlg">1</Publish>
      <Publish Dialog="InstallDirDlg" Control="Next" Event="SetTargetPath" Value="[INSTALLFOLDER]" Order="1">1</Publish>
      <Publish Dialog="InstallDirDlg" Control="Next" Event="DoAction" Value="WixUIValidatePath" Order="2">NOT WIXUI_DONTVALIDATEPATH</Publish>
      <Publish Dialog="InstallDirDlg" Control="Next" Event="NewDialog" Value="ProgressDlg" Order="3">WIXUI_INSTALLDIR_VALID="1"</Publish>
      <Publish Dialog="ProgressDlg" Control="Cancel" Event="Query" Value="1" Order="2">1</Publish>
      <Publish Dialog="ResumeDlg" Control="Finish" Event="EndDialog" Value="Return" Order="3">1</Publish>
      <Publish Dialog="UserExit" Control="Finish" Event="EndDialog" Value="Return" Order="2">1</Publish>
      <Publish Dialog="ExitDlg" Control="Finish" Event="EndDialog" Value="Return" Order="2">1</Publish>
    </UI>
  </Fragment>
</Wix>
'''
        return wxs
    
    def save_wxs_files(self) -> bool:
        """
        Save all WiX files
        
        Returns:
            Success status
        """
        try:
            logger.info("Generating WiX files...")
            
            # Generate and save
            files = {
                'product.wxs': self.generate_product_wxs(),
                'files.wxs': self.generate_files_wxs(),
                'registry.wxs': self.generate_registry_wxs(),
                'ui.wxs': self.generate_ui_wxs(),
            }
            
            for filename, content in files.items():
                path = self.output_dir / filename
                with open(path, 'w') as f:
                    f.write(content)
                logger.debug(f"Generated: {filename}")
            
            logger.info("✓ WiX files generated")
            return True
        except Exception as e:
            logger.error(f"Error generating WiX files: {e}")
            return False
    
    def print_wix_summary(self) -> None:
        """Print WiX generation summary"""
        print("\n" + "="*70)
        print("WiX GENERATION SUMMARY")
        print("="*70)
        print(f"Product ID:      {self.product_guid}")
        print(f"Upgrade ID:      {self.upgrade_guid}")
        print(f"App Name:        {self.config.app_name}")
        print(f"Version:         {self.config.version}")
        print(f"Output Dir:      {self.output_dir}")
        print("="*70)
