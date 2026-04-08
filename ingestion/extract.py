"""
extract.py — Layout-aware PDF text extractor for the KHSBHOF encyclopedia.

The encyclopedia uses a dense 3–4 column print layout. Standard text extraction
reads columns in the wrong order, scrambling bracket data across years.

This module uses pdfplumber with column-boundary detection to read each column
left-to-right, preserving the order of bracket results within each year.

Usage:
    from extract import extract_pages
    pages = extract_pages("encyclopedia.pdf")
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterator

import pdfplumber
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TimeElapsedColumn

console = Console()


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class PageColumn:
    """A single column extracted from one PDF page."""
    page_num: int       # 1-indexed
    col_idx: int        # 0-indexed column within the page
    x0: float           # left boundary
    x1: float           # right boundary
    text: str           # extracted text (whitespace-normalized)


@dataclass
class ExtractedPage:
    """All columns extracted from one PDF page, in left-to-right order."""
    page_num: int
    columns: list[PageColumn] = field(default_factory=list)

    @property
    def full_text(self) -> str:
        """All column text joined with a column separator."""
        return "\n\n[COLUMN BREAK]\n\n".join(c.text for c in self.columns if c.text.strip())

    @property
    def plain_text(self) -> str:
        """All column text joined simply with newlines (no markers)."""
        return "\n\n".join(c.text for c in self.columns if c.text.strip())


# ---------------------------------------------------------------------------
# Column detection
# ---------------------------------------------------------------------------

def detect_column_boundaries(page: pdfplumber.page.Page, n_cols: int | None = None) -> list[tuple[float, float]]:
    """
    Detect column x-boundaries on a page by finding vertical gaps in text
    character distribution.

    Returns a list of (x0, x1) tuples for each column, sorted left-to-right.
    """
    chars = page.chars
    if not chars:
        return [(page.bbox[0], page.bbox[2])]

    page_x0 = page.bbox[0]
    page_x1 = page.bbox[2]
    page_width = page_x1 - page_x0

    # Build x-density histogram (1-point resolution)
    resolution = 2.0  # points per bucket
    buckets = int(page_width / resolution) + 1
    density = [0] * buckets

    for char in chars:
        cx = char["x0"]
        bucket = int((cx - page_x0) / resolution)
        if 0 <= bucket < buckets:
            density[bucket] += 1

    # Smooth with a small window
    window = 3
    smoothed = []
    for i in range(buckets):
        lo = max(0, i - window)
        hi = min(buckets, i + window + 1)
        smoothed.append(sum(density[lo:hi]) / (hi - lo))

    # Find gaps (runs of zero or near-zero density)
    threshold = max(smoothed) * 0.05
    in_gap = False
    gap_start: float | None = None
    gaps: list[tuple[float, float]] = []

    for i, val in enumerate(smoothed):
        x = page_x0 + i * resolution
        if val <= threshold:
            if not in_gap:
                in_gap = True
                gap_start = x
        else:
            if in_gap and gap_start is not None:
                gap_end = x
                if gap_end - gap_start >= 8:  # min gap width of 8 points
                    gaps.append((gap_start, gap_end))
            in_gap = False

    if not gaps:
        return [(page_x0, page_x1)]

    # Build column boundaries from gaps
    cols: list[tuple[float, float]] = []
    prev_x1 = page_x0
    for gap_x0, gap_x1 in gaps:
        col_mid = (gap_x0 + gap_x1) / 2
        cols.append((prev_x1, col_mid))
        prev_x1 = col_mid
    cols.append((prev_x1, page_x1))

    # If n_cols is specified, merge/split to match
    if n_cols and len(cols) != n_cols:
        # Fall back to equal-width columns
        col_width = page_width / n_cols
        cols = [
            (page_x0 + i * col_width, page_x0 + (i + 1) * col_width)
            for i in range(n_cols)
        ]

    return cols


# ---------------------------------------------------------------------------
# Text extraction
# ---------------------------------------------------------------------------

def clean_text(text: str) -> str:
    """Normalize whitespace and fix common PDF extraction artifacts."""
    # Collapse runs of whitespace but preserve paragraph breaks
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Fix ligature artifacts
    text = text.replace("ﬁ", "fi").replace("ﬂ", "fl").replace("ﬃ", "ffi")
    return text.strip()


def extract_column_text(page: pdfplumber.page.Page, x0: float, x1: float) -> str:
    """Extract text from a vertical column slice of a page."""
    # Crop the page to the column bounds, with a small margin
    margin = 1.0
    cropped = page.crop((x0 + margin, page.bbox[1], x1 - margin, page.bbox[3]))
    text = cropped.extract_text(x_tolerance=3, y_tolerance=3) or ""
    return clean_text(text)


def extract_page(page: pdfplumber.page.Page, page_num: int, n_cols: int | None = None) -> ExtractedPage:
    """Extract all columns from a single PDF page."""
    boundaries = detect_column_boundaries(page, n_cols)
    result = ExtractedPage(page_num=page_num)

    for col_idx, (x0, x1) in enumerate(boundaries):
        text = extract_column_text(page, x0, x1)
        result.columns.append(PageColumn(
            page_num=page_num,
            col_idx=col_idx,
            x0=x0,
            x1=x1,
            text=text,
        ))

    return result


# ---------------------------------------------------------------------------
# Batch extraction
# ---------------------------------------------------------------------------

def extract_pages(
    pdf_path: str | Path,
    page_range: tuple[int, int] | None = None,
    n_cols: int | None = None,
    show_progress: bool = True,
) -> list[ExtractedPage]:
    """
    Extract all pages from a PDF, preserving column order.

    Args:
        pdf_path:    Path to the PDF file.
        page_range:  Optional (start, end) tuple (1-indexed, inclusive).
        n_cols:      Force a fixed number of columns per page (None = auto-detect).
        show_progress: Show a rich progress bar.

    Returns:
        List of ExtractedPage objects in page order.
    """
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    results: list[ExtractedPage] = []

    with pdfplumber.open(str(pdf_path)) as pdf:
        pages = pdf.pages

        if page_range:
            start, end = page_range
            pages = pdf.pages[start - 1 : end]
            offset = start - 1
        else:
            offset = 0

        if show_progress:
            with Progress(
                SpinnerColumn(),
                "[progress.description]{task.description}",
                "[progress.percentage]{task.percentage:>3.0f}%",
                TimeElapsedColumn(),
                console=console,
            ) as progress:
                task = progress.add_task("Extracting pages…", total=len(pages))
                for i, page in enumerate(pages):
                    results.append(extract_page(page, i + 1 + offset, n_cols))
                    progress.advance(task)
        else:
            for i, page in enumerate(pages):
                results.append(extract_page(page, i + 1 + offset, n_cols))

    return results


# ---------------------------------------------------------------------------
# Streaming extraction (memory-efficient for large PDFs)
# ---------------------------------------------------------------------------

def stream_pages(
    pdf_path: str | Path,
    page_range: tuple[int, int] | None = None,
    n_cols: int | None = None,
) -> Iterator[ExtractedPage]:
    """Yield ExtractedPage objects one at a time (memory-efficient)."""
    pdf_path = Path(pdf_path)
    with pdfplumber.open(str(pdf_path)) as pdf:
        pages = pdf.pages
        if page_range:
            start, end = page_range
            pages = pdf.pages[start - 1 : end]
            offset = start - 1
        else:
            offset = 0

        for i, page in enumerate(pages):
            yield extract_page(page, i + 1 + offset, n_cols)


# ---------------------------------------------------------------------------
# Validation: spot-check column order
# ---------------------------------------------------------------------------

def validate_column_order(
    pdf_path: str | Path,
    spot_check_pages: list[int],
    expected_patterns: dict[int, list[str]],
) -> dict[int, bool]:
    """
    Validate that columns are extracted in the correct order.

    Args:
        pdf_path:         Path to PDF.
        spot_check_pages: List of page numbers (1-indexed) to validate.
        expected_patterns: Map of page_num → list of strings that must appear
                           in that order in the extracted text.

    Returns:
        Dict of page_num → bool (True = column order is correct).
    """
    results: dict[int, bool] = {}

    with pdfplumber.open(str(pdf_path)) as pdf:
        for page_num in spot_check_pages:
            page = pdf.pages[page_num - 1]
            extracted = extract_page(page, page_num)
            text = extracted.plain_text

            patterns = expected_patterns.get(page_num, [])
            if not patterns:
                results[page_num] = True
                continue

            # Check that each pattern appears after the previous one
            pos = 0
            ok = True
            for pattern in patterns:
                idx = text.find(pattern, pos)
                if idx == -1:
                    ok = False
                    console.print(f"  [red]Page {page_num}: '{pattern}' not found after pos {pos}[/red]")
                    break
                pos = idx + len(pattern)

            results[page_num] = ok
            status = "[green]✓[/green]" if ok else "[red]✗[/red]"
            console.print(f"  Page {page_num}: {status}")

    return results
