"""
Analytics Dashboard - Comprehensive metrics, reports, and insights.
Tracks productivity, trading, usage patterns, and provides actionable intelligence.
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from collections import defaultdict


class AnalyticsTracker:
    """Track user activities and metrics."""
    
    def __init__(self, user_id: str = "guest"):
        self.user_id = user_id
        self.analytics_file = os.path.join(os.path.dirname(__file__), "memory", f"analytics_{user_id}.json")
        self.events = self._load_events()
    
    def _load_events(self) -> List[Dict]:
        """Load analytics events."""
        if os.path.exists(self.analytics_file):
            try:
                with open(self.analytics_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                return []
        return []
    
    def _save_events(self) -> None:
        """Save analytics events."""
        os.makedirs(os.path.dirname(self.analytics_file), exist_ok=True)
        with open(self.analytics_file, "w", encoding="utf-8") as f:
            json.dump(self.events, f, indent=2, default=str)
    
    def track_event(self, event_type: str, category: str, metadata: Dict = None) -> Dict:
        """Track an event."""
        event = {
            "timestamp": datetime.now().isoformat(),
            "type": event_type,
            "category": category,
            "metadata": metadata or {}
        }
        self.events.append(event)
        self._save_events()
        return event
    
    def track_task_completed(self, task_title: str, priority: str = "medium") -> None:
        """Track completed task."""
        self.track_event("task_completed", "productivity", {
            "task": task_title,
            "priority": priority,
            "timestamp": datetime.now().isoformat()
        })
    
    def track_trade(self, symbol: str, action: str, price: float, quantity: int = 1) -> None:
        """Track trading activity."""
        self.track_event("trade", "trading", {
            "symbol": symbol,
            "action": action,
            "price": price,
            "quantity": quantity
        })
    
    def track_command(self, command: str, category: str = "general") -> None:
        """Track command usage."""
        self.track_event("command", category, {"command": command})
    
    def get_events_by_type(self, event_type: str, days: int = 30) -> List[Dict]:
        """Get events by type within time period."""
        cutoff = datetime.now() - timedelta(days=days)
        return [e for e in self.events 
                if e["type"] == event_type and datetime.fromisoformat(e["timestamp"]) >= cutoff]


class ProductivityMetrics:
    """Calculate productivity metrics."""
    
    def __init__(self, tracker: AnalyticsTracker):
        self.tracker = tracker
    
    def get_tasks_completed(self, days: int = 7) -> int:
        """Get tasks completed in period."""
        events = self.tracker.get_events_by_type("task_completed", days)
        return len(events)
    
    def get_completion_rate(self, days: int = 30) -> float:
        """Get task completion rate percentage."""
        from productivity_system import TaskManager
        tasks = TaskManager(self.tracker.user_id)
        total_tasks = len(tasks.tasks)
        
        if total_tasks == 0:
            return 0.0
        
        completed = len([t for t in tasks.tasks if t["completed"]])
        return round((completed / total_tasks) * 100, 1)
    
    def get_productivity_score(self) -> Dict:
        """Calculate productivity score (0-100)."""
        completed_7d = self.get_tasks_completed(7)
        completed_30d = self.get_tasks_completed(30)
        completion_rate = self.get_completion_rate(30)
        
        # Score calculation
        score = min(100, (completed_7d * 5) + (completed_30d * 1) + completion_rate)
        
        return {
            "score": round(score, 1),
            "completed_week": completed_7d,
            "completed_month": completed_30d,
            "completion_rate": completion_rate,
            "level": "excellent" if score >= 80 else "good" if score >= 60 else "fair" if score >= 40 else "needs_improvement"
        }
    
    def get_priority_distribution(self) -> Dict:
        """Get distribution of tasks by priority."""
        from productivity_system import TaskManager
        tasks = TaskManager(self.tracker.user_id)
        
        distribution = {"high": 0, "medium": 0, "low": 0}
        for task in tasks.tasks:
            priority = task.get("priority", "medium")
            if priority in distribution:
                distribution[priority] += 1
        
        return distribution
    
    def get_productivity_trend(self, days: int = 30) -> List[Tuple[str, int]]:
        """Get productivity trend over time."""
        events = self.tracker.get_events_by_type("task_completed", days)
        
        # Group by date
        daily_counts = defaultdict(int)
        for event in events:
            date = event["timestamp"].split("T")[0]
            daily_counts[date] += 1
        
        return sorted(daily_counts.items())


class TradingMetrics:
    """Calculate trading and investment metrics."""
    
    def __init__(self, tracker: AnalyticsTracker):
        self.tracker = tracker
    
    def get_trading_activity(self, days: int = 30) -> Dict:
        """Get trading activity summary."""
        events = self.tracker.get_events_by_type("trade", days)
        
        buys = [e for e in events if e["metadata"].get("action") == "buy"]
        sells = [e for e in events if e["metadata"].get("action") == "sell"]
        
        total_value = 0
        for event in events:
            total_value += event["metadata"].get("price", 0) * event["metadata"].get("quantity", 1)
        
        return {
            "total_trades": len(events),
            "buys": len(buys),
            "sells": len(sells),
            "total_value": round(total_value, 2),
            "average_trade_value": round(total_value / len(events), 2) if events else 0
        }
    
    def get_popular_symbols(self, days: int = 30) -> List[Tuple[str, int]]:
        """Get most traded symbols."""
        events = self.tracker.get_events_by_type("trade", days)
        
        symbols = defaultdict(int)
        for event in events:
            symbol = event["metadata"].get("symbol", "unknown")
            symbols[symbol] += 1
        
        return sorted(symbols.items(), key=lambda x: x[1], reverse=True)
    
    def get_trading_patterns(self) -> Dict:
        """Analyze trading patterns."""
        events = self.tracker.get_events_by_type("trade", 90)
        
        hourly_trades = defaultdict(int)
        daily_trades = defaultdict(int)
        
        for event in events:
            dt = datetime.fromisoformat(event["timestamp"])
            hourly_trades[dt.hour] += 1
            daily_trades[dt.strftime("%A")] += 1
        
        return {
            "peak_trading_hour": max(hourly_trades.items(), key=lambda x: x[1])[0] if hourly_trades else None,
            "busiest_day": max(daily_trades.items(), key=lambda x: x[1])[0] if daily_trades else None,
            "trades_by_hour": dict(hourly_trades),
            "trades_by_day": dict(daily_trades)
        }


class UsageMetrics:
    """Track application usage patterns."""
    
    def __init__(self, tracker: AnalyticsTracker):
        self.tracker = tracker
    
    def get_most_used_commands(self, days: int = 30) -> List[Tuple[str, int]]:
        """Get most frequently used commands."""
        events = self.tracker.get_events_by_type("command", days)
        
        commands = defaultdict(int)
        for event in events:
            cmd = event["metadata"].get("command", "unknown")
            commands[cmd] += 1
        
        return sorted(commands.items(), key=lambda x: x[1], reverse=True)[:10]
    
    def get_usage_by_category(self, days: int = 30) -> Dict:
        """Get usage breakdown by category."""
        all_events = self.tracker.events
        cutoff = datetime.now() - timedelta(days=days)
        
        recent_events = [e for e in all_events if datetime.fromisoformat(e["timestamp"]) >= cutoff]
        
        categories = defaultdict(int)
        for event in recent_events:
            categories[event["category"]] += 1
        
        return dict(categories)
    
    def get_daily_usage_pattern(self, days: int = 7) -> Dict:
        """Get daily usage patterns."""
        all_events = self.tracker.events
        cutoff = datetime.now() - timedelta(days=days)
        
        recent_events = [e for e in all_events if datetime.fromisoformat(e["timestamp"]) >= cutoff]
        
        hourly_usage = defaultdict(int)
        for event in recent_events:
            hour = datetime.fromisoformat(event["timestamp"]).hour
            hourly_usage[hour] += 1
        
        return dict(hourly_usage)


class AnalyticsDashboard:
    """Unified analytics dashboard."""
    
    def __init__(self, user_id: str = "guest"):
        self.user_id = user_id
        self.tracker = AnalyticsTracker(user_id)
        self.productivity = ProductivityMetrics(self.tracker)
        self.trading = TradingMetrics(self.tracker)
        self.usage = UsageMetrics(self.tracker)
    
    def get_executive_summary(self) -> str:
        """Get executive summary dashboard."""
        prod_score = self.productivity.get_productivity_score()
        trading_activity = self.trading.get_trading_activity()
        usage_by_cat = self.usage.get_usage_by_category()
        
        summary = f"""
