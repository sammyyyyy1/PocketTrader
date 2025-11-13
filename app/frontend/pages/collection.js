import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import Card from "../components/Card";

export default function CollectionPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [rarityFilter, setRarityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

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

      const res = await fetch(
        `http://localhost:5001/api/collection?${params.toString()}`
      );
      const data = await res.json();
      if (data.status === "success") setItems(data.items);
      setLoading(false);
    };
    fetchCollection();
  }, [user, rarityFilter, typeFilter]);

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
            to view your collection.
          </p>
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">My Collection</h2>
        <div className="mb-4 flex gap-4 items-center flex-wrap">
          <div>
            <label htmlFor="rarity-filter" className="mr-2 font-semibold">
              Rarity:
            </label>
            <select
              id="rarity-filter"
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
              className="border rounded px-2 py-1 w-36"
            >
              <option value="">All</option>
              <option value="1D">🔷</option>
              <option value="2D">🔷🔷</option>
              <option value="3D">🔷🔷🔷</option>
              <option value="4D">🔷🔷🔷🔷</option>
              <option value="1S">⭐</option>
              <option value="2S">⭐⭐</option>
              <option value="3S">⭐⭐⭐</option>
              <option value="C">👑</option>
            </select>
          </div>
          <div>
            <label htmlFor="type-filter" className="mr-2 font-semibold">
              Type:
            </label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border rounded px-2 py-1 w-36"
            >
              <option value="">All</option>
              <option value="Grass">Grass</option>
              <option value="Fire">Fire</option>
              <option value="Water">Water</option>
              <option value="Lightning">Lightning</option>
              <option value="Psychic">Psychic</option>
              <option value="Fighting">Fighting</option>
              <option value="Darkness">Darkness</option>
              <option value="Metal">Metal</option>
              <option value="Fairy">Fairy</option>
              <option value="Dragon">Dragon</option>
              <option value="Colorless">Colorless</option>
              <option value="Trainer">Trainer</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid grid-cols-6 gap-4">
            {items.map((i) => (
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
