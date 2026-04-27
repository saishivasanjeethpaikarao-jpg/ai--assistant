"""
Browser Automation Client
Handles browser control, form filling, navigation, and text extraction
"""

import os
import logging
import time
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from pathlib import Path

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.common.keys import Keys
    from selenium.common.exceptions import TimeoutException, NoSuchElementException
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False
    logging.warning("Selenium not installed - browser automation disabled")

try:
    import pyautogui
    PYAUTOGUI_AVAILABLE = True
except ImportError:
    PYAUTOGUI_AVAILABLE = False
    logging.warning("PyAutoGUI not installed - GUI automation disabled")

logger = logging.getLogger(__name__)


class BrowserClient:
    """Selenium-based browser automation client"""
    
    def __init__(self, headless: bool = False):
        """
        Initialize browser client
        
        Args:
            headless: Run browser in headless mode (no UI)
        """
        self.driver = None
        self.headless = headless
        self.wait = None
        self._initialize_browser()
    
    def _initialize_browser(self) -> None:
        """Initialize Selenium WebDriver"""
        if not SELENIUM_AVAILABLE:
            logger.warning("Selenium not available")
            return
        
        try:
            options = webdriver.ChromeOptions()
            if self.headless:
                options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            
            self.driver = webdriver.Chrome(options=options)
            self.wait = WebDriverWait(self.driver, 10)
            logger.info("Browser initialized")
        except Exception as e:
            logger.error(f"Error initializing browser: {e}")
            self.driver = None
    
    def navigate(self, url: str) -> bool:
        """
        Navigate to URL
        
        Args:
            url: URL to navigate to
            
        Returns:
            True if successful
        """
        try:
            if not self.driver:
                return False
            
            if not url.startswith(('http://', 'https://')):
                url = f'https://{url}'
            
            self.driver.get(url)
            logger.info(f"Navigated to {url}")
            return True
        except Exception as e:
            logger.error(f"Error navigating to {url}: {e}")
            return False
    
    def search_google(self, query: str) -> bool:
        """
        Search on Google
        
        Args:
            query: Search term
            
        Returns:
            True if search initiated
        """
        try:
            if not self.driver:
                return False
            
            self.navigate('https://www.google.com')
            time.sleep(1)
            
            search_box = self.wait.until(
                EC.presence_of_element_located((By.NAME, 'q'))
            )
            search_box.send_keys(query)
            search_box.send_keys(Keys.RETURN)
            
            logger.info(f"Searched Google for: {query}")
            return True
        except Exception as e:
            logger.error(f"Error searching Google: {e}")
            return False
    
    def search_amazon(self, query: str) -> bool:
        """
        Search on Amazon
        
        Args:
            query: Search term
            
        Returns:
            True if search initiated
        """
        try:
            if not self.driver:
                return False
            
            self.navigate('https://www.amazon.com')
            time.sleep(1)
            
            search_box = self.wait.until(
                EC.presence_of_element_located((By.ID, 'twotabsearchtextbox'))
            )
            search_box.send_keys(query)
            search_box.send_keys(Keys.RETURN)
            
            logger.info(f"Searched Amazon for: {query}")
            return True
        except Exception as e:
            logger.error(f"Error searching Amazon: {e}")
            return False
    
    def search_youtube(self, query: str) -> bool:
        """
        Search on YouTube
        
        Args:
            query: Search term
            
        Returns:
            True if search initiated
        """
        try:
            if not self.driver:
                return False
            
            self.navigate('https://www.youtube.com')
            time.sleep(1)
            
            search_box = self.wait.until(
                EC.presence_of_element_located((By.NAME, 'search_query'))
            )
            search_box.send_keys(query)
            search_box.send_keys(Keys.RETURN)
            
            logger.info(f"Searched YouTube for: {query}")
            return True
        except Exception as e:
            logger.error(f"Error searching YouTube: {e}")
            return False
    
    def fill_form_field(self, field_selector: str, value: str, selector_type: str = 'name') -> bool:
        """
        Fill form field
        
        Args:
            field_selector: Field name or CSS selector
            value: Value to enter
            selector_type: 'name', 'id', 'css', or 'xpath'
            
        Returns:
            True if successful
        """
        try:
            if not self.driver:
                return False
            
            selector_map = {
                'name': By.NAME,
                'id': By.ID,
                'css': By.CSS_SELECTOR,
                'xpath': By.XPATH
            }
            
            by = selector_map.get(selector_type, By.NAME)
            field = self.wait.until(
                EC.presence_of_element_located((by, field_selector))
            )
            
            field.clear()
            field.send_keys(value)
            logger.info(f"Filled field {field_selector} with {value}")
            return True
        except Exception as e:
            logger.error(f"Error filling field: {e}")
            return False
    
    def fill_form(self, fields: Dict[str, str]) -> bool:
        """
        Fill multiple form fields
        
        Args:
            fields: Dictionary of field_name -> value
            
        Returns:
            True if all fields filled
        """
        try:
            for field_name, value in fields.items():
                if not self.fill_form_field(field_name, value):
                    return False
            return True
        except Exception as e:
            logger.error(f"Error filling form: {e}")
            return False
    
    def click_button(self, button_text: str) -> bool:
        """
        Click button by text content
        
        Args:
            button_text: Text on button
            
        Returns:
            True if clicked
        """
        try:
            if not self.driver:
                return False
            
            button = self.wait.until(
                EC.element_to_be_clickable((
                    By.XPATH,
                    f"//button[contains(text(), '{button_text}')]"
                ))
            )
            button.click()
            logger.info(f"Clicked button: {button_text}")
            return True
        except Exception as e:
            logger.error(f"Error clicking button: {e}")
            return False
    
    def click_link(self, link_text: str) -> bool:
        """
        Click link by text content
        
        Args:
            link_text: Text on link
            
        Returns:
            True if clicked
        """
        try:
            if not self.driver:
                return False
            
            link = self.wait.until(
                EC.element_to_be_clickable((
                    By.PARTIAL_LINK_TEXT,
                    link_text
                ))
            )
            link.click()
            logger.info(f"Clicked link: {link_text}")
            return True
        except Exception as e:
            logger.error(f"Error clicking link: {e}")
            return False
    
    def get_page_text(self) -> str:
        """Extract all visible text from page"""
        try:
            if not self.driver:
                return ''
            
            return self.driver.find_element(By.TAG_NAME, 'body').text
        except Exception as e:
            logger.error(f"Error extracting page text: {e}")
            return ''
    
    def get_page_title(self) -> str:
        """Get page title"""
        try:
            if not self.driver:
                return ''
            return self.driver.title
        except Exception as e:
            logger.error(f"Error getting page title: {e}")
            return ''
    
    def take_screenshot(self, filename: str = None) -> Optional[str]:
        """
        Take screenshot
        
        Args:
            filename: Output filename (auto-generated if not provided)
            
        Returns:
            Path to screenshot file
        """
        try:
            if not self.driver:
                return None
            
            if not filename:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                Path('screenshots').mkdir(exist_ok=True)
                filename = f'screenshots/screenshot_{timestamp}.png'
            
            self.driver.save_screenshot(filename)
            logger.info(f"Screenshot saved: {filename}")
            return filename
        except Exception as e:
            logger.error(f"Error taking screenshot: {e}")
            return None
    
    def wait_for_element(self, selector: str, selector_type: str = 'css', timeout: int = 10) -> bool:
        """
        Wait for element to be present
        
        Args:
            selector: Element selector
            selector_type: 'css', 'xpath', 'id', 'name'
            timeout: Wait timeout in seconds
            
        Returns:
            True if element found
        """
        try:
            if not self.driver:
                return False
            
            selector_map = {
                'css': By.CSS_SELECTOR,
                'xpath': By.XPATH,
                'id': By.ID,
                'name': By.NAME
            }
            
            by = selector_map.get(selector_type, By.CSS_SELECTOR)
            WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((by, selector))
            )
            return True
        except TimeoutException:
            logger.warning(f"Element not found: {selector}")
            return False
    
    def get_all_links(self) -> List[Dict]:
        """Get all links on page"""
        try:
            if not self.driver:
                return []
            
            links = self.driver.find_elements(By.TAG_NAME, 'a')
            return [
                {
                    'text': link.text,
                    'href': link.get_attribute('href'),
                    'title': link.get_attribute('title')
                }
                for link in links if link.text and link.get_attribute('href')
            ]
        except Exception as e:
            logger.error(f"Error getting links: {e}")
            return []
    
    def close(self) -> None:
        """Close browser"""
        try:
            if self.driver:
                self.driver.quit()
                logger.info("Browser closed")
        except Exception as e:
            logger.error(f"Error closing browser: {e}")
    
    def __enter__(self):
        """Context manager support"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager support"""
        self.close()
    
    def is_available(self) -> bool:
        """Check if browser is available"""
        return self.driver is not None
