"""
Self-Improvement System — Logs interactions, proposes improvements, applies with approval.
Safe self-upgrade flow with human review.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from backend.tools import ToolResult


class InteractionLogger:
    """Log all interactions for learning."""
    
    def __init__(self, log_file: str = "logs/interactions.jsonl"):
        self.log_file = log_file
        Path(log_file).parent.mkdir(parents=True, exist_ok=True)
    
    def log(self, command: str, response: str, metadata: Dict = None):
        """Log an interaction."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "command": command,
            "response": response,
            "metadata": metadata or {}
        }
        with open(self.log_file, 'a') as f:
            f.write(json.dumps(entry) + "\n")
    
    def get_recent(self, count: int = 10) -> List[Dict]:
        """Get recent interactions."""
        try:
            with open(self.log_file, 'r') as f:
                lines = f.readlines()
            
            recent = [json.loads(line) for line in lines[-count:]]
            return recent
        except:
            return []


class PatchProposal:
    """Represents a proposed code patch."""
    
    def __init__(self, title: str, description: str, diff: str, priority: str = "low"):
        self.title = title
        self.description = description
        self.diff = diff
        self.priority = priority  # low, medium, high
        self.approved = False
        self.created_at = datetime.now().isoformat()
    
    def to_dict(self):
        return {
            "title": self.title,
            "description": self.description,
            "diff": self.diff,
            "priority": self.priority,
            "approved": self.approved,
            "created_at": self.created_at
        }


class SelfImproveEngine:
    """Main self-improvement engine."""
    
    def __init__(self):
        self.logger = InteractionLogger()
        self.proposals: List[PatchProposal] = []
        self.patches_dir = "logs/patches"
        Path(self.patches_dir).mkdir(parents=True, exist_ok=True)
    
    def log_interaction(self, command: str, response: str, metadata: Dict = None) -> ToolResult:
        """Log an interaction."""
        try:
            self.logger.log(command, response, metadata)
            return ToolResult(
                success=True,
                message="Interaction logged for learning"
            )
        except Exception as e:
            return ToolResult(success=False, message=f"Logging failed: {e}")
    
    def analyze_errors(self) -> ToolResult:
        """
        Analyze recent interactions for error patterns.
        
        Returns:
            List of patterns that could be improved
        """
        try:
            recent = self.logger.get_recent(50)
            
            patterns = {
                "misunderstood_commands": [],
                "slow_responses": [],
                "failed_tools": [],
            }
            
            # Simple pattern detection (in production, use ML)
            for entry in recent:
                if "error" in entry["response"].lower() or "failed" in entry["response"].lower():
                    patterns["failed_tools"].append(entry["command"])
                if len(entry["response"]) < 10:
                    patterns["misunderstood_commands"].append(entry["command"])
            
            return ToolResult(
                success=True,
                message="Analysis complete",
                data=patterns
            )
        except Exception as e:
            return ToolResult(success=False, message=f"Analysis failed: {e}")
    
    def generate_improvement_proposal(
        self,
        title: str,
        description: str,
        suggested_change: str,
        priority: str = "low"
    ) -> PatchProposal:
        """
        Generate a patch proposal (not applied yet).
        
        Args:
            title: What is being improved
            description: Why and how
            suggested_change: Code diff/change
            priority: low/medium/high
        
        Returns:
            PatchProposal object (awaiting approval)
        """
        proposal = PatchProposal(title, description, suggested_change, priority)
        self.proposals.append(proposal)
        return proposal
    
    def show_proposal(self, proposal: PatchProposal) -> str:
        """Format a proposal for display."""
        return f"""
┌─ IMPROVEMENT PROPOSAL ─────────────────────┐
│ Title:       {proposal.title}
│ Priority:    {proposal.priority.upper()}
│ Description: {proposal.description}
│
│ Proposed Change:
│ {proposal.diff}
│
│ Review this? (y/n/skip)
└────────────────────────────────────────────┘
"""
    
    def approve_proposal(self, proposal: PatchProposal) -> ToolResult:
        """
        Approve a proposal (simulated - in production, apply the patch).
        
        Args:
            proposal: PatchProposal to approve
        """
        try:
            proposal.approved = True
            
            # Save approved patch
            patch_file = os.path.join(
                self.patches_dir,
                f"patch_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            )
            with open(patch_file, 'w') as f:
                json.dump(proposal.to_dict(), f, indent=2)
            
            return ToolResult(
                success=True,
                message=f"Patch approved and saved: {patch_file}",
                data={"patch_file": patch_file}
            )
        except Exception as e:
            return ToolResult(success=False, message=f"Approval failed: {e}")
    
    def reject_proposal(self, proposal: PatchProposal) -> ToolResult:
        """Reject a proposal."""
        try:
            self.proposals.remove(proposal)
            return ToolResult(success=True, message="Proposal rejected")
        except Exception as e:
            return ToolResult(success=False, message=f"Rejection failed: {e}")
    
    def list_pending_proposals(self) -> List[PatchProposal]:
        """List proposals awaiting approval."""
        return [p for p in self.proposals if not p.approved]
    
    def get_improvement_suggestions(self) -> ToolResult:
        """
        Get AI-generated improvement suggestions based on interaction patterns.
        
        This is where you'd call an LLM to analyze patterns and suggest improvements.
        For now, it's a template.
        """
        try:
            # Analyze errors and patterns
            analysis = self.analyze_errors()
            if not analysis.success:
                return analysis
            
            patterns = analysis.data
            suggestions = []
            
            # Generate proposals based on patterns
            if len(patterns["failed_tools"]) > 3:
                proposal = self.generate_improvement_proposal(
                    title="Improve tool error handling",
                    description="Tool failures detected in recent interactions",
                    suggested_change="Add retry logic to failed tool calls",
                    priority="high"
                )
                suggestions.append(proposal)
            
            if len(patterns["misunderstood_commands"]) > 2:
                proposal = self.generate_improvement_proposal(
                    title="Improve command understanding",
                    description="Some commands are misunderstood",
                    suggested_change="Fine-tune intent detection model",
                    priority="medium"
                )
                suggestions.append(proposal)
            
            return ToolResult(
                success=True,
                message=f"Generated {len(suggestions)} improvement suggestions",
                data={"suggestions": [s.to_dict() for s in suggestions]}
            )
        except Exception as e:
            return ToolResult(success=False, message=f"Suggestion generation failed: {e}")


# Global instance
self_improve_engine = SelfImproveEngine()
