"""
Email Handler for Jarvis
Handles email reading, sending, and management commands
"""

import logging
from typing import Dict, Optional
import asyncio

from integrations.gmail_client import GmailClient

logger = logging.getLogger(__name__)

# Global Gmail client (lazy initialized)
gmail_client: Optional[GmailClient] = None


def _get_gmail_client() -> Optional[GmailClient]:
    """Get or initialize Gmail client"""
    global gmail_client
    if gmail_client is None:
        gmail_client = GmailClient()
    return gmail_client


async def email_handler(command: str, context: Dict = None) -> str:
    """
    Handle email-related commands
    
    Args:
        command: User command
        context: Additional context
        
    Returns:
        Response message
    """
    context = context or {}
    client = _get_gmail_client()
    
    if not client or not client.is_available():
        return "Email service is not available. Please set up Gmail credentials."
    
    try:
        command_lower = command.lower()
        
        # Check email / unread count
        if any(word in command_lower for word in ['check', 'unread', 'email', 'mail']):
            emails = client.get_unread_emails(max_results=5)
            if emails:
                return client.format_email_summary(emails)
            else:
                return "You have no unread emails."
        
        # Send email
        elif any(word in command_lower for word in ['send', 'compose', 'write']):
            # Extract email details from command or ask user
            recipient = context.get('recipient', '')
            subject = context.get('subject', '')
            body = context.get('body', '')
            
            if not recipient:
                return "I need a recipient email address. Please provide the email address."
            if not subject:
                return "I need a subject line. Please provide the email subject."
            if not body:
                return "I need the email body. Please provide the message content."
            
            if client.send_email(recipient, subject, body):
                return f"Email sent to {recipient}"
            else:
                return "Failed to send email. Please try again."
        
        # Search emails
        elif 'search' in command_lower:
            # Extract search term
            search_term = command.replace('search', '').replace('for', '').strip()
            if not search_term:
                search_term = context.get('search_term', '')
            
            if not search_term:
                return "What would you like me to search for in your emails?"
            
            emails = client.search_emails(search_term, max_results=5)
            if emails:
                return client.format_email_summary(emails)
            else:
                return f"No emails found for '{search_term}'"
        
        # Get unread count
        elif any(word in command_lower for word in ['how many', 'count', 'total']):
            count = client.get_unread_count()
            if count == 0:
                return "You have no unread emails."
            elif count == 1:
                return "You have 1 unread email."
            else:
                return f"You have {count} unread emails."
        
        # Get recent emails
        elif any(word in command_lower for word in ['recent', 'latest', 'last']):
            emails = client.get_emails(max_results=5)
            if emails:
                return client.format_email_summary(emails)
            else:
                return "You have no emails."
        
        else:
            return "I didn't understand that email command. You can ask me to check, search, or send emails."
    
    except Exception as e:
        logger.error(f"Error in email handler: {e}")
        return f"Error handling email request: {str(e)}"


def register_email_handler(command_engine) -> None:
    """Register email handler with command engine"""
    try:
        command_engine.register_handler(
            'email',
            email_handler,
            keywords=['email', 'mail', 'check', 'send', 'search', 'unread', 'compose']
        )
        logger.info("Email handler registered")
    except Exception as e:
        logger.error(f"Error registering email handler: {e}")
