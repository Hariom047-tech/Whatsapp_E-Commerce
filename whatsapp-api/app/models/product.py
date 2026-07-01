"""Enhanced product model for WhatsApp AI commerce."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class Product(Base):
    """
    WhatsApp-optimized product catalog.

    Improvements over existing Node/SQLite `products` table:
    - slug for SEO URLs
    - category/subcategory as searchable text (not only FK)
    - primary color name for AI filtering (hex colors kept in colors_json)
    - fabric, brand, stock for richer cards
    - rating/reviews for ranking
    - product_url auto-generated from slug
    """

    __tablename__ = "wa_products"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    subcategory: Mapped[str | None] = mapped_column(String(100), index=True)
    brand: Mapped[str] = mapped_column(String(100), default="Fashion Virus")
    description: Mapped[str | None] = mapped_column(Text)
    price: Mapped[float] = mapped_column(Float, nullable=False)  # MRP
    discount_price: Mapped[float] = mapped_column(Float, nullable=False)  # selling price
    color: Mapped[str | None] = mapped_column(String(50), index=True)
    colors_json: Mapped[str] = mapped_column(Text, default="[]")
    available_sizes: Mapped[str] = mapped_column(Text, default="[]")  # JSON array
    fabric: Mapped[str | None] = mapped_column(String(100))
    stock: Mapped[int] = mapped_column(Integer, default=100)
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    hover_image_url: Mapped[str | None] = mapped_column(Text)
    product_url: Mapped[str] = mapped_column(Text, nullable=False)
    tag: Mapped[str | None] = mapped_column(String(50))
    rating: Mapped[float] = mapped_column(Float, default=4.5)
    reviews_count: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    @property
    def discount_percent(self) -> int:
        if self.price <= 0:
            return 0
        return round((1 - self.discount_price / self.price) * 100)
