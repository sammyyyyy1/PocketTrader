-- Get trade opportunities for a target user
SELECT t.ownerID, u.username AS ownerName, t.cardID, c.name AS cardName, t.createdAt
FROM TradeOpportunity t
JOIN User u ON u.userID = t.ownerID
JOIN Card c ON c.cardID = t.cardID
WHERE t.targetID = :targetId
ORDER BY t.createdAt DESC;
