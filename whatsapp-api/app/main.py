"""Main FastAPI application."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database.connection import Base, engine
from app.routers import dev, products, whatsapp
from app.utils.logging import setup_logging

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.app_name,
    description=(
        "AI-powered WhatsApp shopping assistant for Fashion Virus.\n\n"
        "**Flow:** Customer WhatsApp → HyperSender Webhook → AI Intent → "
        "Database Search → Product Cards → Website Link → Purchase\n\n"
        "Configure HyperSender webhook URL to: `POST /webhook/whatsapp`"
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(whatsapp.router)
app.include_router(products.router)
app.include_router(dev.router)


@app.get("/health", tags=["Health"])
async def health():
    from app.config import reload_settings
    from app.services.product_card_service import build_product_card_body, product_card_from_out
    from app.schemas.product import ProductOut

    s = reload_settings()
    # Quick sanity check — proves new card formatter is loaded
    sample = build_product_card_body(
        product_card_from_out(
            ProductOut(
                id="health",
                product_name="Health Check",
                slug="health",
                category="shirt",
                brand="FV",
                price=1299,
                discount_price=799,
                stock=1,
                image_url="https://example.com/img.jpg",
                product_url="https://example.com/p",
                rating=4.8,
                reviews_count=100,
                available_sizes=["M", "L"],
                fabric="Cotton",
                tag="TRENDING",
            )
        )
    )
    return {
        "status": "ok",
        "service": s.app_name,
        "assistant": "Hariom Fashion AI",
        "card_engine": "hariom_assistant_v1",
        "caption_has_no_urls": "http" not in sample and "localhost" not in sample,
        "hypersender_configured": bool(s.hypersender_api_key and s.hypersender_instance_id),
        "openai_configured": bool(s.openai_api_key),
    }


@app.get("/", tags=["Health"])
async def root():
    return {
        "message": f"{settings.app_name} is running",
        "docs": "/docs",
        "webhook": "/webhook/whatsapp",
    }
