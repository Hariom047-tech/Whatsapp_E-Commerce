# Fashion Virus — Full Stack

E-commerce fashion website with React frontend, Express API, SQLite database, and admin panel.

## Quick Start

### 1. Backend (API + SQLite)

```bash
cd backend
npm install
npm start
```

API runs at **http://localhost:5000**

Default admin credentials: `admin` / `admin123`

### 2. Frontend

```bash
cd frontend
yarn install   # or npm install
yarn start     # or npm start
```

Website: **http://localhost:3000**  
Admin panel: **http://localhost:3000/admin**

## Admin Panel

Manage all website content from `/admin`:

| Section | What it controls |
|---------|------------------|
| Hero Carousel | Homepage banner images & text |
| Products | New Drops product grid |
| Categories | Product categories |
| Featured Categories | Homepage category cards |
| Editorial Tiles | Collection tiles below hero |
| Steals Section | Deal price cards |
| Promo Banner | Sale/promo section |
| Announcements | Top scrolling bar messages |
| Nav Categories | Header category strip |
| Menu Links | Side navigation menu |
| Footer | Footer link sections |

## API Endpoints

**Public** (no auth): `GET /api/announcements`, `/hero-slides`, `/products`, `/featured-categories`, etc.

**Admin** (Bearer token): `POST /api/admin/login`, CRUD at `/api/admin/{resource}`

## Database

SQLite file: `backend/data/fashion-virus.db`  
Seeded automatically on first run with demo content from the original mock data.
