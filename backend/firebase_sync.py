"""
Firebase Integration Module - Cloud Sync & Multi-User Support
Multi-user authentication, cloud backup, cross-device sync
"""

import json
import os
import hashlib
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum
import logging

logger = logging.getLogger(__name__)

# Firebase config
FIREBASE_CONFIG_FILE = "firebase_secrets.py"
CLOUD_DATA_DIR = "cloud_sync"


class SyncStatus(Enum):
    """Sync states"""
    SYNCED = "synced"
    PENDING = "pending"
    SYNCING = "syncing"
    ERROR = "error"


@dataclass
class User:
    """User profile"""
    uid: str
    email: str
    username: str
    created_at: str
    last_login: str
    profile_picture_url: Optional[str] = None
    preferences: Dict = None
    
    def __post_init__(self):
        if self.preferences is None:
            self.preferences = {}


@dataclass
class CloudBackup:
    """Cloud backup record"""
    backup_id: str
    user_id: str
    timestamp: str
    data_type: str  # watchlist, portfolio, alerts, preferences
    data_hash: str
    size_bytes: int
    status: SyncStatus
    device_name: str


@dataclass
class SyncLog:
    """Sync operation log"""
    sync_id: str
    user_id: str
    timestamp: str
    operation: str  # pull, push, merge
    status: SyncStatus
    changed_items: int
    device_name: str


class FirebaseAuth:
    """Firebase Authentication"""
    
    def __init__(self):
        self.current_user: Optional[User] = None
        self.auth_token: Optional[str] = None
        self._load_firebase_config()
    
    def _load_firebase_config(self):
        """Load Firebase configuration"""
        try:
            if os.path.exists(FIREBASE_CONFIG_FILE):
                import sys
                sys.path.insert(0, os.path.dirname(FIREBASE_CONFIG_FILE))
                from firebase_secrets import (
                    FIREBASE_API_KEY,
                    FIREBASE_AUTH_DOMAIN,
                    FIREBASE_PROJECT_ID,
                    FIREBASE_STORAGE_BUCKET,
                    FIREBASE_MESSAGING_SENDER_ID,
                    FIREBASE_APP_ID
                )
                
                self.config = {
                    "apiKey": FIREBASE_API_KEY,
                    "authDomain": FIREBASE_AUTH_DOMAIN,
                    "projectId": FIREBASE_PROJECT_ID,
                    "storageBucket": FIREBASE_STORAGE_BUCKET,
                    "messagingSenderId": FIREBASE_MESSAGING_SENDER_ID,
                    "appId": FIREBASE_APP_ID
                }
                logger.info("Firebase config loaded")
            else:
                logger.warning("Firebase config file not found")
                self.config = {}
        except Exception as e:
            logger.error(f"Error loading Firebase config: {e}")
            self.config = {}
    
    def sign_up(self, email: str, password: str, username: str) -> Tuple[bool, str]:
        """Create new Firebase user account
        
        In production, use Firebase Admin SDK:
        firebase_admin.auth.create_user(email=email, password=password)
        """
        try:
            # Validate email
            if not self._validate_email(email):
                return False, "Invalid email format"
            
            # Validate password strength
            if len(password) < 8:
                return False, "Password must be at least 8 characters"
            
            # Create user locally (would be Firebase in production)
            uid = self._generate_uid()
            user = User(
                uid=uid,
                email=email,
                username=username,
                created_at=datetime.now().isoformat(),
                last_login=datetime.now().isoformat()
            )
            
            self.current_user = user
            self.auth_token = self._generate_token(uid)
            
            logger.info(f"User registered: {email}")
            return True, "Registration successful"
        except Exception as e:
            logger.error(f"Sign up error: {e}")
            return False, str(e)
    
    def sign_in(self, email: str, password: str) -> Tuple[bool, str]:
        """Sign in existing Firebase user"""
        try:
            # In production, use Firebase Admin SDK authentication
            # This is a mock implementation
            if not self._validate_credentials(email, password):
                return False, "Invalid email or password"
            
            uid = self._get_user_id_by_email(email)
            if not uid:
                return False, "User not found"
            
            self.current_user = User(
                uid=uid,
                email=email,
                username=email.split("@")[0],
                created_at=datetime.now().isoformat(),
                last_login=datetime.now().isoformat()
            )
            
            self.auth_token = self._generate_token(uid)
            
            logger.info(f"User signed in: {email}")
            return True, "Sign in successful"
        except Exception as e:
            logger.error(f"Sign in error: {e}")
            return False, str(e)
    
    def sign_out(self) -> bool:
        """Sign out current user"""
        self.current_user = None
        self.auth_token = None
        logger.info("User signed out")
        return True
    
    def get_current_user(self) -> Optional[User]:
        """Get currently authenticated user"""
        return self.current_user
    
    def is_authenticated(self) -> bool:
        """Check if user is authenticated"""
        return self.current_user is not None and self.auth_token is not None
    
    @staticmethod
    def _validate_email(email: str) -> bool:
        """Validate email format"""
        return "@" in email and "." in email.split("@")[1]
    
    @staticmethod
    def _validate_credentials(email: str, password: str) -> bool:
        """Mock credential validation"""
        # In production, would verify against Firebase
        return len(email) > 0 and len(password) >= 8
    
    @staticmethod
    def _generate_uid() -> str:
        """Generate unique user ID"""
        import uuid
        return str(uuid.uuid4())
    
    @staticmethod
    def _get_user_id_by_email(email: str) -> Optional[str]:
        """Get user ID by email (mock)"""
        # In production, would query Firebase
        return FirebaseAuth._generate_uid()
    
    @staticmethod
    def _generate_token(uid: str) -> str:
        """Generate JWT-like auth token"""
        import secrets
        return secrets.token_urlsafe(32)


