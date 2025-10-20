-- :userId, :rarityOpt, :typeOpt, :packOpt, :nameSearchOpt are parameters
SELECT c.cardID, c.name, c.rarity, c.type, col.quantity
FROM Collection col
JOIN Card c ON c.cardID = col.cardID
WHERE col.userID = :userId
  AND (:rarityOpt IS NULL OR c.rarity = :rarityOpt)
  AND (:typeOpt   IS NULL OR c.type   = :typeOpt)
  AND (:packOpt   IS NULL OR c.packName = :packOpt)
  AND (:nameSearchOpt IS NULL OR c.name LIKE CONCAT('%%', :nameSearchOpt, '%%'))
ORDER BY c.rarity, c.name;
