# JARVIS Architecture & System Diagram

## 🎯 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER BROWSER                              │
│                  http://localhost:8080                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   JARVIS DASHBOARD UI                          │
│  ┌────────────────┬──────────────────────┬──────────────────┐  │
│  │   SIDEBAR      │   MAIN CHAT AREA     │  CONTEXT PANEL   │  │
│  ├────────────────┼──────────────────────┼──────────────────┤  │
│  │ 💬 Chat       │ System Status        │ Session Info     │  │
│  │ ⚡ Commands   │ Recommendations      │ Mode: Chat       │  │
│  │ 🎯 Goals      │ Stats/Uptime         │ Complexity: LOW  │  │
│  │ 📊 Analytics  ├──────────────────────┤ Intent: CHAT     │  │
│  │ 📈 Trading    │ Messages             │ Insights: -      │  │
│  │ - Briefing    │ [AI Response]        │                  │  │
│  │ - Reminders   │ [User Message]       │                  │  │
│  │ - Memory      ├──────────────────────┤                  │  │
│  │               │ Input: [____] [Send] │                  │  │
│  │               │ Mode: Goal ▼         │                  │  │
│  └────────────────┴──────────────────────┴──────────────────┘  │
│                                                                  │
│                jarvis-ui.js | jarvis-style.css                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │ POST /api/request
                          │ { message: "user input" }
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND API SERVER (Port 5000)                    │
│                  dashboard_api.py                              │
│                                                                  │
│  GET  /api/health              - Health check                  │
│  GET  /api/system/status       - System info                   │
│  GET  /api/system/knowledge    - Learned patterns              │
│  POST /api/request             ─┐                              │
└────────────────────────────────┼──────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│            SYSTEM COORDINATOR (system_coordinator.py)          │
│        Routes through 12-layer AI pipeline                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    ┌─────────┐    ┌──────────┐    ┌─────────────┐
    │  MODE   │    │  INTENT  │    │  EXECUTOR   │
    │ ROUTER  │    │ DETECTOR │    │   (Layer 4) │
    └────┬────┘    └────┬─────┘    └─────────────┘
         │              │
         └──────┬───────┘
                ▼
