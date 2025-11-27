-- Insert a new user row using a supplied password hash; dateJoined set to NOW()
INSERT INTO User(username, passwordHash, dateJoined)
VALUES (:username, :passwordHash, NOW());
