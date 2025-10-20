
import Layout from "../../components/Layout";
import { useEffect, useState } from "react";



export default function Home() {
  const [cards, setCards] = useState(undefined);
  const [rarityFilter, setRarityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    const fetchCards = async () => {
      const response = await fetch("http://localhost:5000/api/cards");
      const data = await response.json();
      setCards(data);
    };

    fetchCards();
  }, []);

  if (!cards) {
    return <Layout>Loading...</Layout>;
  }

  console.debug("Cards fetched:", cards);

  let filteredCards = cards.cards;
  if (rarityFilter) {
    filteredCards = filteredCards.filter((card) => card.rarity === rarityFilter);
  }
  if (typeFilter) {
    filteredCards = filteredCards.filter((card) => card.type === typeFilter);
  }

  return (
    <Layout>
      <div className="mb-4 mt-4 flex flex-wrap gap-6 items-center">
        <div>
          <label htmlFor="rarity-filter" className="mr-2 font-semibold">Rarity:</label>
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
          <label htmlFor="type-filter" className="mr-2 font-semibold">Type:</label>
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
      {filteredCards.length === 0 ? (
        <div className="text-center text-gray-500">No cards found for this rarity.</div>
      ) : (
        filteredCards.map((card) => (
          <div key={card.id} className="inline-block m-2">
            <img src={card.imageURL.replace("/tcgdex/", "/tcgp/")} alt={card.name} className="w-32 object-cover" />
            <div>
              <h2 className="text-black text-center">{card.name}</h2>
            </div>
          </div>
        ))
      )}
    </Layout>
  );
}