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

-- ActiveTrades table: tracks confirmed/active trades between two users
CREATE TABLE IF NOT EXISTS ActiveTrades (
    user1 INT NOT NULL,
    user2 INT NOT NULL,
    cardSent1 VARCHAR(50) NOT NULL,
    cardSent2 VARCHAR(50) NOT NULL,
    confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    createdBy INT NOT NULL,
    confirmedBy INT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user1, user2, cardSent1, cardSent2),
    FOREIGN KEY (user1) REFERENCES User(userID) ON DELETE RESTRICT,
    FOREIGN KEY (user2) REFERENCES User(userID) ON DELETE RESTRICT,
    FOREIGN KEY (cardSent1) REFERENCES Card(cardID) ON DELETE RESTRICT,
    FOREIGN KEY (cardSent2) REFERENCES Card(cardID) ON DELETE RESTRICT,
    FOREIGN KEY (createdBy) REFERENCES User(userID) ON DELETE RESTRICT,
    FOREIGN KEY (confirmedBy) REFERENCES User(userID) ON DELETE RESTRICT
);

-- CompletedTrades table: archival record of completed trades (inserted by trigger)
CREATE TABLE IF NOT EXISTS CompletedTrades (
    completedID INT AUTO_INCREMENT PRIMARY KEY,
    user1 INT NOT NULL,
    user2 INT NOT NULL,
    cardFrom1 VARCHAR(50) NOT NULL,
    cardFrom2 VARCHAR(50) NOT NULL,
    completedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1) REFERENCES User(userID) ON DELETE RESTRICT,
    FOREIGN KEY (user2) REFERENCES User(userID) ON DELETE RESTRICT,
    FOREIGN KEY (cardFrom1) REFERENCES Card(cardID) ON DELETE RESTRICT,
    FOREIGN KEY (cardFrom2) REFERENCES Card(cardID) ON DELETE RESTRICT
);

-- Ensure inserts cannot set confirmed=true directly: force FALSE on insert
-- Make trigger creation idempotent: drop if exists first
DROP TRIGGER IF EXISTS trg_activetrades_before_insert;
DELIMITER $$
CREATE TRIGGER trg_activetrades_before_insert
BEFORE INSERT ON ActiveTrades
FOR EACH ROW
BEGIN
    -- Force confirmed to false regardless of what the client provided
    SET NEW.confirmed = FALSE;

    -- Basic sanity: users must be distinct and cards must be distinct
    IF NEW.user1 = NEW.user2 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ActiveTrades: user1 and user2 must differ';
    END IF;

    IF NEW.cardSent1 = NEW.cardSent2 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ActiveTrades: cardSent1 and cardSent2 must differ';
    END IF;

    -- createdBy must be one of the participants
    IF NOT (NEW.createdBy = NEW.user1 OR NEW.createdBy = NEW.user2) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ActiveTrades: createdBy must be one of the participants';
    END IF;

    -- verify user1 actually owns cardSent1 at create time
    IF (SELECT COUNT(*) FROM Collection WHERE userID = NEW.user1 AND cardID = NEW.cardSent1 AND quantity >= 1) = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ActiveTrades: user1 does not own cardSent1 at create time';
    END IF;

    -- verify user2 actually owns cardSent2 at create time
    IF (SELECT COUNT(*) FROM Collection WHERE userID = NEW.user2 AND cardID = NEW.cardSent2 AND quantity >= 1) = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ActiveTrades: user2 does not own cardSent2 at create time';
    END IF;
END$$
DELIMITER ;

