USE app_db;

-- Seed primary trainer accounts
INSERT INTO User (username, passwordHash, dateJoined) VALUES
('Alice', 'pbkdf2:sha256:260000$hEA1K1n8f2ZGPUKu$47947a693aa5b690ff4c21981b6a7ece50a7f9d0ee1a8e0e4ce00ffe4e512680', '2025-10-20 13:30:00'),
('Bob', 'pbkdf2:sha256:260000$Bit1Y7fUyvWhoiP8$fc31a970c590452a72ac5896795648394556ea62a91309a97dc6120943620a2d', '2025-10-21 13:30:00'),
('Charlie', 'pbkdf2:sha256:260000$TBJNd12NZyfbvopr$597a8951c1416ad59f1d3dee6fde37061d03b347dd239ae05d7eece0dd297943', '2025-10-22 09:10:00'),
('Diana', 'pbkdf2:sha256:260000$vJsqe6ncGQJfdQLL$a4eeb9fe34f22b66376d8c9b26c7a5004cc88160b10c625876dc441e683d764a', '2025-10-22 11:45:00'),
('Ethan', 'pbkdf2:sha256:260000$sqQCSudk3sQlWQxo$da081933eedf8a7b88fe8ec3bd0f8f6e4e317997f63c219f9fd8f9b990b308df', '2025-10-23 08:05:00');

-- Seed a sample collection for the sample user (userID = 1)
INSERT INTO Collection (userID, cardID, quantity) VALUES
(1, 'A1-001', 2),
(1, 'A1-033', 1),
(1, 'A1-053', 1),
(1, 'A1-003', 1),
(1, 'A1-035', 1),
(1, 'A1-055', 1),
(1, 'A1-096', 1),
(1, 'A1-094', 3),
(2, 'A1-053', 2),
(2, 'A1-285', 4);

-- Give trainers wishlists so they can track desired cards
INSERT INTO Wishlist (userID, cardID, dateAdded) VALUES
(1, 'A1-285', '2025-10-24 10:00:00'),
(1, 'A1-280', '2025-10-24 10:02:00'),
(1, 'A1-053', '2025-10-24 10:05:00'),
(2, 'A1-096', '2025-10-24 11:15:00'),
(2, 'A1-129', '2025-10-24 11:17:00'),
(2, 'A1-001', '2025-10-24 11:20:00'),
(3, 'A1-036', '2025-10-25 09:00:00'),
(3, 'A1-232', '2025-10-25 09:05:00'),
(4, 'A1-004', '2025-10-25 14:30:00'),
(4, 'A1-033', '2025-10-25 14:35:00'),
(5, 'A1-056', '2025-10-26 08:10:00'),
(5, 'A1-268', '2025-10-26 08:12:00');
