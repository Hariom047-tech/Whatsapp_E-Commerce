"""Product search with ranking and caching."""

import json
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.intent import ShoppingIntent
from app.schemas.product import ProductOut, ProductSearchResult
from app.utils.cache import get_cached, intent_cache_key, set_cached
from app.utils.logging import get_logger

logger = get_logger(__name__)

CATEGORY_ALIASES = {
    "shirt": ["shirt", "shirts", "t-shirt", "t-shirts", "overshirt", "polo", "polos"],
    "shirts": ["shirt", "shirts", "t-shirt", "t-shirts", "overshirt", "polo"],
    "t-shirt": ["t-shirt", "t-shirts", "tshirt", "shirt", "shirts"],
    "t-shirts": ["t-shirt", "t-shirts", "tshirt", "shirt"],
    "jeans": ["jeans"],
    "trousers": ["trousers", "trouser", "pant", "pants"],
    "cargo-pants": ["cargo-pants", "cargo", "cargos", "cargo pants"],
    "shorts": ["shorts"],
    "shoes": ["shoes", "shoe"],
    "overshirt": ["overshirt", "overshirts", "shirt"],
    "polo": ["polo", "polos", "t-shirt"],
}

COLOR_ALIASES = {
    "red": ["red", "burgundy", "maroon", "crimson"],
    "blue": ["blue", "navy", "indigo"],
    "black": ["black", "charcoal"],
    "white": ["white", "ivory", "off-white", "cream"],
    "green": ["green", "olive", "emerald"],
    "brown": ["brown", "beige", "sand", "tan"],
    "grey": ["grey", "gray", "charcoal"],
}


def _normalize_category(cat: str | None) -> list[str]:
    if not cat:
        return []
    key = cat.lower().strip()
    return CATEGORY_ALIASES.get(key, [key])


def _size_available(product: Product, size: str | None) -> bool:
    if not size:
        return True
    sizes = json.loads(product.available_sizes or "[]")
    return size.upper() in [s.upper() for s in sizes]


def _color_match_score(product: Product, color: str | None) -> float:
    if not color:
        return 0.5
    c = color.lower()
    aliases = COLOR_ALIASES.get(c, [c])
    for alias in aliases:
        if product.color and alias in product.color.lower():
            return 1.0
        if alias in product.product_name.lower():
            return 0.9
        if alias in (product.description or "").lower():
            return 0.7
    return 0.0


def _rank_product(product: Product, intent: ShoppingIntent) -> float:
    score = 0.0

    # 1. Exact colour match (weight 40)
    score += _color_match_score(product, intent.color) * 40

    # 2. Price range (weight 25)
    if intent.max_price is not None:
        if product.discount_price <= intent.max_price:
            score += 25
        else:
            score -= 15
    else:
        score += 10

    # 3. Size availability (weight 20)
    if intent.size:
        score += 20 if _size_available(product, intent.size) else -10
    else:
        score += 10

    # 4. Rating (weight 10)
    score += (product.rating / 5.0) * 10

    # 5. Latest products (weight 5)
    if product.created_at:
        score += 5

    # Category bonus
    if intent.category:
        cats = _normalize_category(intent.category)
        if product.category.lower() in cats or (product.subcategory and product.subcategory.lower() in cats):
            score += 15

    # Stock penalty
    if product.stock <= 0:
        score -= 50

    return score


class ProductSearchService:
    def search(self, db: Session, intent: ShoppingIntent, limit: int = 3) -> ProductSearchResult:
        cache_key = intent_cache_key(intent.model_dump(exclude_none=True))
        cached = get_cached(cache_key)
        if cached:
            logger.debug("Cache hit for intent search")
            return ProductSearchResult(**cached)

        query = db.query(Product).filter(Product.active.is_(True), Product.stock > 0)

        if intent.category:
            cats = _normalize_category(intent.category)
            cat_filters = [Product.category.ilike(f"%{c}%") for c in cats]
            cat_filters += [Product.subcategory.ilike(f"%{c}%") for c in cats]
            query = query.filter(or_(*cat_filters))

        if intent.max_price is not None:
            query = query.filter(Product.discount_price <= intent.max_price)

        if intent.color:
            c = intent.color.lower()
            aliases = COLOR_ALIASES.get(c, [c])
            color_filters = []
            for alias in aliases:
                color_filters.extend([
                    Product.color.ilike(f"%{alias}%"),
                    Product.product_name.ilike(f"%{alias}%"),
                    Product.description.ilike(f"%{alias}%"),
                ])
            query = query.filter(or_(*color_filters))

        if intent.query_text and not intent.category:
            q = intent.query_text.lower()
            query = query.filter(
                or_(
                    Product.product_name.ilike(f"%{q}%"),
                    Product.category.ilike(f"%{q}%"),
                    Product.description.ilike(f"%{q}%"),
                )
            )

        candidates = query.all()

        if intent.size:
            sized = [p for p in candidates if _size_available(p, intent.size)]
            if sized:
                candidates = sized

        ranked = sorted(candidates, key=lambda p: _rank_product(p, intent), reverse=True)
        top = ranked[:limit]

        # Fallback: if strict filters return nothing, broaden search
        if not top and intent.category:
            broad_intent = ShoppingIntent(
                intent_type="search",
                category=intent.category,
                max_price=intent.max_price,
                size=intent.size,
            )
            broad_query = db.query(Product).filter(Product.active.is_(True), Product.stock > 0)
            cats = _normalize_category(intent.category)
            cat_filters = [Product.category.ilike(f"%{c}%") for c in cats]
            cat_filters += [Product.subcategory.ilike(f"%{c}%") for c in cats]
            broad_query = broad_query.filter(or_(*cat_filters))
            if intent.max_price:
                broad_query = broad_query.filter(Product.discount_price <= intent.max_price * 1.2)
            candidates = broad_query.all()
            ranked = sorted(candidates, key=lambda p: _rank_product(p, broad_intent), reverse=True)
            top = ranked[:limit]

        products = [ProductOut.from_orm_product(p) for p in top]

        summary_parts = []
        if intent.color:
            summary_parts.append(intent.color)
        if intent.category:
            summary_parts.append(intent.category)
        if intent.max_price:
            summary_parts.append(f"under ₹{int(intent.max_price)}")
        if intent.size:
            summary_parts.append(f"size {intent.size}")

        result = ProductSearchResult(
            products=products,
            total=len(ranked),
            intent_summary=" ".join(summary_parts) or "your search",
        )

        set_cached(cache_key, result.model_dump())
        return result


product_search_service = ProductSearchService()
