-- Decline (remove) a pending active trade
-- Params: user1, user2, cardSent1, cardSent2
DELETE FROM ActiveTrades
WHERE user1 = %s
  AND user2 = %s
  AND cardSent1 = %s
  AND cardSent2 = %s
  AND confirmed = FALSE;
