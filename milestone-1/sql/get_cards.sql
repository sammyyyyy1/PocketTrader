SELECT cardID, name, packName, rarity, type, imageURL
FROM Card
ORDER BY 
  CASE rarity
    WHEN 'C'  THEN 1
    WHEN '3S' THEN 2
    WHEN '4D' THEN 3
    WHEN '3D' THEN 4
    WHEN '2S' THEN 5
    WHEN '1S' THEN 6
    WHEN '2D' THEN 7
    WHEN '1D' THEN 8
    ELSE 99
  END,
  name;
