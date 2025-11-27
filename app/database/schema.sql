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
    createdBy INT NOT NULL,
    confirmedBy INT NULL,
    FOREIGN KEY (initiatorID) REFERENCES User(userID) ON DELETE RESTRICT,
    FOREIGN KEY (recipientID) REFERENCES User(userID) ON DELETE RESTRICT,
    FOREIGN KEY (createdBy) REFERENCES User(userID) ON DELETE RESTRICT,
    FOREIGN KEY (confirmedBy) REFERENCES User(userID) ON DELETE RESTRICT,
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

-- Active trades view derived from canonical Trade + Tradecard
DROP VIEW IF EXISTS active_trades_view;
DELIMITER $$
CREATE VIEW active_trades_view AS
SELECT
    t.tradeID,
    t.initiatorID AS user1,
    t.recipientID AS user2,
    -- pick a representative card offered by initiator (single-card-per-side view)
    (SELECT tc.cardID FROM Tradecard tc WHERE tc.tradeID = t.tradeID AND tc.fromUserID = t.initiatorID LIMIT 1) AS cardSent1,
    (SELECT c1.name FROM Card c1 WHERE c1.cardID = (SELECT tc.cardID FROM Tradecard tc WHERE tc.tradeID = t.tradeID AND tc.fromUserID = t.initiatorID LIMIT 1)) AS cardSent1Name,
    (SELECT c1.imageURL FROM Card c1 WHERE c1.cardID = (SELECT tc.cardID FROM Tradecard tc WHERE tc.tradeID = t.tradeID AND tc.fromUserID = t.initiatorID LIMIT 1)) AS cardSent1Image,
    (SELECT tc.cardID FROM Tradecard tc WHERE tc.tradeID = t.tradeID AND tc.fromUserID = t.recipientID LIMIT 1) AS cardSent2,
    (SELECT c2.name FROM Card c2 WHERE c2.cardID = (SELECT tc.cardID FROM Tradecard tc WHERE tc.tradeID = t.tradeID AND tc.fromUserID = t.recipientID LIMIT 1)) AS cardSent2Name,
    (SELECT c2.imageURL FROM Card c2 WHERE c2.cardID = (SELECT tc.cardID FROM Tradecard tc WHERE tc.tradeID = t.tradeID AND tc.fromUserID = t.recipientID LIMIT 1)) AS cardSent2Image,
    t.status,
    t.createdBy,
    t.confirmedBy,
    t.dateStarted
FROM Trade t;
DELIMITER ;

-- Triggers on Trade to validate and perform confirmation swaps
DROP TRIGGER IF EXISTS trg_trade_before_update;
DELIMITER $$
CREATE TRIGGER trg_trade_before_update
BEFORE UPDATE ON Trade
FOR EACH ROW
BEGIN
    DECLARE cnt1 INT DEFAULT 0;
    DECLARE cnt2 INT DEFAULT 0;
    DECLARE v_card1 VARCHAR(50);
    DECLARE v_card2 VARCHAR(50);

    -- Only validate transitions to accepted
    IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
        -- confirmedBy must be provided and must be one of the participants
        IF NEW.confirmedBy IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Trade: confirmedBy must be provided when confirming';
        END IF;
        IF NOT (NEW.confirmedBy = OLD.initiatorID OR NEW.confirmedBy = OLD.recipientID) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Trade: confirmedBy must be one of the participants';
        END IF;

        -- The confirmer cannot be the same as the creator
        IF NEW.confirmedBy = OLD.createdBy THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Trade: creator cannot confirm their own trade';
        END IF;

        -- Get representative cards (single-card-per-side assumption)
        SELECT tc.cardID INTO v_card1 FROM Tradecard tc WHERE tc.tradeID = OLD.tradeID AND tc.fromUserID = OLD.initiatorID LIMIT 1;
        SELECT tc.cardID INTO v_card2 FROM Tradecard tc WHERE tc.tradeID = OLD.tradeID AND tc.fromUserID = OLD.recipientID LIMIT 1;

        -- Check user ownership
        SELECT COUNT(*) INTO cnt1 FROM Collection WHERE userID = OLD.initiatorID AND cardID = v_card1 AND quantity >= 1;
        SELECT COUNT(*) INTO cnt2 FROM Collection WHERE userID = OLD.recipientID AND cardID = v_card2 AND quantity >= 1;
        IF cnt1 = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Trade: initiator does not have required card at confirmation time';
        END IF;
        IF cnt2 = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Trade: recipient does not have required card at confirmation time';
        END IF;
    END IF;
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS trg_trade_after_update;
DELIMITER $$
CREATE TRIGGER trg_trade_after_update
AFTER UPDATE ON Trade
FOR EACH ROW
BEGIN
    DECLARE v_card1 VARCHAR(50);
    DECLARE v_card2 VARCHAR(50);

    IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
        -- fetch the one card IDs per participant
        SELECT tc.cardID INTO v_card1 FROM Tradecard tc WHERE tc.tradeID = NEW.tradeID AND tc.fromUserID = NEW.initiatorID LIMIT 1;
        SELECT tc.cardID INTO v_card2 FROM Tradecard tc WHERE tc.tradeID = NEW.tradeID AND tc.fromUserID = NEW.recipientID LIMIT 1;

        -- decrement initiator's card
        UPDATE Collection SET quantity = quantity - 1 WHERE userID = NEW.initiatorID AND cardID = v_card1;
        -- increment/add to recipient
        INSERT INTO Collection (userID, cardID, quantity) VALUES (NEW.recipientID, v_card1, 1)
            ON DUPLICATE KEY UPDATE quantity = quantity + 1;

        -- decrement recipient's card
        UPDATE Collection SET quantity = quantity - 1 WHERE userID = NEW.recipientID AND cardID = v_card2;
        -- increment/add to initiator
        INSERT INTO Collection (userID, cardID, quantity) VALUES (NEW.initiatorID, v_card2, 1)
            ON DUPLICATE KEY UPDATE quantity = quantity + 1;

    END IF;
END$$
DELIMITER ;

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

-- Ensure other trigger/procedure/event drops for idempotency
-- (Removed trailing DROP block here — individual DROP IF EXISTS are placed
-- immediately before each CREATE to make schema idempotent without
-- accidentally dropping objects after creation.)
