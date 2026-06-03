"""
Reminders Router - Reminders and notifications
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import database
import sqlite3

router = APIRouter()

class ReminderRequest(BaseModel):
    text: str
    when: Optional[str] = None
    user_id: Optional[str] = None

class ReminderUpdate(BaseModel):
    text: Optional[str] = None
    when: Optional[str] = None
    completed: Optional[bool] = None

def get_db():
    """Get database connection"""
    conn = sqlite3.connect("/opt/render/project/data/airis.db")
    conn.row_factory = sqlite3.Row
    return conn

@router.get("/reminders")
def list_reminders(user_id: Optional[str] = None):
    """List all reminders"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        if user_id:
            cursor.execute(
                "SELECT * FROM reminders WHERE user_id = ? ORDER BY when_due ASC",
                (user_id,)
            )
        else:
            cursor.execute("SELECT * FROM reminders ORDER BY when_due ASC")
        
        rows = cursor.fetchall()
        conn.close()
        
        reminders = []
        for row in rows:
            reminders.append({
                "id": row["id"],
                "text": row["text"],
                "when": row["when_due"],
                "completed": bool(row["completed"]),
                "created_at": row["created_at"]
            })
        
        return {"reminders": reminders}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reminders")
def create_reminder(req: ReminderRequest):
    """Create a new reminder"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute(
            "INSERT INTO reminders (user_id, text, when_due) VALUES (?, ?, ?)",
            (req.user_id, req.text, req.when)
        )
        conn.commit()
        reminder_id = cursor.lastrowid
        conn.close()
        
        return {
            "success": True,
            "id": reminder_id,
            "text": req.text,
            "when": req.when
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reminders/{reminder_id}")
def get_reminder(reminder_id: int):
    """Get a specific reminder"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM reminders WHERE id = ?", (reminder_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail=f"Reminder {reminder_id} not found")
        
        return {
            "id": row["id"],
            "text": row["text"],
            "when": row["when_due"],
            "completed": bool(row["completed"]),
            "created_at": row["created_at"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/reminders/{reminder_id}")
def update_reminder(reminder_id: int, req: ReminderUpdate):
    """Update a reminder"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        updates = []
        params = []
        
        if req.text is not None:
            updates.append("text = ?")
            params.append(req.text)
        
        if req.when is not None:
            updates.append("when_due = ?")
            params.append(req.when)
        
        if req.completed is not None:
            updates.append("completed = ?")
            params.append(1 if req.completed else 0)
        
        if not updates:
            conn.close()
            raise HTTPException(status_code=400, detail="No fields to update")
        
        params.append(reminder_id)
        query = f"UPDATE reminders SET {', '.join(updates)} WHERE id = ?"
        
        cursor.execute(query, params)
        conn.commit()
        conn.close()
        
        return {"success": True, "id": reminder_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/reminders/{reminder_id}")
def delete_reminder(reminder_id: int):
    """Delete a reminder"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM reminders WHERE id = ?", (reminder_id,))
        conn.commit()
        conn.close()
        
        return {"success": True, "message": f"Reminder {reminder_id} deleted"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reminders/{reminder_id}/complete")
def complete_reminder(reminder_id: int):
    """Mark a reminder as complete"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute(
            "UPDATE reminders SET completed = 1 WHERE id = ?",
            (reminder_id,)
        )
        conn.commit()
        conn.close()
        
        return {"success": True, "message": f"Reminder {reminder_id} marked complete"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
