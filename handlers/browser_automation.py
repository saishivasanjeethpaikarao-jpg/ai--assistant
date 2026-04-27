"""
Browser Automation Handler for Jarvis
Handles web navigation, form filling, and browser control
"""

import logging
from typing import Dict, Optional
import asyncio
import re

from integrations.browser_client import BrowserClient

logger = logging.getLogger(__name__)

# Global browser client (lazy initialized)
browser_client: Optional[BrowserClient] = None


def _get_browser_client() -> Optional[BrowserClient]:
    """Get or initialize browser client"""
    global browser_client
    if browser_client is None:
        try:
            browser_client = BrowserClient(headless=False)
        except Exception as e:
            logger.error(f"Error initializing browser: {e}")
            return None
    return browser_client


async def browser_automation_handler(command: str, context: Dict = None) -> str:
    """
    Handle browser automation commands
    
    Args:
        command: User command
        context: Additional context
        
    Returns:
        Response message
    """
    context = context or {}
    client = _get_browser_client()
    
    if not client or not client.is_available():
        return "Browser service is not available. Please install Selenium and ChromeDriver."
    
    try:
        command_lower = command.lower()
        
        # Search on Google
        if 'google' in command_lower or 'search for' in command_lower:
            # Extract search term
            search_term = re.search(r'(?:search for|search|google)\s+(.+)', command, re.IGNORECASE)
            if not search_term:
                search_term = context.get('search_term', '')
            else:
                search_term = search_term.group(1)
            
            if not search_term:
                return "What would you like me to search for?"
            
            if client.search_google(search_term):
                return f"Searching Google for {search_term}"
            else:
                return "Failed to search Google"
        
        # Search on Amazon
        elif 'amazon' in command_lower:
            search_term = re.search(r'(?:amazon|search amazon for)\s+(.+)', command, re.IGNORECASE)
            if not search_term:
                search_term = context.get('search_term', '')
            else:
                search_term = search_term.group(1)
            
            if not search_term:
                return "What would you like me to search for on Amazon?"
            
            if client.search_amazon(search_term):
                return f"Searching Amazon for {search_term}"
            else:
                return "Failed to search Amazon"
        
        # Search on YouTube
        elif 'youtube' in command_lower or 'youtube' in command_lower:
            search_term = re.search(r'(?:youtube|search youtube for)\s+(.+)', command, re.IGNORECASE)
            if not search_term:
                search_term = context.get('search_term', '')
            else:
                search_term = search_term.group(1)
            
            if not search_term:
                return "What would you like me to search for on YouTube?"
            
            if client.search_youtube(search_term):
                return f"Searching YouTube for {search_term}"
            else:
                return "Failed to search YouTube"
        
        # Navigate to URL
        elif 'open' in command_lower or 'go to' in command_lower or 'navigate' in command_lower:
            url = re.search(r'(?:open|go to|navigate to)\s+(.+)', command, re.IGNORECASE)
            if not url:
                url = context.get('url', '')
            else:
                url = url.group(1)
            
            if not url:
                return "What URL would you like me to open?"
            
            if client.navigate(url):
                return f"Opened {url}"
            else:
                return f"Failed to open {url}"
        
        # Fill form
        elif 'fill' in command_lower and 'form' in command_lower:
            fields = context.get('fields', {})
            
            if not fields:
                return "I need form field information to fill out the form."
            
            if client.fill_form(fields):
                return "Form filled successfully"
            else:
                return "Error filling form"
        
        # Click button
        elif 'click' in command_lower:
            button_text = re.search(r'click\s+(?:the\s+)?(.+)', command, re.IGNORECASE)
            if not button_text:
                button_text = context.get('button_text', '')
            else:
                button_text = button_text.group(1)
            
            if not button_text:
                return "Which button would you like me to click?"
            
            if client.click_button(button_text):
                return f"Clicked {button_text}"
            else:
                return f"Could not find button: {button_text}"
        
        # Read page text
        elif 'read' in command_lower:
            text = client.get_page_text()
            if text:
                # Return first 500 chars for voice
                return text[:500]
            else:
                return "Could not extract text from page"
        
        # Take screenshot
        elif 'screenshot' in command_lower:
            filename = client.take_screenshot()
            if filename:
                return f"Screenshot saved to {filename}"
            else:
                return "Failed to take screenshot"
        
        # Get page title
        elif 'title' in command_lower:
            title = client.get_page_title()
            if title:
                return f"Page title: {title}"
            else:
                return "Could not get page title"
        
        # Get page links
        elif 'links' in command_lower:
            links = client.get_all_links()
            if links:
                response = f"Found {len(links)} links. "
                for link in links[:5]:
                    response += f"{link['text']}, "
                return response.rstrip(', ')
            else:
                return "No links found on this page"
        
        else:
            return "I didn't understand that browser command. You can ask me to search, navigate, click, or read web pages."
    
    except Exception as e:
        logger.error(f"Error in browser handler: {e}")
        return f"Error with browser command: {str(e)}"


def register_browser_handler(command_engine) -> None:
    """Register browser handler with command engine"""
    try:
        command_engine.register_handler(
            'browser',
            browser_automation_handler,
            keywords=['search', 'google', 'amazon', 'youtube', 'open', 'click', 'navigate', 'form']
        )
        logger.info("Browser automation handler registered")
    except Exception as e:
        logger.error(f"Error registering browser handler: {e}")
