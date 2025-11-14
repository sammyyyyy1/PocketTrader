USE app_db;

-- Create sample users for testing
INSERT INTO User (username, passwordHash, dateJoined) VALUES
('trainer', 'password123', '2025-10-20 13:30:00'),
('Bob', 'password123', '2025-10-21 14:00:00'),
('Chloe', 'password123', '2025-10-22 09:00:00'),
('a', 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb', '2025-10-23 10:00:00');


INSERT INTO Card (cardID, name, packName, rarity, type, imageURL) VALUES
('A1-285', 'Pikachu ex', 'Shared', 'C', 'Lightning', 'https://assets.tcgdex.net/en/tcgp/A1/285/high.webp'),
('A1-286', 'Mewtwo ex', 'Shared', 'C', 'Psychic', 'https://assets.tcgdex.net/en/tcgp/A1/286/high.webp'),
('A1-282', 'Mewtwo ex', 'Mewtwo', '3S', 'Psychic', 'https://assets.tcgdex.net/en/tcgp/A1/282/high.webp'),
('A1-280', 'Charizard ex', 'Charizard', '3S', 'Fire', 'https://assets.tcgdex.net/en/tcgp/A1/280/high.webp'),
('A1-281', 'Pikachu ex', 'Pikachu', '3S', 'Lightning', 'https://assets.tcgdex.net/en/tcgp/A1/281/high.webp'),
('A1-004', 'Venusaur ex', 'Mewtwo', '4D', 'Grass', 'https://assets.tcgdex.net/en/tcgp/A1/004/high.webp'),
('A1-036', 'Charizard ex', 'Charizard', '4D', 'Fire', 'https://assets.tcgdex.net/en/tcgp/A1/036/high.webp'),
('A1-056', 'Blastoise ex', 'Pikachu', '4D', 'Water', 'https://assets.tcgdex.net/en/tcgp/A1/056/high.webp'),
('A1-096', 'Pikachu ex', 'Pikachu', '4D', 'Lightning', 'https://assets.tcgdex.net/en/tcgp/A1/096/high.webp'),
('A1-129', 'Mewtwo ex', 'Mewtwo', '4D', 'Psychic', 'https://assets.tcgdex.net/en/tcgp/A1/129/high.webp'),
('A1-003', 'Venusaur', 'Mewtwo', '3D', 'Grass', 'https://assets.tcgdex.net/en/tcgp/A1/003/high.webp'),
('A1-035', 'Charizard', 'Charizard', '3D', 'Fire', 'https://assets.tcgdex.net/en/tcgp/A1/035/high.webp'),
('A1-055', 'Blastoise', 'Pikachu', '3D', 'Water', 'https://assets.tcgdex.net/en/tcgp/A1/055/high.webp'),
('A1-268', 'Blaine', 'Charizard', '2S', 'Trainer', 'https://assets.tcgdex.net/en/tcgp/A1/268/high.webp'),
('A1-267', 'Misty', 'Pikachu', '2S', 'Trainer', 'https://assets.tcgdex.net/en/tcgp/A1/267/high.webp'),
('A1-266', 'Erika', 'Charizard', '2S', 'Trainer', 'https://assets.tcgdex.net/en/tcgp/A1/266/high.webp'),
('A1-002', 'Ivysaur', 'Mewtwo', '2D', 'Grass', 'https://assets.tcgdex.net/en/tcgp/A1/002/high.webp'),
('A1-034', 'Charmeleon', 'Charizard', '2D', 'Fire', 'https://assets.tcgdex.net/en/tcgp/A1/034/high.webp'),
('A1-054', 'Wartortle', 'Pikachu', '2D', 'Water', 'https://assets.tcgdex.net/en/tcgp/A1/054/high.webp'),
('A1-227', 'Bulbasaur', 'Mewtwo', '1S', 'Grass', 'https://assets.tcgdex.net/en/tcgp/A1/227/high.webp'),
('A1-230', 'Charmander', 'Charizard', '1S', 'Fire', 'https://assets.tcgdex.net/en/tcgp/A1/230/high.webp'),
('A1-232', 'Squirtle', 'Pikachu', '1S', 'Water', 'https://assets.tcgdex.net/en/tcgp/A1/232/high.webp'),
('A1-001', 'Bulbasaur', 'Mewtwo', '1D', 'Grass', 'https://assets.tcgdex.net/en/tcgp/A1/001/high.webp'),
('A1-033', 'Charmander', 'Charizard', '1D', 'Fire', 'https://assets.tcgdex.net/en/tcgp/A1/033/high.webp'),
('A1-053', 'Squirtle', 'Pikachu', '1D', 'Water', 'https://assets.tcgdex.net/en/tcgp/A1/053/high.webp'),
('A1-094', 'Pikachu', 'Pikachu', '1D', 'Lightning', 'https://assets.tcgdex.net/en/tcgp/A1/094/high.webp');

INSERT INTO Collection (userID, cardID, quantity) VALUES
-- User 1 (trainer) collection
(1, 'A1-001', 2),
(1, 'A1-033', 1),
(1, 'A1-053', 1),
(1, 'A1-003', 1),
(1, 'A1-035', 1),
(1, 'A1-055', 1),
(1, 'A1-096', 1),
(1, 'A1-094', 3),
(2, 'A1-053', 2),
(3, 'A1-001', 1);

INSERT INTO Wishlist (userID, cardID, dateAdded) VALUES
(1, 'A1-053', '2025-10-24 10:00:00'),
(1, 'A1-001', '2025-10-24 10:05:00'),
(2, 'A1-033', '2025-10-24 11:00:00'),
(3, 'A1-033', '2025-10-24 12:00:00');

