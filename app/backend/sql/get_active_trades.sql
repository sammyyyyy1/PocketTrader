-- Get active trades (built from canonical Trade + Tradecard via view)
-- Params: userID, userID
SELECT
    at.initiatorID AS initiatorID,
    at.responderID AS responderID,
    at.cardOfferedByUser1 AS cardOfferedByUser1,
    at.cardOfferedByUser1Name AS cardOfferedByUser1Name,
    at.cardOfferedByUser1Image AS cardOfferedByUser1Image,
    at.cardOfferedByUser2 AS cardOfferedByUser2,
    at.cardOfferedByUser2Name AS cardOfferedByUser2Name,
    at.cardOfferedByUser2Image AS cardOfferedByUser2Image,
    (at.status = 'accepted') AS confirmed,
    at.createdBy,
    at.confirmedBy,
    at.dateStarted AS createdAt
FROM active_trades_view at
WHERE at.initiatorID = %s OR at.responderID = %s
ORDER BY at.dateStarted DESC;
