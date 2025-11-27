-- Insert wishlist entry or update timestamp if exists
INSERT INTO Wishlist (userID, cardID, dateAdded)
VALUES (:userId, :cardId, NOW())
ON DUPLICATE KEY UPDATE dateAdded = VALUES(dateAdded);
