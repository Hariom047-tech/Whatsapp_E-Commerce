"""Product search API for testing and admin use."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.intent import ShoppingIntent
from app.schemas.product import ProductSearchResult
from app.services.ai_service import ai_service
from app.services.product_search import product_search_service

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("/search", response_model=ProductSearchResult)
def search_products(
    message: str = Query(..., description="Natural language query e.g. red shirt under 799 size M"),
    limit: int = Query(3, ge=1, le=10),
    db: Session = Depends(get_db),
):
    """Test product search with AI intent extraction (same logic as WhatsApp bot)."""
    intent = ai_service.extract_intent(message)
    if intent.intent_type in ("clarify", "greeting", "unknown"):
        return ProductSearchResult(
            products=[],
            total=0,
            intent_summary=intent.clarification_question or "Please provide more details",
        )
    return product_search_service.search(db, intent, limit=limit)


@router.get("/count")
def product_count(db: Session = Depends(get_db)):
    from app.models.product import Product
    total = db.query(Product).filter(Product.active.is_(True)).count()
    return {"total_active_products": total}
