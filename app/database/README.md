# Database Setup & Initialization

## How Database Initialization Works

This project uses **MySQL's automatic initialization feature** to set up the database when Docker containers are first created.

### First-Time Setup (New Team Member)

When someone clones the repo and runs:

```bash
docker compose up --build
```

MySQL automatically executes all `.sql` files in `/docker-entrypoint-initdb.d/` in alphabetical order:

1. **`01-schema.sql`** - Creates all tables (USER, CARD, COLLECTION, WISHLIST, TRADE, TRADECARD)
2. **`02-init.sql`** - Inserts seed data (20 Pokemon cards)

### Persistent Data

- Database data is stored in a **Docker volume** (`db_data`)
- Data persists across `docker compose down` and `docker compose up`
- Initialization scripts **only run once** when the volume is empty

## Resetting the Database

To start fresh (e.g., after schema changes):

```bash
# Stop containers and remove volumes
docker compose down -v

# Rebuild and start fresh
docker compose up --build
```

The `-v` flag removes volumes, triggering re-initialization.

## Schema Overview

```
USER (userID, username, passwordHash, dateJoined)
  ↓
COLLECTION (userID, cardID, quantity, dateAcquired) ← references CARD
  ↓
WISHLIST (userID, cardID, dateAdded) ← references CARD
  ↓
TRADE (tradeID, initiatorID, recipientID, status, dateStarted, dateCompleted)
  ↓
TRADECARD (tradeCardID, tradeID, cardID, fromUserID, toUserID)
```

## Sample Data

All cards are from the **Genetic Apex** pack. We took a sample of 26 cards of varying rarities.

### Empty Tables

- USER, COLLECTION, WISHLIST, TRADE, TRADECARD start empty
- These will be populated during normal app usage

## Adding More Seed Data

To add more cards:

1. Edit `migrations/init.sql`
2. Add `INSERT INTO CARD` statements
3. Reset database: `docker compose down -v && docker compose up --build`

## Production Considerations

For production environments:

- Use proper database migrations (Alembic, Flyway, etc.)
- Don't rely on `/docker-entrypoint-initdb.d/` for schema changes
- Consider using separate seed data files for dev vs prod
- Store sensitive data (passwords) securely with proper hashing

## Querying the Database

From the host machine:

```bash
mysql -h 127.0.0.1 -P 3307 -u user -p app_db
# Password: password
```

From inside the backend container:

```bash
docker compose exec backend python -c "
from flask import Flask
from flask_mysqldb import MySQL
app = Flask(__name__)
app.config['MYSQL_HOST'] = 'db'
app.config['MYSQL_USER'] = 'user'
app.config['MYSQL_PASSWORD'] = 'password'
app.config['MYSQL_DB'] = 'app_db'
mysql = MySQL(app)
with app.app_context():
    cur = mysql.connection.cursor()
    cur.execute('SELECT COUNT(*) FROM CARD')
    print(f'Cards in database: {cur.fetchone()[0]}')
"
```
