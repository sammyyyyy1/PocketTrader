# Milestone 1 - Database-Centric App Demo

This milestone demonstrates good schema design, visible SQL, and a simple working app that uses those queries directly.

---

## Quick Start (First-Time Setup)

### Prerequisites
- Docker Desktop (recommended)
- Python 3.9+ (for backend dev)
- Node.js 18+ (for frontend dev)
- MySQL 5.7+ (if running DB manually)

### Clone and Run (Docker)
```powershell
# Clone the repo
cd <your workspace>
git clone <your-repo-url>
cd PocketTrader/app

# Start all services (DB, backend, frontend)
docker compose up -d

# Check backend health
curl http://localhost:5000/api/health
```

### Access the App
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health: http://localhost:5000/api/health

### Reset the Database
```powershell
docker compose down -v
docker compose up -d
```

### Manual Setup (Advanced)
```powershell
# Create DB and load schema + seed
mysql -h 127.0.0.1 -P 3307 -u user -ppassword -e "CREATE DATABASE IF NOT EXISTS app_db;"
mysql -h 127.0.0.1 -P 3307 -u user -ppassword app_db < PocketTrader/app/database/schema.sql
mysql -h 127.0.0.1 -P 3307 -u user -ppassword app_db < PocketTrader/app/database/migrations/init.sql

# Backend
cd PocketTrader/app/backend
pip install -r requirements.txt
$env:MYSQL_HOST="127.0.0.1"; $env:MYSQL_USER="user"; $env:MYSQL_PASSWORD="password"; $env:MYSQL_DATABASE="app_db"
python app.py

# Frontend
cd PocketTrader/app/frontend
npm install
npm run dev
```

---

## Project Structure

- schema.sql — DB tables, constraints, indexes
- init.sql — sample user, cards, collection
- `app/backend/sql/` — all SQL queries used by the backend
- app.py — Flask API, loads and runs SQL files
- `app/frontend/` — Next.js frontend
- test-sample.sql — sample queries for grading
- test-sample.out — output from running test-sample.sql

---

## Features & API Guide

### R6: Browse & Filter My Collection
- Endpoint: `GET /api/collection?username=trainer&rarity=1D&packName=Pikachu`
- Optional filters: rarity, type, packName, name
- Returns: List of cards in the user's collection matching filters

### R7: Add a Card to My Collection
- Endpoint: `POST /api/collection`
- Body: `{ "userID": 1, "cardID": "A1-001", "quantity": 1 }`
- Behavior: Adds or increments quantity for the card

### Other Endpoints
- `GET /api/cards` — all cards
- `POST /api/login` — login with username/password
- `GET /api/users` — all users

---

## SQL File Inventory

- schema.sql — schema
- init.sql — seed data
- `app/backend/sql/get_cards.sql` — all cards
- `app/backend/sql/login_get_user_by_username.sql` — login
- `app/backend/sql/get_collection.sql` — R6
- `app/backend/sql/add_to_collection.sql` — R7
- `app/backend/sql/get_users.sql` — users

---

## Running Test SQL

```powershell
mysql -h 127.0.0.1 -P 3307 -u user -ppassword app_db < PocketTrader/milestone-1/test-sample.sql > PocketTrader/milestone-1/test-sample.out
```

---

## Troubleshooting

- **Service won’t start?**
  - Run `docker compose ps` and `docker compose logs backend` or `db` for errors
- **DB connection failed?**
  - Try `docker compose down -v` then `docker compose up -d` to reset
- **Port already in use?**
  - Stop other apps using ports 3000, 5000, or 3307
- **Frontend not loading?**
  - Check `docker compose logs frontend` and ensure Node.js is installed

---

## Notes

- Passwords are plain-text for demo only. Use hashing for production.
- All SQL is visible and versioned in the repo.
- Rarity ordering: C → 3S → 4D → 3D → 2S → 1S → 2D → 1D
