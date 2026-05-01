"""
File Editor Tool — Create, read, edit, delete files.
"""

import os
from pathlib import Path
from typing import Optional
from backend.tools import ToolResult, tool_registry


def create_file(filepath: str, content: str = "") -> ToolResult:
    """
    Create a new file.
    
    Args:
        filepath: Path to file
        content: Initial content
    """
    try:
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return ToolResult(
            success=True,
            message=f"Created file: {filepath}"
        )
    except Exception as e:
        return ToolResult(success=False, message=f"Failed to create file: {e}")


def read_file(filepath: str) -> ToolResult:
    """
    Read a file.
    
    Args:
        filepath: Path to file
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        return ToolResult(
            success=True,
            message=f"File content ({len(content)} chars)",
            data={"content": content, "filepath": filepath}
        )
    except Exception as e:
        return ToolResult(success=False, message=f"Failed to read file: {e}")


def append_to_file(filepath: str, content: str) -> ToolResult:
    """
    Append content to a file.
    
    Args:
        filepath: Path to file
        content: Content to append
    """
    try:
        with open(filepath, 'a', encoding='utf-8') as f:
            f.write(content)
        return ToolResult(
            success=True,
            message=f"Appended to file: {filepath}"
        )
    except Exception as e:
        return ToolResult(success=False, message=f"Failed to append: {e}")


def edit_file(filepath: str, search: str, replace: str) -> ToolResult:
    """
    Edit a file (find and replace).
    
    Args:
        filepath: Path to file
        search: Text to search for
        replace: Replacement text
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = content.replace(search, replace)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return ToolResult(
            success=True,
            message=f"Edited file: {filepath}"
        )
    except Exception as e:
        return ToolResult(success=False, message=f"Failed to edit file: {e}")


def delete_file(filepath: str) -> ToolResult:
    """
    Delete a file.
    
    Args:
        filepath: Path to file
    """
    try:
        os.remove(filepath)
        return ToolResult(
            success=True,
            message=f"Deleted file: {filepath}"
        )
    except Exception as e:
        return ToolResult(success=False, message=f"Failed to delete file: {e}")


def list_files(directory: str = ".") -> ToolResult:
    """
    List files in a directory.
    
    Args:
        directory: Directory path
    """
    try:
        files = os.listdir(directory)
        return ToolResult(
            success=True,
            message=f"Found {len(files)} items in {directory}",
            data={"files": files, "directory": directory}
        )
    except Exception as e:
        return ToolResult(success=False, message=f"Failed to list files: {e}")


def file_exists(filepath: str) -> ToolResult:
    """
    Check if a file exists.
    
    Args:
        filepath: Path to file
    """
    exists = os.path.isfile(filepath)
    return ToolResult(
        success=True,
        message=f"File {'exists' if exists else 'does not exist'}",
        data={"exists": exists}
    )


# Register tools
tool_registry.register("create_file", create_file)
tool_registry.register("read_file", read_file)
tool_registry.register("append_to_file", append_to_file)
tool_registry.register("edit_file", edit_file)
tool_registry.register("delete_file", delete_file)
tool_registry.register("list_files", list_files)
tool_registry.register("file_exists", file_exists)
