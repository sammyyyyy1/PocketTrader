-- Get active trades (built from canonical Trade + Tradecard via view)
-- Params: userID, userID
SELECT
    at.user1 AS initiatorID,
    at.user2 AS responderID,
    at.cardSent1 AS cardOfferedByUser1,
    at.cardSent1Name AS cardOfferedByUser1Name,
    at.cardSent1Image AS cardOfferedByUser1Image,
    at.cardSent2 AS cardOfferedByUser2,
    at.cardSent2Name AS cardOfferedByUser2Name,
    at.cardSent2Image AS cardOfferedByUser2Image,
    (at.status = 'accepted') AS confirmed,
    at.createdBy,
    at.confirmedBy,
    at.dateStarted AS createdAt
FROM active_trades_view at
WHERE at.user1 = %s OR at.user2 = %s
ORDER BY at.dateStarted DESC;
