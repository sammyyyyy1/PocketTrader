-- Pokemon Trading Card App - Database Schema

-- User table
CREATE TABLE User (
    userID INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    dateJoined DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Card table
CREATE TABLE Card (
    cardID VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    packName VARCHAR(100) NOT NULL,
    rarity ENUM('1D', '2D', '3D', '4D', '1S', '2S', '3S', 'C') NOT NULL,
    type VARCHAR(20) NOT NULL,
    imageURL VARCHAR(255)
);

-- Collection table (user's owned cards)
CREATE TABLE Collection (
    userID INT,
    cardID VARCHAR(50),
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    dateAcquired DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (userID, cardID),
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE,
    FOREIGN KEY (cardID) REFERENCES Card(cardID) ON DELETE RESTRICT
);

-- Wishlist table
CREATE TABLE Wishlist (
    userID INT,
    cardID VARCHAR(50),
    dateAdded DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (userID, cardID),
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE,
    FOREIGN KEY (cardID) REFERENCES Card(cardID) ON DELETE RESTRICT
);

-- Trade table
CREATE TABLE Trade (
    tradeID INT AUTO_INCREMENT PRIMARY KEY,
    initiatorID INT NOT NULL,
    recipientID INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
    dateStarted DATETIME DEFAULT CURRENT_TIMESTAMP,
    dateCompleted DATETIME,
    FOREIGN KEY (initiatorID) REFERENCES User(userID) ON DELETE RESTRICT,
    FOREIGN KEY (recipientID) REFERENCES User(userID) ON DELETE RESTRICT,
    CHECK (initiatorID != recipientID)
);

-- Tradecard table
CREATE TABLE Tradecard (
    tradeCardID INT AUTO_INCREMENT PRIMARY KEY,
    tradeID INT NOT NULL,
    cardID VARCHAR(50) NOT NULL,
    fromUserID INT NOT NULL,
    toUserID INT NOT NULL,
    FOREIGN KEY (tradeID) REFERENCES Trade(tradeID) ON DELETE CASCADE,
    FOREIGN KEY (cardID) REFERENCES Card(cardID) ON DELETE RESTRICT,
    FOREIGN KEY (fromUserID) REFERENCES User(userID) ON DELETE RESTRICT,
    FOREIGN KEY (toUserID) REFERENCES User(userID) ON DELETE RESTRICT
);

-- Create indexes for better query performance
CREATE INDEX idx_collection_card_qty_user ON Collection (cardID, quantity, userID); -- R8
CREATE INDEX idx_wishlist_card_user ON Wishlist(cardID, userID); -- R9
CREATE INDEX idx_trade_initiator ON Trade(initiatorID);
CREATE INDEX idx_trade_recipient ON Trade(recipientID);
CREATE INDEX idx_trade_status ON Trade(status);
CREATE INDEX idx_tradecard_tradeid ON Tradecard(tradeID);

-- TradeOpportunity table: records potential trade matches when a user has 2+ copies
CREATE TABLE IF NOT EXISTS TradeOpportunity (
        ownerID INT NOT NULL,
        targetID INT NOT NULL,
        cardID VARCHAR(50) NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (ownerID, targetID, cardID),
        FOREIGN KEY (ownerID) REFERENCES User(userID) ON DELETE CASCADE,
        FOREIGN KEY (targetID) REFERENCES User(userID) ON DELETE CASCADE,
        FOREIGN KEY (cardID) REFERENCES Card(cardID) ON DELETE RESTRICT
);

DELIMITER $$
CREATE TRIGGER trg_collection_after_insert
AFTER INSERT ON Collection
FOR EACH ROW
BEGIN
    IF NEW.quantity >= 2 THEN
        INSERT IGNORE INTO TradeOpportunity (ownerID, targetID, cardID)
        SELECT NEW.userID, w.userID, NEW.cardID
        FROM Wishlist w
        WHERE w.cardID = NEW.cardID
            AND w.userID <> NEW.userID;
    END IF;
END$$

CREATE TRIGGER trg_collection_after_update
AFTER UPDATE ON Collection
FOR EACH ROW
BEGIN
    IF OLD.quantity < 2 AND NEW.quantity >= 2 THEN
        INSERT IGNORE INTO TradeOpportunity (ownerID, targetID, cardID)
        SELECT NEW.userID, w.userID, NEW.cardID
        FROM Wishlist w
        WHERE w.cardID = NEW.cardID
            AND w.userID <> NEW.userID;
    END IF;
END$$
DELIMITER ;

-- Market Trends View
CREATE VIEW market_trends_view AS
SELECT
    c.cardID,
    c.name,
    c.rarity,
    c.packName,
    c.imageURL,
    COALESCE(demand.demandCount, 0) AS demand,
    COALESCE(supply.supplyCount, 0) AS supply,
    COALESCE(demand.demandCount, 0) - COALESCE(supply.supplyCount, 0) AS trend
FROM Card c
LEFT JOIN (
    SELECT
        cardID,
        COUNT(DISTINCT userID) AS demandCount
    FROM Wishlist
    GROUP BY cardID
) AS demand ON c.cardID = demand.cardID
LEFT JOIN (
    SELECT
        cardID,
        SUM(quantity) AS supplyCount
    FROM Collection
    GROUP BY cardID
) AS supply ON c.cardID = supply.cardID;

-- Trigger: remove a collection row when quantity drops to zero or below
DROP TRIGGER IF EXISTS trg_collection_delete_empty;
DELIMITER //
CREATE TRIGGER trg_collection_delete_empty
AFTER UPDATE ON Collection
FOR EACH ROW
BEGIN
    IF NEW.quantity <= 0 THEN
        DELETE FROM Collection WHERE userID = NEW.userID AND cardID = NEW.cardID;
    END IF;
END//
DELIMITER ;
