"""Quick test for product card delivery."""

import asyncio
import json
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.schemas.product import ProductOut
from app.services.product_card_service import (
    build_interactive_payload,
    build_product_card_body,
    product_card_from_out,
    send_product_card,
)


def load_product(product_id: str = "p9") -> ProductOut:
    db = Path(__file__).resolve().parents[1] / "data" / "whatsapp_commerce.db"
    conn = sqlite3.connect(db)
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM wa_products WHERE id = ?", (product_id,)).fetchone()
    sizes = json.loads(row["available_sizes"] or "[]")
    return ProductOut(
        id=row["id"],
        product_name=row["product_name"],
        slug=row["slug"],
        category=row["category"],
        subcategory=row["subcategory"],
        brand=row["brand"],
        description=row["description"],
        price=row["price"],
        discount_price=row["discount_price"],
        color=row["color"],
        available_sizes=sizes,
        fabric=row["fabric"],
        stock=row["stock"],
        image_url=row["image_url"],
        product_url=row["product_url"],
        tag=row["tag"],
        rating=row["rating"],
        reviews_count=row["reviews_count"],
    )


async def main():
    product = load_product()
    card = product_card_from_out(product)
    print("=== CAPTION PREVIEW ===")
    print(build_product_card_body(card))
    print("\n=== CLOUD API REFERENCE PAYLOAD ===")
    print(json.dumps(build_interactive_payload("919999999999@c.us", card), indent=2))

    if len(sys.argv) > 1 and sys.argv[1] == "--send":
        chat_id = sys.argv[2] if len(sys.argv) > 2 else "258144747970633@lid"
        result = await send_product_card(chat_id, card)
        print("\n=== DELIVERY RESULT ===")
        print(result.model_dump())


if __name__ == "__main__":
    asyncio.run(main())
