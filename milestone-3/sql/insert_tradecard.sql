-- Insert a Tradecard for an existing trade
INSERT INTO Tradecard (tradeID, cardID, fromUserID, toUserID)
VALUES (%s, %s, %s, %s);
