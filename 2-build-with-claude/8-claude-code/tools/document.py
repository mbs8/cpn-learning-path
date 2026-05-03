from markitdown import MarkItDown, StreamInfo
from io import BytesIO
from pathlib import Path
from pydantic import Field

SUPPORTED_EXTENSIONS = {"docx", "pdf"}


def binary_document_to_markdown(binary_data: bytes, file_type: str) -> str:
    """Converts binary document data to markdown-formatted text."""
    md = MarkItDown()
    file_obj = BytesIO(binary_data)
    stream_info = StreamInfo(extension=file_type)
    result = md.convert(file_obj, stream_info=stream_info)
    return result.text_content


def document_path_to_markdown(
    file_path: str = Field(description="Absolute or relative path to the document file (.docx or .pdf) to convert"),
) -> str:
    """Convert a document file at a given path to markdown text.

    Reads the file from disk, detects its type from the extension, and delegates
    to binary_document_to_markdown to perform the conversion.

    When to use:
    - When you have a file path to a document on disk
    - When the file is a .docx or .pdf

    When NOT to use:
    - When you already have the binary content in memory (use binary_document_to_markdown directly)
    - When the file format is not .docx or .pdf

    Examples:
    >>> document_path_to_markdown("/tmp/report.pdf")
    "# Report Title\\n\\nContent..."
    >>> document_path_to_markdown("docs/spec.docx")
    "# Spec\\n\\nContent..."
    """
    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"No file found at path: {file_path}")

    extension = path.suffix.lstrip(".").lower()

    if not extension or extension not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file extension: '{extension}'. Supported formats: {sorted(SUPPORTED_EXTENSIONS)}"
        )

    binary_data = path.read_bytes()
    return binary_document_to_markdown(binary_data, extension)
