"""Format helpers — delegates to Hariom Fashion assistant messages."""

from app.services.assistant_messages import (
    no_products_found,
    products_found_intro,
    quick_actions_footer,
    trust_footer,
    welcome_greeting,
)
from app.services.product_card_service import build_product_card_body, product_card_from_out

format_greeting = products_found_intro
format_greeting_intro = welcome_greeting
format_footer = trust_footer
format_quick_actions = quick_actions_footer
format_no_results = no_products_found


def format_product_caption(product) -> str:
    return build_product_card_body(product_card_from_out(product))
