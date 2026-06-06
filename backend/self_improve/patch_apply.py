"""
Self-Improvement Patch Apply — STUB IMPLEMENTATION.

Phase 3: This module is a deliberate stub. The actual patch-application
pipeline requires:
  1. A unified diff parser
  2. AST-level safety validation
  3. A backup/rollback mechanism (git stash or snapshot)
  4. An interactive review UI (not just `input()`)

Until those pieces exist, this module only logs and reports what WOULD
be done. It never modifies files. This is intentional — the previous
implementation claimed to apply patches but did nothing, which was
worse than being honest about its limitations.
"""

import os
from typing import Dict, Any, Optional
from .patch_generator import patch_generator
from .logger import self_improve_logger


class PatchApply:
    """STUB: Reports proposed patches but does not modify files."""

    def __init__(self):
        self.patch_generator = patch_generator
        self.logger = self_improve_logger

    def apply_patch(self, patch: Dict[str, Any], auto_confirm: bool = False) -> bool:
        """STUB: Always returns False because no safe apply path exists yet."""
        formatted = self.patch_generator.format_patch_for_review(patch)
        print(formatted)
        print(
            "\n[STUB] patch_apply.apply_patch() does not modify files yet.\n"
            "       A safe apply path (diff parser + AST validation + backup) is required first."
        )
        self.logger.log_feedback("Patch apply skipped (stub)", rating=0)
        return False

    def _apply_changes(self, changes: list) -> bool:
        """STUB: Returns True only to signal 'nothing to roll back', not success."""
        for change in changes:
            file_path = change.get('file')
            line_num = change.get('line')
            code_diff = change.get('code_diff', '')
            if not file_path:
                continue
            print(f"[STUB] Would apply to {file_path} at line {line_num}")
        return True

    def apply_full_patch(self, auto_confirm: bool = False) -> bool:
        """STUB: Generate a patch report but never apply it."""
        patch = self.patch_generator.generate_full_patch()
        if patch.get('type') == 'no_changes':
            print("No changes needed.")
            return True
        return self.apply_patch(patch, auto_confirm)

    def rollback_patch(self, patch_id: str) -> bool:
        """STUB: No-op because no patches have actually been applied."""
        print(f"[STUB] Rollback for patch {patch_id}: no-op (no patches applied).")
        return False

    def list_pending_patches(self) -> list:
        """List patches that could be applied (none, since apply is a stub)."""
        patch = self.patch_generator.generate_full_patch()
        return patch.get('patches', [])


# Singleton instance
patch_apply = PatchApply()
