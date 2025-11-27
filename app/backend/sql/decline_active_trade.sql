-- Decline (mark rejected) a pending trade via stored procedure
-- Params: user1, user2, cardSent1, cardSent2
-- Decline a trade by tradeID (the caller should locate the matching tradeID)
UPDATE Trade
SET status = 'rejected', dateCompleted = NOW()
WHERE tradeID = %s AND status = 'pending';
