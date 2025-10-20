SELECT k.cardID, k.name, k.packName, k.rarity, k.type, c.quantity, k.imageURL
FROM Collection c
JOIN Card k ON k.cardID = c.cardID
WHERE c.userID = %s
  AND (%s IS NULL OR k.rarity = %s)
  AND (%s IS NULL OR k.type   = %s)
  AND (%s IS NULL OR k.packName = %s)
  AND (%s IS NULL OR k.name LIKE CONCAT('%%', %s, '%%'))
ORDER BY k.rarity, k.name;
