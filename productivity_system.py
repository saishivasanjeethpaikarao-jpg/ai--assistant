"""
Productivity System - Task management, note-taking, and calendar integration.
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import hashlib


class TaskManager:
    """Manage tasks with priorities and due dates."""
    
    def __init__(self, user_id: str = "guest"):
        self.user_id = user_id
        self.tasks_file = os.path.join(os.path.dirname(__file__), "memory", f"tasks_{user_id}.json")
        self.tasks = self._load_tasks()
    
    def _load_tasks(self) -> List[Dict]:
        """Load tasks from file."""
        if os.path.exists(self.tasks_file):
            try:
                with open(self.tasks_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                return []
        return []
    
    def _save_tasks(self) -> None:
        """Save tasks to file."""
        os.makedirs(os.path.dirname(self.tasks_file), exist_ok=True)
        with open(self.tasks_file, "w", encoding="utf-8") as f:
            json.dump(self.tasks, f, indent=2, default=str)
    
    def add_task(self, title: str, description: str = "", priority: str = "medium", 
                 due_date: Optional[str] = None, tags: List[str] = None) -> Dict:
        """Add a new task."""
        task = {
            "id": hashlib.md5(f"{title}{datetime.now().isoformat()}".encode()).hexdigest()[:8],
            "title": title,
            "description": description,
            "priority": priority.lower() if priority in ["low", "medium", "high"] else "medium",
            "due_date": due_date,
            "tags": tags or [],
            "completed": False,
            "created_at": datetime.now().isoformat(),
            "completed_at": None
        }
        self.tasks.append(task)
        self._save_tasks()
        return task
    
    def complete_task(self, task_id: str) -> bool:
        """Mark task as completed."""
        for task in self.tasks:
            if task["id"] == task_id:
                task["completed"] = True
                task["completed_at"] = datetime.now().isoformat()
                self._save_tasks()
                return True
        return False
    
    def delete_task(self, task_id: str) -> bool:
        """Delete a task."""
        self.tasks = [t for t in self.tasks if t["id"] != task_id]
        self._save_tasks()
        return True
    
    def list_tasks(self, filter_by: str = "all", tags: List[str] = None) -> List[Dict]:
        """List tasks with optional filtering."""
        filtered = self.tasks
        
        if filter_by == "completed":
            filtered = [t for t in filtered if t["completed"]]
        elif filter_by == "pending":
            filtered = [t for t in filtered if not t["completed"]]
        elif filter_by == "high_priority":
            filtered = [t for t in filtered if t["priority"] == "high"]
        
        if tags:
            filtered = [t for t in filtered if any(tag in t["tags"] for tag in tags)]
        
        # Sort by priority and due date
        priority_order = {"high": 0, "medium": 1, "low": 2}
        return sorted(filtered, key=lambda t: (priority_order.get(t["priority"], 1), t.get("due_date", "9999-12-31")))
    
    def get_overdue_tasks(self) -> List[Dict]:
        """Get tasks that are overdue."""
        today = datetime.now().date()
        return [t for t in self.tasks 
                if not t["completed"] and t.get("due_date") and datetime.fromisoformat(t["due_date"]).date() < today]
    
    def update_task(self, task_id: str, **kwargs) -> Optional[Dict]:
        """Update task properties."""
        for task in self.tasks:
            if task["id"] == task_id:
                for key, value in kwargs.items():
                    if key in ["title", "description", "priority", "due_date", "tags"]:
                        task[key] = value
                self._save_tasks()
                return task
        return None


class NoteManager:
    """Manage notes with tagging and searching."""
    
    def __init__(self, user_id: str = "guest"):
        self.user_id = user_id
        self.notes_file = os.path.join(os.path.dirname(__file__), "memory", f"notes_{user_id}.json")
        self.notes = self._load_notes()
    
    def _load_notes(self) -> List[Dict]:
        """Load notes from file."""
        if os.path.exists(self.notes_file):
            try:
                with open(self.notes_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                return []
        return []
    
    def _save_notes(self) -> None:
        """Save notes to file."""
        os.makedirs(os.path.dirname(self.notes_file), exist_ok=True)
        with open(self.notes_file, "w", encoding="utf-8") as f:
            json.dump(self.notes, f, indent=2, default=str)
    
    def create_note(self, title: str, content: str, tags: List[str] = None) -> Dict:
        """Create a new note."""
        note = {
            "id": hashlib.md5(f"{title}{datetime.now().isoformat()}".encode()).hexdigest()[:8],
            "title": title,
            "content": content,
            "tags": tags or [],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "pinned": False
        }
        self.notes.append(note)
        self._save_notes()
        return note
    
    def update_note(self, note_id: str, title: str = None, content: str = None, tags: List[str] = None) -> Optional[Dict]:
        """Update a note."""
        for note in self.notes:
            if note["id"] == note_id:
                if title:
                    note["title"] = title
                if content:
                    note["content"] = content
                if tags is not None:
                    note["tags"] = tags
                note["updated_at"] = datetime.now().isoformat()
                self._save_notes()
                return note
        return None
    
    def delete_note(self, note_id: str) -> bool:
        """Delete a note."""
        self.notes = [n for n in self.notes if n["id"] != note_id]
        self._save_notes()
        return True
    
    def search_notes(self, query: str) -> List[Dict]:
        """Search notes by title or content."""
        query_lower = query.lower()
        results = [n for n in self.notes 
                  if query_lower in n["title"].lower() or query_lower in n["content"].lower()]
        return sorted(results, key=lambda n: n["updated_at"], reverse=True)
    
    def get_notes_by_tag(self, tag: str) -> List[Dict]:
        """Get notes with specific tag."""
        return [n for n in self.notes if tag in n["tags"]]
    
    def pin_note(self, note_id: str) -> bool:
        """Pin a note to top."""
        for note in self.notes:
            if note["id"] == note_id:
                note["pinned"] = not note["pinned"]
                self._save_notes()
                return True
        return False
    
    def list_notes(self, sort_by: str = "recent") -> List[Dict]:
        """List notes with optional sorting."""
        sorted_notes = self.notes.copy()
        
        if sort_by == "recent":
            sorted_notes.sort(key=lambda n: n["updated_at"], reverse=True)
        elif sort_by == "oldest":
            sorted_notes.sort(key=lambda n: n["created_at"])
        elif sort_by == "title":
            sorted_notes.sort(key=lambda n: n["title"])
        
        # Pinned notes first
        pinned = [n for n in sorted_notes if n["pinned"]]
        unpinned = [n for n in sorted_notes if not n["pinned"]]
        return pinned + unpinned


class CalendarManager:
    """Manage events and schedule."""
    
    def __init__(self, user_id: str = "guest"):
        self.user_id = user_id
        self.events_file = os.path.join(os.path.dirname(__file__), "memory", f"events_{user_id}.json")
        self.events = self._load_events()
    
    def _load_events(self) -> List[Dict]:
        """Load events from file."""
        if os.path.exists(self.events_file):
            try:
                with open(self.events_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                return []
        return []
    
    def _save_events(self) -> None:
        """Save events to file."""
        os.makedirs(os.path.dirname(self.events_file), exist_ok=True)
        with open(self.events_file, "w", encoding="utf-8") as f:
            json.dump(self.events, f, indent=2, default=str)
    
    def add_event(self, title: str, date: str, time: str = "09:00", 
                  duration: int = 60, description: str = "", location: str = "", tags: List[str] = None) -> Dict:
        """Add a calendar event."""
        event = {
            "id": hashlib.md5(f"{title}{date}{datetime.now().isoformat()}".encode()).hexdigest()[:8],
            "title": title,
            "date": date,
            "time": time,
            "duration": duration,
            "description": description,
            "location": location,
            "tags": tags or [],
            "created_at": datetime.now().isoformat(),
            "reminders": ["day_before", "hour_before"]
        }
        self.events.append(event)
        self._save_events()
        return event
    
    def get_events_for_date(self, date: str) -> List[Dict]:
        """Get events for a specific date."""
        return sorted([e for e in self.events if e["date"] == date], key=lambda e: e["time"])
    
    def get_events_for_period(self, start_date: str, end_date: str) -> List[Dict]:
        """Get events within a date range."""
        return sorted([e for e in self.events if start_date <= e["date"] <= end_date], key=lambda e: (e["date"], e["time"]))
    
    def get_upcoming_events(self, days: int = 7) -> List[Dict]:
        """Get upcoming events."""
        today = datetime.now().date()
        end_date = today + timedelta(days=days)
        
        events = []
        for event in self.events:
            try:
                event_date = datetime.fromisoformat(event["date"]).date()
                if today <= event_date <= end_date:
                    events.append(event)
            except (ValueError, KeyError):
                pass
        
        return sorted(events, key=lambda e: (e["date"], e["time"]))
    
    def delete_event(self, event_id: str) -> bool:
        """Delete an event."""
        self.events = [e for e in self.events if e["id"] != event_id]
        self._save_events()
        return True
    
    def update_event(self, event_id: str, **kwargs) -> Optional[Dict]:
        """Update event properties."""
        for event in self.events:
            if event["id"] == event_id:
                for key, value in kwargs.items():
                    if key in ["title", "date", "time", "duration", "description", "location", "tags"]:
                        event[key] = value
                self._save_events()
                return event
        return None
    
    def get_schedule_summary(self, date: str) -> str:
        """Get formatted schedule summary."""
        events = self.get_events_for_date(date)
        
        if not events:
            return f"No events scheduled for {date}"
        
        summary = f"\n📅 SCHEDULE FOR {date}\n{'='*40}\n"
        for event in events:
            end_time = self._calculate_end_time(event["time"], event["duration"])
            summary += f"\n⏰ {event['time']} - {end_time} | {event['title']}"
            if event.get("location"):
                summary += f" @ {event['location']}"
            if event.get("description"):
                summary += f"\n   {event['description']}"
        
        return summary
    
    @staticmethod
    def _calculate_end_time(start_time: str, duration: int) -> str:
        """Calculate end time from duration."""
        try:
            start_dt = datetime.strptime(start_time, "%H:%M")
            end_dt = start_dt + timedelta(minutes=duration)
            return end_dt.strftime("%H:%M")
        except ValueError:
            return "N/A"


class ProductivityDashboard:
    """Unified productivity dashboard."""
    
    def __init__(self, user_id: str = "guest"):
        self.user_id = user_id
        self.tasks = TaskManager(user_id)
        self.notes = NoteManager(user_id)
        self.calendar = CalendarManager(user_id)
    
    def get_daily_summary(self, date: str = None) -> str:
        """Get complete daily summary."""
        if date is None:
            date = datetime.now().strftime("%Y-%m-%d")
        
        # Get today's data
        overdue = self.tasks.get_overdue_tasks()
        today_tasks = [t for t in self.tasks.list_tasks("pending") 
                      if t.get("due_date") and t["due_date"].startswith(date)]
        upcoming_tasks = [t for t in self.tasks.list_tasks("pending") 
                         if not t.get("due_date") or t["due_date"] > date][:5]
        schedule = self.calendar.get_schedule_summary(date)
        recent_notes = self.notes.list_notes("recent")[:3]
        
        summary = f"""
