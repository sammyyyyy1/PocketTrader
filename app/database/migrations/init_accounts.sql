USE app_db;

-- Seed primary trainer accounts
INSERT INTO User (username, passwordHash, dateJoined) VALUES
('Alice', 'IAmAlice', '2025-10-20 13:30:00'),
('Bob', 'IAmBob', '2025-10-21 13:30:00'),
('Charlie', 'IAmCharlie', '2025-10-22 09:10:00'),
('Diana', 'IAmDiana', '2025-10-22 11:45:00'),
('Ethan', 'IAmEthan', '2025-10-23 08:05:00');

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
(2, 'A1-285', 4);

-- Give trainers wishlists so they can track desired cards
INSERT INTO Wishlist (userID, cardID, dateAdded) VALUES
(1, 'A1-285', '2025-10-24 10:00:00'),
(1, 'A1-280', '2025-10-24 10:02:00'),
(2, 'A1-096', '2025-10-24 11:15:00'),
(2, 'A1-129', '2025-10-24 11:17:00'),
(3, 'A1-036', '2025-10-25 09:00:00'),
(3, 'A1-232', '2025-10-25 09:05:00'),
(4, 'A1-004', '2025-10-25 14:30:00'),
(4, 'A1-033', '2025-10-25 14:35:00'),
(5, 'A1-056', '2025-10-26 08:10:00'),
(5, 'A1-268', '2025-10-26 08:12:00');
