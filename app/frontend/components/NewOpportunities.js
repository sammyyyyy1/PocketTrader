import React, { useEffect, useState, useRef } from "react";

const POLL_MS = 60 * 1000; // 60s

function groupByCard(items) {
  return items.reduce((acc, it) => {
    const key = it.cardID || "unknown";
    if (!acc[key]) acc[key] = { cardName: it.cardName || key, owners: [] };
    acc[key].owners.push({
      ownerID: it.ownerID,
      ownerName: it.ownerName,
      createdAt: it.createdAt,
    });
    return acc;
  }, {});
}

const NewOpportunities = ({ user }) => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    async function load() {
      if (!user || !user.userID) return setItems([]);
      try {
        // Call backend directly (matches other frontend pages using http://localhost:5001)
        const res = await fetch(
          `http://localhost:5001/api/trade-opportunities?userID=${user.userID}`
        );
        const data = await res.json();
        if (data && data.status === "success") {
          if (mounted.current) setItems(data.items || []);
        }
      } catch (e) {
        console.error("Failed to load trade opportunities", e);
      }
    }

    load();
    const iv = setInterval(load, POLL_MS);
    return () => {
      mounted.current = false;
      clearInterval(iv);
    };
  }, [user]);

  const groups = groupByCard(items);
  const count = items.length;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((s) => !s)}
        title="New trade opportunities"
        className="bg-transparent text-white py-1 px-3 rounded flex items-center gap-2"
      >
        <span className="text-sm">New Opportunities</span>
        <span className="bg-red-600 text-white text-xs font-semibold rounded-full h-6 w-6 flex items-center justify-center">
          {count}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded p-3 text-gray-800 z-50">
          <h4 className="text-sm font-semibold mb-2">New Opportunities</h4>
          {count === 0 ? (
            <div className="text-sm text-gray-600">No new opportunities</div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-auto">
              {Object.keys(groups).map((cardID) => {
                const g = groups[cardID];
                return (
                  <div key={cardID} className="border rounded p-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{g.cardName}</div>
                        <div className="text-xs text-gray-500">{cardID}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      You can trade for {g.cardName} with:{" "}
                      {g.owners.map((o) => o.ownerName).join(", ")}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewOpportunities;
