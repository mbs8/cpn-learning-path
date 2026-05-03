# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies (venv already exists at .venv)
uv pip install -e .

# Start the MCP server
uv run main.py

# Run all tests
uv run pytest

# Run a single test
uv run pytest tests/test_document.py::TestBinaryDocumentToMarkdown::test_binary_document_to_markdown_with_docx
```

## Architecture

The project is an MCP server built with [FastMCP](https://github.com/jlowin/fastmcp). The entry point `main.py` instantiates the server, imports tool functions from `tools/`, registers them, and starts the server.

```
main.py          ← creates FastMCP instance, registers tools, calls mcp.run()
tools/
  math.py        ← tool functions (add, etc.)
  document.py    ← utility/helper functions (not yet exposed as MCP tools)
tests/
  fixtures/      ← binary test files (docx, pdf)
  test_document.py
```

Tools and helpers are separated: `tools/` holds pure Python functions. **Not every function in `tools/` is an MCP tool** — registration happens explicitly in `main.py`.

## Defining MCP Tools

### Registration

Import the function and register it in `main.py`:

```python
from tools.math import add

mcp.tool()(add)
```

### Function signature

Tools are plain Python functions. Use `pydantic.Field` for parameter descriptions — FastMCP reads them to build the tool schema exposed to the AI client:

```python
from pydantic import Field

def my_tool(
    param1: str = Field(description="What this parameter represents"),
    param2: int = Field(description="What this parameter does"),
) -> ReturnType:
    """One-line summary.

    Detailed explanation of what the tool does, its limitations, and its
    relationship to other tools.

    When to use:
    - Scenario A
    - Scenario B

    When NOT to use:
    - Scenario C

    Examples:
    >>> my_tool("hello", 3)
    "hello hello hello"
    """
    # implementation
```

### Docstring conventions

The docstring becomes the tool's description in the MCP schema. Structure it as:
1. One-line summary (the most important part — shown in tool listings)
2. Detailed explanation
3. `When to use:` / `When NOT to use:` bullets — helps the AI decide between similar tools
4. `Examples:` with `>>>` style showing input → output

### Return types

Return native Python types. FastMCP serializes them automatically. For document/binary content, return `str` (e.g., markdown text).