📊 ANALYTICS DASHBOARD
{'='*60}

🎯 PRODUCTIVITY SCORE: {prod_score['score']}/100 ({prod_score['level'].upper()})
  ├─ Tasks Completed (7d): {prod_score['completed_week']}
  ├─ Tasks Completed (30d): {prod_score['completed_month']}
  └─ Completion Rate: {prod_score['completion_rate']}%

📈 TRADING ACTIVITY
  ├─ Total Trades: {trading_activity['total_trades']}
  ├─ Buys: {trading_activity['buys']}
  ├─ Sells: {trading_activity['sells']}
  └─ Total Value: ${trading_activity['total_value']}

🔍 USAGE BY CATEGORY
"""
        for category, count in sorted(usage_by_cat.items(), key=lambda x: x[1], reverse=True):
            summary += f"  ├─ {category.title()}: {count}\n"
        
        return summary.rstrip()
    
    def get_productivity_report(self) -> str:
        """Get detailed productivity report."""
        score = self.productivity.get_productivity_score()
        priority_dist = self.productivity.get_priority_distribution()
        trend = self.productivity.get_productivity_trend(7)
        
        report = f"""
📋 PRODUCTIVITY REPORT
{'='*60}

OVERALL SCORE: {score['score']}/100 ({score['level'].upper()})
  Last 7 days: {score['completed_week']} tasks
  Last 30 days: {score['completed_month']} tasks