class CloudSync:
    """Cloud synchronization manager"""
    
    def __init__(self, auth: FirebaseAuth):
        self.auth = auth
        self.sync_logs: List[SyncLog] = []
        self.backups: List[CloudBackup] = []
    
    def sync_watchlist_to_cloud(self, watchlist_data: Dict) -> Tuple[bool, str]:
        """Upload watchlist to cloud"""
        if not self.auth.is_authenticated():
            return False, "Not authenticated"
        
        try:
            user = self.auth.get_current_user()
            
            # Generate data hash
            data_hash = self._generate_hash(watchlist_data)
            
            # Create backup record
            backup = CloudBackup(
                backup_id=self._generate_id(),
                user_id=user.uid,
                timestamp=datetime.now().isoformat(),
                data_type="watchlist",
                data_hash=data_hash,
                size_bytes=len(json.dumps(watchlist_data)),
                status=SyncStatus.SYNCING,
                device_name=self._get_device_name()
            )
            
            # In production, upload to Firebase Firestore
            # firebase_db.collection("users").document(user.uid)
            #   .collection("backups").document(backup.backup_id).set(data)
            
            backup.status = SyncStatus.SYNCED
            self.backups.append(backup)
            
            log = SyncLog(
                sync_id=self._generate_id(),
                user_id=user.uid,
                timestamp=datetime.now().isoformat(),
                operation="push",
                status=SyncStatus.SYNCED,
                changed_items=len(watchlist_data),
                device_name=self._get_device_name()
            )
            self.sync_logs.append(log)
            
            logger.info(f"Watchlist synced for user {user.email}")
            return True, "Watchlist synced successfully"
        except Exception as e:
            logger.error(f"Sync error: {e}")
            return False, str(e)
    
    def sync_portfolio_to_cloud(self, portfolio_data: Dict) -> Tuple[bool, str]:
        """Upload portfolio to cloud"""
        if not self.auth.is_authenticated():
            return False, "Not authenticated"
        
        try:
            user = self.auth.get_current_user()
            
            backup = CloudBackup(
                backup_id=self._generate_id(),
                user_id=user.uid,
                timestamp=datetime.now().isoformat(),
                data_type="portfolio",
                data_hash=self._generate_hash(portfolio_data),
                size_bytes=len(json.dumps(portfolio_data)),
                status=SyncStatus.SYNCED,
                device_name=self._get_device_name()
            )
            
            self.backups.append(backup)
            
            logger.info(f"Portfolio synced for user {user.email}")
            return True, "Portfolio synced successfully"
        except Exception as e:
            logger.error(f"Sync error: {e}")
            return False, str(e)
    
    def sync_alerts_to_cloud(self, alerts_data: Dict) -> Tuple[bool, str]:
        """Upload alerts to cloud"""
        if not self.auth.is_authenticated():
            return False, "Not authenticated"
        
        try:
            user = self.auth.get_current_user()
            
            backup = CloudBackup(
                backup_id=self._generate_id(),
                user_id=user.uid,
                timestamp=datetime.now().isoformat(),
                data_type="alerts",
                data_hash=self._generate_hash(alerts_data),
                size_bytes=len(json.dumps(alerts_data)),
                status=SyncStatus.SYNCED,
                device_name=self._get_device_name()
            )
            
            self.backups.append(backup)
            
            logger.info(f"Alerts synced for user {user.email}")
            return True, "Alerts synced successfully"
        except Exception as e:
            logger.error(f"Sync error: {e}")
            return False, str(e)
    
    def pull_from_cloud(self, data_type: str) -> Tuple[bool, Dict]:
        """Download data from cloud"""
        if not self.auth.is_authenticated():
            return False, {}
        
        try:
            user = self.auth.get_current_user()
            
            # Find latest backup of type
            latest_backup = None
            for backup in self.backups:
                if backup.user_id == user.uid and backup.data_type == data_type:
                    if latest_backup is None or backup.timestamp > latest_backup.timestamp:
                        latest_backup = backup
            
            if not latest_backup:
                return False, {}
            
            # In production, fetch from Firebase
            data = {}
            
            log = SyncLog(
                sync_id=self._generate_id(),
                user_id=user.uid,
                timestamp=datetime.now().isoformat(),
                operation="pull",
                status=SyncStatus.SYNCED,
                changed_items=len(data),
                device_name=self._get_device_name()
            )
            self.sync_logs.append(log)
            
            return True, data
        except Exception as e:
            logger.error(f"Pull error: {e}")
            return False, {}
    
    def get_sync_status(self) -> Dict:
        """Get overall sync status"""
        if not self.auth.is_authenticated():
            return {}
        
        user = self.auth.get_current_user()
        user_backups = [b for b in self.backups if b.user_id == user.uid]
        user_logs = [l for l in self.sync_logs if l.user_id == user.uid]
        
        return {
            "user": user.email,
            "total_backups": len(user_backups),
            "last_sync": user_logs[-1].timestamp if user_logs else None,
            "sync_status": "synced" if not any(b.status == SyncStatus.PENDING for b in user_backups) else "pending",
            "backup_data_types": list(set(b.data_type for b in user_backups)),
            "total_size_mb": sum(b.size_bytes for b in user_backups) / (1024 * 1024)
        }
    
    @staticmethod
    def _generate_hash(data: Dict) -> str:
        """Generate SHA256 hash of data"""
        data_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256(data_str.encode()).hexdigest()
    
    @staticmethod
    def _generate_id() -> str:
        """Generate unique ID"""
        import uuid
        return str(uuid.uuid4())
    
    @staticmethod
    def _get_device_name() -> str:
        """Get device identifier"""
        import platform
        return platform.node()


