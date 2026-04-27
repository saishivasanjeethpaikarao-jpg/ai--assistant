"""
Alerts & Notifications System
Price alerts, performance alerts, and multi-channel notifications
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from market_tracker import get_watchlist, get_portfolio
from indian_stock_api import get_api

logger = logging.getLogger(__name__)

ALERTS_DIR = "memory"
ALERTS_FILE = os.path.join(ALERTS_DIR, "alerts.json")
NOTIFICATIONS_FILE = os.path.join(ALERTS_DIR, "notifications.json")


class AlertType(Enum):
    """Alert types"""
    PRICE_ALERT = "price"
    PERFORMANCE_ALERT = "performance"
    PORTFOLIO_ALERT = "portfolio"
    SECTOR_ALERT = "sector"
    TECHNICAL_ALERT = "technical"
    NEWS_ALERT = "news"


class AlertChannel(Enum):
    """Notification channels"""
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    IN_APP = "in_app"
    TELEGRAM = "telegram"


class AlertPriority(Enum):
    """Alert priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class Alert:
    """Alert configuration"""
    id: str
    symbol: str
    alert_type: AlertType
    condition: str  # e.g., "price > 2500" or "change > 5%"
    threshold: float
    channels: List[AlertChannel]
    priority: AlertPriority
    enabled: bool
    created_at: str
    last_triggered: Optional[str] = None
    trigger_count: int = 0


@dataclass
class Notification:
    """Sent notification record"""
    id: str
    alert_id: str
    symbol: str
    message: str
    channel: AlertChannel
    sent_at: str
    read: bool = False


class NotificationService:
    """Handle notifications across multiple channels"""
    
    def __init__(self):
        self.email_config = self._load_email_config()
        self.sms_config = self._load_sms_config()
        self.telegram_config = self._load_telegram_config()
    
    def _load_email_config(self) -> Dict:
        """Load email configuration from env"""
        return {
            "sender": os.getenv("ALERT_EMAIL_SENDER", ""),
            "password": os.getenv("ALERT_EMAIL_PASSWORD", ""),
            "smtp_server": os.getenv("ALERT_SMTP_SERVER", "smtp.gmail.com"),
            "smtp_port": int(os.getenv("ALERT_SMTP_PORT", "587")),
            "recipient": os.getenv("ALERT_EMAIL_RECIPIENT", "")
        }
    
    def _load_sms_config(self) -> Dict:
        """Load SMS configuration (Twilio)"""
        return {
            "account_sid": os.getenv("TWILIO_ACCOUNT_SID", ""),
            "auth_token": os.getenv("TWILIO_AUTH_TOKEN", ""),
            "phone_from": os.getenv("TWILIO_PHONE_FROM", ""),
            "phone_to": os.getenv("TWILIO_PHONE_TO", "")
        }
    
    def _load_telegram_config(self) -> Dict:
        """Load Telegram configuration"""
        return {
            "bot_token": os.getenv("TELEGRAM_BOT_TOKEN", ""),
            "chat_id": os.getenv("TELEGRAM_CHAT_ID", "")
        }
    
    def send_email(self, subject: str, body: str, recipient: Optional[str] = None) -> bool:
        """Send email notification"""
        try:
            if not self.email_config["sender"] or not self.email_config["password"]:
                logger.warning("Email not configured")
                return False
            
            recipient = recipient or self.email_config["recipient"]
            if not recipient:
                return False
            
            msg = MIMEMultipart()
            msg["From"] = self.email_config["sender"]
            msg["To"] = recipient
            msg["Subject"] = subject
            
            msg.attach(MIMEText(body, "html"))
            
            with smtplib.SMTP(self.email_config["smtp_server"], self.email_config["smtp_port"]) as server:
                server.starttls()
                server.login(self.email_config["sender"], self.email_config["password"])
                server.send_message(msg)
            
            logger.info(f"Email sent to {recipient}")
            return True
        except Exception as e:
            logger.error(f"Email send failed: {e}")
            return False
    
    def send_sms(self, message: str, phone: Optional[str] = None) -> bool:
        """Send SMS notification via Twilio"""
        try:
            if not self.sms_config["account_sid"] or not self.sms_config["auth_token"]:
                logger.warning("SMS not configured")
                return False
            
            # This would require: pip install twilio
            try:
                from twilio.rest import Client
            except ImportError:
                logger.warning("Twilio package not installed")
                return False
            
            client = Client(self.sms_config["account_sid"], self.sms_config["auth_token"])
            
            phone = phone or self.sms_config["phone_to"]
            
            client.messages.create(
                body=message,
                from_=self.sms_config["phone_from"],
                to=phone
            )
            
            logger.info(f"SMS sent to {phone}")
            return True
        except Exception as e:
            logger.error(f"SMS send failed: {e}")
            return False
    
    def send_telegram(self, message: str, chat_id: Optional[str] = None) -> bool:
        """Send Telegram notification"""
        try:
            if not self.telegram_config["bot_token"] or not self.telegram_config["chat_id"]:
                logger.warning("Telegram not configured")
                return False
            
            try:
                import requests
            except ImportError:
                logger.warning("Requests package not installed")
                return False
            
            chat_id = chat_id or self.telegram_config["chat_id"]
            url = f"https://api.telegram.org/bot{self.telegram_config['bot_token']}/sendMessage"
            
            response = requests.post(url, json={"chat_id": chat_id, "text": message})
            
            if response.status_code == 200:
                logger.info(f"Telegram message sent to {chat_id}")
                return True
            else:
                logger.error(f"Telegram send failed: {response.text}")
                return False
        except Exception as e:
            logger.error(f"Telegram send failed: {e}")
            return False
    
    def send_push(self, title: str, body: str) -> bool:
        """Send push notification (platform-specific)"""
        try:
            # This could integrate with:
            # - Firebase Cloud Messaging
            # - OneSignal
            # - Local system notifications via plyer
            
            try:
                from plyer import notification
                notification.notify(
                    title=title,
                    message=body,
                    timeout=10
                )
                logger.info("Push notification sent")
                return True
            except ImportError:
                logger.warning("Plyer not available for push notifications")
                return False
        except Exception as e:
            logger.error(f"Push notification failed: {e}")
            return False
    
    def send_notification(self, alert: Alert, message: str) -> bool:
        """Send notification through configured channels"""
        success = False
        
        for channel in alert.channels:
            if channel == AlertChannel.EMAIL:
                success |= self.send_email(f"Alert: {alert.symbol}", message)
            elif channel == AlertChannel.SMS:
                success |= self.send_sms(message)
            elif channel == AlertChannel.TELEGRAM:
                success |= self.send_telegram(message)
            elif channel == AlertChannel.PUSH:
                success |= self.send_push(f"Alert: {alert.symbol}", message)
            elif channel == AlertChannel.IN_APP:
                success |= self._save_inapp_notification(alert.id, message)
        
        return success
    
    def _save_inapp_notification(self, alert_id: str, message: str) -> bool:
        """Save in-app notification"""
        try:
            notification = Notification(
                id=self._generate_id(),
                alert_id=alert_id,
                symbol=alert_id.split("_")[0],
                message=message,
                channel=AlertChannel.IN_APP,
                sent_at=datetime.now().isoformat()
            )
            self._save_notification(notification)
            return True
        except Exception as e:
            logger.error(f"In-app notification save failed: {e}")
            return False


