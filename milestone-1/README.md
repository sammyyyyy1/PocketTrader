# Milestone 1 - Database-first demo (how to run the DB & interact with it)

This README explains how to run the MySQL database used by the demo, how to run the whole app with Docker, and how to interact with the DB directly (run the sample SQL and ad-hoc SQL commands).

If you're opening this project for the first time, the quickest way to get started is Docker Compose — the DB, backend, and frontend will start for you and the database will be seeded with demo data.

---

## Quick start (recommended - Docker)

Prerequisites
- Docker Desktop (or Docker Engine + Compose)

Start everything (DB, backend, frontend):

```powershell
cd PocketTrader/app
docker compose up -d --build
```

Check services:

```powershell
docker compose ps
docker compose logs db --tail 50
docker compose logs backend --tail 50
```

Confirm backend health:

```powershell
curl http://localhost:5001/api/health
```

Open the UI: http://localhost:3000
Backend API base: http://localhost:5001

---

## Reset DB (fresh seed)

If you want to reset the database to the shipped seed (drops persisted DB data):

```powershell
cd PocketTrader/app
docker compose down -v
docker compose up -d --build
```

Note: `-v` removes named volumes — use it when you want to re-run schema + seed.

---

## Connect to the database directly

Two quick ways to run SQL against the running DB:

1) From your host (requires mysql client installed)

```powershell
# default Docker Compose maps MySQL on host port 3307
mysql -h 127.0.0.1 -P 3307 -u user -ppassword app_db
# then at the mysql prompt you can run SQL, e.g.:
SELECT COUNT(*) FROM Card;
SELECT * FROM Collection WHERE userID = 1 LIMIT 10;
```

2) From inside the running DB container (no client required on host)

```powershell
# open a shell in the db container
docker exec -it app-db-1 bash
# connect using the local mysql client inside the container
mysql -u user -ppassword app_db
```

Tips:
- The Compose file maps DB port 3306 inside the container to 3307 on your host.
- Username/password/database are set in `docker-compose.yml` (user / password / app_db).

---

## Run the sample SQL files shipped with the project

The repo includes `app/database/schema.sql` (creates tables) and `app/database/migrations/init-prod.sql` (seed data). The Compose setup already runs these on first startup.

If you prefer to run the sample SQL manually from your host:

```powershell
mysql -h 127.0.0.1 -P 3307 -u user -ppassword app_db < PocketTrader/app/database/schema.sql
mysql -h 127.0.0.1 -P 3307 -u user -ppassword app_db < PocketTrader/app/database/migrations/init-prod.sql
```

There is also `milestone-1/test-sample.sql` containing example queries used for grading. To run it and capture output:

```powershell
mysql -h 127.0.0.1 -P 3307 -u user -ppassword app_db < PocketTrader/milestone-1/test-sample.sql > PocketTrader/milestone-1/test-sample.out
mysql -h 127.0.0.1 -P 3307 -u user -ppassword app_db < milestone-2/test-production.sql > milestone-2/test-production.out
```

---

## Helpful SQL snippets (examples)

Run these in `mysql` prompt or pass via `mysql -e "..."`:

```sql
-- count cards
SELECT COUNT(*) FROM Card;

-- show first 10 cards
SELECT cardID, name, packName, rarity, type, imageURL FROM Card LIMIT 10;

-- see a user's collection
SELECT c.cardID, c.name, col.quantity
FROM Collection col
JOIN Card c USING (cardID)
WHERE col.userID = 1
ORDER BY c.rarity, c.name;

-- add one card to a user's collection (mimic backend upsert)
INSERT INTO Collection (userID, cardID, quantity)
VALUES (1, 'A1-001', 1)
ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity);
```

---

## Backend & Frontend (developer mode)

If you want to run the backend and frontend locally (not in Docker), these commands show the expected environment variables and ports.

Backend (Python)

```powershell
cd PocketTrader/app/backend
pip install -r requirements.txt
$env:MYSQL_HOST='127.0.0.1'; $env:MYSQL_USER='user'; $env:MYSQL_PASSWORD='password'; $env:MYSQL_DATABASE='app_db'
python app.py
```

Frontend (Next.js)

```powershell
cd PocketTrader/app/frontend
npm install
npm run dev
# open http://localhost:3000
```

Note: If you run the frontend locally and you previously used `docker compose down -v`, ensure node modules are installed (`npm ci`) before starting.

---

## API quick reference

- `GET /api/health` — health + DB counts
- `GET /api/cards` — list all cards
- `POST /api/login` — body: `{ "username": "trainer", "password": "password123" }` (password stored hashed via Werkzeug)
- `GET /api/collection?userID=1` — list user's collection (supports `rarity`, `type`, `packName`, `name` filters)
- `POST /api/collection` — body: `{ "userID": 1, "cardID": "A1-001", "quantity": 1 }`

---

## Troubleshooting

- Service won't start: run `docker compose logs backend` and `docker compose logs db`.
- DB connection failed: re-run `docker compose down -v` then `docker compose up -d` to reset DB volumes and re-seed.
- Frontend build errors (missing node modules): make sure you didn't remove the named volume `app_frontend_node_modules`; if you did, re-run `docker compose up -d --build` to recreate it.

---

## Notes and safety

- Seed passwords are hashed with PBKDF2-SHA256 via `werkzeug.security.generate_password_hash`.
- SQL files are intentionally visible in `app/backend/sql/` to keep the project DB-first and easy to inspect.
