-- Find a pending trade matching two cards and two participants
SELECT t.tradeID
FROM Trade t
JOIN Tradecard tc1 ON tc1.tradeID = t.tradeID AND tc1.cardID = %s
JOIN Tradecard tc2 ON tc2.tradeID = t.tradeID AND tc2.cardID = %s
WHERE t.status = 'pending' AND ((t.initiatorID = %s AND t.recipientID = %s) OR (t.initiatorID = %s AND t.recipientID = %s))
LIMIT 1;
