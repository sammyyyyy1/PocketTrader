-- Return quantity for a user's card in collection
SELECT quantity FROM Collection WHERE userID = %s AND cardID = %s;