class AlertManager:
    """Manage alerts and trigger conditions"""
    
    def __init__(self):
        self.api = get_api()
        self.notification_service = NotificationService()
        self.alerts: Dict[str, Alert] = {}
        self.load_alerts()
    
    def create_price_alert(self, symbol: str, condition: str, threshold: float,
                          channels: List[AlertChannel] = None, 
                          priority: AlertPriority = AlertPriority.MEDIUM) -> str:
        """Create a price alert
        
        Usage:
            create_price_alert("RELIANCE", "above", 2600)
            create_price_alert("TCS", "below", 3000)
        """
        alert_id = self._generate_id()
        
        alert = Alert(
            id=alert_id,
            symbol=symbol.upper(),
            alert_type=AlertType.PRICE_ALERT,
            condition=f"price {condition} {threshold}",
            threshold=threshold,
            channels=channels or [AlertChannel.IN_APP, AlertChannel.PUSH],
            priority=priority,
            enabled=True,
            created_at=datetime.now().isoformat()
        )
        
        self.alerts[alert_id] = alert
        self.save_alerts()
        logger.info(f"Created alert {alert_id}: {symbol} {condition} {threshold}")
        return alert_id
    
    def create_performance_alert(self, symbol: str, change_threshold: float,
                                channels: List[AlertChannel] = None,
                                priority: AlertPriority = AlertPriority.MEDIUM) -> str:
        """Create performance alert"""
        alert_id = self._generate_id()
        
        alert = Alert(
            id=alert_id,
            symbol=symbol.upper(),
            alert_type=AlertType.PERFORMANCE_ALERT,
            condition=f"change > {change_threshold}%",
            threshold=change_threshold,
            channels=channels or [AlertChannel.IN_APP],
            priority=priority,
            enabled=True,
            created_at=datetime.now().isoformat()
        )
        
        self.alerts[alert_id] = alert
        self.save_alerts()
        return alert_id
    
    def check_alerts(self) -> Dict[str, List[str]]:
        """Check all active alerts and trigger if conditions met"""
        triggered_alerts = {}
        
        for alert_id, alert in self.alerts.items():
            if not alert.enabled:
                continue
            
            try:
                stock = self.api.get_stock(alert.symbol)
                if not stock:
                    continue
                
                should_trigger = False
                message = ""
                
                if alert.alert_type == AlertType.PRICE_ALERT:
                    if "above" in alert.condition and stock.last_price >= alert.threshold:
                        should_trigger = True
                        message = f"{alert.symbol} reached ₹{stock.last_price:.2f} (above ₹{alert.threshold:.2f})"
                    elif "below" in alert.condition and stock.last_price <= alert.threshold:
                        should_trigger = True
                        message = f"{alert.symbol} reached ₹{stock.last_price:.2f} (below ₹{alert.threshold:.2f})"
                
                elif alert.alert_type == AlertType.PERFORMANCE_ALERT:
                    if abs(stock.percent_change) >= alert.threshold:
                        should_trigger = True
                        message = f"{alert.symbol} changed by {stock.percent_change:+.2f}%"
                
                if should_trigger:
                    self._trigger_alert(alert, message)
                    if alert_id not in triggered_alerts:
                        triggered_alerts[alert_id] = []
                    triggered_alerts[alert_id].append(message)
            
            except Exception as e:
                logger.error(f"Error checking alert {alert_id}: {e}")
        
        return triggered_alerts
    
    def _trigger_alert(self, alert: Alert, message: str):
        """Trigger alert and send notifications"""
        alert.last_triggered = datetime.now().isoformat()
        alert.trigger_count += 1
        self.save_alerts()
        
        self.notification_service.send_notification(alert, message)
    
    def disable_alert(self, alert_id: str) -> bool:
        """Disable an alert"""
        if alert_id in self.alerts:
            self.alerts[alert_id].enabled = False
            self.save_alerts()
            return True
        return False
    
    def delete_alert(self, alert_id: str) -> bool:
        """Delete an alert"""
        if alert_id in self.alerts:
            del self.alerts[alert_id]
            self.save_alerts()
            return True
        return False
    
    def list_alerts(self, symbol: Optional[str] = None) -> List[Alert]:
        """List all alerts, optionally filtered by symbol"""
        if symbol:
            return [a for a in self.alerts.values() if a.symbol == symbol.upper()]
        return list(self.alerts.values())
    
    def get_alert_status(self) -> Dict:
        """Get status of all alerts"""
        total = len(self.alerts)
        enabled = sum(1 for a in self.alerts.values() if a.enabled)
        triggered = sum(1 for a in self.alerts.values() if a.last_triggered)
        
        return {
            "total_alerts": total,
            "enabled": enabled,
            "disabled": total - enabled,
            "triggered": triggered
        }
    
    @staticmethod
    def _generate_id() -> str:
        """Generate unique alert ID"""
        from datetime import datetime
        import random
        return f"alert_{datetime.now().strftime('%Y%m%d%H%M%S')}_{random.randint(1000, 9999)}"
    
    def save_alerts(self):
        """Save alerts to file"""
        try:
            os.makedirs(ALERTS_DIR, exist_ok=True)
            with open(ALERTS_FILE, 'w') as f:
                data = {k: {
                    **asdict(v),
                    "alert_type": v.alert_type.value,
                    "channels": [c.value for c in v.channels],
                    "priority": v.priority.value
                } for k, v in self.alerts.items()}
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving alerts: {e}")
    
    def load_alerts(self):
        """Load alerts from file"""
        try:
            if os.path.exists(ALERTS_FILE):
                with open(ALERTS_FILE, 'r') as f:
                    data = json.load(f)
                    self.alerts = {}
                    for alert_id, alert_data in data.items():
                        alert_data["alert_type"] = AlertType(alert_data["alert_type"])
                        alert_data["channels"] = [AlertChannel(c) for c in alert_data["channels"]]
                        alert_data["priority"] = AlertPriority(alert_data["priority"])
                        self.alerts[alert_id] = Alert(**alert_data)
            else:
                self.alerts = {}
        except Exception as e:
            logger.error(f"Error loading alerts: {e}")
            self.alerts = {}


# Singleton instance
_alert_manager = None


def get_alert_manager() -> AlertManager:
    """Get singleton alert manager"""
    global _alert_manager
    if _alert_manager is None:
        _alert_manager = AlertManager()
    return _alert_manager
