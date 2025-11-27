import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getStoredUser } from "../utils/auth";
import Modal from "../components/Modal";
import Card from "../components/Card";
import CardFilters from "../components/CardFilters";

const TradesPage = () => {
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Read stored user only on client after mount to avoid SSR/CSR mismatch
    const u = getStoredUser();
    setUser(u);
    setMounted(true);
  }, []);

  const userID = user ? user.userID : null;

  const [activeTrades, setActiveTrades] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const [allCards, setAllCards] = useState([]);
  const [cardsMap, setCardsMap] = useState({});
  const [usersMap, setUsersMap] = useState({});

  // filters for collection view inside modal
  const [rarityFilter, setRarityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [packFilter, setPackFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [viewModal, setViewModal] = useState({ open: false, trade: null });
  const [createModal, setCreateModal] = useState({
    open: false,
    opportunity: null,
  });
  const [myCollection, setMyCollection] = useState([]);
  const [matches, setMatches] = useState([]);
  const [actionError, setActionError] = useState(null);
  const errorTimerRef = React.useRef();

  const showActionError = (msg) => {
    console.error(msg);
    setActionError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setActionError(null), 5000);
  };

  useEffect(() => {
    if (!mounted || !userID) return;
    setLoading(true);
    // fetch active trades, users and opportunities
    const base = "http://localhost:5001";
    Promise.all([
      fetch(`${base}/api/active-trades?userID=${userID}`).then((r) => r.json()),
      fetch(`${base}/api/users`).then((r) => r.json()),
      fetch(`${base}/api/trade-opportunities?userID=${userID}`).then((r) =>
        r.json()
      ),
      fetch(`${base}/api/collection?userID=${userID}`).then((r) => r.json()),
      fetch(`${base}/api/matches?userID=${userID}`).then((r) => r.json()),
      fetch(`${base}/api/cards`).then((r) => r.json()),
    ])
      .then(([tradesRes, usersRes, oppRes, collRes, matchesRes, cardsRes]) => {
        if (tradesRes && tradesRes.status === "success")
          setActiveTrades(tradesRes.items || []);
        if (usersRes && usersRes.status === "success") {
          const um = {};
          (usersRes.users || []).forEach((u) => {
            um[u.userID] = u.username || u.name || `User ${u.userID}`;
          });
          setUsersMap(um);
        }
        if (oppRes && oppRes.status === "success")
          setOpportunities(oppRes.items || []);
        if (collRes && collRes.status === "success")
          setMyCollection(collRes.items || []);
        if (matchesRes && matchesRes.status === "success")
          setMatches(matchesRes.items || []);
        if (cardsRes && (cardsRes.cards || cardsRes.items || cardsRes)) {
          // backend returns { status, cards } while some endpoints may return items
          const arr = cardsRes.cards || cardsRes.items || cardsRes;
          setAllCards(arr || []);
          const map = {};
          (arr || []).forEach((c) => {
            map[c.cardID] = c;
          });
          setCardsMap(map);
        }
      })
      .catch((e) => console.error("Failed to load trades data", e))
      .finally(() => setLoading(false));
  }, [userID, refreshCounter]);

  // reload helper to re-fetch data after actions (create/accept/decline)
  const reload = () => setRefreshCounter((c) => c + 1);

  const openView = (trade) => setViewModal({ open: true, trade });

  const handleAccept = async (trade) => {
    if (!userID) return showActionError("Not signed in");
    try {
      const res = await fetch(
        "http://localhost:5001/api/active-trades/confirm",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            confirmedBy: userID,
            user1: trade.initiatorID,
            user2: trade.responderID,
            cardSent1: trade.cardOfferedByUser1,
            cardSent2: trade.cardOfferedByUser2,
          }),
        }
      );
      const j = await res.json();
      if (res.ok && j.status === "success") {
        reload();
      } else {
        showActionError("Accept failed: " + (j.message || JSON.stringify(j)));
      }
    } catch (e) {
      console.error(e);
      showActionError("Accept failed");
    }
  };

  const handleDecline = async (trade) => {
    if (!userID) return showActionError("Not signed in");
    try {
      const res = await fetch("http://localhost:5001/api/active-trades", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user1: trade.initiatorID,
          user2: trade.responderID,
          cardSent1: trade.cardOfferedByUser1,
          cardSent2: trade.cardOfferedByUser2,
        }),
      });
      const j = await res.json();
      if (res.ok && j.status === "success") reload();
      else
        showActionError("Decline failed: " + (j.message || JSON.stringify(j)));
    } catch (e) {
      console.error(e);
      showActionError("Decline failed");
    }
  };

  const openCreate = (opp) => {
    // opp has ownerID as ownerID or ownerID field from API; normalize
    setCreateModal({ open: true, opportunity: opp });
  };

  const createTrade = async (opp, myCardId, requestedCardId) => {
    if (!userID) return showActionError("Not signed in");
    try {
      const payload = {
        user1: userID,
        user2:
          opp.ownerID || opp.owner || opp.ownerID || opp.ownerUserID || null,
        cardSent1: myCardId,
        cardSent2: requestedCardId || opp.cardID,
        createdBy: userID,
      };

      // Try to infer owner id from common fields
      if (!payload.user2) {
        payload.user2 =
          opp.ownerID || opp.owner || opp.ownerUserID || opp.ownerId || null;
      }

      const res = await fetch("http://localhost:5001/api/active-trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (res.ok && j.status === "success") {
        setCreateModal({ open: false, opportunity: null });
        reload();
      } else {
        showActionError("Create failed: " + (j.message || JSON.stringify(j)));
      }
    } catch (e) {
      console.error(e);
      showActionError("Create failed");
    }
  };

  if (!userID) {
    return (
      <Layout>
        <div className="p-6">Please sign in to view trades.</div>
      </Layout>
    );
  }

  // split active trades into sentToMe (responder==me) and sentByMe (initiator==me)
  const sentToMe = activeTrades.filter(
    (t) => String(t.responderID) === String(userID)
  );
  const sentByMe = activeTrades.filter(
    (t) => String(t.initiatorID) === String(userID)
  );

  // Consolidated pending trades list (both sent and received)
  const pendingTrades = (activeTrades || []).filter(
    (t) => t.status === "pending"
  );

  // Filtered collection based on CardFilters state
  const filteredCollection = myCollection.filter((c) => {
    if (rarityFilter && c.rarity !== rarityFilter) return false;
    if (typeFilter && c.type !== typeFilter) return false;
    if (packFilter && c.packName !== packFilter) return false;
    if (
      searchQuery &&
      !c.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <Layout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Trades</h2>
        {actionError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-800 rounded flex items-center justify-between">
            <div>{actionError}</div>
            <button
              onClick={() => setActionError(null)}
              className="ml-4 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-2">Pending Trades</h3>
          <div className="space-y-3">
            {loading ? (
              <div>Loading...</div>
            ) : pendingTrades.length === 0 ? (
              <div className="text-sm text-gray-500">No pending trades.</div>
            ) : (
              pendingTrades.map((t, idx) => {
                const card1 = cardsMap[t.cardOfferedByUser1] || {
                  cardID: t.cardOfferedByUser1,
                  name: t.cardOfferedByUser1Name,
                  imageURL: t.cardOfferedByUser1Image,
                };
                const card2 = cardsMap[t.cardOfferedByUser2] || {
                  cardID: t.cardOfferedByUser2,
                  name: t.cardOfferedByUser2Name,
                  imageURL: t.cardOfferedByUser2Image,
                };
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white p-3 rounded shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-40">
                        <div className="font-medium truncate">
                          {card1.name || card1.cardID}
                        </div>
                        <div className="text-sm text-gray-500">
                          {card1.cardID}
                        </div>
                      </div>
                      <div className="text-sm text-center">⇄</div>
                      <div className="w-40">
                        <div className="font-medium truncate">
                          {card2.name || card2.cardID}
                        </div>
                        <div className="text-sm text-gray-500">
                          {card2.cardID}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">
                          From:{" "}
                          {usersMap[t.initiatorID] ||
                            t.initiatorName ||
                            t.initiator ||
                            `User ${t.initiatorID}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          To:{" "}
                          {usersMap[t.responderID] ||
                            t.responderName ||
                            t.responder ||
                            `User ${t.responderID}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openView(t)}
                        className="bg-gray-200 px-3 py-1 rounded"
                      >
                        Details
                      </button>
                      {!t.confirmed &&
                        String(t.responderID) === String(userID) && (
                          <>
                            <button
                              onClick={() => handleAccept(t)}
                              className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleDecline(t)}
                              className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded"
                            >
                              Decline
                            </button>
                          </>
                        )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">Trade Opportunities</h3>
          <div className="space-y-3">
            {loading ? (
              <div>Loading...</div>
            ) : opportunities.length === 0 ? (
              <div className="text-sm text-gray-500">
                No opportunities right now.
              </div>
            ) : (
              opportunities.map((o, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-white p-3 rounded shadow-sm"
                >
                  <div>
                    <div className="font-medium">{o.cardName || o.cardID}</div>
                    <div className="text-sm text-gray-500">
                      Owner:{" "}
                      {usersMap[o.ownerID] ||
                        o.ownerName ||
                        o.owner ||
                        `User ${o.ownerID}`}
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={() => openCreate(o)}
                      className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
                    >
                      Create Trade
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <Modal
          open={viewModal.open}
          onClose={() => setViewModal({ open: false, trade: null })}
          title="Trade Details"
        >
          {viewModal.trade && (
            <div className="flex flex-wrap gap-4 justify-center">
              {(() => {
                const t = viewModal.trade;
                const card1 = cardsMap[t.cardOfferedByUser1] || {
                  cardID: t.cardOfferedByUser1,
                  name: t.cardOfferedByUser1Name,
                  imageURL: t.cardOfferedByUser1Image,
                };
                const card2 = cardsMap[t.cardOfferedByUser2] || {
                  cardID: t.cardOfferedByUser2,
                  name: t.cardOfferedByUser2Name,
                  imageURL: t.cardOfferedByUser2Image,
                };
                return (
                  <>
                    <div className="w-48">
                      <Card card={card1} />
                      <div className="text-center mt-2">
                        From:{" "}
                        {usersMap[t.initiatorID] ||
                          t.initiatorName ||
                          t.initiator ||
                          t.initiatorID}
                      </div>
                    </div>
                    <div className="w-48">
                      <Card card={card2} />
                      <div className="text-center mt-2">
                        To:{" "}
                        {usersMap[t.responderID] ||
                          t.responderName ||
                          t.responder ||
                          t.responderID}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </Modal>

        <Modal
          open={createModal.open}
          onClose={() => setCreateModal({ open: false, opportunity: null })}
          title="Create Trade"
        >
          {createModal.opportunity && (
            <div>
              <div className="mb-3 text-sm text-gray-600">
                Owner:{" "}
                {usersMap[createModal.opportunity.ownerID] ||
                  createModal.opportunity.ownerName ||
                  createModal.opportunity.owner}
              </div>
              <div className="mb-3">
                <strong>Card requested:</strong>{" "}
                {createModal.opportunity.cardName ||
                  createModal.opportunity.cardID}
              </div>

              {/* Matches first: suggested cards the partner wants (these are likely in your collection) */}
              <div className="mb-4">
                <strong>Suggested (from their wishlist)</strong>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {matches
                    .filter(
                      (m) =>
                        m.partnerID ===
                        (createModal.opportunity.ownerID ||
                          createModal.opportunity.owner)
                    )
                    .map((m) => {
                      const cardInfo = cardsMap[m.theyWant_cardID] || {
                        cardID: m.theyWant_cardID,
                        name: m.theyWant_name,
                        imageURL: null,
                      };
                      return (
                        <div key={m.theyWant_cardID} className="">
                          <Card
                            card={cardInfo}
                            extraActions={
                              <button
                                className="mt-2 bg-blue-500 text-white px-3 py-1 rounded w-full"
                                onClick={() =>
                                  createTrade(
                                    createModal.opportunity,
                                    m.theyWant_cardID,
                                    createModal.opportunity.cardID
                                  )
                                }
                              >
                                Offer this
                              </button>
                            }
                          />
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="mb-3">
                <strong>Your collection</strong>
                <CardFilters
                  rarityFilter={rarityFilter}
                  setRarityFilter={setRarityFilter}
                  typeFilter={typeFilter}
                  setTypeFilter={setTypeFilter}
                  packFilter={packFilter}
                  setPackFilter={setPackFilter}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onResetFilters={() => {
                    setRarityFilter("");
                    setTypeFilter("");
                    setPackFilter("");
                    setSearchQuery("");
                  }}
                  showPackFilter={true}
                  showSearchQuery={true}
                  allCards={allCards}
                />

                <div className="grid grid-cols-3 gap-3 mt-2">
                  {filteredCollection.map((c) => (
                    <div key={c.cardID}>
                      <Card
                        card={c}
                        extraActions={
                          <button
                            className="mt-2 bg-blue-500 text-white px-3 py-1 rounded w-full"
                            onClick={() =>
                              createTrade(
                                createModal.opportunity,
                                c.cardID,
                                createModal.opportunity.cardID
                              )
                            }
                          >
                            Offer this
                          </button>
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default TradesPage;
