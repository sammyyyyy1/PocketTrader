# 🎮 PocketTrader App - v0.1

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
curl http://localhost:5001/api/health
```

### Access the App
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001
- Health: http://localhost:5001/api/health

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
mysql -h 127.0.0.1 -P 3307 -u user -ppassword app_db < PocketTrader/app/database/migrations/init-prod.sql

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
- init-prod.sql — sample cards, user, collection
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

**Implementation snapshot** – Logged-in trainers use the `/cards` page (`app/frontend/pages/cards/index.js`) to filter/search cards and click the inline “Add Card” button that `Card` components render when `canAdd` is true. That click fires the `handleAdd` helper, which POSTs to `/api/collection` with `{ userID, cardID, quantity }`. On the backend, `app/backend/app.py` loads `app/backend/sql/add_to_collection.sql` and executes the `INSERT ... ON DUPLICATE KEY UPDATE` so the row is either created or incremented. The UI raises a toast and the `/collection` grid reflects the new quantity after a refresh.

**Performance tuning & evaluation (R7-c)** – The `Collection` table is clustered on `(userID, cardID)` and we added `idx_collection_user_card` so MySQL can satisfy both the upsert key check and the subsequent R6 browse query without a full scan. To verify the benefit, capture timings with the tuned index, then temporarily revert to the old single-column index on a scratch database:
```bash
# Tuned version
mysql ... -e "SET profiling=1; INSERT INTO Collection(userID, cardID, quantity, dateAcquired) VALUES (1,'A1-001',1,NOW()) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity); SHOW PROFILES;" app_db

