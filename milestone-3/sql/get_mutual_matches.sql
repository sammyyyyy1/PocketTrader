-- :me is the logged-in userId
-- Finds users (other) where me wants X and other owns X, and other wants Y and me owns Y
-- Only returns pairs where the two cards share the same rarity
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
-- I want a card the other owns
JOIN Wishlist wantMine        ON wantMine.userID = me.userID
JOIN Collection col_other               ON col_other.userID = other.userID AND col_other.cardID = wantMine.cardID AND col_other.quantity > 0
JOIN Card c1                            ON c1.cardID = wantMine.cardID
-- They want a card I own
JOIN Wishlist wantTheirs     ON wantTheirs.userID = other.userID
JOIN Collection col_me                  ON col_me.userID = me.userID AND col_me.cardID = wantTheirs.cardID AND col_me.quantity > 0
JOIN Card c2                            ON c2.cardID = wantTheirs.cardID
-- Rarity must match
WHERE me.userID = :me
  AND c1.rarity = c2.rarity
ORDER BY other.username, c1.name, c2.name;
