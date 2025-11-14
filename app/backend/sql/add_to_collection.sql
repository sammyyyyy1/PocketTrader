INSERT INTO Collection(userID, cardID, quantity, dateAcquired)
VALUES (:userId, :cardId, :quantity, NOW())
ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity);
