import React, { useState } from "react";
import Layout from "../components/Layout";

const initialActiveTrades = [
  {
    id: 1,
    cardName: "Pikachu V",
    initiator: "alice",
    recipient: "you",
    status: "pending",
  },
  {
    id: 2,
    cardName: "Charizard GX",
    initiator: "bob",
    recipient: "you",
    status: "pending",
  },
];

const sampleOpportunities = [
  { cardID: "A1-026", cardName: "Guzma", ownerName: "local_user2" },
  {
    cardID: "A3-208",
    cardName: "Professor Oak's Visit",
    ownerName: "local_user3",
  },
];

const TradesPage = () => {
  const [activeTrades, setActiveTrades] = useState(initialActiveTrades);
  const [opportunities] = useState(sampleOpportunities);

  const handleAccept = (id) => {
    setActiveTrades((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "accepted" } : t))
    );
    console.log("Accepted trade", id);
  };

  const handleDecline = (id) => {
    setActiveTrades((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "declined" } : t))
    );
    console.log("Declined trade", id);
  };

  const handleCreateTrade = (opp) => {
    // Placeholder: in future this will open a create-trade flow / dialog
    alert(`Create trade for ${opp.cardName} (owner: ${opp.ownerName})`);
    console.log("Create trade clicked", opp);
  };

  return (
    <Layout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Trades</h2>

        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-2">Active Trades</h3>
          <div className="space-y-3">
            {activeTrades.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between bg-white p-3 rounded shadow-sm"
              >
                <div>
                  <div className="font-medium">{t.cardName}</div>
                  <div className="text-sm text-gray-500">
                    From: {t.initiator} • To: {t.recipient}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-sm mr-2">Status: {t.status}</div>
                  <button
                    onClick={() => handleAccept(t.id)}
                    disabled={t.status !== "pending"}
                    className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(t.id)}
                    disabled={t.status !== "pending"}
                    className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">Trade Opportunities</h3>
          <div className="space-y-3">
            {opportunities.map((o) => (
              <div
                key={o.cardID}
                className="flex items-center justify-between bg-white p-3 rounded shadow-sm"
              >
                <div>
                  <div className="font-medium">{o.cardName}</div>
                  <div className="text-sm text-gray-500">
                    Owner: {o.ownerName}
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => handleCreateTrade(o)}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
                  >
                    Create Trade
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default TradesPage;
