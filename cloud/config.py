"""
Cloud Configuration Management
Multi-cloud provider settings
"""

import logging
import json
from dataclasses import dataclass, asdict, field
from pathlib import Path
from typing import List, Optional

logger = logging.getLogger(__name__)


@dataclass
class CloudConfig:
    """Cloud deployment configuration"""
    
    # Cloud providers
    enabled_providers: List[str] = field(default_factory=lambda: ['aws'])
    
    # AWS Configuration
    aws_region: str = 'us-east-1'
    aws_instance_type: str = 't3.micro'
    aws_bucket_name: str = 'jarvis-prod-updates'
    aws_api_key: Optional[str] = None
    aws_secret_key: Optional[str] = None
    
    # Azure Configuration
    azure_region: str = 'eastus'
    azure_resource_group: str = 'jarvis-rg'
    azure_app_service_name: str = 'jarvis-app'
    azure_subscription_id: Optional[str] = None
    azure_client_id: Optional[str] = None
    azure_client_secret: Optional[str] = None
    
    # Heroku Configuration
    heroku_app_name: str = 'jarvis-prod'
    heroku_api_key: Optional[str] = None
    heroku_region: str = 'us'
    
    # Common Settings
    auto_update_enabled: bool = True
    monitoring_enabled: bool = True
    backup_enabled: bool = True
    cdn_enabled: bool = True
    db_name: str = 'jarvis_prod'
    db_backup_enabled: bool = True
    
    # Version & Build
    app_version: str = '9.0.0'
    app_name: str = 'Jarvis'
    
    def validate(self) -> bool:
        """
        Validate configuration
        
        Returns:
            Configuration valid
        """
        try:
            logger.info("Validating cloud configuration...")
            
            # Check providers
            valid_providers = {'aws', 'azure', 'heroku'}
            for provider in self.enabled_providers:
                if provider not in valid_providers:
                    logger.warning(f"Unknown provider: {provider}")
                    return False
            
            # Check regions
            if self.aws_region not in ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1']:
                logger.warning(f"Unknown AWS region: {self.aws_region}")
            
            if self.azure_region not in ['eastus', 'westus', 'northeurope', 'southeastasia']:
                logger.warning(f"Unknown Azure region: {self.azure_region}")
            
            # Check instance types
            if not self.aws_instance_type.startswith(('t3', 't2', 'm5', 'm6')):
                logger.warning(f"Unusual instance type: {self.aws_instance_type}")
            
            # Check names
            if not self.aws_bucket_name or not self.heroku_app_name:
                logger.warning("Missing bucket or app name")
                return False
            
            logger.info("✓ Configuration valid")
            return True
        except Exception as e:
            logger.error(f"Validation failed: {e}")
            return False
    
    def to_dict(self) -> dict:
        """
        Convert to dictionary
        
        Returns:
            Configuration dictionary
        """
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: dict) -> 'CloudConfig':
        """
        Create from dictionary
        
        Args:
            data: Configuration dict
            
        Returns:
            CloudConfig instance
        """
        return cls(**data)
    
    @classmethod
    def load_from_env(cls) -> 'CloudConfig':
        """
        Load from environment variables
        
        Returns:
            CloudConfig instance
        """
        import os
        
        config = cls()
        
        # AWS
        config.aws_region = os.getenv('AWS_REGION', config.aws_region)
        config.aws_api_key = os.getenv('AWS_ACCESS_KEY_ID')
        config.aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        
        # Azure
        config.azure_subscription_id = os.getenv('AZURE_SUBSCRIPTION_ID')
        config.azure_client_id = os.getenv('AZURE_CLIENT_ID')
        config.azure_client_secret = os.getenv('AZURE_CLIENT_SECRET')
        
        # Heroku
        config.heroku_api_key = os.getenv('HEROKU_API_KEY')
        
        logger.info("Loaded configuration from environment")
        return config
    
    @classmethod
    def load_from_file(cls, path: Path) -> 'CloudConfig':
        """
        Load from JSON file
        
        Args:
            path: Config file path
            
        Returns:
            CloudConfig instance
        """
        try:
            with open(path, 'r') as f:
                data = json.load(f)
            
            config = cls.from_dict(data)
            logger.info(f"Loaded configuration from {path}")
            return config
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            return cls()
    
    def save_to_file(self, path: Path) -> bool:
        """
        Save to JSON file
        
        Args:
            path: Output path
            
        Returns:
            Save successful
        """
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(path, 'w') as f:
                json.dump(self.to_dict(), f, indent=2)
            
            logger.info(f"Saved configuration to {path}")
            return True
        except Exception as e:
            logger.error(f"Failed to save config: {e}")
            return False
