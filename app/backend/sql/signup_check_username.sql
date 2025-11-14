-- Check whether a username already exists (returns 1 if present)
SELECT 1 FROM User WHERE username = :username;
