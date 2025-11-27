-- Insert a new pending active trade
-- Params: user1, user2, cardSent1, cardSent2, createdBy
INSERT INTO ActiveTrades (user1, user2, cardSent1, cardSent2, createdBy)
VALUES (%s, %s, %s, %s, %s);
