import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import Card from "../components/Card";
import CardFilters from "../components/CardFilters";

export default function CollectionPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [rarityFilter, setRarityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [packFilter, setPackFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const u = localStorage.getItem("pt_user");
    if (u) setUser(JSON.parse(u));
  }, []);

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

  // Client-side filtering for search and pack
  let filteredItems = items;
  if (searchQuery) {
    filteredItems = filteredItems.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  if (packFilter) {
    filteredItems = filteredItems.filter((item) => item.packName === packFilter);
  }

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
          onResetFilters={() => { }}
          showPackFilter={true}
          showSearchQuery={true}
          allCards={items}
        />
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid grid-cols-6 gap-4">
            {filteredItems.map((i) => (
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
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
