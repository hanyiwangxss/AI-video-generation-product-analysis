from __future__ import annotations

import re
from typing import Iterable

CJK_RE = re.compile(r"[\u4e00-\u9fff]")
WORD_RE = re.compile(r"[A-Za-z0-9]+")


def tokenize(text: str | None) -> list[str]:
    if not text:
        return []

    tokens: list[str] = []
    if CJK_RE.search(text):
        buf: list[str] = []
        for ch in text:
            if CJK_RE.match(ch):
                if buf:
                    tokens.extend(WORD_RE.findall("".join(buf).lower()))
                    buf = []
                tokens.append(ch)
            else:
                buf.append(ch)
        if buf:
            tokens.extend(WORD_RE.findall("".join(buf).lower()))
    else:
        tokens = WORD_RE.findall(text.lower())

    return tokens


def join_list(values: Iterable[str] | None, fallback: str = "") -> str:
    if not values:
        return fallback
    return "; ".join([v for v in values if v])
