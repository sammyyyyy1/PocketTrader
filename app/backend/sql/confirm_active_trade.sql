-- Confirm a pending trade: call stored procedure to validate and perform collection transfers
-- Params: confirmedBy, user1, user2, cardSent1, cardSent2
-- Confirm a trade by tradeID. Triggers on Trade will perform the collection swap.
UPDATE Trade
SET status = 'accepted', confirmedBy = %s, dateCompleted = NOW()
WHERE tradeID = %s AND status = 'pending';
