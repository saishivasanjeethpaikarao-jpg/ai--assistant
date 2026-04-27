"""
Smart Recommendations Engine - AI-powered personalized recommendations.
Provides insights on productivity, trading, health, and personal development.
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from collections import defaultdict


class RecommendationEngine:
    """Generate personalized recommendations."""
    
    def __init__(self, user_id: str = "guest"):
        self.user_id = user_id
        self.recommendations_file = os.path.join(
            os.path.dirname(__file__), "memory", f"recommendations_{user_id}.json"
        )
        self.history = self._load_history()
    
    def _load_history(self) -> List[Dict]:
        """Load recommendation history."""
        if os.path.exists(self.recommendations_file):
            try:
                with open(self.recommendations_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                return []
        return []
    
    def _save_history(self) -> None:
        """Save recommendation history."""
        os.makedirs(os.path.dirname(self.recommendations_file), exist_ok=True)
        with open(self.recommendations_file, "w", encoding="utf-8") as f:
            json.dump(self.history, f, indent=2, default=str)
    
    def add_recommendation(self, category: str, title: str, description: str, 
                          priority: str = "normal", action: str = "") -> Dict:
        """Add a recommendation."""
        rec = {
            "id": f"{category}_{datetime.now().timestamp()}",
            "category": category,
            "title": title,
            "description": description,
            "priority": priority,
            "action": action,
            "created_at": datetime.now().isoformat(),
            "dismissed": False,
            "acted_on": False
        }
        self.history.append(rec)
        self._save_history()
        return rec
    
    def get_active_recommendations(self) -> List[Dict]:
        """Get all active (not dismissed) recommendations."""
        return [r for r in self.history if not r.get("dismissed")]
    
    def dismiss_recommendation(self, rec_id: str) -> bool:
        """Dismiss a recommendation."""
        for rec in self.history:
            if rec["id"] == rec_id:
                rec["dismissed"] = True
                self._save_history()
                return True
        return False


class ProductivityRecommender:
    """Recommend productivity improvements."""
    
    def __init__(self, user_id: str = "guest"):
        self.user_id = user_id
        self.engine = RecommendationEngine(user_id)
    
    def analyze_and_recommend(self) -> List[Dict]:
        """Analyze productivity and generate recommendations."""
        recommendations = []
        
        try:
            from productivity_system import TaskManager
            from analytics_dashboard import ProductivityMetrics, AnalyticsTracker
            
            tasks = TaskManager(self.user_id)
            tracker = AnalyticsTracker(self.user_id)
            metrics = ProductivityMetrics(tracker)
            
            # Check overdue tasks
            overdue = tasks.get_overdue_tasks()
            if overdue:
                recommendations.append(
                    self.engine.add_recommendation(
                        "productivity",
                        "Clear Overdue Tasks",
                        f"You have {len(overdue)} overdue task(s). Consider completing them first.",
                        "high",
                        "Review and complete overdue tasks"
                    )
                )
            
            # Check task completion rate
            completion_rate = metrics.get_completion_rate()
            if completion_rate < 50:
                recommendations.append(
                    self.engine.add_recommendation(
                        "productivity",
                        "Improve Task Completion Rate",
                        f"Your completion rate is {completion_rate}%. Try breaking tasks into smaller steps.",
                        "normal",
                        "Create smaller, achievable tasks"
                    )
                )
            
            # Check priority distribution
            priority_dist = metrics.get_priority_distribution()
            if priority_dist.get("high", 0) > 10:
                recommendations.append(
                    self.engine.add_recommendation(
                        "productivity",
                        "Too Many High Priority Tasks",
                        "You have many high-priority tasks. Consider prioritizing further.",
                        "normal",
                        "Review and adjust task priorities"
                    )
                )
            
            # Suggest goal setting
            completed_7d = metrics.get_tasks_completed(7)
            if completed_7d == 0:
                recommendations.append(
                    self.engine.add_recommendation(
                        "productivity",
                        "Set Weekly Goals",
                        "No tasks completed this week. Set achievable weekly goals.",
                        "low",
                        "Create 5-7 tasks for this week"
                    )
                )
        
        except ImportError:
            pass
        
        return recommendations
    
    def get_time_management_tips(self) -> List[str]:
        """Get time management tips based on usage patterns."""
        tips = [
            "📌 Use the Pomodoro technique: 25 min focus, 5 min break",
            "🎯 Start with high-priority tasks first (eat the frog)",
            "📋 Plan your day the evening before",
            "⏰ Time-block similar tasks together",
            "🚫 Minimize distractions during focus time",
            "📊 Review progress daily",
            "🔄 Batch process emails and messages",
            "💪 Take regular breaks for better focus"
        ]
        return tips


class TradingRecommender:
    """Recommend trading improvements."""
    
    def __init__(self, user_id: str = "guest"):
        self.user_id = user_id
        self.engine = RecommendationEngine(user_id)
    
    def analyze_and_recommend(self) -> List[Dict]:
        """Analyze trading patterns and generate recommendations."""
        recommendations = []
        
        try:
            from analytics_dashboard import TradingMetrics, AnalyticsTracker
            
            tracker = AnalyticsTracker(self.user_id)
            trading_metrics = TradingMetrics(tracker)
            
            activity = trading_metrics.get_trading_activity()
            
            # Check trade frequency
            if activity['total_trades'] == 0:
                recommendations.append(
                    self.engine.add_recommendation(
                        "trading",
                        "Start Building Your Portfolio",
                        "You haven't made any trades yet. Start building your investment portfolio.",
                        "low",
                        "Research and make first trade"
                    )
                )
            elif activity['total_trades'] > 20:
                recommendations.append(
                    self.engine.add_recommendation(
                        "trading",
                        "Consider Buy-and-Hold Strategy",
                        f"You have {activity['total_trades']} trades. Too frequent trading may lead to losses.",
                        "normal",
                        "Reduce trading frequency, focus on long-term strategy"
                    )
                )
            
            # Check buy/sell ratio
            if activity['buys'] > 0 and activity['sells'] > 0:
                buy_sell_ratio = activity['buys'] / activity['sells']
                if buy_sell_ratio > 3:
                    recommendations.append(
                        self.engine.add_recommendation(
                            "trading",
                            "Increase Profit Taking",
                            "You're buying much more than selling. Consider taking profits.",
                            "normal",
                            "Review positions and take profits where appropriate"
                        )
                    )
            
            # Check average trade value
            if activity['average_trade_value'] > 0:
                if activity['average_trade_value'] < 100:
                    recommendations.append(
                        self.engine.add_recommendation(
                            "trading",
                            "Optimize Trade Size",
                            f"Your average trade is ${activity['average_trade_value']}. Consider larger positions.",
                            "low",
                            "Research optimal position sizing"
                        )
                    )
        
        except ImportError:
            pass
        
        return recommendations
    
    def get_trading_tips(self) -> List[str]:
        """Get trading tips and best practices."""
        tips = [
            "💹 Never put all your money in one stock",
            "📊 Use stop-loss orders to protect profits",
            "🎯 Have a trading plan before entering trades",
            "🔍 Research before investing",
            "📈 Buy quality companies at reasonable prices",
            "⏰ Avoid emotional trading decisions",
            "💰 Risk only what you can afford to lose",
            "🎓 Continuously educate yourself on markets",
            "🔄 Rebalance portfolio regularly",
            "📉 Learn from losses, don't repeat mistakes"
        ]
        return tips


class HealthRecommender:
    """Recommend health and wellness improvements."""
    
    def __init__(self, user_id: str = "guest"):
        self.user_id = user_id
        self.engine = RecommendationEngine(user_id)
    
    def analyze_and_recommend(self) -> List[Dict]:
        """Analyze health patterns and generate recommendations."""
        recommendations = []
        
        try:
            from analytics_dashboard import UsageMetrics, AnalyticsTracker
            
            tracker = AnalyticsTracker(self.user_id)
            usage = UsageMetrics(tracker)
            
            daily_pattern = usage.get_daily_usage_pattern()
            
            # Check for excessive screen time
            total_usage = sum(daily_pattern.values())
            if total_usage > 100:  # More than 100 events in 7 days
                recommendations.append(
                    self.engine.add_recommendation(
                        "health",
                        "Reduce Screen Time",
                        "You're spending a lot of time on the assistant. Take breaks for your health.",
                        "normal",
                        "Take regular breaks, go for a walk, rest your eyes"
                    )
                )
            
            # Check for late night usage
            late_night = sum(daily_pattern.get(h, 0) for h in [22, 23, 0, 1, 2, 3])
            if late_night > 5:
                recommendations.append(
                    self.engine.add_recommendation(
                        "health",
                        "Improve Sleep Schedule",
                        "You're using the assistant late at night. Better sleep is important.",
                        "normal",
                        "Establish consistent sleep schedule"
                    )
                )
        
        except ImportError:
            pass
        
        return recommendations
    
    def get_wellness_tips(self) -> List[str]:
        """Get wellness tips."""
        tips = [
            "🧘 Take 5-10 minutes of mindfulness meditation daily",
            "💪 Exercise for at least 30 minutes, 5 days a week",
            "💧 Drink 8 glasses of water daily",
            "🍎 Eat balanced meals with fruits and vegetables",
            "😴 Get 7-9 hours of quality sleep",
            "🚶 Take walking breaks every hour",
            "🖥️ Follow 20-20-20 rule: every 20 min, look 20 feet away for 20 seconds",
            "🧠 Practice gratitude for mental health",
            "🤝 Spend time with loved ones",
            "⛔ Limit caffeine after 3 PM"
        ]
        return tips


class PersonalDevelopmentRecommender:
    """Recommend personal development and learning."""
    
    def __init__(self, user_id: str = "guest"):
        self.user_id = user_id
        self.engine = RecommendationEngine(user_id)
    
    def analyze_and_recommend(self) -> List[Dict]:
        """Analyze usage and recommend learning opportunities."""
        recommendations = []
        
        try:
            from analytics_dashboard import UsageMetrics, AnalyticsTracker
            
            tracker = AnalyticsTracker(self.user_id)
            usage = UsageMetrics(tracker)
            
            top_commands = usage.get_most_used_commands()
            
            if top_commands:
                # Suggest learning about advanced features
                recommendations.append(
                    self.engine.add_recommendation(
                        "learning",
                        "Master Advanced Features",
                        "You're using basic commands frequently. Learn advanced features to boost productivity.",
                        "low",
                        "Read documentation on advanced features"
                    )
                )
        
        except ImportError:
            pass
        
        return recommendations
    
    def get_learning_resources(self) -> List[Dict]:
        """Get recommended learning resources."""
        return [
            {
                "title": "Financial Markets Fundamentals",
                "type": "course",
                "duration": "4 weeks",
                "relevance": "trading"
            },
            {
                "title": "Productivity Mastery",
                "type": "book",
                "duration": "5-7 hours",
                "relevance": "productivity"
            },
            {
                "title": "Technical Analysis for Traders",
                "type": "course",
                "duration": "6 weeks",
                "relevance": "trading"
            },
            {
                "title": "Time Management Essentials",
                "type": "course",
                "duration": "2 weeks",
                "relevance": "productivity"
            }
        ]


class UnifiedRecommendationSystem:
    """Unified recommendation system combining all recommenders."""
    
    def __init__(self, user_id: str = "guest"):
        self.user_id = user_id
        self.productivity = ProductivityRecommender(user_id)
        self.trading = TradingRecommender(user_id)
        self.health = HealthRecommender(user_id)
        self.learning = PersonalDevelopmentRecommender(user_id)
    
    def get_all_recommendations(self) -> List[Dict]:
        """Get all recommendations from all categories."""
        all_recs = []
        all_recs.extend(self.productivity.analyze_and_recommend())
        all_recs.extend(self.trading.analyze_and_recommend())
        all_recs.extend(self.health.analyze_and_recommend())
        all_recs.extend(self.learning.analyze_and_recommend())
        return all_recs
    
    def get_recommendations_summary(self) -> str:
        """Get recommendations summary."""
        recs = self.get_all_recommendations()
        
        if not recs:
            return "✅ All systems optimal! No recommendations at this time."
        
        summary = f"""