-- BEFORE UPDATE validator: when confirming a trade, ensure the confirmer is the counterparty
-- and that both senders actually own the cards to be sent.
DROP TRIGGER IF EXISTS trg_activetrades_before_update;
DELIMITER $$
CREATE TRIGGER trg_activetrades_before_update
BEFORE UPDATE ON ActiveTrades
FOR EACH ROW
BEGIN
    DECLARE cnt1 INT DEFAULT 0;
    DECLARE cnt2 INT DEFAULT 0;

    -- Only validate transitions to confirmed = TRUE
    IF OLD.confirmed = FALSE AND NEW.confirmed = TRUE THEN
        -- confirmedBy must be provided and must be one of the participants
        IF NEW.confirmedBy IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ActiveTrades: confirmedBy must be provided when confirming';
        END IF;

        IF NOT (NEW.confirmedBy = NEW.user1 OR NEW.confirmedBy = NEW.user2) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ActiveTrades: confirmedBy must be one of the participants';
        END IF;

        -- The confirmer cannot be the same as the creator who created the trade
        IF NEW.confirmedBy = OLD.createdBy THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ActiveTrades: creator cannot confirm their own trade';
        END IF;

        -- Check user1 has at least one of cardSent1
        SELECT COUNT(*) INTO cnt1 FROM Collection WHERE userID = NEW.user1 AND cardID = NEW.cardSent1 AND quantity >= 1;
        IF cnt1 = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ActiveTrades: user1 does not have required cardSent1';
        END IF;

        -- Check user2 has at least one of cardSent2
        SELECT COUNT(*) INTO cnt2 FROM Collection WHERE userID = NEW.user2 AND cardID = NEW.cardSent2 AND quantity >= 1;
        IF cnt2 = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ActiveTrades: user2 does not have required cardSent2';
        END IF;
    END IF;
END$$
DELIMITER ;

-- When a row is updated to confirmed = TRUE (transition from FALSE -> TRUE),
-- atomically move cards between collections, update quantities, clear wishlists,
-- and insert an archival row into CompletedTrades. Note: some environments
-- do not allow modifying the triggering table from within its own trigger;
-- to avoid mutating ActiveTrades inside this trigger we record completion in
-- `CompletedTrades` and leave removal of the ActiveTrades row to application
-- logic or a cleanup job.
DROP TRIGGER IF EXISTS trg_activetrades_after_update;
DELIMITER $$
CREATE TRIGGER trg_activetrades_after_update
AFTER UPDATE ON ActiveTrades
FOR EACH ROW
BEGIN
    -- only act on transitions to confirmed = TRUE
    IF OLD.confirmed = FALSE AND NEW.confirmed = TRUE THEN
        -- decrement user1's sent card (cardSent1)
        UPDATE Collection
        SET quantity = quantity - 1
        WHERE userID = NEW.user1 AND cardID = NEW.cardSent1;

        -- increment/add cardSent1 to user2's collection
        INSERT INTO Collection (userID, cardID, quantity)
        VALUES (NEW.user2, NEW.cardSent1, 1)
        ON DUPLICATE KEY UPDATE quantity = quantity + 1;

        -- decrement user2's sent card (cardSent2)
        UPDATE Collection
        SET quantity = quantity - 1
        WHERE userID = NEW.user2 AND cardID = NEW.cardSent2;

        -- increment/add cardSent2 to user1's collection
        INSERT INTO Collection (userID, cardID, quantity)
        VALUES (NEW.user1, NEW.cardSent2, 1)
        ON DUPLICATE KEY UPDATE quantity = quantity + 1;

        -- remove these cards from wishlists for the respective receivers (if present)
        DELETE FROM Wishlist
        WHERE (userID = NEW.user1 AND cardID = NEW.cardSent2)
           OR (userID = NEW.user2 AND cardID = NEW.cardSent1);

        -- record completed trade for audit/history
        INSERT INTO CompletedTrades (user1, user2, cardFrom1, cardFrom2)
        VALUES (NEW.user1, NEW.user2, NEW.cardSent1, NEW.cardSent2);

        -- Note: We do not DELETE the ActiveTrades row here due to trigger
        -- limitations around mutating the same table in a row trigger. The
        -- application or a scheduled cleanup job should remove rows where
        -- confirmed = TRUE after they have been processed by this trigger.
    END IF;
END$$
DELIMITER ;

-- Add indexes to speed lookups on ActiveTrades and CompletedTrades
CREATE INDEX idx_activetrades_user1 ON ActiveTrades (user1);
CREATE INDEX idx_activetrades_user2 ON ActiveTrades (user2);
CREATE INDEX idx_completedtrades_users ON CompletedTrades (user1, user2);

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

-- Ensure other trigger/procedure/event drops for idempotency
-- (Removed trailing DROP block here — individual DROP IF EXISTS are placed
-- immediately before each CREATE to make schema idempotent without
-- accidentally dropping objects after creation.)