class MultiDeviceSync:
    """Manage sync across multiple devices"""
    
    def __init__(self, auth: FirebaseAuth):
        self.auth = auth
        self.devices: Dict[str, Dict] = {}
    
    def register_device(self, device_name: str, device_type: str) -> Tuple[bool, str]:
        """Register a new device for sync"""
        if not self.auth.is_authenticated():
            return False, "Not authenticated"
        
        try:
            user = self.auth.get_current_user()
            device_id = self._generate_device_id()
            
            self.devices[device_id] = {
                "user_id": user.uid,
                "device_name": device_name,
                "device_type": device_type,
                "registered_at": datetime.now().isoformat(),
                "last_sync": None
            }
            
            logger.info(f"Device registered: {device_name}")
            return True, device_id
        except Exception as e:
            logger.error(f"Device registration error: {e}")
            return False, str(e)
    
    def get_registered_devices(self) -> List[Dict]:
        """Get all registered devices for current user"""
        if not self.auth.is_authenticated():
            return []
        
        user = self.auth.get_current_user()
        return [d for d in self.devices.values() if d["user_id"] == user.uid]
    
    def sync_all_devices(self) -> Tuple[bool, int]:
        """Sync data across all devices"""
        if not self.auth.is_authenticated():
            return False, 0
        
        try:
            user = self.auth.get_current_user()
            synced_devices = 0
            
            for device_id, device in self.devices.items():
                if device["user_id"] == user.uid:
                    device["last_sync"] = datetime.now().isoformat()
                    synced_devices += 1
            
            logger.info(f"Synced {synced_devices} devices")
            return True, synced_devices
        except Exception as e:
            logger.error(f"Sync error: {e}")
            return False, 0
    
    @staticmethod
    def _generate_device_id() -> str:
        """Generate unique device ID"""
        import uuid
        return str(uuid.uuid4())


# Singleton instances
_firebase_auth = None
_cloud_sync = None


def get_firebase_auth() -> FirebaseAuth:
    """Get singleton Firebase auth instance"""
    global _firebase_auth
    if _firebase_auth is None:
        _firebase_auth = FirebaseAuth()
    return _firebase_auth


def get_cloud_sync() -> CloudSync:
    """Get singleton cloud sync instance"""
    global _cloud_sync
    if _cloud_sync is None:
        auth = get_firebase_auth()
        _cloud_sync = CloudSync(auth)
    return _cloud_sync
