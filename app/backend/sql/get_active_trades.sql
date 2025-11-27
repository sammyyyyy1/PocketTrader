-- Get active (pending) trades for a given user (as initiator or responder)
-- Params: userID, userID
SELECT
    a.user1 AS initiatorID,
    a.user2 AS responderID,
    a.cardSent1 AS cardOfferedByUser1,
    c1.name AS cardOfferedByUser1Name,
    c1.imageURL AS cardOfferedByUser1Image,
    a.cardSent2 AS cardOfferedByUser2,
    c2.name AS cardOfferedByUser2Name,
    c2.imageURL AS cardOfferedByUser2Image,
    a.confirmed,
    a.createdBy,
    a.confirmedBy,
    a.createdAt
FROM ActiveTrades a
LEFT JOIN Card c1 ON a.cardSent1 = c1.cardID
LEFT JOIN Card c2 ON a.cardSent2 = c2.cardID
WHERE a.user1 = %s OR a.user2 = %s
ORDER BY a.createdAt DESC;
