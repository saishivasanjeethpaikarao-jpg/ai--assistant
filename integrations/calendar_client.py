"""
Google Calendar Integration Client
Handles calendar events, scheduling, and availability
"""

import os
import pickle
import logging
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from pathlib import Path
from dateutil import parser as date_parser

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.api_python_client import build, errors

logger = logging.getLogger(__name__)

# Calendar API scopes
CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar']


class CalendarClient:
    """Google Calendar API client"""
    
    def __init__(self, credentials_file: str = None, token_file: str = None):
        """
        Initialize Calendar client
        
        Args:
            credentials_file: Path to credentials.json from Google Cloud
            token_file: Path to store authentication token
        """
        self.credentials_file = credentials_file or os.getenv('CALENDAR_CREDENTIALS_FILE')
        self.token_file = token_file or Path.home() / '.jarvis' / 'calendar_token.pickle'
        self.service = None
        self._authenticate()
    
    def _authenticate(self) -> None:
        """Authenticate with Google Calendar API"""
        try:
            # Try to load existing token
            if self.token_file.exists():
                with open(self.token_file, 'rb') as f:
                    creds = pickle.load(f)
                    if creds.expired and creds.refresh_token:
                        creds.refresh(Request())
                    self.service = build('calendar', 'v3', credentials=creds)
                    logger.info("Loaded existing Calendar credentials")
                    return
            
            # Create new credentials
            if not self.credentials_file:
                logger.warning("Calendar credentials file not found - calendar features disabled")
                return
            
            flow = InstalledAppFlow.from_client_secrets_file(
                self.credentials_file, CALENDAR_SCOPES
            )
            creds = flow.run_local_server(port=0)
            
            # Save token for future use
            self.token_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.token_file, 'wb') as f:
                pickle.dump(creds, f)
            
            self.service = build('calendar', 'v3', credentials=creds)
            logger.info("Authenticated with Google Calendar API")
            
        except Exception as e:
            logger.error(f"Calendar authentication failed: {e}")
            self.service = None
    
    def get_today_events(self) -> List[Dict]:
        """
        Get today's events
        
        Returns:
            List of event dictionaries
        """
        try:
            if not self.service:
                return []
            
            now = datetime.now()
            start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat() + 'Z'
            end = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0).isoformat() + 'Z'
            
            events = self.service.events().list(
                calendarId='primary',
                timeMin=start,
                timeMax=end,
                singleEvents=True,
                orderBy='startTime'
            ).execute().get('items', [])
            
            return self._format_events(events)
        except Exception as e:
            logger.error(f"Error getting today's events: {e}")
            return []
    
    def get_upcoming_events(self, days: int = 7, max_results: int = 10) -> List[Dict]:
        """
        Get upcoming events
        
        Args:
            days: Number of days to look ahead
            max_results: Maximum number of events
            
        Returns:
            List of event dictionaries
        """
        try:
            if not self.service:
                return []
            
            now = datetime.now().isoformat() + 'Z'
            events = self.service.events().list(
                calendarId='primary',
                timeMin=now,
                maxResults=max_results,
                singleEvents=True,
                orderBy='startTime'
            ).execute().get('items', [])
            
            return self._format_events(events)
        except Exception as e:
            logger.error(f"Error getting upcoming events: {e}")
            return []
    
    def _format_events(self, events: List[Dict]) -> List[Dict]:
        """Format calendar events"""
        formatted = []
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            end = event['end'].get('dateTime', event['end'].get('date'))
            
            formatted.append({
                'id': event['id'],
                'title': event.get('summary', 'Untitled'),
                'start': start,
                'end': end,
                'description': event.get('description', ''),
                'location': event.get('location', ''),
                'attendees': event.get('attendees', []),
                'conference_data': event.get('conferenceData', {})
            })
        
        return formatted
    
    def get_next_event(self) -> Optional[Dict]:
        """Get next upcoming event"""
        events = self.get_upcoming_events(max_results=1)
        return events[0] if events else None
    
    def create_event(
        self,
        title: str,
        start_time: str,
        duration_minutes: int = 60,
        description: str = '',
        location: str = ''
    ) -> bool:
        """
        Create a calendar event
        
        Args:
            title: Event title
            start_time: Start time (ISO format or natural language)
            duration_minutes: Event duration in minutes
            description: Event description
            location: Event location
            
        Returns:
            True if event created successfully
        """
        try:
            if not self.service:
                return False
            
            # Parse start time
            try:
                start_dt = date_parser.parse(start_time)
            except:
                logger.error(f"Could not parse time: {start_time}")
                return False
            
            end_dt = start_dt + timedelta(minutes=duration_minutes)
            
            event = {
                'summary': title,
                'description': description,
                'location': location,
                'start': {'dateTime': start_dt.isoformat()},
                'end': {'dateTime': end_dt.isoformat()}
            }
            
            self.service.events().insert(
                calendarId='primary',
                body=event
            ).execute()
            
            logger.info(f"Event created: {title}")
            return True
        except Exception as e:
            logger.error(f"Error creating event: {e}")
            return False
    
    def find_free_slots(self, duration_minutes: int = 60, days_ahead: int = 7) -> List[Dict]:
        """
        Find free time slots
        
        Args:
            duration_minutes: Required duration for free slot
            days_ahead: Number of days to check
            
        Returns:
            List of available time slots
        """
        try:
            if not self.service:
                return []
            
            events = self.get_upcoming_events(days=days_ahead, max_results=100)
            
            # Simple algorithm: find gaps between events
            free_slots = []
            now = datetime.now()
            
            # Check business hours (9am-5pm)
            for day in range(days_ahead):
                day_start = now.replace(hour=9, minute=0, second=0, microsecond=0) + timedelta(days=day)
                day_end = now.replace(hour=17, minute=0, second=0, microsecond=0) + timedelta(days=day)
                
                # Find events for this day
                day_events = [
                    e for e in events
                    if datetime.fromisoformat(e['start'].replace('Z', '+00:00')).date() == day_start.date()
                ]
                
                # Simple: suggest morning (9-10am) if free
                if not day_events or day_start.hour < 10:
                    free_slots.append({
                        'start': day_start.isoformat(),
                        'end': (day_start + timedelta(minutes=duration_minutes)).isoformat(),
                        'day': day_start.strftime('%A'),
                        'time': day_start.strftime('%I:%M %p')
                    })
            
            return free_slots[:3]  # Return top 3 slots
        except Exception as e:
            logger.error(f"Error finding free slots: {e}")
            return []
    
    def get_event_details(self, event_id: str) -> Optional[Dict]:
        """Get full event details"""
        try:
            if not self.service:
                return None
            
            event = self.service.events().get(
                calendarId='primary',
                eventId=event_id
            ).execute()
            
            formatted = self._format_events([event])
            return formatted[0] if formatted else None
        except Exception as e:
            logger.error(f"Error getting event details: {e}")
            return None
    
    def get_meeting_link(self, event_id: str) -> Optional[str]:
        """Get video conference link from event"""
        try:
            event = self.get_event_details(event_id)
            if event and event.get('conference_data'):
                conference = event['conference_data']
                if 'conferenceData' in event:
                    return event['conferenceData'].get('entryPoints', [{}])[0].get('uri')
            return None
        except Exception as e:
            logger.error(f"Error getting meeting link: {e}")
            return None
    
    def format_events_summary(self, events: List[Dict]) -> str:
        """Format events for voice response"""
        if not events:
            return "You have no upcoming events."
        
        summary = f"You have {len(events)} event{'s' if len(events) != 1 else ''}. "
        for i, event in enumerate(events[:3], 1):
            try:
                start_time = date_parser.parse(event['start']).strftime('%I:%M %p')
                summary += f"{i}. {event['title']} at {start_time}. "
            except:
                summary += f"{i}. {event['title']}. "
        
        return summary
    
    def is_available(self) -> bool:
        """Check if Calendar service is available"""
        return self.service is not None
