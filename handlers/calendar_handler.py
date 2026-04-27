"""
Calendar Handler for Jarvis
Handles calendar events, scheduling, and availability commands
"""

import logging
from typing import Dict, Optional
import asyncio

from integrations.calendar_client import CalendarClient

logger = logging.getLogger(__name__)

# Global Calendar client (lazy initialized)
calendar_client: Optional[CalendarClient] = None


def _get_calendar_client() -> Optional[CalendarClient]:
    """Get or initialize Calendar client"""
    global calendar_client
    if calendar_client is None:
        calendar_client = CalendarClient()
    return calendar_client


async def calendar_handler(command: str, context: Dict = None) -> str:
    """
    Handle calendar-related commands
    
    Args:
        command: User command
        context: Additional context
        
    Returns:
        Response message
    """
    context = context or {}
    client = _get_calendar_client()
    
    if not client or not client.is_available():
        return "Calendar service is not available. Please set up Google Calendar credentials."
    
    try:
        command_lower = command.lower()
        
        # Get today's events
        if any(word in command_lower for word in ['today', 'schedule', 'calendar', 'events']):
            events = client.get_today_events()
            if events:
                return client.format_events_summary(events)
            else:
                return "You have no events scheduled for today."
        
        # Get next event
        elif any(word in command_lower for word in ['next', 'upcoming', 'meeting', 'call']):
            event = client.get_next_event()
            if event:
                summary = client.format_events_summary([event])
                
                # Check for video conference link
                link = client.get_meeting_link(event['id'])
                if link:
                    summary += f" Join video call: {link}"
                
                return summary
            else:
                return "You have no upcoming events."
        
        # Find free time
        elif any(word in command_lower for word in ['free', 'available', 'availability', 'when am i free']):
            duration = context.get('duration', 60)
            free_slots = client.find_free_slots(duration_minutes=duration, days_ahead=7)
            
            if free_slots:
                response = "Here are some available time slots:\n"
                for i, slot in enumerate(free_slots, 1):
                    response += f"{i}. {slot['day']} at {slot['time']}\n"
                return response
            else:
                return "I couldn't find any available time slots in the next week."
        
        # Schedule / create event
        elif any(word in command_lower for word in ['schedule', 'create', 'book', 'meet', 'meeting']):
            title = context.get('title', '')
            start_time = context.get('start_time', '')
            duration = context.get('duration', 60)
            
            if not title or not start_time:
                return "I need the event title and time. Please provide both details."
            
            if client.create_event(title, start_time, duration):
                return f"Event '{title}' scheduled for {start_time}"
            else:
                return "Failed to create event. Please check the time format."
        
        # Get all upcoming
        elif any(word in command_lower for word in ['upcoming', 'coming up', 'what is coming up']):
            events = client.get_upcoming_events(days=7, max_results=5)
            if events:
                return client.format_events_summary(events)
            else:
                return "You have no upcoming events."
        
        # Get event details
        elif 'event' in command_lower or 'details' in command_lower:
            event = client.get_next_event()
            if event:
                details = f"{event['title']}\n"
                details += f"Time: {event['start']}\n"
                if event.get('location'):
                    details += f"Location: {event['location']}\n"
                if event.get('description'):
                    details += f"Details: {event['description']}\n"
                return details
            else:
                return "No upcoming events to show."
        
        else:
            return "I didn't understand that calendar command. You can ask me about your schedule, upcoming events, or availability."
    
    except Exception as e:
        logger.error(f"Error in calendar handler: {e}")
        return f"Error handling calendar request: {str(e)}"


def register_calendar_handler(command_engine) -> None:
    """Register calendar handler with command engine"""
    try:
        command_engine.register_handler(
            'calendar',
            calendar_handler,
            keywords=['calendar', 'event', 'schedule', 'meeting', 'today', 'next', 'upcoming', 'available']
        )
        logger.info("Calendar handler registered")
    except Exception as e:
        logger.error(f"Error registering calendar handler: {e}")
