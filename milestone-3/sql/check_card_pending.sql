-- Check whether a given cardID is part of any pending trade
SELECT t.tradeID
FROM Trade t
JOIN Tradecard tc ON tc.tradeID = t.tradeID
WHERE t.status = 'pending' AND tc.cardID = %s
LIMIT 1;
