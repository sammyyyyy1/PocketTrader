-- :userId is the viewer, :cardId is the wishlist card to inspect
-- Returns owners (userID, username) who have extra copies (>1) of :cardId, excluding the viewer
SELECT col.userID AS ownerID,
       u.username,
       col.quantity
FROM Collection col
JOIN User u ON u.userID = col.userID
WHERE col.cardID = :cardId
  AND col.userID <> :userId
  AND col.quantity > 1
ORDER BY u.username;
