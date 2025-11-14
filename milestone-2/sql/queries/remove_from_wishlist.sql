-- Remove a wishlist entry for a user
DELETE FROM Wishlist WHERE userID = :userId AND cardID = :cardId;
