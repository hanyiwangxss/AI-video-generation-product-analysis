from __future__ import annotations

from typing import Any

REQUIRED_FIELDS = {
    "id",
    "name",
    "vendor",
    "status",
    "category",
    "capabilities",
    "pricing",
    "limitations",
    "use_cases",
    "notes",
    "sources",
}


def validate_product(product: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    missing = REQUIRED_FIELDS - set(product.keys())
    if missing:
        errors.append(f"Missing fields: {sorted(missing)}")

    name = product.get("name", {})
    if not isinstance(name, dict):
        errors.append("Field 'name' must be an object with 'en'/'zh' keys")
    else:
        if "en" not in name and "zh" not in name:
            errors.append("Field 'name' should contain at least 'en' or 'zh'")

    for list_field in ["category", "limitations", "use_cases", "sources"]:
        if list_field in product and not isinstance(product[list_field], list):
            errors.append(f"Field '{list_field}' must be a list")

    for dict_field in ["capabilities", "pricing", "notes"]:
        if dict_field in product and not isinstance(product[dict_field], dict):
            errors.append(f"Field '{dict_field}' must be an object with 'en'/'zh'")

    return errors
