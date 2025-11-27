**PocketTrader**

- **Description:** PocketTrader is a small Full-Stack sample application for trading collectible cards. It includes a Flask backend, a Next.js frontend, and a MySQL database with schema and migrations provided under `app/database`.

**Getting Started**

- **Prerequisites:**

  - Docker & Docker Compose (for running full stack)
  - Python 3.8+ and `venv` (for running backend locally)
  - Node.js (for running frontend locally)

- **Run full stack with Docker Compose (recommended):**

```powershell
# from the repo root
cd "PocketTrader/app"
docker-compose up --build
```

- **Run backend locally (development):**

```powershell
# activate virtualenv (example path used by this repo)
& "C:/Users/Sam/github projects/poketrader/.venv/Scripts/Activate.ps1"
cd "PocketTrader/app/backend"
python -u app.py
```

- **Run frontend locally (development):**

```powershell
cd "PocketTrader/app/frontend"
npm install
npm run dev
```

**Database & Migrations**

- Schema file: `app/database/schema.sql` (canonical DDL).
- Migrations are under `app/database/migrations/` (e.g. `02-triggers.sql`, `03-indexes.sql`). Triggers were moved to a migration to avoid Docker MySQL `DELIMITER` issues during container init.
- To run migration SQL against a running DB container (example):

```powershell
$compose='c:\Users\Sam\github projects\poketrader\PocketTrader\app\docker-compose.yml'
$local='c:\Users\Sam\github projects\poketrader\PocketTrader\app\database\migrations\03-indexes.sql'
$cid=(docker-compose -f $compose ps -q db)
docker cp $local ${cid}:/tmp/03-indexes.sql
docker-compose -f $compose exec -T db sh -c 'mysql -uuser -ppassword app_db < /tmp/03-indexes.sql'
```

**Project Layout (key paths)**

- `app/backend` : Flask backend and SQL fragments in `app/backend/sql/`.
- `app/frontend` : Next.js React frontend.
- `app/database` : `schema.sql`, `migrations/`, and helper scripts for DB initialization.

**Notable files**

- `app/database/schema.sql` — main schema, tables and views.
- `app/database/migrations/02-triggers.sql` — DB triggers moved out of schema for container init safety.
- `app/database/migrations/03-indexes.sql` — recommended indexes for performance.
- `app/backend/sql/` — parameterized SQL fragments used by the Flask app.
- `app/frontend/pages/trades.js` — trades UI (displays usernames and uses non-blocking error banners).

**Common Tasks & Tips**

- If the DB init fails due to `DELIMITER` lines, ensure triggers are in migrations rather than the main `schema.sql`.
- After adding indexes in a running DB, you may restart the backend to pick up any connection-level optimizations.
- When updating schema or migrations on a running DB, apply ALTER statements carefully and keep migrations idempotent where possible.

**Next Steps & Recommendations**

- Consider adding idempotency checks in `migrations` to avoid aborts when rerunning scripts.
- Drop redundant single-column indexes after validating performance with `EXPLAIN` to reduce write overhead.
- Consider rewriting `active_trades_view` into a join-based view if the optimizer shows dependent-subquery overhead at scale.

**License / Notes**

- This README is intended as a developer quickstart. See `app/README.md` and subfolders for component-specific docs.
