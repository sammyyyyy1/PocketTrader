SELECT userID, username, passwordHash, dateJoined
FROM User
WHERE username = :username;
