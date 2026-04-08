"""
chunk.py — Semantic chunking for the KHSBHOF encyclopedia.

Splits extracted page text into semantically meaningful chunks targeting
~500 tokens each, preserving year/section metadata so the AI can cite
precise sources.

Metadata categories correspond to encyclopedia sections:
  state_tournament, regional_tournament, miss_basketball, mister_basketball,
  hall_of_fame, records, all_a_classic, coach_records, pro_players,
  all_state, invitational, general
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field
from typing import Iterator

import tiktoken

from extract import ExtractedPage

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

TARGET_CHUNK_TOKENS = 500
MAX_CHUNK_TOKENS = 750
OVERLAP_TOKENS = 50  # overlap between consecutive chunks for context continuity

TOKENIZER = tiktoken.get_encoding("cl100k_base")

# Section detection patterns (order matters — more specific first)
SECTION_PATTERNS: list[tuple[str, str, str]] = [
    # (pattern, category, section_name)
    (r"(?i)(sweet\s*16|state\s+tournament|state\s+champion)", "state_tournament", "Sweet 16 State Tournament"),
    (r"(?i)(miss\s+basketball)", "miss_basketball", "Miss Basketball Award"),
    (r"(?i)(mister\s+basketball|mr\.?\s+basketball)", "mister_basketball", "Mister Basketball Award"),
    (r"(?i)(hall\s+of\s+fame\s+inductee|inductee\s+profile)", "hall_of_fame", "Hall of Fame Inductees"),
    (r"(?i)(all\s*[–\-]\s*a\s+classic)", "all_a_classic", "All A Classic"),
    (r"(?i)(louisville\s+invitational|king\s+of\s+the\s+bluegrass)", "invitational", "Invitational Tournaments"),
    (r"(?i)(regional\s+tournament|district\s+tournament|region\s+\d+)", "regional_tournament", "Regional Tournaments"),
    (r"(?i)(coach\s+of\s+the\s+year|coaching\s+record)", "coach_records", "Coach Records"),
    (r"(?i)(professional\s+career|nba|wnba|went\s+pro)", "pro_players", "Professional Players"),
    (r"(?i)(all[–\-]state|all\s+state|litkenhous)", "all_state", "All-State Teams"),
    (r"(?i)(scoring\s+record|career\s+record|individual\s+record|team\s+record)", "records", "Records & Statistics"),
    (r"(?i)(black\s+athletic\s+league)", "records", "Black Athletic League"),
]

# Year extraction pattern
YEAR_PATTERN = re.compile(r"\b(19[0-9]{2}|20[0-2][0-9])\b")


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class Chunk:
    content: str
    metadata: dict = field(default_factory=dict)

    # Derived fields (populated during chunking)
    section: str | None = None
    category: str | None = None
    page_start: int | None = None
    page_end: int | None = None
    year_start: int | None = None
    year_end: int | None = None
    source_ref: str | None = None

    @property
    def chunk_hash(self) -> str:
        return hashlib.md5(self.content.encode("utf-8")).hexdigest()

    @property
    def token_count(self) -> int:
        return len(TOKENIZER.encode(self.content))

    def to_dict(self) -> dict:
        return {
            "content": self.content,
            "metadata": {
                **self.metadata,
                "section": self.section,
                "category": self.category,
                "page_start": self.page_start,
                "page_end": self.page_end,
                "year_start": self.year_start,
                "year_end": self.year_end,
                "source_ref": self.source_ref,
                "token_count": self.token_count,
                "chunk_hash": self.chunk_hash,
            },
            "section": self.section,
            "category": self.category,
            "page_start": self.page_start,
            "page_end": self.page_end,
            "year_start": self.year_start,
            "year_end": self.year_end,
            "chunk_hash": self.chunk_hash,
            "source_ref": self.source_ref,
        }


# ---------------------------------------------------------------------------
# Metadata detection
# ---------------------------------------------------------------------------

def detect_section(text: str) -> tuple[str | None, str | None]:
    """Detect the encyclopedia section and category from text content."""
    for pattern, category, section in SECTION_PATTERNS:
        if re.search(pattern, text):
            return section, category
    return None, "general"


def extract_years(text: str) -> tuple[int | None, int | None]:
    """Extract earliest and latest year mentioned in text."""
    years = [int(y) for y in YEAR_PATTERN.findall(text)]
    if not years:
        return None, None
    return min(years), max(years)


def build_source_ref(section: str | None, page_start: int | None, page_end: int | None) -> str:
    parts = []
    if section:
        parts.append(section)
    if page_start:
        if page_end and page_end != page_start:
            parts.append(f"p.{page_start}–{page_end}")
        else:
            parts.append(f"p.{page_start}")
    return ", ".join(parts) if parts else "Encyclopedia"


# ---------------------------------------------------------------------------
# Text splitting
# ---------------------------------------------------------------------------

def split_into_paragraphs(text: str) -> list[str]:
    """Split text into paragraphs on blank lines or known structural separators."""
    paras = re.split(r"\n{2,}|\[COLUMN BREAK\]", text)
    return [p.strip() for p in paras if p.strip()]


def token_count(text: str) -> int:
    return len(TOKENIZER.encode(text))


def chunk_paragraphs(
    paragraphs: list[str],
    target_tokens: int = TARGET_CHUNK_TOKENS,
    max_tokens: int = MAX_CHUNK_TOKENS,
) -> Iterator[str]:
    """
    Group paragraphs into chunks targeting ~target_tokens each.
    A paragraph that exceeds max_tokens is split by sentence.
    """
    current: list[str] = []
    current_tokens = 0

    for para in paragraphs:
        para_tokens = token_count(para)

        # Oversized paragraph: split by sentence
        if para_tokens > max_tokens:
            # Yield any pending content first
            if current:
                yield "\n\n".join(current)
                current = []
                current_tokens = 0

            sentences = re.split(r"(?<=[.!?])\s+", para)
            sent_buf: list[str] = []
            sent_tokens = 0
            for sent in sentences:
                st = token_count(sent)
                if sent_tokens + st > max_tokens and sent_buf:
                    yield " ".join(sent_buf)
                    sent_buf = []
                    sent_tokens = 0
                sent_buf.append(sent)
                sent_tokens += st
            if sent_buf:
                yield " ".join(sent_buf)
            continue

        # Regular paragraph: add to current chunk or flush
        if current_tokens + para_tokens > max_tokens and current:
            yield "\n\n".join(current)
            current = []
            current_tokens = 0

        current.append(para)
        current_tokens += para_tokens

        # Flush if we've hit the target
        if current_tokens >= target_tokens:
            yield "\n\n".join(current)
            current = []
            current_tokens = 0

    if current:
        yield "\n\n".join(current)


# ---------------------------------------------------------------------------
# Page-level chunking
# ---------------------------------------------------------------------------

def chunk_page(page: ExtractedPage, section_hint: str | None = None) -> list[Chunk]:
    """Chunk a single extracted page into Chunk objects with metadata."""
    chunks: list[Chunk] = []

    for col in page.columns:
        if not col.text.strip():
            continue

        paragraphs = split_into_paragraphs(col.text)
        for raw_chunk in chunk_paragraphs(paragraphs):
            if not raw_chunk.strip():
                continue

            section, category = detect_section(raw_chunk)
            if not section and section_hint:
                section = section_hint
            year_start, year_end = extract_years(raw_chunk)

            chunk = Chunk(
                content=raw_chunk,
                section=section,
                category=category,
                page_start=page.page_num,
                page_end=page.page_num,
                year_start=year_start,
                year_end=year_end,
                source_ref=build_source_ref(section, page.page_num, page.page_num),
            )
            chunks.append(chunk)

    return chunks


def chunk_pages(pages: list[ExtractedPage]) -> list[Chunk]:
    """
    Chunk all extracted pages.

    Carries forward section context: if a page is detected as being in a
    section, that section is applied to subsequent pages until a new section
    is detected.
    """
    all_chunks: list[Chunk] = []
    current_section: str | None = None

    for page in pages:
        page_chunks = chunk_page(page, section_hint=current_section)

        # Update section context from the first chunk that has a detected section
        for chunk in page_chunks:
            if chunk.section and chunk.category != "general":
                current_section = chunk.section
                break

        all_chunks.extend(page_chunks)

    return all_chunks
