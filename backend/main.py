"""
Airis Backend - Consolidated FastAPI Server
Entry point for all backend services
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Import routers
from routers import ai, voice, trading, settings, memory, reminders

app = FastAPI(
    title="Airis AI Assistant Backend",
    description="Multi-provider AI assistant with voice, trading, and memory",
    version="3.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",
        "https://airis-9ox.pages.dev",
        "https://ai-assistant-8r3x.onrender.com",
        "http://localhost:5173",
        "http://localhost:5000",
        "http://localhost:8000",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ai.router, prefix="/api", tags=["AI"])
app.include_router(voice.router, prefix="/api", tags=["Voice"])
app.include_router(trading.router, prefix="/api", tags=["Trading"])
app.include_router(settings.router, prefix="/api", tags=["Settings"])
app.include_router(memory.router, prefix="/api", tags=["Memory"])
app.include_router(reminders.router, prefix="/api", tags=["Reminders"])

@app.get("/api/health")
def health():
    """Health check endpoint"""
    return {"status": "ok", "version": "3.0.0"}

@app.get("/")
def root():
    """Root endpoint"""
    return {
        "name": "Airis AI Assistant",
        "version": "3.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
