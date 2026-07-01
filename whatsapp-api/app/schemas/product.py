"""Product API schemas."""

import json
from datetime import datetime

from pydantic import BaseModel, computed_field


class ProductOut(BaseModel):
    id: str
    product_name: str
    slug: str
    category: str
    subcategory: str | None = None
    brand: str
    description: str | None = None
    price: float
    discount_price: float
    color: str | None = None
    available_sizes: list[str] = []
    fabric: str | None = None
    stock: int
    image_url: str
    product_url: str
    tag: str | None = None
    rating: float
    reviews_count: int

    model_config = {"from_attributes": True}

    @computed_field
    @property
    def discount_percent(self) -> int:
        if self.price <= 0:
            return 0
        return round((1 - self.discount_price / self.price) * 100)

    @classmethod
    def from_orm_product(cls, p) -> "ProductOut":
        sizes = json.loads(p.available_sizes or "[]")
        return cls(
            id=p.id,
            product_name=p.product_name,
            slug=p.slug,
            category=p.category,
            subcategory=p.subcategory,
            brand=p.brand,
            description=p.description,
            price=p.price,
            discount_price=p.discount_price,
            color=p.color,
            available_sizes=sizes,
            fabric=p.fabric,
            stock=p.stock,
            image_url=p.image_url,
            product_url=p.product_url,
            tag=p.tag,
            rating=p.rating,
            reviews_count=p.reviews_count,
        )


class ProductSearchResult(BaseModel):
    products: list[ProductOut]
    total: int
    intent_summary: str
