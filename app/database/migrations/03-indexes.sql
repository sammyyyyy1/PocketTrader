-- Collection: find owners by card quickly
CREATE INDEX idx_collection_cardID ON Collection(cardID);

-- Wishlist: find wishlist owners quickly
CREATE INDEX idx_wishlist_cardID ON Wishlist(cardID);

-- Trade: filter by status and lookup trades for a user
CREATE INDEX idx_trade_status ON Trade(status);
CREATE INDEX idx_trade_initiator_recipient ON Trade(initiatorID, recipientID);

-- Tradecard: joins from Trade -> Tradecard and lookups by fromUser
CREATE INDEX idx_tradecard_tradeID ON Tradecard(tradeID);
CREATE INDEX idx_tradecard_fromUserID ON Tradecard(fromUserID);
CREATE INDEX idx_tradecard_toUserID ON Tradecard(toUserID);
CREATE INDEX idx_tradecard_cardID ON Tradecard(cardID);

-- TradeOpportunity: fast lookup of opportunities for a target user
CREATE INDEX idx_tradeopportunity_target ON TradeOpportunity(targetID);