💡 PERSONALIZED RECOMMENDATIONS ({len(recs)})
{'='*50}

"""
        by_priority = defaultdict(list)
        for rec in recs:
            by_priority[rec['priority']].append(rec)
        
        for priority in ['high', 'normal', 'low']:
            if priority in by_priority:
                summary += f"\n{priority.upper()} PRIORITY:\n"
                for rec in by_priority[priority]:
                    emoji = "🔴" if priority == "high" else "🟡" if priority == "normal" else "🟢"
                    summary += f"  {emoji} {rec['title']}\n"
                    summary += f"     {rec['description']}\n"
                    if rec['action']:
                        summary += f"     Action: {rec['action']}\n"
        
        return summary
    
    def get_daily_tips(self) -> str:
        """Get daily tips across all categories."""
        from random import choice
        
        tips = f"""
📚 DAILY TIPS & BEST PRACTICES
{'='*50}

⏱️ PRODUCTIVITY TIP:
   {choice(self.productivity.get_time_management_tips())}

💹 TRADING TIP:
   {choice(self.trading.get_trading_tips())}

🏥 WELLNESS TIP:
   {choice(self.health.get_wellness_tips())}
"""
        return tips


def get_recommendations_system(user_id: str = "guest") -> UnifiedRecommendationSystem:
    return UnifiedRecommendationSystem(user_id)