┌─────────────────────────────────────────────────────────────────┐
│         12-LAYER AI PROCESSING PIPELINE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ LAYER 1 ──────────────────────────────────────────────┐   │
│  │ Intent Detector                                        │   │
│  │ Classifies: COMMAND | GOAL | CHAT                     │   │
│  └─────────────────────────┬──────────────────────────────┘   │
│                            │                                   │
│  ┌─ LAYER 2 ──────────────▼──────────────────────────────┐   │
│  │ Strategic Planner                                      │   │
│  │ Creates multi-step execution plan                     │   │
│  └─────────────────────────┬──────────────────────────────┘   │
│                            │                                   │
│  ┌─ LAYER 3 ──────────────▼──────────────────────────────┐   │
│  │ Plan Critic                                           │   │
│  │ Validates and improves the plan                       │   │
│  └─────────────────────────┬──────────────────────────────┘   │
│                            │                                   │
│  ┌─ LAYER 4 ──────────────▼──────────────────────────────┐   │
│  │ Execution Engine                                       │   │
│  │ Executes approved actions                             │   │
│  └─────────────────────────┬──────────────────────────────┘   │
│                            │                                   │
│  ┌─ LAYER 5 ──────────────▼──────────────────────────────┐   │
│  │ Decision Engine                                        │   │
│  │ Makes key decisions                                   │   │
│  └─────────────────────────┬──────────────────────────────┘   │
│                            │                                   │
│  ┌─ LAYER 6 ──────────────▼──────────────────────────────┐   │
│  │ Safety Filter                                          │   │
│  │ Validates for safety                                  │   │
│  └─────────────────────────┬──────────────────────────────┘   │
│                            │                                   │
│  ┌─ LAYER 7 ──────────────▼──────────────────────────────┐   │
│  │ Self-Reflection                                        │   │
│  │ Analyzes outcomes                                     │   │
│  └─────────────────────────┬──────────────────────────────┘   │
│                            │                                   │
│  ┌─ LAYER 8 ──────────────▼──────────────────────────────┐   │
│  │ Adaptive Memory                                        │   │
│  │ Stores learnings and patterns                         │   │
│  └─────────────────────────┬──────────────────────────────┘   │
│                            │                                   │
│  ┌─ LAYER 9 ──────────────▼──────────────────────────────┐   │
│  │ Replanning Engine                                      │   │
│  │ Adjusts if needed                                     │   │
│  └─────────────────────────┬──────────────────────────────┘   │
│                            │                                   │
│  ┌─ LAYER 10 ─────────────▼──────────────────────────────┐   │
│  │ Chat Mode                                              │   │
│  │ Natural language responses                            │   │
│  └─────────────────────────┬──────────────────────────────┘   │
│                            │                                   │
│  ┌─ LAYER 11 ─────────────▼──────────────────────────────┐   │
│  │ Meta-Improvement                                       │   │
│  │ Improves own system behavior                          │   │
│  └─────────────────────────┬──────────────────────────────┘   │
│                            │                                   │
│  ┌─ LAYER 12 ─────────────▼──────────────────────────────┐   │
│  │ Orchestrator                                           │   │
│  │ Coordinates all layers                                │   │
│  └─────────────────────────┬──────────────────────────────┘   │
│                            │                                   │
│                            ▼                                   │
│                    [RESPONSE GENERATED]                        │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │   ADAPTIVE MEMORY SYSTEM   │
    │  (adaptive_memory.py)      │
    │                            │
    │ Stores:                    │
    │ • Strategies               │
    │ • Preferences              │
    │ • Patterns                 │
    │ • Learning Events          │
    │ • Failures & Successes     │
    └────────────┬───────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │   JSON FILE STORAGE        │
    │   memory.json              │
    │   (persistent learning)    │
    └────────────────────────────┘
```

## 📊 Data Flow Diagram

```
USER INPUT
    │
    ├─ "open Chrome"              [COMMAND - LOW complexity]
    ├─ "plan project launch"      [GOAL - MEDIUM complexity]
    └─ "analyze sales data"       [ANALYSIS - HIGH complexity]
    │
    ▼
MODE DETECTION
    │
    ├─ CHAT       (natural conversation)
    ├─ COMMAND    (immediate actions)
    ├─ GOAL       (multi-step planning)
    ├─ ANALYTICS  (data analysis)
    └─ TRADING    (market analysis)
    │
    ▼
12-LAYER PROCESSING
    │
    ├─ Layers 1-3: Analysis & Planning
    ├─ Layers 4-6: Execution & Safety
    ├─ Layers 7-9: Reflection & Adjustment
    ├─ Layers 10-12: Response & Learning
    │
    ▼
RESPONSE
    │
    ├─ Reply text
    ├─ Processing metadata
    ├─ Complexity classification
    └─ Intent information
    │
    ▼
ADAPTIVE MEMORY
    │
    ├─ Store strategy (if applicable)
    ├─ Update preferences
    ├─ Log pattern
    └─ Track learning event
    │
    ▼
DASHBOARD DISPLAY
    │
    ├─ Add message to chat
    ├─ Update session info
    ├─ Refresh statistics
    └─ Animate response
```

## 🎨 Dashboard Layout

```
Header (60px)
├─ Logo: 🤖 JARVIS
├─ Status: Online (green dot)
└─ Buttons: Voice, Settings

