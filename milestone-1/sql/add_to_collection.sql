INSERT INTO Collection(userID, cardID, quantity, dateAcquired)
VALUES (%s, %s, %s, NOW())
ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity);
