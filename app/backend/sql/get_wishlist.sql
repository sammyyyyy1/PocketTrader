-- Get a user's wishlist items with optional filters (same named-param pattern as get_collection.sql)
SELECT c.cardID, c.name, c.packName, c.rarity, c.type, w.dateAdded, c.imageURL
FROM Wishlist w
JOIN Card c USING (cardID)
WHERE w.userID = :userId
  AND ( :rarityOpt IS NULL OR c.rarity = :rarityOpt )
  AND ( :typeOpt IS NULL OR c.type = :typeOpt )
  AND ( :packOpt IS NULL OR c.packName = :packOpt )
  AND ( :nameSearchOpt IS NULL OR c.name LIKE CONCAT('%', :nameSearchOpt, '%') )
ORDER BY c.rarity, c.name;
