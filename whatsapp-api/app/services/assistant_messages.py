"""Hariom Fashion AI Assistant — personality & canned replies."""

from app.config import get_settings

settings = get_settings()
BRAND = settings.brand_name


def welcome_greeting() -> str:
    return (
        f"👋 Hello! Welcome to *{BRAND}* 😊\n\n"
        "I am your personal shopping assistant.\n\n"
        "I can help you find:\n"
        "👕 Shirts\n"
        "👖 Jeans\n"
        "🧥 Jackets\n"
        "👔 T-Shirts\n"
        "🔥 Latest fashion collections\n\n"
        "What would you like to explore today?"
    )


def products_found_intro() -> str:
    return (
        "✨ Great choice!\n\n"
        "Maine aapke liye kuch best options find kiye hain 👇\n\n"
        "Aap inme se koi pasand kar sakte hain 😊"
    )


def no_products_found() -> str:
    return (
        "Sorry 😊 mujhe is category me exact match nahi mila.\n\n"
        "Kya aap:\n"
        "• different colour\n"
        "• different budget\n"
        "• another style\n\n"
        "try karna chahenge?"
    )


def confused_help() -> str:
    return (
        "No problem 😊\n\n"
        "Aap mujhe bas bata dijiye:\n\n"
        "1. Occasion kya hai?\n"
        "2. Budget kitna hai?\n"
        "3. Kaunsa colour pasand hai?\n\n"
        "Main best options suggest kar dunga."
    )


def purchase_help() -> str:
    return (
        "Great choice 😊\n\n"
        "Aap product open karke *Buy Now* par click kar sakte hain.\n\n"
        "Agar koi help chahiye to main yahi hu."
    )


def browse_all() -> str:
    return f"🌐 Browse our full collection:\n{settings.website_base_url}/shop"


def upsell_jeans() -> str:
    return (
        "Ye shirt ke sath matching jeans bhi achhi lagegi 😊\n\n"
        "Kya main jeans options bhi dikhaun?\n"
        "Reply with: *jeans under 1500*"
    )


def upsell_shirt() -> str:
    return (
        "Is jeans ke sath ek stylish shirt bhi perfect rahegi 😊\n\n"
        "Kya main shirt options bhi dikhaun?"
    )


def format_price_reply(product_name: str, price: float) -> str:
    return (
        f"Iski price *₹{int(price):,}* hai 😊\n\n"
        "Aap chahe to main iske similar aur options bhi dikha sakta hu."
    )


def format_size_available(size: str) -> str:
    return f"Yes 😊 *{size.upper()}* available hai."


def format_size_unavailable(requested: str, available: list[str]) -> str:
    sizes = " | ".join(available[:6]) if available else "M | L | XL"
    return (
        f"Sorry 😊 *{requested.upper()}* available nahi hai.\n\n"
        f"Available sizes:\n{sizes}"
    )


def quick_actions_footer() -> str:
    return (
        "\n─────────────────\n"
        "Aap aur kya dekhna chahenge? 👇\n\n"
        "👕 *More Shirts*\n"
        "🎨 *Different Colour*\n"
        "📏 *Change Size*"
    )


def trust_footer() -> str:
    return (
        "\n─────────────────\n"
        "✅ 100% Secure Shopping\n"
        "🚚 Fast Delivery  ·  ↩️ Easy Returns  ·  💬 24x7 Support"
    )