Content Grid:
├─ Sidebar (250px)         Main Area (1fr)           Context (300px)
│  ├─ MODES                ├─ Dashboard               ├─ Session Info
│  │  ├─ 💬 Chat (active) │  ├─ System Status      │  ├─ Mode
│  │  ├─ ⚡ Commands      │  │  └─ 12/12 Layers    │  ├─ Complexity
│  │  ├─ 🎯 Goals         │  ├─ Recommendations    │  ├─ Intent
│  │  ├─ 📊 Analytics     │  └─ Stats              │  └─ Insights
│  │  └─ 📈 Trading       │                        │
│  └─ QUICK ACCESS         ├─ Chat Interface       │
│     ├─ 📋 Briefing      │  ├─ [AI Response]     │
│     ├─ 🔔 Reminders     │  ├─ [User Message]    │
│     └─ 🧠 Memory        │  └─ Input Field       │
│                         │                        │
└─────────────────────────┴────────────────────────┘
```

## 🔄 Request Lifecycle

```
1. USER TYPES MESSAGE
   └─ Input: "analyze my productivity"

2. SEND MESSAGE
   └─ API Client creates request
   └─ POST /api/request

3. BACKEND RECEIVES
   └─ Parse message
   └─ Route to system coordinator

4. MODE DETECTION
   └─ Intent Detector runs
   └─ Result: ANALYSIS / HIGH complexity

5. 12-LAYER PROCESSING
   ├─ Layer 1: Detect ANALYSIS mode
   ├─ Layer 2: Plan analysis approach
   ├─ Layer 3: Validate plan
   ├─ Layer 4: Execute analysis
   ├─ Layer 5: Make recommendations
   ├─ Layer 6: Safety check
   ├─ Layer 7: Reflect on results
   ├─ Layer 8: Store learning
   ├─ Layer 9: Refine if needed
   ├─ Layer 10: Generate response
   ├─ Layer 11: Improve system
   └─ Layer 12: Orchestrate all

6. RESPONSE CREATED
   └─ Reply: "Based on your interactions..."
   └─ Metadata: { type: "ANALYSIS", complexity: "HIGH" }

7. MEMORY STORAGE
   └─ Store strategy used
   └─ Log pattern recognized
   └─ Update preferences
   └─ Track learning event

8. SEND RESPONSE
   └─ Return JSON to frontend
   └─ Include all metadata

9. DISPLAY IN UI
   ├─ Add AI message to chat
   ├─ Show response text
   ├─ Show metadata badge
   ├─ Update session info
   ├─ Refresh statistics
   ├─ Increment interaction count
   └─ Increment learning count

10. USER SEES RESULT
    └─ Chat updated
    └─ Stats updated
    └─ Session info updated
    └─ Ready for next interaction
```

## 🎯 Mode-Specific Paths

```
CHAT MODE
  User: "What is machine learning?"
  ├─ Intent: CHAT
  ├─ Complexity: LOW
  ├─ Layers: 1, 10, 12 (simplified path)
  └─ Response: Natural conversation

COMMAND MODE
  User: "Open Chrome"
  ├─ Intent: COMMAND
  ├─ Complexity: LOW
  ├─ Layers: 1, 4, 6, 8, 12
  └─ Response: Execute command

GOAL MODE
  User: "Plan product launch"
  ├─ Intent: GOAL
  ├─ Complexity: HIGH
  ├─ Layers: 1-12 (full processing)
  └─ Response: Strategic plan

ANALYTICS MODE
  User: "Analyze Q4 sales"
  ├─ Intent: ANALYSIS
  ├─ Complexity: HIGH
  ├─ Layers: 1, 2, 4, 5, 7, 8, 12
  └─ Response: Data insights

TRADING MODE
  User: "Should I buy TSLA?"
  ├─ Intent: TRADING
  ├─ Complexity: HIGH
  ├─ Layers: 1, 2, 4, 5, 6, 7, 8, 12
  └─ Response: Investment recommendation
```

## 🔌 Port Map

```
localhost:5000  →  Backend API (dashboard_api.py)
                    ├─ /api/request
                    ├─ /api/health
                    ├─ /api/system/status
                    └─ /api/system/knowledge

localhost:8080  →  Frontend Dev Server (frontend_server.py)
                    ├─ index.html (dashboard)
                    ├─ jarvis-ui.js (controller)
                    ├─ jarvis-style.css (theme)
                    ├─ api-client.js (client)
                    └─ manifest.json (PWA)
```

---

**This architecture enables a professional personal AI assistant with enterprise-grade capability!**
