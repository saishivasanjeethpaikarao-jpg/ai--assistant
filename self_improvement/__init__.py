"""
Safe Self-Improvement Module
AI suggests improvements with user approval workflow.
"""

from .safe_improver import SafeImprover, ImprovementSuggestion, get_safe_improver

__all__ = [
    'SafeImprover',
    'ImprovementSuggestion',
    'get_safe_improver'
]
