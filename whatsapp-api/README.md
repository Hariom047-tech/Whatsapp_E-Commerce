# Fashion Virus — WhatsApp AI Shopping Assistant

Production-ready FastAPI backend for AI-powered WhatsApp commerce using **HyperSender**, **OpenAI**, and your existing **Fashion Virus** product database.

## Architecture

```
Customer WhatsApp
       ↓
HyperSender WhatsApp API
       ↓
POST /webhook/whatsapp  (FastAPI)
       ↓
AI Agent (OpenAI / rule-based fallback)
       ↓
Product Search + Ranking
       ↓
WhatsApp Product Cards (image + caption + links)
       ↓
View on Website → http://localhost:3000/product/:id
       ↓
Customer Purchase
```

## Existing Database Analysis & Improvements

### Current Node/SQLite `products` table
| Field | Issue for WhatsApp AI |
|-------|----------------------|
| `name` | OK — used as product_name |
| `price` / `mrp` | Confusing names — `price` is sale price, `mrp` is original |
| `colors` (JSON hex) | AI can't filter by "red" — needs `color` text field |
| `sizes` (JSON) | OK but needs indexed text search |
| `category_id` (FK) | Requires JOIN — WhatsApp search needs flat `category` text |
| Missing `slug` | Can't build clean product URLs |
| Missing `description` | Weak AI + card copy |
| Missing `fabric`, `brand`, `stock` | Can't show trust details |
| Missing `rating`, `reviews_count` | Can't rank by popularity |

### New `wa_products` table (this project)
All fields from your spec plus sync from existing DB:
`product_name`, `slug`, `category`, `subcategory`, `brand`, `description`, `price` (MRP), `discount_price`, `color`, `available_sizes`, `fabric`, `stock`, `image_url`, `product_url`, `rating`, `reviews_count`

## Quick Start

```bash
cd whatsapp-api
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # Add your API keys

# Sync products from existing ecommerce SQLite DB
python scripts/sync_from_node_db.py

# Run API
uvicorn app.main:app --reload --port 8000
```

- **Swagger docs:** http://localhost:8000/docs
- **Webhook URL:** `POST http://your-server:8000/webhook/whatsapp`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL or SQLite connection string |
| `OPENAI_API_KEY` | OpenAI API key for intent extraction |
| `HYPERSENDER_API_KEY` | HyperSender bearer token |
| `HYPERSENDER_INSTANCE_ID` | WhatsApp instance UUID |
| `HYPERSENDER_WEBHOOK_SECRET` | Webhook auth header secret |
| `WEBSITE_BASE_URL` | Your React store URL (e.g. http://localhost:3000) |

## HyperSender Setup

1. Create instance at [hypersender.com](https://hypersender.com)
2. Set webhook URL to: `https://your-domain.com/webhook/whatsapp`
3. Set webhook secret in `.env` as `HYPERSENDER_WEBHOOK_SECRET`
4. Pass header: `Authorization: Bearer <secret>`

## Example Customer Flow

**Customer:** `Mujhe red colour ki shirt chahiye under 799 size M`

**AI extracts:**
```json
{
  "intent_type": "search",
  "category": "shirt",
  "color": "red",
  "max_price": 799,
  "size": "M"
}
```

**System:** Searches DB → ranks by colour, price, size, rating → sends up to 3 product image cards with View/Buy links.

## Project Structure

```
whatsapp-api/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── routers/whatsapp.py
│   ├── services/
│   │   ├── ai_service.py
│   │   ├── hypersender.py
│   │   ├── product_search.py
│   │   ├── message_formatter.py
│   │   └── webhook_parser.py
│   ├── models/product.py
│   ├── schemas/
│   └── database/
├── scripts/sync_from_node_db.py
└── requirements.txt
```

## Production Deployment

- Use **PostgreSQL**: `DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/fashion_virus`
- Run behind HTTPS (required for webhooks)
- Set `OPENAI_API_KEY` and HyperSender credentials
- Schedule `sync_from_node_db.py` via cron when products update in admin panel

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/docs` | Swagger UI |
| POST | `/webhook/whatsapp` | HyperSender incoming messages |
| GET | `/webhook/whatsapp` | Webhook verification |
