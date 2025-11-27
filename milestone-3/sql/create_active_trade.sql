-- Create a new Trade + Tradecard entries (canonical model)
-- Params: user1, user2, cardSent1, cardSent2, createdBy
-- Insert a new Trade row. Validation should be performed by the caller.
INSERT INTO Trade (initiatorID, recipientID, status, dateStarted, createdBy)
VALUES (%s, %s, 'pending', NOW(), %s);
