-- Confirm a pending active trade (set confirmed = TRUE and set confirmedBy)
-- Params: confirmedBy, user1, user2, cardSent1, cardSent2
UPDATE ActiveTrades
SET confirmed = TRUE,
    confirmedBy = %s
WHERE user1 = %s
  AND user2 = %s
  AND cardSent1 = %s
  AND cardSent2 = %s
  AND confirmed = FALSE;
