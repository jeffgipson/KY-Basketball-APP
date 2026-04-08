"""
ingest.py — CLI entry point for the KHSBHOF encyclopedia ingestion pipeline.

Steps:
  1. Extract text from PDF (layout-aware, column-preserving)
  2. Chunk text into semantically meaningful segments with metadata
  3. Embed chunks via Voyage AI
  4. Upsert to Supabase pgvector

Usage:
    python ingest.py --pdf path/to/encyclopedia.pdf
    python ingest.py --pdf encyclopedia.pdf --pages 1-200
    python ingest.py --pdf encyclopedia.pdf --validate
    python ingest.py --pdf encyclopedia.pdf --dry-run

Requires: .env file or environment variables (see .env.example)
"""

from __future__ import annotations

import sys
from pathlib import Path

import click
from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from chunk import chunk_pages
from embed import ingest_chunks
from extract import extract_pages, validate_column_order

load_dotenv()
console = Console()

# ---------------------------------------------------------------------------
# Validation spot-check data
# When you have the actual PDF, update these expected_patterns with known
# text that appears in the correct column order on specific pages.
# ---------------------------------------------------------------------------
VALIDATION_SPOT_CHECKS: dict[int, list[str]] = {
    # Example: on page 50, "1966" should appear before "1967" in the text
    # These will be filled in once the actual PDF is available.
    # Format: {page_num: [expected_string_1, expected_string_2, ...]}
}

SAMPLE_SPOT_CHECK_PAGES = [1, 10, 25, 50, 100, 150, 200]


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

@click.command()
@click.option("--pdf", required=True, type=click.Path(exists=True), help="Path to the encyclopedia PDF")
@click.option("--pages", default=None, help="Page range to ingest, e.g. '1-200' (default: all pages)")
@click.option("--cols", default=None, type=int, help="Force number of columns per page (default: auto-detect)")
@click.option("--validate", is_flag=True, help="Validate column extraction order on spot-check pages, then exit")
@click.option("--dry-run", is_flag=True, help="Extract and chunk but do NOT embed or upload to Supabase")
@click.option("--verbose", is_flag=True, help="Print each chunk to stdout")
def main(
    pdf: str,
    pages: str | None,
    cols: int | None,
    validate: bool,
    dry_run: bool,
    verbose: bool,
) -> None:
    pdf_path = Path(pdf)

    console.print(Panel.fit(
        "[bold gold1]KHSBHOF Encyclopedia Ingestion Pipeline[/bold gold1]\n"
        "[dim]Kentucky High School Basketball Hall of Fame[/dim]",
        border_style="gold1",
    ))
    console.print(f"  PDF:      [cyan]{pdf_path.name}[/cyan]")
    console.print(f"  Size:     [cyan]{pdf_path.stat().st_size / 1_000_000:.1f} MB[/cyan]")
    if pages:
        console.print(f"  Pages:    [cyan]{pages}[/cyan]")
    if cols:
        console.print(f"  Columns:  [cyan]{cols}[/cyan]")
    console.print(f"  Mode:     [cyan]{'VALIDATE' if validate else 'DRY RUN' if dry_run else 'FULL INGEST'}[/cyan]")
    console.print()

    # Parse page range
    page_range: tuple[int, int] | None = None
    if pages:
        try:
            parts = pages.split("-")
            page_range = (int(parts[0]), int(parts[1]))
        except (ValueError, IndexError):
            console.print(f"[red]Invalid --pages format. Use e.g. '1-200'[/red]")
            sys.exit(1)

    # ---------------------------------------------------------------------------
    # VALIDATE mode
    # ---------------------------------------------------------------------------
    if validate:
        console.print("[bold]Running column order validation…[/bold]")
        check_pages = list(VALIDATION_SPOT_CHECKS.keys()) or SAMPLE_SPOT_CHECK_PAGES

        if not VALIDATION_SPOT_CHECKS:
            console.print("[yellow]Warning: No expected_patterns defined in VALIDATION_SPOT_CHECKS.[/yellow]")
            console.print("[yellow]Will extract spot-check pages and print them for manual inspection.[/yellow]\n")

            pages_data = extract_pages(pdf_path, page_range=page_range, n_cols=cols, show_progress=True)
            sample = pages_data[:min(5, len(pages_data))]
            for p in sample:
                console.rule(f"Page {p.page_num} ({len(p.columns)} columns)")
                for col in p.columns:
                    console.print(f"[dim]Column {col.col_idx + 1} | x:[{col.x0:.0f}–{col.x1:.0f}][/dim]")
                    console.print(col.text[:500] + ("…" if len(col.text) > 500 else ""))
                    console.print()
            return

        results = validate_column_order(pdf_path, check_pages, VALIDATION_SPOT_CHECKS)
        passed = sum(1 for v in results.values() if v)
        total = len(results)
        console.print()
        if passed == total:
            console.print(f"[green bold]✓ All {total} spot-checks passed! Column order is correct.[/green bold]")
        else:
            console.print(f"[red bold]✗ {total - passed}/{total} spot-checks failed. Review extract.py column detection.[/red bold]")
            sys.exit(1)
        return

    # ---------------------------------------------------------------------------
    # EXTRACT
    # ---------------------------------------------------------------------------
    console.print("[bold]Step 1/3: Extracting text from PDF…[/bold]")
    pages_data = extract_pages(pdf_path, page_range=page_range, n_cols=cols, show_progress=True)
    console.print(f"  [green]✓ Extracted {len(pages_data)} pages[/green]")

    # ---------------------------------------------------------------------------
    # CHUNK
    # ---------------------------------------------------------------------------
    console.print("\n[bold]Step 2/3: Chunking text…[/bold]")
    chunks = chunk_pages(pages_data)
    console.print(f"  [green]✓ Created {len(chunks)} chunks[/green]")

    # Category breakdown
    categories: dict[str, int] = {}
    for chunk in chunks:
        cat = chunk.category or "unknown"
        categories[cat] = categories.get(cat, 0) + 1

    table = Table(title="Chunks by Category", border_style="dim")
    table.add_column("Category", style="cyan")
    table.add_column("Count", justify="right")
    table.add_column("Avg Tokens", justify="right")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        cat_chunks = [c for c in chunks if c.category == cat]
        avg_tokens = sum(c.token_count for c in cat_chunks) // max(len(cat_chunks), 1)
        table.add_row(cat, str(count), str(avg_tokens))
    console.print(table)

    if verbose:
        for i, chunk in enumerate(chunks[:5]):
            console.rule(f"Chunk {i + 1} | {chunk.category} | p.{chunk.page_start}")
            console.print(chunk.content[:300])
            console.print()

    if dry_run:
        console.print("\n[yellow]DRY RUN: skipping embed + upload.[/yellow]")
        console.print(f"[green]✓ Pipeline validated: {len(chunks)} chunks ready for ingestion.[/green]")
        return

    # ---------------------------------------------------------------------------
    # EMBED + UPSERT
    # ---------------------------------------------------------------------------
    console.print("\n[bold]Step 3/3: Embedding and uploading to Supabase…[/bold]")
    stats = ingest_chunks(chunks, show_progress=True)

    console.print()
    console.print(Panel.fit(
        f"[green bold]✓ Ingestion complete![/green bold]\n"
        f"  Upserted: {stats['upserted']} rows\n"
        f"  Errors:   {stats['errors']} rows",
        border_style="green",
    ))


if __name__ == "__main__":
    main()
