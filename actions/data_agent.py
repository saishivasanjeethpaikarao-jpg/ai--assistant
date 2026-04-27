import os
import subprocess
import tempfile

def execute_python_code(code: str) -> str:
    """Execute raw Python code seamlessly and return its output/errors."""
    try:
        fd, file_path = tempfile.mkstemp(suffix=".py")
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            f.write(code)
        
        # Execute the python script with a 60 second timeout
        result = subprocess.run(["python", file_path], capture_output=True, text=True, timeout=60)
        
        try:
            os.remove(file_path)
        except Exception:
            pass
            
        output = ""
        if result.stdout:
            output += f"Output:\n{result.stdout}\n"
        if result.stderr:
            output += f"Errors:\n{result.stderr}\n"
            
        if not output:
            output = "Code executed successfully with no output."
            
        return output
    except subprocess.TimeoutExpired:
        return "Execution Error: Script timed out after 60 seconds."
    except Exception as e:
        return f"Execution Error: {e}"