# Simulate pre-tuning plan (drop composite, add legacy index, rerun, then restore tuned index)
mysql ... -e "ALTER TABLE Collection DROP INDEX idx_collection_user_card; CREATE INDEX idx_collection_userid ON Collection(userID);" app_db
mysql ... -e "SET profiling=1; INSERT INTO Collection(userID, cardID, quantity, dateAcquired) VALUES (1,'A1-001',1,NOW()) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity); SHOW PROFILES;" app_db
mysql ... -e "ALTER TABLE Collection DROP INDEX idx_collection_userid; CREATE INDEX idx_collection_user_card ON Collection(userID, cardID);" app_db
```
Comparing the `SHOW PROFILES` (or `EXPLAIN ANALYZE INSERT ...`) output shows the tuned version does a single index probe, while the legacy index triggers extra lookups to confirm `cardID`, which is noticeable once millions of rows exist.

**Testing & production evidence (R7-d)** – The R7 block in `milestone-2/test-production.sql` inserts `('A1-001', user 1)` via the same upsert and then selects the resulting quantity. Running the script twice demonstrates both code paths: the first execution reports `affected_rows_after_R7_upsert = 1` (row inserted) and the second reports `2` (duplicate-key update), matching `milestone-2/test-production.out` that was captured against the large production dataset. For the UI snapshot, sign in as `Alice`, open `/cards`, click “Add Card” on “Charmander,” and then refresh `/collection` to confirm the quantity incremented visually.

### Other Endpoints
- `GET /api/cards` — all cards
- `POST /api/login` — login with username/password
- `GET /api/users` — all users

---

## SQL File Inventory

- schema.sql — schema
- init-prod.sql — seed card data, user & collection data
- `app/backend/sql/get_cards.sql` — all cards
- `app/backend/sql/login_get_user_by_username.sql` — login
- `app/backend/sql/get_collection.sql` — R6
- `app/backend/sql/add_to_collection.sql` — R7
- `app/backend/sql/get_users.sql` — users

---

## Seed Dataset Options

- **Sample dataset (`milestone-2/sql/init-sample.sql`)** — small, autograder-friendly snapshot with four trainers, a dozen marquee cards, and matching collection + wishlist rows. Run it after the schema is applied whenever you want a tiny dataset for demos:
  ```bash
  mysql -h 127.0.0.1 -P 3307 -u user -ppassword app_db < milestone-2/sql/init-sample.sql
  ```
- **Production dataset (`milestone-2/sql/init-prod.sql`)** — seeds all card and user data. Docker Compose loads the same data automatically via `app/database/migrations`, but you can also apply it manually with the command shown in the Production Data Guide below.

---

## Seed Accounts & Password Hashing

- Default trainers live in `app/database/migrations/init_accounts.sql` (mirrored in `milestone-2/sql/init_accounts.sql`) and can be used to sign in via `/api/login`. Example: username `Alice` with password `IAmAlice`.
- Passwords are stored using Werkzeug's `generate_password_hash` helper. To add new users, hash the password first:
  ```bash
  python - <<'PY'
  from werkzeug.security import generate_password_hash
  print(generate_password_hash("MySecurePassword"))
  PY
  ```
- When Docker initializes MySQL it now loads the hashed credentials, and the backend verifies input with `check_password_hash` while still accepting any legacy plaintext rows you may have in older databases.

---

## Production Data Guide

### What lives in `milestone-2/sql/init-prod.sql`?
- Canonical “production” seed featuring ten real trainers, and the full 786 cards from Genetic Apex (A1), Space-Time Smackdown (A2), and Celestial Guardians (A3) sets, stock collection rows, and wishlist entries so every table has meaningful relationships on Day 1.
- Card facts (names, packs, rarity, typing, art URLs) come directly from the official [TCG Dex](https://www.tcgdex.net/en) export for the “Pocket” release, so all identifiers map to verifiable public data.
- The script is literally `init-prod.sql`, making it easy to regenerate either portion or run them independently inside Docker.

### How we generate and clean it
- Cards start as a CSV from TCG Dex filters (pack = Pocket, language = EN). We keep columns `cardID`, `name`, `packName`, `rarity`, `type`, `imageURL`, drop promos without a public art URL, then transform via a small Python helper into SQL INSERT statements.
- Trainer, Collection, and Wishlist rows are hand-authored storylines to ensure each constraint is exercised: duplicate quantities, overlapping wishlists, and at least one card in every rarity/type bucket. Dates are normalized to `YYYY-MM-DD HH:MM:SS`.
- Before publishing the file we load it into a disposable MySQL 5.7 instance (`mysql --show-warnings app_db < init-prod.sql`) to catch referential-integrity issues, trim whitespace, and verify there are no NULLs in NOT NULL columns.

### Loading the production dataset
1. Ensure the schema is applied (`app/database/schema.sql`) and truncate existing demo data if you previously ran `init-prod.sql`.
2. From the repo root, stream the SQL into MySQL:
   - **Docker** (while `docker compose up` is running):
     ```bash
     cd app
     cat ../milestone-2/sql/init-prod.sql | docker compose exec -T db mysql -u user -ppassword app_db
     ```
   - **Direct MySQL** (DB exposed on port 3307):
     ```bash
     mysql -h 127.0.0.1 -P 3307 -u user -ppassword app_db < milestone-2/sql/init-prod.sql
     ```
3. Verify the counts:
   ```bash
   mysql -h 127.0.0.1 -P 3307 -u user -ppassword -e "SELECT COUNT(*) AS cards FROM Card; SELECT COUNT(*) AS trainers FROM User;" app_db
   ```
   Expect 286 cards and 5 trainers; Wishlist rows align with the INSERT block.

Starting from an empty database keeps the script idempotent—you can drop/truncate and re-run anytime to rehydrate the same production snapshot.

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
  - Stop other apps using ports 3000, 5001, or 3307
- **Frontend not loading?**
  - Check `docker compose logs frontend` and ensure Node.js is installed

---

## Notes

- Seed passwords are hashed with PBKDF2-SHA256 using Werkzeug. Use the helper snippet above when adding new accounts.
- All SQL is visible and versioned in the repo.
- Rarity ordering: C → 3S → 4D → 3D → 2S → 1S → 2D → 1D
