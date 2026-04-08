"""
embed.py — Generate embeddings and upsert chunks to Supabase pgvector.

Uses Voyage AI voyage-large-2 (1024-dim) for embeddings.
Batches API calls to stay within rate limits.
Uses chunk_hash for idempotent upserts (safe to re-run after partial failures).
"""

from __future__ import annotations

import os
import time
from typing import Any

import voyageai
from dotenv import load_dotenv
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TimeElapsedColumn
from supabase import create_client, Client

from chunk import Chunk

load_dotenv()
console = Console()

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

VOYAGE_MODEL = "voyage-large-2"
VOYAGE_BATCH_SIZE = 128       # Voyage AI max batch size
SUPABASE_BATCH_SIZE = 50      # Supabase REST upsert batch size
EMBEDDING_DIM = 1024          # voyage-large-2 output dimension
RATE_LIMIT_SLEEP = 0.5        # seconds between Voyage AI batches


# ---------------------------------------------------------------------------
# Clients
# ---------------------------------------------------------------------------

def get_voyage_client() -> voyageai.Client:
    api_key = os.environ.get("INGESTION_VOYAGE_API_KEY") or os.environ.get("VOYAGE_API_KEY")
    if not api_key:
        raise ValueError("INGESTION_VOYAGE_API_KEY or VOYAGE_API_KEY env var required")
    return voyageai.Client(api_key=api_key)


def get_supabase_client() -> Client:
    url = os.environ.get("INGESTION_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
    key = os.environ.get("INGESTION_SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise ValueError("INGESTION_SUPABASE_URL and INGESTION_SUPABASE_SERVICE_KEY env vars required")
    return create_client(url, key)


# ---------------------------------------------------------------------------
# Embedding
# ---------------------------------------------------------------------------

def embed_chunks(
    chunks: list[Chunk],
    voyage: voyageai.Client,
    show_progress: bool = True,
) -> list[list[float]]:
    """
    Generate embeddings for all chunks using Voyage AI.
    Returns a list of embedding vectors aligned with the input chunks.
    """
    texts = [c.content for c in chunks]
    all_embeddings: list[list[float]] = []

    batches = [texts[i : i + VOYAGE_BATCH_SIZE] for i in range(0, len(texts), VOYAGE_BATCH_SIZE)]

    if show_progress:
        with Progress(
            SpinnerColumn(),
            "[progress.description]{task.description}",
            "[progress.percentage]{task.percentage:>3.0f}%",
            TimeElapsedColumn(),
            console=console,
        ) as progress:
            task = progress.add_task(f"Embedding {len(texts)} chunks…", total=len(batches))
            for batch in batches:
                result = voyage.embed(batch, model=VOYAGE_MODEL, input_type="document")
                all_embeddings.extend(result.embeddings)
                progress.advance(task)
                if len(batches) > 1:
                    time.sleep(RATE_LIMIT_SLEEP)
    else:
        for batch in batches:
            result = voyage.embed(batch, model=VOYAGE_MODEL, input_type="document")
            all_embeddings.extend(result.embeddings)
            if len(batches) > 1:
                time.sleep(RATE_LIMIT_SLEEP)

    return all_embeddings


# ---------------------------------------------------------------------------
# Supabase upsert
# ---------------------------------------------------------------------------

def upsert_chunks(
    chunks: list[Chunk],
    embeddings: list[list[float]],
    supabase: Client,
    show_progress: bool = True,
) -> dict[str, int]:
    """
    Upsert chunks with embeddings to Supabase encyclopedia_chunks table.
    Uses chunk_hash for conflict detection — safe to re-run on partial failures.

    Returns a summary dict with inserted/updated counts.
    """
    assert len(chunks) == len(embeddings), "chunks and embeddings must have same length"

    rows: list[dict[str, Any]] = []
    for chunk, embedding in zip(chunks, embeddings):
        rows.append({
            "content": chunk.content,
            "embedding": embedding,
            "metadata": chunk.metadata if chunk.metadata else {},
            "section": chunk.section,
            "category": chunk.category,
            "page_start": chunk.page_start,
            "page_end": chunk.page_end,
            "year_start": chunk.year_start,
            "year_end": chunk.year_end,
            "chunk_hash": chunk.chunk_hash,
            "source_ref": chunk.source_ref,
        })

    batches = [rows[i : i + SUPABASE_BATCH_SIZE] for i in range(0, len(rows), SUPABASE_BATCH_SIZE)]
    inserted = 0
    updated = 0
    errors = 0

    if show_progress:
        with Progress(
            SpinnerColumn(),
            "[progress.description]{task.description}",
            "[progress.percentage]{task.percentage:>3.0f}%",
            TimeElapsedColumn(),
            console=console,
        ) as progress:
            task = progress.add_task(f"Upserting {len(rows)} rows to Supabase…", total=len(batches))
            for batch in batches:
                try:
                    res = supabase.table("encyclopedia_chunks").upsert(
                        batch,
                        on_conflict="chunk_hash",
                    ).execute()
                    inserted += len(res.data) if res.data else 0
                except Exception as e:
                    console.print(f"[red]Upsert error: {e}[/red]")
                    errors += len(batch)
                progress.advance(task)
    else:
        for batch in batches:
            try:
                res = supabase.table("encyclopedia_chunks").upsert(
                    batch,
                    on_conflict="chunk_hash",
                ).execute()
                inserted += len(res.data) if res.data else 0
            except Exception as e:
                console.print(f"[red]Upsert error: {e}[/red]")
                errors += len(batch)

    return {"upserted": inserted, "errors": errors}


# ---------------------------------------------------------------------------
# High-level ingest function
# ---------------------------------------------------------------------------

def ingest_chunks(chunks: list[Chunk], show_progress: bool = True) -> dict[str, int]:
    """
    Full pipeline: embed chunks → upsert to Supabase.
    Initializes clients from environment variables.
    """
    voyage = get_voyage_client()
    supabase = get_supabase_client()

    console.print(f"\n[bold cyan]Embedding {len(chunks)} chunks via Voyage AI ({VOYAGE_MODEL})…[/bold cyan]")
    embeddings = embed_chunks(chunks, voyage, show_progress=show_progress)

    console.print(f"\n[bold cyan]Upserting to Supabase pgvector…[/bold cyan]")
    stats = upsert_chunks(chunks, embeddings, supabase, show_progress=show_progress)

    return stats
