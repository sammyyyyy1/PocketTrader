-- Pokemon Trading Card App - Database Schema

-- NOTE: Trigger definitions were moved to `database/migrations/02-triggers.sql`.
-- The schema file should contain only table/view DDL so the Docker MySQL
-- entrypoint can run it without encountering `DELIMITER` blocks.

-- Users
CREATE TABLE IF NOT EXISTS `User` (
  userID INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  dateJoined DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cards
CREATE TABLE IF NOT EXISTS `Card` (
  cardID VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  packName VARCHAR(100) NOT NULL,
  rarity ENUM('1D','2D','3D','4D','1S','2S','3S','C') NOT NULL,
  type VARCHAR(20) NOT NULL,
  imageURL VARCHAR(255)
);

-- User collections
CREATE TABLE IF NOT EXISTS `Collection` (
  userID INT NOT NULL,
  cardID VARCHAR(50) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  dateAcquired DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (userID, cardID)
);

-- Wishlist entries
CREATE TABLE IF NOT EXISTS `Wishlist` (
  userID INT NOT NULL,
  cardID VARCHAR(50) NOT NULL,
  dateAdded DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (userID, cardID)
);

-- Canonical trade model
CREATE TABLE IF NOT EXISTS `Trade` (
  tradeID INT AUTO_INCREMENT PRIMARY KEY,
  initiatorID INT NOT NULL,
  recipientID INT NOT NULL,
  status ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  createdBy INT NOT NULL,
  confirmedBy INT NULL,
  dateStarted DATETIME DEFAULT CURRENT_TIMESTAMP,
  dateCompleted DATETIME NULL
);

-- Tradecard: cards attached to a trade
CREATE TABLE IF NOT EXISTS `Tradecard` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tradeID INT NOT NULL,
  fromUserID INT NOT NULL,
  cardID VARCHAR(50) NOT NULL,
  toUserID INT NULL
);

-- TradeOpportunity read-model
CREATE TABLE IF NOT EXISTS `TradeOpportunity` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ownerID INT NOT NULL,
  targetID INT NOT NULL,
  cardID VARCHAR(50) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Active trades view derived from canonical Trade + Tradecard (single-card-per-side)
DROP VIEW IF EXISTS active_trades_view;
CREATE VIEW active_trades_view AS
SELECT
  t.tradeID,
  t.initiatorID AS initiatorID,
  t.recipientID AS responderID,
  (SELECT tc.cardID FROM Tradecard tc WHERE tc.tradeID = t.tradeID AND tc.fromUserID = t.initiatorID LIMIT 1) AS cardOfferedByUser1,
  (SELECT c1.name FROM Card c1 WHERE c1.cardID = (SELECT tc.cardID FROM Tradecard tc WHERE tc.tradeID = t.tradeID AND tc.fromUserID = t.initiatorID LIMIT 1)) AS cardOfferedByUser1Name,
  (SELECT c1.imageURL FROM Card c1 WHERE c1.cardID = (SELECT tc.cardID FROM Tradecard tc WHERE tc.tradeID = t.tradeID AND tc.fromUserID = t.initiatorID LIMIT 1)) AS cardOfferedByUser1Image,
  (SELECT tc.cardID FROM Tradecard tc WHERE tc.tradeID = t.tradeID AND tc.fromUserID = t.recipientID LIMIT 1) AS cardOfferedByUser2,
  (SELECT c2.name FROM Card c2 WHERE c2.cardID = (SELECT tc.cardID FROM Tradecard tc WHERE tc.tradeID = t.tradeID AND tc.fromUserID = t.recipientID LIMIT 1)) AS cardOfferedByUser2Name,
  (SELECT c2.imageURL FROM Card c2 WHERE c2.cardID = (SELECT tc.cardID FROM Tradecard tc WHERE tc.tradeID = t.tradeID AND tc.fromUserID = t.recipientID LIMIT 1)) AS cardOfferedByUser2Image,
  t.status,
  t.createdBy,
  t.confirmedBy,
  t.dateCompleted,
  t.dateStarted
FROM Trade t;

-- End of schema
