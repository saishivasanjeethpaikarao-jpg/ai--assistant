"""
Memory Router - Brain memory and facts storage
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import database
import sqlite3

router = APIRouter()

class MemoryRequest(BaseModel):
    key: str
    value: Any

class ProfileRequest(BaseModel):
    key: str
    value: Any

def get_memory_db():
    """Get connection to brain memory database"""
    conn = sqlite3.connect("/opt/render/project/data/brain_memory.db")
    conn.row_factory = sqlite3.Row
    return conn

@router.get("/memory/stats")
def get_memory_stats():
    """Get memory statistics"""
    try:
        conn = get_memory_db()
        cursor = conn.cursor()
        
        # Count memories
        cursor.execute("SELECT COUNT(*) as count FROM memories")
        memories_count = cursor.fetchone()["count"]
        
        # Count profile items
        cursor.execute("SELECT COUNT(*) as count FROM profile")
        profile_count = cursor.fetchone()["count"]
        
        conn.close()
        
        return {
            "total_memories": memories_count,
            "total_profile_items": profile_count,
            "total_facts": memories_count + profile_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/memory")
def list_memories():
    """List all memories"""
    try:
        conn = get_memory_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT key, value FROM memories ORDER BY updated_at DESC")
        rows = cursor.fetchall()
        conn.close()
        
        memories = {}
        for key, value in rows:
            try:
                import json
                memories[key] = json.loads(value)
            except:
                memories[key] = value
        
        return {"memories": memories}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/memory")
def add_memory(req: MemoryRequest):
    """Add a memory"""
    try:
        conn = get_memory_db()
        cursor = conn.cursor()
        
        import json
        value = json.dumps(req.value) if not isinstance(req.value, str) else req.value
        
        cursor.execute(
            "INSERT OR REPLACE INTO memories (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
            (req.key, value)
        )
        conn.commit()
        conn.close()
        
        return {"success": True, "key": req.key, "value": req.value}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/memory/{key}")
def get_memory(key: str):
    """Get a specific memory"""
    try:
        conn = get_memory_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT value FROM memories WHERE key = ?", (key,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail=f"Memory '{key}' not found")
        
        try:
            import json
            value = json.loads(row["value"])
        except:
            value = row["value"]
        
        return {"key": key, "value": value}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/memory/{key}")
def delete_memory(key: str):
    """Delete a memory"""
    try:
        conn = get_memory_db()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM memories WHERE key = ?", (key,))
        conn.commit()
        conn.close()
        
        return {"success": True, "message": f"Memory '{key}' deleted"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile")
def list_profile():
    """List all profile items"""
    try:
        conn = get_memory_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT key, value FROM profile ORDER BY updated_at DESC")
        rows = cursor.fetchall()
        conn.close()
        
        profile = {}
        for key, value in rows:
            try:
                import json
                profile[key] = json.loads(value)
            except:
                profile[key] = value
        
        return {"profile": profile}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/profile")
def add_profile(req: ProfileRequest):
    """Add a profile item"""
    try:
        conn = get_memory_db()
        cursor = conn.cursor()
        
        import json
        value = json.dumps(req.value) if not isinstance(req.value, str) else req.value
        
        cursor.execute(
            "INSERT OR REPLACE INTO profile (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
            (req.key, value)
        )
        conn.commit()
        conn.close()
        
        return {"success": True, "key": req.key, "value": req.value}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile/{key}")
def get_profile(key: str):
    """Get a specific profile item"""
    try:
        conn = get_memory_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT value FROM profile WHERE key = ?", (key,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail=f"Profile item '{key}' not found")
        
        try:
            import json
            value = json.loads(row["value"])
        except:
            value = row["value"]
        
        return {"key": key, "value": value}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/profile/{key}")
def delete_profile(key: str):
    """Delete a profile item"""
    try:
        conn = get_memory_db()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM profile WHERE key = ?", (key,))
        conn.commit()
        conn.close()
        
        return {"success": True, "message": f"Profile item '{key}' deleted"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