PRIORITY DISTRIBUTION:
  High Priority: {priority_dist['high']} tasks
  Medium Priority: {priority_dist['medium']} tasks
  Low Priority: {priority_dist['low']} tasks

7-DAY TREND:
"""
        for date, count in trend:
            bar = "█" * count
            report += f"  {date}: {bar} ({count})\n"
        
        return report.rstrip()
    
    def get_trading_report(self) -> str:
        """Get detailed trading report."""
        activity = self.trading.get_trading_activity()
        popular = self.trading.get_popular_symbols(30)
        patterns = self.trading.get_trading_patterns()
        
        report = f"""
💹 TRADING REPORT
{'='*60}

TRADING SUMMARY:
  Total Trades: {activity['total_trades']}
  Buy Orders: {activity['buys']}
  Sell Orders: {activity['sells']}
  Total Value: ${activity['total_value']}
  Average Trade: ${activity['average_trade_value']}

TOP TRADED SYMBOLS:
"""
        for symbol, count in popular[:5]:
            report += f"  {symbol}: {count} trades\n"
        
        report += f"""
TRADING PATTERNS:
  Peak Trading Hour: {patterns.get('peak_trading_hour', 'N/A')}:00
  Busiest Day: {patterns.get('busiest_day', 'N/A')}
"""
        
        return report.rstrip()
    
    def get_usage_report(self) -> str:
        """Get detailed usage report."""
        top_commands = self.usage.get_most_used_commands()
        usage_by_cat = self.usage.get_usage_by_category()
        daily_pattern = self.usage.get_daily_usage_pattern()
        
        report = f"""
⚙️ USAGE REPORT
{'='*60}

MOST USED COMMANDS:
"""
        for cmd, count in top_commands[:10]:
            report += f"  {cmd}: {count} uses\n"
        
        report += f"\nUSAGE BY CATEGORY:\n"
        for cat, count in sorted(usage_by_cat.items(), key=lambda x: x[1], reverse=True):
            report += f"  {cat.title()}: {count}\n"
        
        report += f"\nHOURLY USAGE PATTERN (Last 7 days):\n"
        for hour in range(24):
            count = daily_pattern.get(hour, 0)
            bar = "▓" * (count // 2) if count > 0 else ""
            report += f"  {hour:02d}:00 {bar} ({count})\n"
        
        return report.rstrip()
    
    def get_insights(self) -> List[str]:
        """Get actionable insights."""
        insights = []
        
        # Productivity insights
        score = self.productivity.get_productivity_score()
        if score['score'] >= 80:
            insights.append("🌟 Excellent productivity! Keep up the great work!")
        elif score['score'] >= 60:
            insights.append("📈 Good productivity. Consider setting more goals to improve further.")
        else:
            insights.append("⚠️ Productivity needs attention. Try breaking tasks into smaller chunks.")
        
        # Trading insights
        trading_activity = self.trading.get_trading_activity()
        if trading_activity['total_trades'] > 10:
            insights.append(f"📊 High trading activity ({trading_activity['total_trades']} trades). Ensure proper risk management.")
        
        # Usage insights
        top_commands = self.usage.get_most_used_commands(7)
        if top_commands:
            most_used = top_commands[0][0]
            insights.append(f"🔧 Your most used command: '{most_used}'. Consider creating shortcuts for frequent tasks.")
        
        return insights


def get_analytics_dashboard(user_id: str = "guest") -> AnalyticsDashboard:
    return AnalyticsDashboard(user_id)
