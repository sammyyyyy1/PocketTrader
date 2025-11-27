-- One-time population of TradeOpportunity from existing Collection and Wishlist
-- Inserts rows for owners who have quantity >= 2 and targets who have the card on their wishlist.
-- Safe to run multiple times because it uses INSERT IGNORE.

INSERT IGNORE INTO TradeOpportunity (ownerID, targetID, cardID)
SELECT col.userID AS ownerID, w.userID AS targetID, col.cardID
FROM Collection col
JOIN Wishlist w ON w.cardID = col.cardID
WHERE col.quantity >= 2
  AND w.userID <> col.userID;