📊 PRODUCTIVITY DASHBOARD - {date}
{'='*50}

⚠️ OVERDUE TASKS ({len(overdue)}):
"""
        if overdue:
            for task in overdue[:3]:
                summary += f"\n  ❌ [{task['priority'].upper()}] {task['title']}"
                if task.get("due_date"):
                    summary += f" (Due: {task['due_date']})"
        else:
            summary += "\n  ✅ All caught up!\n"
        
        summary += f"\n\n📋 TODAY'S TASKS ({len(today_tasks)}):"
        if today_tasks:
            for task in today_tasks:
                summary += f"\n  ☐ [{task['priority'].upper()}] {task['title']}"
        else:
            summary += "\n  No tasks scheduled for today"
        
        summary += f"\n\n📅 TODAY'S SCHEDULE:"
        summary += f"\n{schedule}"
        
        summary += f"\n\n📝 RECENT NOTES ({len(recent_notes)}):"
        for note in recent_notes:
            summary += f"\n  • {note['title']}"
            if note.get("tags"):
                summary += f" [{', '.join(note['tags'])}]"
        
        return summary
    
    def get_weekly_summary(self) -> str:
        """Get weekly summary."""
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        completed = [t for t in self.tasks.tasks if t["completed"] and 
                    week_start.isoformat() <= (t.get("completed_at", "").split("T")[0]) <= week_end.isoformat()]
        pending = [t for t in self.tasks.list_tasks("pending") 
                  if t.get("due_date") and week_start.isoformat() <= t["due_date"] <= week_end.isoformat()]
        
        events = self.calendar.get_events_for_period(week_start.isoformat(), week_end.isoformat())
        
        summary = f"""
📈 WEEKLY SUMMARY ({week_start} to {week_end})
{'='*50}

✅ COMPLETED: {len(completed)} tasks
⏳ PENDING: {len(pending)} tasks
📅 EVENTS: {len(events)} events

Top Pending Tasks:
"""
        for task in pending[:5]:
            summary += f"\n  • {task['title']} (Due: {task['due_date']})"
        
        return summary


# Convenience functions
def get_task_manager(user_id: str = "guest") -> TaskManager:
    return TaskManager(user_id)

def get_note_manager(user_id: str = "guest") -> NoteManager:
    return NoteManager(user_id)

def get_calendar_manager(user_id: str = "guest") -> CalendarManager:
    return CalendarManager(user_id)

def get_productivity_dashboard(user_id: str = "guest") -> ProductivityDashboard:
    return ProductivityDashboard(user_id)
