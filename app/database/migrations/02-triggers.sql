-- Triggers to validate and perform confirmation swaps
-- Created as a separate migration so the Docker init process can run it.

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

DROP TRIGGER IF EXISTS trg_trade_before_update$$
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

DROP TRIGGER IF EXISTS trg_trade_after_update$$
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

DROP TRIGGER IF EXISTS trg_trade_before_insert$$
CREATE TRIGGER trg_trade_before_insert
BEFORE INSERT ON Trade
FOR EACH ROW
BEGIN
    SET NEW.status = 'pending';
END$$

DROP TRIGGER IF EXISTS trg_collection_delete_empty$$
CREATE TRIGGER trg_collection_delete_empty
AFTER UPDATE ON Collection
FOR EACH ROW
BEGIN
    IF NEW.quantity <= 0 THEN
        DELETE FROM Collection WHERE userID = NEW.userID AND cardID = NEW.cardID;
    END IF;
END$$

DELIMITER ;
