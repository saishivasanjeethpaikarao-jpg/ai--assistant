"""
Safe Self-Improvement System - Approval workflow
AI suggests improvements, user approves, then applies.
Never directly edits code without approval.
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime
import os

from assistant_core import generate_text

logger = logging.getLogger(__name__)


class ImprovementSuggestion:
    """Represents a suggested improvement."""
    
    def __init__(self, file_path: str, original_code: str, 
                 suggested_code: str, reasoning: str, 
                 category: str):
        self.file_path = file_path
        self.original_code = original_code
        self.suggested_code = suggested_code
        self.reasoning = reasoning
        self.category = category  # performance, structure, readability, bug_fix
        self.timestamp = datetime.now().isoformat()
        self.approved = False
        self.applied = False


class SafeImprover:
    """Safe self-improvement system with approval workflow."""
    
    def __init__(self, base_dir: str):
        self.base_dir = base_dir
        self.suggestions: List[ImprovementSuggestion] = []
        self.pending_suggestions: List[ImprovementSuggestion] = []
        
        # Exclude directories
        self.exclude_dirs = {".git", ".venv", "__pycache__", "build", "dist", "node_modules"}
        
        # Focus on Python files
        self.extensions = {".py"}
    
    def analyze_file(self, file_path: str) -> Optional[ImprovementSuggestion]:
        """
        Analyze a file and suggest improvements.
        
        Args:
            file_path: Path to file to analyze
            
        Returns:
            ImprovementSuggestion or None
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                code = f.read()
            
            if not code.strip():
                return None
            
            # Generate improvement suggestion
            prompt = f"""Analyze this Python code and suggest improvements.

Focus on:
- Performance optimizations
- Code structure
- Readability
- Potential bugs

Code:
{code[:2000]}

Provide:
1. Category (performance/structure/readability/bug_fix)
2. Brief reasoning (max 2 sentences)
3. Improved code (only the changed parts)

Format:
CATEGORY: [category]
REASONING: [reasoning]
CODE:
[improved code]"""
            
            result = generate_text(prompt)
            if not result:
                return None
            
            # Parse response
            category = "readability"
            reasoning = "General improvement suggested"
            suggested_code = code
            
            lines = result.split("\n")
            current_section = None
            
            for line in lines:
                if line.startswith("CATEGORY:"):
                    category = line.replace("CATEGORY:", "").strip()
                elif line.startswith("REASONING:"):
                    reasoning = line.replace("REASONING:", "").strip()
                elif line.startswith("CODE:"):
                    current_section = "code"
                elif current_section == "code":
                    suggested_code += "\n" + line
            
            # Check if there's actual improvement
            if suggested_code == code:
                return None
            
            suggestion = ImprovementSuggestion(
                file_path=file_path,
                original_code=code,
                suggested_code=suggested_code,
                reasoning=reasoning,
                category=category
            )
            
            return suggestion
            
        except Exception as e:
            logger.error(f"Failed to analyze {file_path}: {e}")
            return None
    
    def analyze_directory(self, directory: str, max_files: int = 5) -> List[ImprovementSuggestion]:
        """
        Analyze all Python files in a directory.
        
        Args:
            directory: Directory to analyze
            max_files: Maximum files to analyze
            
        Returns:
            List of improvement suggestions
        """
        suggestions = []
        files_analyzed = 0
        
        for root, dirs, files in os.walk(directory):
            # Skip excluded directories
            dirs[:] = [d for d in dirs if d not in self.exclude_dirs]
            
            for file in files:
                if files_analyzed >= max_files:
                    break
                
                if any(file.endswith(ext) for ext in self.extensions):
                    file_path = os.path.join(root, file)
                    suggestion = self.analyze_file(file_path)
                    if suggestion:
                        suggestions.append(suggestion)
                        files_analyzed += 1
        
        return suggestions
    
    def suggest_improvements(self, focus_area: Optional[str] = None) -> List[ImprovementSuggestion]:
        """
        Generate improvement suggestions.
        
        Args:
            focus_area: Optional specific area to focus on
            
        Returns:
            List of suggestions
        """
        logger.info("Generating improvement suggestions...")
        
        if focus_area:
            # Analyze specific directory
            target_dir = os.path.join(self.base_dir, focus_area)
            if os.path.exists(target_dir):
                suggestions = self.analyze_directory(target_dir)
            else:
                logger.warning(f"Directory not found: {target_dir}")
                suggestions = []
        else:
            # Analyze base directory
            suggestions = self.analyze_directory(self.base_dir)
        
        self.pending_suggestions = suggestions
        logger.info(f"Generated {len(suggestions)} suggestions")
        
        return suggestions
    
    def approve_suggestion(self, suggestion: ImprovementSuggestion) -> bool:
        """
        Approve a suggestion and apply it.
        
        Args:
            suggestion: Suggestion to approve
            
        Returns:
            True if applied successfully
        """
        try:
            # Backup original
            backup_path = suggestion.file_path + ".backup"
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(suggestion.original_code)
            
            # Apply suggestion
            with open(suggestion.file_path, 'w', encoding='utf-8') as f:
                f.write(suggestion.suggested_code)
            
            suggestion.approved = True
            suggestion.applied = True
            
            logger.info(f"Applied improvement to {suggestion.file_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to apply suggestion: {e}")
            return False
    
    def reject_suggestion(self, suggestion: ImprovementSuggestion):
        """Reject a suggestion."""
        suggestion.approved = False
        logger.info(f"Rejected suggestion for {suggestion.file_path}")
    
    def get_pending_suggestions(self) -> List[ImprovementSuggestion]:
        """Get all pending suggestions."""
        return self.pending_suggestions
    
    def get_suggestion_summary(self) -> Dict:
        """Get summary of suggestions."""
        return {
            "total": len(self.pending_suggestions),
            "by_category": {
                "performance": len([s for s in self.pending_suggestions if s.category == "performance"]),
                "structure": len([s for s in self.pending_suggestions if s.category == "structure"]),
                "readability": len([s for s in self.pending_suggestions if s.category == "readability"]),
                "bug_fix": len([s for s in self.pending_suggestions if s.category == "bug_fix"])
            },
            "pending": len([s for s in self.pending_suggestions if not s.approved]),
            "applied": len([s for s in self.pending_suggestions if s.applied])
        }


# Singleton instance
_safe_improver: Optional[SafeImprover] = None


def get_safe_improver() -> SafeImprover:
    """Get or create SafeImprover instance."""
    global _safe_improver
    if _safe_improver is None:
        import sys
        base_dir = os.path.dirname(os.path.abspath(__file__))
        _safe_improver = SafeImprover(base_dir)
    return _safe_improver
