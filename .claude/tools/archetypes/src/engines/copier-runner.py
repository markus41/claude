#!/usr/bin/env python3
"""
Copier Bridge Runner - Python subprocess handler for Copier integration

Executes Copier operations based on JSON request files and writes results
to JSON response files for consumption by Node.js bridge adapter.

Establishes secure, structured communication enabling project lifecycle management
with template versioning and update propagation.

Requirements:
    - Python 3.8+
    - copier >= 8.0.0
    - jinja2 >= 3.0.0

Usage:
    python copier-runner.py <request_file.json> <response_file.json>
"""

import sys
import json
import traceback
from pathlib import Path
from typing import Dict, Any, List, Optional
import time

# Import Copier with graceful degradation
try:
    import copier
    from copier import run_copy, run_update
    COPIER_AVAILABLE = True
    COPIER_VERSION = copier.__version__
except ImportError:
    COPIER_AVAILABLE = False
    COPIER_VERSION = None

# Import Jinja2 for template operations
try:
    from jinja2 import Environment, Template, TemplateSyntaxError, meta
    JINJA2_AVAILABLE = True
    import jinja2
    JINJA2_VERSION = jinja2.__version__
except ImportError:
    JINJA2_AVAILABLE = False
    JINJA2_VERSION = None


class BridgeRequestType:
    """Request type constants matching TypeScript enum"""
    RENDER = "render"
    UPDATE = "update"
    VALIDATE = "validate"
    EXTRACT_VARS = "extract_vars"
    CHECK_VERSION = "check_version"


