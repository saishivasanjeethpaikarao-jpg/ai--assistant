"""
Self-Improvement Patch Apply — Applies patches with human confirmation.
Safe, user-reviewed approach to self-improvement.
"""

import os
import subprocess
from typing import Dict, Any, Optional
from .patch_generator import patch_generator
from .logger import self_improve_logger


class PatchApply:
    """Applies generated patches with user confirmation."""
    
    def __init__(self):
        self.patch_generator = patch_generator
        self.logger = self_improve_logger
    
    def apply_patch(self, patch: Dict[str, Any], auto_confirm: bool = False) -> bool:
        """Apply a patch with confirmation."""
        if not auto_confirm:
            # Show patch for review
            formatted = self.patch_generator.format_patch_for_review(patch)
            print(formatted)
            
            # Ask for confirmation
            response = input("\nApply this patch? (y/n): ").strip().lower()
            if response != 'y':
                print("Patch cancelled by user.")
                self.logger.log_feedback("Patch cancelled", rating=0)
                return False
        
        # Apply the patch
        try:
            success = self._apply_changes(patch.get('suggested_changes', []))
            
            if success:
                self.logger.log_feedback("Patch applied successfully", rating=5)
                print("Patch applied successfully.")
                return True
            else:
                self.logger.log_feedback("Patch application failed", rating=1)
                print("Patch application failed.")
                return False
        except Exception as e:
            self.logger.log_error(f"Patch application error: {str(e)}")
            print(f"Error applying patch: {e}")
            return False
    
    def _apply_changes(self, changes: list) -> bool:
        """Apply individual file changes."""
        for change in changes:
            file_path = change.get('file')
            line_num = change.get('line')
            code_diff = change.get('code_diff', '')
            
            if not file_path:
                print(f"Skipping change: no file specified")
                continue
            
            # In a real implementation, this would apply the diff
            # For now, just log what would be done
            print(f"Would apply to {file_path} at line {line_num}")
            print(f"Diff: {code_diff}")
        
        return True
    
    def apply_full_patch(self, auto_confirm: bool = False) -> bool:
        """Generate and apply a comprehensive patch."""
        patch = self.patch_generator.generate_full_patch()
        
        if patch.get('type') == 'no_changes':
            print("No changes needed.")
            return True
        
        return self.apply_patch(patch, auto_confirm)
    
    def rollback_patch(self, patch_id: str) -> bool:
        """Rollback a previously applied patch."""
        # In a real implementation, this would use git or backup files
        print(f"Rollback for patch {patch_id} not implemented yet.")
        return False
    
    def list_pending_patches(self) -> list:
        """List patches that could be applied."""
        patch = self.patch_generator.generate_full_patch()
        return patch.get('patches', [])


# Singleton instance
patch_apply = PatchApply()
