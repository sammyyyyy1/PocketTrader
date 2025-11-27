import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { getStoredUser } from "../utils/auth";
import Card from "../components/Card";
import CardFilters from "../components/CardFilters";
import PaginationControls from "../components/PaginationControls";

const CARDS_PER_PAGE = 24;

export default function WishlistPage() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rarityFilter, setRarityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [packFilter, setPackFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [ownersModal, setOwnersModal] = useState({
    card: null,
    owners: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    const u = getStoredUser();
    if (u) setUser(u);
    else setLoading(false);
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  useEffect(() => {
    if (!user) return;
    const fetchWishlist = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("userID", user.userID);
        if (rarityFilter) params.set("rarity", rarityFilter);
        if (typeFilter) params.set("type", typeFilter);
        if (packFilter) params.set("packName", packFilter);
        if (searchQuery) params.set("name", searchQuery);

        const res = await fetch(
          `http://localhost:5001/api/wishlist?${params.toString()}`
        );
        const data = await res.json();
        if (data.status === "success") {
          setItems(data.items);
        } else {
          console.error("Failed to fetch wishlist", data.message || data);
        }
      } catch (e) {
        console.error("Failed to fetch wishlist", e);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [user, rarityFilter, typeFilter, packFilter, searchQuery]);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5001/api/wishlist?userID=${user.userID}`
      );
      const data = await res.json();
      if (data.status === "success") {
        setItems(data.items);
      }
    } catch (e) {
      console.error("Failed to refresh wishlist", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    let list = items;
    if (rarityFilter) {
      list = list.filter((item) => item.rarity === rarityFilter);
    }
    if (typeFilter) {
      list = list.filter((item) => item.type === typeFilter);
    }
    if (packFilter) {
      list = list.filter((item) => item.packName === packFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) => item.name.toLowerCase().includes(q));
    }
    return list;
  }, [items, packFilter, rarityFilter, searchQuery, typeFilter]);

  useEffect(() => {
    if (currentPage === 1) return;
    const maxPage = Math.ceil(filteredItems.length / CARDS_PER_PAGE) || 1;
    if (currentPage > maxPage) {
      setCurrentPage(1);
    }
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / CARDS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
  const paginatedItems = filteredItems.slice(
    startIndex,
    startIndex + CARDS_PER_PAGE
  );

  const handleRemove = async (cardID, cardName) => {
    if (!user) return;
    try {
      const res = await fetch("http://localhost:5001/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID: user.userID, cardID }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setItems((prev) => prev.filter((item) => item.cardID !== cardID));
        setToast(`Removed ${cardName} from wishlist`);
      } else {
        console.error("Failed to remove wishlist item", data.message || data);
      }
    } catch (e) {
      console.error("Failed to remove wishlist item", e);
    }
  };

  const openOwnersModal = async (card) => {
    if (!user) return;
    setOwnersModal({ card, owners: [], loading: true, error: null });
    try {
      const params = new URLSearchParams();
      params.set("userID", user.userID);
      params.set("cardID", card.cardID);
      const res = await fetch(
        `http://localhost:5001/api/wishlist/owners?${params.toString()}`
      );
      const data = await res.json();
      if (data.status === "success") {
        setOwnersModal({
          card,
          owners: data.items,
          loading: false,
          error: null,
        });
      } else {
        setOwnersModal({
          card,
          owners: [],
          loading: false,
          error: data.message || "Unable to load owners",
        });
      }
    } catch (e) {
      console.error("Failed to fetch wishlist owners", e);
      setOwnersModal({
        card,
        owners: [],
        loading: false,
        error: "Unable to load owners right now",
      });
    }
  };

  const closeModal = () =>
    setOwnersModal({ card: null, owners: [], loading: false, error: null });

  if (!authChecked) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
          Checking your session...
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
          <h2 className="text-lg font-semibold">Not signed in</h2>
          <p>
            Please{" "}
            <a href="/login" className="text-blue-600">
              sign in
            </a>{" "}
            or{" "}
            <a href="/signup" className="text-blue-600">
              create an account
            </a>{" "}
            to view your wishlist.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold m-0">My Wishlist</h2>
            <p className="text-sm text-gray-500 m-0">
              Add cards from the main Cards page, then use this list to find
              trading partners.
            </p>
          </div>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition text-sm"
          >
            Refresh
          </button>
        </div>
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
            setCurrentPage(1);
          }}
          showPackFilter={true}
          showSearchQuery={true}
          allCards={items}
        />

        {loading ? (
          <div>Loading wishlist...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center text-gray-500 py-12 bg-white rounded shadow">
            No cards in your wishlist yet. Visit the Cards page and add a few.
          </div>
        ) : (
          <>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
            <div className="grid grid-cols-6 gap-4">
              {paginatedItems.map((item) => (
                <Card
                  key={item.cardID}
                  card={item}
                  extraActions={
                    <>
                      <button
                        onClick={() => openOwnersModal(item)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white py-1 px-2 rounded"
                      >
                        Who can trade this?
                      </button>
                      <button
                        onClick={() => handleRemove(item.cardID, item.name)}
                        className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded"
                      >
                        Remove
                      </button>
                    </>
                  }
                />
              ))}
            </div>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
          </>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded shadow-lg">
          {toast}
        </div>
      )}

      {ownersModal.card && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <h3 className="text-lg font-semibold mb-2">
              Owners with extras - {ownersModal.card.name}
            </h3>
            {ownersModal.loading ? (
              <div>Loading...</div>
            ) : ownersModal.error ? (
              <div className="text-red-500 text-sm">{ownersModal.error}</div>
            ) : ownersModal.owners.length === 0 ? (
              <div className="text-sm text-gray-600">
                No other collectors currently have extra copies of this card.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {ownersModal.owners.map((owner) => (
                  <li
                    key={owner.ownerID}
                    className="py-2 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{owner.username}</div>
                      <div className="text-xs text-gray-500">
                        User ID: {owner.ownerID}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-700">
                      {owner.quantity} copies
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
