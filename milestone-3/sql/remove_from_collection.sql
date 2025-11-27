-- Remove a card from a user's collection
DELETE FROM Collection WHERE userID = :userId AND cardID = :cardId;
