"""Sync products from existing Node.js SQLite ecommerce DB into WhatsApp catalog."""

import json
import re
import sqlite3
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import get_settings
from app.database.connection import Base, SessionLocal, engine
from app.models.product import Product

settings = get_settings()

COLOR_FROM_NAME = {
    "burgundy": "burgundy", "maroon": "maroon", "navy": "navy", "emerald": "green",
    "olive": "olive", "charcoal": "charcoal", "ivory": "ivory", "sand": "sand",
    "off-white": "white", "red": "red", "blue": "blue", "black": "black", "white": "white",
    "green": "green", "grey": "grey", "gray": "grey", "beige": "beige", "brown": "brown",
}


def detect_color(name: str, colors_json: str) -> str | None:
    lower = name.lower()
    # Match longer color names first
    for word in sorted(COLOR_FROM_NAME.keys(), key=len, reverse=True):
        if word in lower:
            return COLOR_FROM_NAME[word]
    return None


FABRIC_MAP = {
    "linen": "Linen", "cotton": "100% Cotton", "denim": "Denim",
    "polyester": "Polyester Blend", "wool": "Wool Blend",
}

REVIEWS = [128, 256, 89, 412, 67, 198, 305, 54, 176, 233, 91, 367]


def slugify(name: str, pid: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or pid


def detect_fabric(name: str) -> str:
    lower = name.lower()
    for key, fabric in FABRIC_MAP.items():
        if key in lower:
            return fabric
    return "Premium Cotton Blend"


def sync():
    node_db = Path(__file__).resolve().parents[2] / "backend" / "data" / "fashion-virus.db"
    if not node_db.exists():
        node_db = Path(settings.node_sqlite_path)
    if not node_db.exists():
        print(f"Node SQLite not found at {node_db}")
        sys.exit(1)

    Base.metadata.create_all(bind=engine)
    conn = sqlite3.connect(str(node_db))
    conn.row_factory = sqlite3.Row

    rows = conn.execute("""
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.active = 1
    """).fetchall()
    conn.close()

    db = SessionLocal()
    synced = 0
    for i, row in enumerate(rows):
        name = row["name"]
        slug = slugify(name, row["id"])
        color = detect_color(name, row["colors"])
        sizes = row["sizes"] or "[]"
        category = (row["category_slug"] or "general").replace("-", " ").title()
        subcategory = row["category_slug"]

        product = Product(
            id=row["id"],
            product_name=name,
            slug=slug,
            category=category,
            subcategory=subcategory,
            brand=settings.brand_name,
            description=f"Premium {name} from {settings.brand_name}. Stylish, comfortable, and perfect for everyday wear.",
            price=float(row["mrp"]),
            discount_price=float(row["price"]),
            color=color,
            colors_json=row["colors"] or "[]",
            available_sizes=sizes,
            fabric=detect_fabric(name),
            stock=100,
            image_url=row["image"],
            hover_image_url=row["hover_image"],
            product_url=f"{settings.website_base_url.rstrip('/')}/product/{row['id']}",
            tag=row["tag"],
            rating=round(4.3 + (i % 5) * 0.1, 1),
            reviews_count=REVIEWS[i % len(REVIEWS)],
            active=True,
        )
        db.merge(product)
        synced += 1

    db.commit()
    db.close()
    print(f"Synced {synced} products into WhatsApp catalog.")


if __name__ == "__main__":
    sync()
