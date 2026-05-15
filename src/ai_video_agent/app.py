from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

from .ingest import build_documents, load_products
from .retrieval import TfidfIndex
from .utils import join_list


def _pick_lang(field: dict[str, Any] | None, lang: str) -> str:
    if not field:
        return ""
    if lang in field and field[lang]:
        return field[lang]
    fallback = field.get("en") or field.get("zh")
    return fallback or ""


def _render_product(product: dict[str, Any], lang: str) -> str:
    name = _pick_lang(product.get("name", {}), lang) or product.get("id", "")
    vendor = product.get("vendor", "")
    status = product.get("status", "")
    category = join_list(product.get("category", []))

    capabilities = _pick_lang(product.get("capabilities", {}), lang)
    if not capabilities:
        capabilities = join_list(product.get("capabilities", {}).get("en", []))

    pricing = _pick_lang(product.get("pricing", {}), lang)
    limitations = join_list(product.get("limitations", []))
    use_cases = join_list(product.get("use_cases", []))
    notes = _pick_lang(product.get("notes", {}), lang)

    lines = [
        f"{name} ({vendor})",
        f"Status: {status}",
        f"Category: {category}",
        f"Capabilities: {capabilities}",
        f"Pricing: {pricing}",
        f"Limitations: {limitations}",
        f"Use cases: {use_cases}",
        f"Notes: {notes}",
        "Sources:",
    ]

    sources = product.get("sources", [])
    if sources:
        for src in sources:
            title = src.get("title", "")
            url = src.get("url", "")
            date = src.get("date", "")
            lines.append(f"- {title} | {url} | {date}")
    else:
        lines.append("- (none)")

    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="AI video product analysis agent (prototype)")
    parser.add_argument("--data", type=Path, default=None, help="Path to products JSON")
    parser.add_argument("--query", type=str, default="", help="Query for the agent")
    parser.add_argument("--top", type=int, default=5, help="Top results to return")
    parser.add_argument("--lang", type=str, default="zh", choices=["zh", "en"], help="Output language")
    parser.add_argument("--list", action="store_true", help="List products only")
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[2]
    data_path = args.data or (root / "data" / "products_seed.json")
    products = load_products(data_path)

    if args.list:
        for product in products:
            name = _pick_lang(product.get("name", {}), args.lang) or product.get("id", "")
            print(f"- {name} ({product.get('vendor', '')})")
        return

    if not args.query:
        raise SystemExit("--query is required unless --list is set")

    documents, metas = build_documents(products)
    index = TfidfIndex(documents, metas)
    results = index.search(args.query, top_k=args.top)

    if not results:
        print("No results found.")
        return

    for result in results:
        print("=" * 60)
        print(_render_product(result.product, args.lang))


if __name__ == "__main__":
    main()
