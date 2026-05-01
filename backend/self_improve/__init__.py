"""
Self-Improvement Module — Safe, human-reviewed self-improvement.
Logs interactions, generates patches, applies with confirmation.
"""

from .logger import self_improve_logger
from .patch_generator import patch_generator
from .patch_apply import patch_apply

__all__ = ['self_improve_logger', 'patch_generator', 'patch_apply']
