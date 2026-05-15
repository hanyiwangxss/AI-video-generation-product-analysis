from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .schema import validate_product
from .utils import join_list


def load_products(data_path: Path) -> list[dict[str, Any]]:
    if not data_path.exists():
        raise FileNotFoundError(f"Data file not found: {data_path}")

    payload = json.loads(data_path.read_text(encoding="utf-8"))
    products = payload.get("products", [])
    if not isinstance(products, list):
        raise ValueError("'products' must be a list")

    errors: list[str] = []
    for idx, product in enumerate(products):
        for err in validate_product(product):
            errors.append(f"products[{idx}]: {err}")

    if errors:
        message = "\n".join(errors)
        raise ValueError(f"Invalid product data:\n{message}")

    return products


def product_to_document(product: dict[str, Any]) -> str:
    name = product.get("name", {})
    caps = product.get("capabilities", {})
    pricing = product.get("pricing", {})
    notes = product.get("notes", {})

    parts = [
        name.get("en", ""),
        name.get("zh", ""),
        product.get("vendor", ""),
        join_list(product.get("category")),
        join_list(caps.get("en", [])),
        join_list(caps.get("zh", [])),
        pricing.get("en", ""),
        pricing.get("zh", ""),
        join_list(product.get("limitations", [])),
        join_list(product.get("use_cases", [])),
        notes.get("en", ""),
        notes.get("zh", ""),
    ]

    return "\n".join([p for p in parts if p])


def build_documents(products: list[dict[str, Any]]) -> tuple[list[str], list[dict[str, Any]]]:
    docs: list[str] = []
    metas: list[dict[str, Any]] = []
    for product in products:
        docs.append(product_to_document(product))
        metas.append(product)
    return docs, metas
