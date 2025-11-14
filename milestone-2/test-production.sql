-- test-production.sql
-- Purpose: Run production-scale queries (limited to top results where appropriate)
USE app_db;

-- List users (top 10)
SELECT userID, username, dateJoined FROM User ORDER BY userID LIMIT 10;

-- Count total cards
SELECT COUNT(*) AS total_cards FROM Card;

-- R6: Browse & Filter my collection (by rarity = '1D') for userID = 1 (limit results)
SELECT c.cardID, c.name, c.rarity, k.type, col.quantity
FROM Collection col
JOIN Card c ON c.cardID = col.cardID
JOIN Card k ON k.cardID = col.cardID
WHERE col.userID = 1 AND c.rarity = '1D'
ORDER BY c.name
LIMIT 10;

-- R6 optional filter example (limit)
SELECT k.cardID, k.name, k.rarity, k.type, col.quantity
FROM Collection col
JOIN Card k ON k.cardID = col.cardID
WHERE col.userID = 1
  AND ('Water' IS NULL OR k.type = 'Water')
  AND ('saur' IS NULL OR k.name LIKE CONCAT('%', 'saur', '%'))
ORDER BY k.rarity, k.name
LIMIT 10;

-- R7: Upsert (safe idempotent)
INSERT INTO Collection(userID, cardID, quantity, dateAcquired)
VALUES (1, 'A1-001', 1, '2025-10-20 13:30:00')
ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity);
SELECT ROW_COUNT() AS affected_rows_after_R7_upsert;

-- Verify upsert
SELECT userID, cardID, quantity FROM Collection WHERE userID = 1 AND cardID = 'A1-001';

-- R8: Wishlist availability for A1-053 (owners other than user 1)
SELECT col.userID AS ownerID, u.username, col.quantity
FROM Collection col
JOIN User u ON u.userID = col.userID
WHERE col.cardID = 'A1-053'
  AND col.userID <> 1
  AND col.quantity > 1
ORDER BY u.username
LIMIT 10;

-- R9: Mutual trade matches for user 1 (limit results)
SELECT
  other.userID           AS partnerID,
  other.username         AS partnerName,
  wantMine.cardID        AS iWant_cardID,
  c1.name                AS iWant_name,
  c1.rarity              AS rarity_required,
  wantTheirs.cardID      AS theyWant_cardID,
  c2.name                AS theyWant_name
FROM User me
JOIN User other ON other.userID <> me.userID
JOIN Wishlist wantMine  ON wantMine.userID = me.userID
JOIN Collection col_other
  ON col_other.userID = other.userID
 AND col_other.cardID = wantMine.cardID
 AND col_other.quantity > 0
JOIN Card c1 ON c1.cardID = wantMine.cardID
JOIN Wishlist wantTheirs ON wantTheirs.userID = other.userID
JOIN Collection col_me
  ON col_me.userID = me.userID
 AND col_me.cardID = wantTheirs.cardID
 AND col_me.quantity > 0
JOIN Card c2 ON c2.cardID = wantTheirs.cardID
WHERE me.userID = 1
  AND c1.rarity = c2.rarity
ORDER BY other.username, c1.name, c2.name
LIMIT 20;

-- R10: Signup uniqueness check for Alice
SELECT 1 FROM User WHERE username = 'Alice' LIMIT 1;

-- R10: Signup insert (idempotent)
INSERT INTO User (username, passwordHash, dateJoined)
VALUES ('newuser_prod', 'pbkdf2:sha256:260000$p2rtzuZtsacRMMRh$17de9a4065b1854876dd243f0dc0f2fdc15140f63dade14c0de99aaf0a07e925', '2025-10-25 15:00:00')
ON DUPLICATE KEY UPDATE passwordHash = VALUES(passwordHash), dateJoined = VALUES(dateJoined);
SELECT ROW_COUNT() AS affected_rows_after_R10_insert;

-- R10: Login query for Alice (retrieve passwordHash)
SELECT passwordHash FROM User WHERE username = 'Alice' LIMIT 1;
