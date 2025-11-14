import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import Card from "../components/Card";
import CardFilters from "../components/CardFilters";
import PaginationControls from "../components/PaginationControls";

export default function Home() {
  const [cards, setCards] = useState(undefined);
  const [rarityFilter, setRarityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [packFilter, setPackFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const CARDS_PER_PAGE = 25;

  useEffect(() => {
    const fetchCards = async () => {
      const response = await fetch("http://localhost:5001/api/cards");
      const data = await response.json();
      setCards(data);
    };

    fetchCards();
  }, []);

  // toast state
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  if (!cards) {
    return <Layout>Loading...</Layout>;
  }

  console.debug("Cards fetched:", cards);

  let filteredCards = cards.cards;
  if (rarityFilter) {
    filteredCards = filteredCards.filter(
      (card) => card.rarity === rarityFilter
    );
  }
  if (typeFilter) {
    filteredCards = filteredCards.filter((card) => card.type === typeFilter);
  }
  if (packFilter) {
    filteredCards = filteredCards.filter((card) => card.packName === packFilter);
  }
  if (searchQuery) {
    filteredCards = filteredCards.filter((card) =>
      card.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Reset to page 1 when filters change
  if (currentPage > 1) {
    const maxPage = Math.ceil(filteredCards.length / CARDS_PER_PAGE);
    if (currentPage > maxPage) {
      setCurrentPage(1);
    }
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE);
  const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
  const endIndex = startIndex + CARDS_PER_PAGE;
  const paginatedCards = filteredCards.slice(startIndex, endIndex);

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("pt_user") || "null")
      : null;
  const handleAdd = async (cardID, cardName) => {
    if (!user) {
      alert("Please sign in first");
      return;
    }
    try {
      const res = await fetch("http://localhost:5001/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID: user.userID, cardID, quantity: 1 }),
      });
      const data = await res.json();
      if (data.status === "success") {
        // show a small toast saying we added one
        setToast(`Added one ${cardName}`);
      } else {
        console.error("Failed to add", data.message || data);
      }
    } catch (e) {
      console.error("Error adding to collection", e);
    }
  };

  const handleResetFilters = () => {
    setRarityFilter("");
    setTypeFilter("");
    setPackFilter("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <Layout>
      <CardFilters
        rarityFilter={rarityFilter}
        setRarityFilter={setRarityFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        packFilter={packFilter}
        setPackFilter={setPackFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onResetFilters={() => setCurrentPage(1)}
        showPackFilter={true}
        showSearchQuery={true}
        allCards={cards.cards}
      />

      {filteredCards.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
        />
      )}

      {filteredCards.length === 0 ? (
        <div className="text-center text-gray-500">
          No cards found.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-6 gap-4">
            {paginatedCards.map((card) => (
              <div key={card.cardID}>
                <Card card={card} onAdd={handleAdd} canAdd={!!user} />
              </div>
            ))}
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        </>
      )}

      {/* toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded shadow-lg">
          {toast}
        </div>
      )}
    </Layout>
  );
}
