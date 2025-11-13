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

