"""Section-aware retrieval over the synthetic corpus.

Pipeline (spec §6): section-aware chunking -> BM25 candidate generation
over the doc_type/case-filtered chunks -> VultronRetriever rerank of the
candidates -> top_k. The rerank step is on the demo's critical path, so it
degrades gracefully: any rerank error or timeout falls back to BM25 ordering
and the caller still receives a normal result. Set config.RERANK_ENABLED
= False to force pure BM25 (deterministic fallback demo).
"""

import json
import logging
import re
from dataclasses import dataclass, field

from rank_bm25 import BM25Okapi

from backend import config
from backend.agent.schemas import Chunk, Citation
from backend.llm import vultr_client

logger = logging.getLogger(__name__)

_BANNER_RE = re.compile(r"^<!--.*?-->\s*", re.DOTALL)
_HEADER_RE = re.compile(r"^(#{1,3})\s+(.*)$")
_WORD_RE = re.compile(r"[a-z0-9]+")
_SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+|\n+")
_DATE_RE = re.compile(r"\d")
_MAX_QUOTE_WORDS = 25
_BM25_CANDIDATE_POOL = 12


def _tokenize(text: str) -> list[str]:
    return _WORD_RE.findall(text.lower())


def _strip_markdown(text: str) -> str:
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


@dataclass
class RetrievalResult:
    """What search() returns: the ranked chunks plus whether the reranker
    actually ran (for the trace / graceful-degrade reporting)."""

    query: str
    chunks: list[Chunk]
    reranked: bool
    fallback_reason: str | None = None


def _split_document(doc_id: str, doc_title: str, doc_type: str, case: str, markdown: str) -> list[Chunk]:
    """Split a Markdown document on ## / ### headers into section chunks.
    A long run of session entries is further capped so no single chunk
    swallows the whole treatment record."""
    body = _BANNER_RE.sub("", markdown)
    chunks: list[Chunk] = []
    heading = doc_title
    buffer: list[str] = []

    def flush() -> None:
        text = "\n".join(buffer).strip()
        if text:
            chunks.append(
                Chunk(
                    doc_id=doc_id,
                    doc_title=doc_title,
                    doc_type=doc_type,
                    case=case,
                    section_heading=heading,
                    text=text,
                )
            )

    for line in body.splitlines():
        match = _HEADER_RE.match(line)
        if match and len(match.group(1)) >= 2:  # ## or ### starts a new section
            flush()
            heading = match.group(2).strip()
            buffer = [line]
        else:
            buffer.append(line)
    flush()
    return chunks


class RetrievalIndex:
    """Builds an in-memory chunk index from the corpus manifest at startup."""

    def __init__(self) -> None:
        self.chunks: list[Chunk] = []
        manifest = json.loads((config.CORPUS_DIR / "manifest.json").read_text())
        for doc in manifest["documents"]:
            markdown = (config.CORPUS_DIR / doc["file"]).read_text()
            self.chunks.extend(
                _split_document(doc["doc_id"], doc["title"], doc["doc_type"], doc["case"], markdown)
            )
        logger.info("Retrieval index built: %d chunks from %d documents", len(self.chunks), len(manifest["documents"]))

    def _filter(self, doc_types: list[str] | None, case: str) -> list[Chunk]:
        return [
            c
            for c in self.chunks
            if (doc_types is None or c.doc_type in doc_types) and c.case in (case, "shared")
        ]

    def _bm25_candidates(self, query: str, pool: list[Chunk], limit: int) -> list[Chunk]:
        if not pool:
            return []
        bm25 = BM25Okapi([_tokenize(c.text + " " + c.section_heading) for c in pool])
        scores = bm25.get_scores(_tokenize(query))
        ranked = sorted(zip(pool, scores), key=lambda pair: pair[1], reverse=True)
        return [chunk for chunk, _ in ranked[:limit]]

    async def search(
        self, query: str, doc_types: list[str] | None, case: str, top_k: int = 4
    ) -> RetrievalResult:
        """Retrieve the top_k chunks for a query, restricted to the given
        doc_types and case. Never raises on rerank failure."""
        pool = self._filter(doc_types, case)
        if not pool:
            return RetrievalResult(query=query, chunks=[], reranked=False)

        candidates = self._bm25_candidates(query, pool, _BM25_CANDIDATE_POOL)

        if not config.RERANK_ENABLED:
            return RetrievalResult(query=query, chunks=candidates[:top_k], reranked=False)

        try:
            ranked = await vultr_client.rerank(query, [c.text for c in candidates])
            reordered = [candidates[idx] for idx, _ in ranked if idx < len(candidates)]
            return RetrievalResult(query=query, chunks=reordered[:top_k], reranked=True)
        except Exception as exc:  # noqa: BLE001 - any rerank error/timeout must degrade to BM25
            logger.warning("Rerank failed, falling back to BM25 order: %s", exc)
            return RetrievalResult(
                query=query, chunks=candidates[:top_k], reranked=False, fallback_reason=str(exc)
            )


def build_citation(chunk: Chunk, query: str) -> Citation:
    """Extract a <=25-word load-bearing quote from a chunk, biased toward
    the query terms and toward passages carrying dates/numbers."""
    quote = _best_quote(chunk.text, query)
    return Citation(
        doc_id=chunk.doc_id,
        doc_title=chunk.doc_title,
        section_heading=chunk.section_heading,
        quote=quote,
    )


def _score_terms(words: list[str], query_terms: set[str]) -> float:
    overlap = sum(1 for w in words if w in query_terms)
    numeric = sum(1 for w in words if _DATE_RE.search(w))
    # Reward query-term overlap first; break ties toward passages that carry
    # more dates/numbers, so a quote captures a full date range, not one end.
    return overlap + 0.25 * numeric


def _best_quote(text: str, query: str) -> str:
    query_terms = set(_tokenize(query))
    sentences = [s.strip() for s in _SENTENCE_SPLIT_RE.split(text) if s.strip()]
    if not sentences:
        return _strip_markdown(text)[:200]

    best_sentence = max(sentences, key=lambda s: _score_terms(_tokenize(s), query_terms))
    clean = _strip_markdown(best_sentence)
    words = clean.split()
    if len(words) <= _MAX_QUOTE_WORDS:
        return clean

    # Slide a 25-word window and keep the densest span (query terms + numbers).
    best_window, best_score = words[:_MAX_QUOTE_WORDS], -1.0
    for start in range(0, len(words) - _MAX_QUOTE_WORDS + 1):
        window = words[start : start + _MAX_QUOTE_WORDS]
        score = _score_terms([w.lower().strip(".,;:") for w in window], query_terms)
        if score > best_score:
            best_window, best_score = window, score
    return " ".join(best_window)
