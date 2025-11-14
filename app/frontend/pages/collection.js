import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import Card from "../components/Card";
import CardFilters from "../components/CardFilters";
import PaginationControls from "../components/PaginationControls";

export default function CollectionPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [rarityFilter, setRarityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [packFilter, setPackFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const CARDS_PER_PAGE = 25;

  useEffect(() => {
    const u = localStorage.getItem("pt_user");
    if (u) setUser(JSON.parse(u));
  }, []);

  useEffect(() => {
    // Scroll to top when page changes
    window.scrollTo(0, 0);
  }, [currentPage]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchCollection = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("userID", user.userID);
      if (rarityFilter) params.set("rarity", rarityFilter);
      if (typeFilter) params.set("type", typeFilter);
      if (packFilter) params.set("pack", packFilter);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(
        `http://localhost:5001/api/collection?${params.toString()}`
      );
      const data = await res.json();
      if (data.status === "success") setItems(data.items);
      setLoading(false);
    };
    fetchCollection();
  }, [user, rarityFilter, typeFilter, packFilter, searchQuery]);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5001/api/collection?userID=${user.userID}`
      );
      const data = await res.json();
      if (data.status === "success") setItems(data.items);
    } catch (e) {
      console.error("Failed to refresh collection", e);
    }
    setLoading(false);
  };

  const onDelete = async (cardID) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5001/api/collection?userID=${user.userID}&cardID=${cardID}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (data.status === "success") {
        setItems(items.filter((item) => item.cardID !== cardID));
      } else {
        console.error("Failed to delete card", data);
      }
    } catch (e) {
      console.error("Failed to delete card", e);
    }
    setLoading(false);
  };

  const onResetFilters = () => {
    setRarityFilter("");
    setTypeFilter("");
    setPackFilter("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  if (!user)
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
            to view your collection.
          </p>
        </div>
      </Layout>
    );

  let filteredItems = items;
  if (rarityFilter) {
    filteredItems = filteredItems.filter((item) => item.rarity === rarityFilter);
  }
  if (typeFilter) {
    filteredItems = filteredItems.filter((item) => item.type === typeFilter);
  }
  if (packFilter) {
    filteredItems = filteredItems.filter((item) => item.packName === packFilter);
  }
  if (searchQuery) {
    filteredItems = filteredItems.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Reset to page 1 when filters change
  if (currentPage > 1) {
    const maxPage = Math.ceil(filteredItems.length / CARDS_PER_PAGE);
    if (currentPage > maxPage) {
      setCurrentPage(1);
    }
  }

  const totalPages = Math.ceil(filteredItems.length / CARDS_PER_PAGE);
  const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
  const endIndex = startIndex + CARDS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  return (
    <Layout>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">My Collection</h2>
        <CardFilters
          rarityFilter={rarityFilter}
          setRarityFilter={setRarityFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          packFilter={packFilter}
          setPackFilter={setPackFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onResetFilters={onResetFilters}
          showPackFilter={true}
          showSearchQuery={true}
          allCards={items}
        />
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            {filteredItems.length > 0 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
              />
            )}
            {filteredItems.length === 0 ? (
              <div className="text-center text-gray-500">
                No cards found in your collection.
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-4">
                {paginatedItems.map((i) => (
                  <div key={i.cardID}>
                    <Card
                      card={{
                        cardID: i.cardID,
                        name: i.name,
                        packName: i.packName,
                        rarity: i.rarity,
                        imageURL: i.imageURL,
                        quantity: i.quantity,
                      }}
                      canAdd={false}
                      onDelete={onDelete}
                    />
                  </div>
                ))}
              </div>
            )}
            {filteredItems.length > 0 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
