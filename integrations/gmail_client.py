"""
Gmail Integration Client
Handles email reading, sending, searching, and management
"""

import os
import pickle
import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from pathlib import Path
import base64
import re

from google.auth.transport.requests import Request
from google.oauth2.service_account import Credentials
from google.oauth2.credentials import Credentials as UserCredentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.api_python_client import build, errors

logger = logging.getLogger(__name__)

# Gmail API scopes
GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.modify']


class GmailClient:
    """Gmail API client for email management"""
    
    def __init__(self, credentials_file: str = None, token_file: str = None):
        """
        Initialize Gmail client
        
        Args:
            credentials_file: Path to credentials.json from Google Cloud
            token_file: Path to store authentication token
        """
        self.credentials_file = credentials_file or os.getenv('GMAIL_CREDENTIALS_FILE')
        self.token_file = token_file or Path.home() / '.jarvis' / 'gmail_token.pickle'
        self.service = None
        self._authenticate()
    
    def _authenticate(self) -> None:
        """Authenticate with Gmail API"""
        try:
            # Try to load existing token
            if self.token_file.exists():
                with open(self.token_file, 'rb') as f:
                    creds = pickle.load(f)
                    if creds.expired and creds.refresh_token:
                        creds.refresh(Request())
                    self.service = build('gmail', 'v1', credentials=creds)
                    logger.info("Loaded existing Gmail credentials")
                    return
            
            # Create new credentials
            if not self.credentials_file:
                logger.warning("Gmail credentials file not found - email features disabled")
                return
            
            flow = InstalledAppFlow.from_client_secrets_file(
                self.credentials_file, GMAIL_SCOPES
            )
            creds = flow.run_local_server(port=0)
            
            # Save token for future use
            self.token_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.token_file, 'wb') as f:
                pickle.dump(creds, f)
            
            self.service = build('gmail', 'v1', credentials=creds)
            logger.info("Authenticated with Gmail API")
            
        except Exception as e:
            logger.error(f"Gmail authentication failed: {e}")
            self.service = None
    
    def _get_message_details(self, message_id: str) -> Dict:
        """Get full message details"""
        try:
            message = self.service.users().messages().get(
                userId='me',
                id=message_id,
                format='full'
            ).execute()
            
            headers = message['payload']['headers']
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
            sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
            date = next((h['value'] for h in headers if h['name'] == 'Date'), '')
            
            # Get body
            body = self._get_message_body(message['payload'])
            
            return {
                'id': message_id,
                'subject': subject,
                'sender': sender,
                'date': date,
                'body': body,
                'snippet': message.get('snippet', '')
            }
        except Exception as e:
            logger.error(f"Error getting message details: {e}")
            return {}
    
    def _get_message_body(self, payload: Dict) -> str:
        """Extract message body from payload"""
        try:
            if 'parts' in payload:
                for part in payload['parts']:
                    if part['mimeType'] == 'text/plain':
                        if 'data' in part['body']:
                            return base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
            else:
                if 'data' in payload['body']:
                    return base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8')
            return ''
        except Exception as e:
            logger.error(f"Error extracting message body: {e}")
            return ''
    
    def get_unread_count(self) -> int:
        """Get count of unread emails"""
        try:
            if not self.service:
                return 0
            
            results = self.service.users().messages().list(
                userId='me',
                q='is:unread',
                maxResults=1
            ).execute()
            
            return results.get('resultSizeEstimate', 0)
        except Exception as e:
            logger.error(f"Error getting unread count: {e}")
            return 0
    
    def get_unread_emails(self, max_results: int = 5) -> List[Dict]:
        """
        Get unread emails
        
        Args:
            max_results: Maximum number of emails to return
            
        Returns:
            List of email dictionaries
        """
        try:
            if not self.service:
                return []
            
            # Get unread message IDs
            results = self.service.users().messages().list(
                userId='me',
                q='is:unread',
                maxResults=max_results
            ).execute()
            
            messages = results.get('messages', [])
            emails = []
            
            for msg in messages:
                email_details = self._get_message_details(msg['id'])
                if email_details:
                    emails.append(email_details)
            
            return emails
        except Exception as e:
            logger.error(f"Error getting unread emails: {e}")
            return []
    
    def get_emails(self, query: str = '', max_results: int = 5) -> List[Dict]:
        """
        Get emails matching query
        
        Args:
            query: Gmail search query (e.g., 'from:john', 'subject:meeting')
            max_results: Maximum number of emails
            
        Returns:
            List of email dictionaries
        """
        try:
            if not self.service:
                return []
            
            results = self.service.users().messages().list(
                userId='me',
                q=query,
                maxResults=max_results
            ).execute()
            
            messages = results.get('messages', [])
            emails = []
            
            for msg in messages:
                email_details = self._get_message_details(msg['id'])
                if email_details:
                    emails.append(email_details)
            
            return emails
        except Exception as e:
            logger.error(f"Error getting emails: {e}")
            return []
    
    def send_email(self, to: str, subject: str, body: str, cc: str = '', bcc: str = '') -> bool:
        """
        Send email
        
        Args:
            to: Recipient email address
            subject: Email subject
            body: Email body
            cc: CC recipients (comma-separated)
            bcc: BCC recipients (comma-separated)
            
        Returns:
            True if sent successfully
        """
        try:
            if not self.service:
                logger.warning("Gmail service not available")
                return False
            
            # Create message
            message = {
                'raw': self._create_message_b64(to, subject, body, cc, bcc)
            }
            
            self.service.users().messages().send(
                userId='me',
                body=message
            ).execute()
            
            logger.info(f"Email sent to {to}")
            return True
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return False
    
    def _create_message_b64(self, to: str, subject: str, body: str, cc: str = '', bcc: str = '') -> str:
        """Create base64 encoded email message"""
        import email
        from email.mime.text import MIMEText
        
        message = MIMEText(body)
        message['to'] = to
        message['subject'] = subject
        if cc:
            message['cc'] = cc
        
        return base64.urlsafe_b64encode(message.as_bytes()).decode()
    
    def search_emails(self, search_term: str, max_results: int = 5) -> List[Dict]:
        """
        Search emails by term
        
        Args:
            search_term: Search term (e.g., 'python', 'project')
            max_results: Maximum results
            
        Returns:
            List of matching emails
        """
        # Create Gmail search query
        query = f'({search_term})'
        return self.get_emails(query, max_results)
    
    def mark_as_read(self, message_id: str) -> bool:
        """Mark email as read"""
        try:
            if not self.service:
                return False
            
            self.service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'removeLabelIds': ['UNREAD']}
            ).execute()
            
            return True
        except Exception as e:
            logger.error(f"Error marking email as read: {e}")
            return False
    
    def star_email(self, message_id: str) -> bool:
        """Star/favorite an email"""
        try:
            if not self.service:
                return False
            
            self.service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'addLabelIds': ['STARRED']}
            ).execute()
            
            return True
        except Exception as e:
            logger.error(f"Error starring email: {e}")
            return False
    
    def format_email_summary(self, emails: List[Dict]) -> str:
        """Format emails for voice response"""
        if not emails:
            return "You have no unread emails."
        
        summary = f"You have {len(emails)} unread email{'s' if len(emails) != 1 else ''}. "
        for i, email in enumerate(emails[:3], 1):
            sender_name = email['sender'].split('<')[0].strip()
            summary += f"{i}. From {sender_name}: {email['subject']}. "
        
        return summary
    
    def is_available(self) -> bool:
        """Check if Gmail service is available"""
        return self.service is not None
