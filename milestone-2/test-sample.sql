-- test-sample.sql
-- Purpose: Demonstrate key SQL used by the app on the sample dataset
-- Covers R6 (browse/filter collection) and R7 (add to collection upsert), plus basic selects.

USE app_db;

-- List users
SELECT userID, username, dateJoined FROM User ORDER BY userID;

-- List total cards
SELECT COUNT(*) AS total_cards FROM Card;

-- R6: Browse & Filter my collection (by rarity = '1D') for userID = 1
SELECT c.cardID, c.name, c.rarity, k.type, col.quantity
FROM Collection col
JOIN Card c ON c.cardID = col.cardID
JOIN Card k ON k.cardID = col.cardID  -- alias k to also show type explicitly
WHERE col.userID = 1 AND c.rarity = '1D'
ORDER BY c.name;

-- R6: Browse & Filter with optional filters (rarity/type/name)
-- Example: rarity=NULL, type='Water', name LIKE '%saur%' for userID = 1
SELECT k.cardID, k.name, k.rarity, k.type, col.quantity
FROM Collection col
JOIN Card k ON k.cardID = col.cardID
WHERE col.userID = 1
  AND (NULL IS NULL OR k.rarity = NULL)
  AND ('Water' IS NULL OR k.type   = 'Water')
  AND ('saur' IS NULL OR k.name LIKE CONCAT('%', 'saur', '%'))
ORDER BY k.rarity, k.name;

-- R7: Add to collection (simulate insert/upsert)
INSERT INTO Collection(userID, cardID, quantity, dateAcquired)
VALUES (1, 'A1-001', 1, '2025-10-20 13:30:00')
ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity);

-- Verify the upsert result
SELECT userID, cardID, quantity FROM Collection WHERE userID = 1 AND cardID = 'A1-001';

-- R8: Wishlist availability - see who owns cards user 1 wants
SELECT w.cardID, c.name,
       COUNT(DISTINCT col.userID)     AS owners,
       COALESCE(SUM(col.quantity), 0) AS total_copies
FROM Wishlist w
JOIN Card c ON c.cardID = w.cardID
LEFT JOIN Collection col
  ON col.cardID = w.cardID AND col.userID <> 1
WHERE w.userID = 1
GROUP BY w.cardID, c.name
ORDER BY owners DESC, c.name;

-- R9: Find mutual trade matches for user 1
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
ORDER BY other.username, c1.name, c2.name;

-- R10: Signup uniqueness check - verify if username 'a' already exists
SELECT 1 FROM User WHERE username = 'a';

-- R10: Signup insert - create a new user 'newuser'
INSERT INTO User (username, passwordHash, dateJoined)
VALUES ('newuser', 'hashedpassword456', '2025-10-25 15:00:00');

-- R10: Login query - retrieve passwordHash for username 'a'
SELECT passwordHash FROM User WHERE username = 'a';