class BridgeExecutor:
    """
    Executes bridge requests with comprehensive error handling
    """

    def __init__(self):
        """Initialize Jinja2 environment with Copier-compatible settings"""
        if JINJA2_AVAILABLE:
            self.jinja_env = Environment(
                variable_start_string='{{',
                variable_end_string='}}',
                block_start_string='{%',
                block_end_string='%}',
                comment_start_string='{#',
                comment_end_string='#}',
                trim_blocks=True,
                lstrip_blocks=True,
                keep_trailing_newline=True
            )
        else:
            self.jinja_env = None

    def execute(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute bridge request and return response

        Args:
            request: Validated request dictionary

        Returns:
            Response dictionary with success status and result/error
        """
        start_time = time.time()

        try:
            request_type = request.get('type')

            if request_type == BridgeRequestType.RENDER:
                result = self._render(request)
            elif request_type == BridgeRequestType.UPDATE:
                result = self._update(request)
            elif request_type == BridgeRequestType.VALIDATE:
                result = self._validate(request)
            elif request_type == BridgeRequestType.EXTRACT_VARS:
                result = self._extract_vars(request)
            elif request_type == BridgeRequestType.CHECK_VERSION:
                result = self._check_version()
            else:
                raise ValueError(f"Unknown request type: {request_type}")

            processing_time = time.time() - start_time

            return {
                'success': True,
                'result': result,
                'metadata': {
                    'engineVersion': COPIER_VERSION,
                    'processingTime': processing_time
                }
            }

        except Exception as e:
            processing_time = time.time() - start_time
            error_trace = traceback.format_exc()

            return {
                'success': False,
                'error': str(e),
                'stderr': error_trace,
                'metadata': {
                    'engineVersion': COPIER_VERSION,
                    'processingTime': processing_time
                }
            }

    def _render(self, request: Dict[str, Any]) -> str:
        """
        Render template string with context

        Args:
            request: Request with templateString and context

        Returns:
            Rendered template as string
        """
        if not JINJA2_AVAILABLE:
            raise RuntimeError("Jinja2 is not installed")

        template_string = request.get('templateString')
        context = request.get('context', {})

        if not template_string:
            raise ValueError("templateString is required for render operation")

        template = self.jinja_env.from_string(template_string)
        result = template.render(**context)

        # Ensure output ends with exactly one newline
        result = result.rstrip('\r\n') + '\n'

        return result

    def _update(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update existing project with new template version

        Args:
            request: Request with templatePath, outputPath, context, and options

        Returns:
            Dictionary with filesCreated, filesUpdated, answersFile
        """
        if not COPIER_AVAILABLE:
            raise RuntimeError("Copier is not installed")

        template_path = request.get('templatePath')
        output_path = request.get('outputPath')
        context = request.get('context', {})
        options = request.get('options', {})

        if not template_path or not output_path:
            raise ValueError("templatePath and outputPath are required for update operation")

        # Prepare Copier options
        copier_options = {
            'src_path': template_path,
            'dst_path': output_path,
            'data': context,
            'answers_file': options.get('answersFile', '.copier-answers.yml'),
            'overwrite': options.get('force', False),
            'skip_if_exists': []
        }

        # Execute Copier update
        result = run_update(**copier_options)

        # Track created/updated files (Copier doesn't provide this directly)
        # In practice, you'd need to implement file tracking or use Copier's
        # internal mechanisms. For now, return structure:
        return {
            'filesCreated': [],  # Would need file system comparison
            'filesUpdated': [],  # Would need file system comparison
            'answersFile': str(Path(output_path) / copier_options['answers_file'])
        }

    def _validate(self, request: Dict[str, Any]) -> Dict[str, bool]:
        """
        Validate template syntax

        Args:
            request: Request with templateString

        Returns:
            Dictionary with valid boolean and optional error message
        """
        if not JINJA2_AVAILABLE:
            raise RuntimeError("Jinja2 is not installed")

        template_string = request.get('templateString')

        if not template_string:
            raise ValueError("templateString is required for validate operation")

        try:
            # Try to parse the template
            self.jinja_env.parse(template_string)
            return {'valid': True}
        except TemplateSyntaxError as e:
            return {
                'valid': False,
                'error': f"Syntax error at line {e.lineno}: {e.message}"
            }
        except Exception as e:
            return {
                'valid': False,
                'error': str(e)
            }

    def _extract_vars(self, request: Dict[str, Any]) -> List[str]:
        """
        Extract variable names from template

        Args:
            request: Request with templateString

        Returns:
            List of variable names used in template
        """
        if not JINJA2_AVAILABLE:
            raise RuntimeError("Jinja2 is not installed")

        template_string = request.get('templateString')

        if not template_string:
            raise ValueError("templateString is required for extract_vars operation")

        try:
            # Parse template and extract undeclared variables
            ast = self.jinja_env.parse(template_string)
            variables = meta.find_undeclared_variables(ast)
            return sorted(list(variables))
        except Exception as e:
            raise RuntimeError(f"Failed to extract variables: {e}")

    def _check_version(self) -> Dict[str, Any]:
        """
        Check Python, Copier, and Jinja2 versions

        Returns:
            Dictionary with version information and availability status
        """
        return {
            'pythonVersion': f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
            'copierVersion': COPIER_VERSION,
            'jinja2Version': JINJA2_VERSION,
            'available': COPIER_AVAILABLE and JINJA2_AVAILABLE
        }


def load_request(request_file: str) -> Dict[str, Any]:
    """
    Load and validate request from JSON file

    Args:
        request_file: Path to request JSON file

    Returns:
        Parsed request dictionary

    Raises:
        FileNotFoundError: If request file doesn't exist
        json.JSONDecodeError: If request file is invalid JSON
    """
    request_path = Path(request_file)

    if not request_path.exists():
        raise FileNotFoundError(f"Request file not found: {request_file}")

    with open(request_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def write_response(response_file: str, response: Dict[str, Any]) -> None:
    """
    Write response to JSON file

    Args:
        response_file: Path to response JSON file
        response: Response dictionary to write

    Raises:
        IOError: If response file cannot be written
    """
    response_path = Path(response_file)
    response_path.parent.mkdir(parents=True, exist_ok=True)

    with open(response_path, 'w', encoding='utf-8') as f:
        json.dump(response, f, indent=2, ensure_ascii=False)


def main():
    """
    Main entry point for bridge runner

    Usage:
        python copier-runner.py <request_file.json> <response_file.json>

    Exit codes:
        0: Success
        1: Invalid arguments
        2: Request file error
        3: Execution error
        4: Response file error
    """
    if len(sys.argv) != 3:
        print("Usage: python copier-runner.py <request_file.json> <response_file.json>",
              file=sys.stderr)
        sys.exit(1)

    request_file = sys.argv[1]
    response_file = sys.argv[2]

    try:
        # Load request
        request = load_request(request_file)
    except FileNotFoundError as e:
        response = {
            'success': False,
            'error': str(e)
        }
        write_response(response_file, response)
        sys.exit(2)
    except json.JSONDecodeError as e:
        response = {
            'success': False,
            'error': f"Invalid JSON in request file: {e}"
        }
        write_response(response_file, response)
        sys.exit(2)

    try:
        # Execute request
        executor = BridgeExecutor()
        response = executor.execute(request)
    except Exception as e:
        response = {
            'success': False,
            'error': str(e),
            'stderr': traceback.format_exc()
        }

    try:
        # Write response
        write_response(response_file, response)
    except IOError as e:
        print(f"Failed to write response file: {e}", file=sys.stderr)
        sys.exit(4)

    # Exit with appropriate code
    sys.exit(0 if response.get('success', False) else 3)


if __name__ == '__main__':
    main()
