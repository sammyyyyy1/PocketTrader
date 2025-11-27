import Layout from "../components/Layout";
import { useState, useEffect } from "react";

export default function Page() {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMarketTrends() {
      try {
        const response = await fetch("http://localhost:5001/api/market-trends");
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        const data = await response.json();
        if (data.status === "success") {
          setTrends(data.items);
        } else {
          setError(data.message);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMarketTrends();
  }, []);

  // Sort trends by valueScore
  const sortedTrends = [...trends].sort((a, b) => b.trend - a.trend);

  // Get top 10 highest and top 10 lowest
  const mostPopular = sortedTrends.slice(0, 10);
  const leastPopular = sortedTrends.slice(-10).reverse();

  if (loading) {
    return (
      <Layout>
        <p>Loading market trends...</p>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <h1>Trending</h1>
        <p>Error: {error}</p>
      </Layout>
    );
  }

  const TrendColumn = ({ title, cards }) => (
    <div className="flex-1 mx-4">
      <h2 className="text-xl font-semibold mb-4 text-center">{title}</h2>
      {cards.length > 0 ? (
        <ul>
          {cards.map((card, index) => (
            <li key={card.cardID} className="flex items-center mb-4 bg-white p-3 rounded shadow">
              <span className="text-lg font-bold mr-2 w-6">
                {index > 0 && cards[index].trend === cards[index - 1].trend ? " -" : `${index + 1}.`}
              </span>
              <img src={card.imageURL} alt={card.name} className="w-10 h-auto mr-4" />
              <div>
                <p className="font-bold">{card.name}</p>
                <div className="flex gap-1">
                  <span>{card.packName} Pack</span>
                  <span>•</span>
                  <span className="flex items-center">
                    {card.rarity?.includes("D")
                      ? Array.from({ length: parseInt(card.rarity) }, (_, i) => (
                        <img key={i} src="/diamond.png" alt="Diamond" className="w-3 h-3 object-contain" />
                      ))
                      : card.rarity?.includes("S")
                        ? Array.from({ length: parseInt(card.rarity) }, (_, i) => (
                          <img key={i} src="/star.png" alt="Star" className="w-3 h-3 object-contain" />
                        ))
                        : card.rarity === "C"
                          ? <img src="/crown.png" alt="Crown" className="w-3 h-3 object-contain" />
                          : card.rarity}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No {title.toLowerCase()} cards found.</p>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="flex justify-around mt-4">
        <TrendColumn title="Most Popular" cards={mostPopular} />
        <TrendColumn title="Least Popular" cards={leastPopular} />
      </div>
    </Layout>
  );
}