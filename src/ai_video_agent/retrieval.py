from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

from .utils import tokenize


@dataclass
class SearchResult:
    score: float
    product: dict[str, Any]


class TfidfIndex:
    def __init__(self, documents: list[str], metas: list[dict[str, Any]]):
        if len(documents) != len(metas):
            raise ValueError("documents and metas must have the same length")
        self._documents = documents
        self._metas = metas
        self._doc_tokens = [tokenize(doc) for doc in documents]
        self._idf = self._build_idf(self._doc_tokens)

    @staticmethod
    def _build_idf(doc_tokens: list[list[str]]) -> dict[str, float]:
        df: dict[str, int] = {}
        for tokens in doc_tokens:
            for token in set(tokens):
                df[token] = df.get(token, 0) + 1
        n_docs = max(len(doc_tokens), 1)
        return {token: math.log((n_docs + 1) / (count + 1)) + 1 for token, count in df.items()}

    def search(self, query: str, top_k: int = 5) -> list[SearchResult]:
        tokens = tokenize(query)
        if not tokens:
            return []

        scores: list[tuple[int, float]] = []
        for idx, doc_tokens in enumerate(self._doc_tokens):
            if not doc_tokens:
                continue
            tf: dict[str, int] = {}
            for token in doc_tokens:
                tf[token] = tf.get(token, 0) + 1
            doc_len = len(doc_tokens)
            score = 0.0
            for token in tokens:
                if token in tf:
                    score += (tf[token] / doc_len) * self._idf.get(token, 0.0)
            if score > 0:
                scores.append((idx, score))

        scores.sort(key=lambda item: item[1], reverse=True)
        results: list[SearchResult] = []
        for idx, score in scores[:top_k]:
            results.append(SearchResult(score=score, product=self._metas[idx]))
        return results
