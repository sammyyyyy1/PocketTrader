import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import Card from "../components/Card";
import CardFilters from "../components/CardFilters";
import PaginationControls from "../components/PaginationControls";
import { useRouter } from 'next/router';

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [rarityFilter, setRarityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [packFilter, setPackFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const CARDS_PER_PAGE = 25;

  const router = useRouter();
  const { username: queryUsername } = router.query;

  useEffect(() => {
    const u = localStorage.getItem("pt_user");
    if (u) setUser(JSON.parse(u));
  }, []);

  useEffect(() => {
    // Scroll to top when page changes
    window.scrollTo(0, 0);
  }, [currentPage]);

  useEffect(() => {
    if (!user && !queryUsername) {
      setLoading(false);
      return;
    }
    const fetchWishlist = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (queryUsername) {
        params.set("username", queryUsername);
      } else if (user) {
        params.set("userID", user.userID);
      }

      if (rarityFilter) params.set("rarity", rarityFilter);
      if (typeFilter) params.set("type", typeFilter);
      if (packFilter) params.set("pack", packFilter);
      if (searchQuery) params.set("name", searchQuery);

      const res = await fetch(
        `http://localhost:5001/api/wishlist?${params.toString()}`
      );
      const data = await res.json();
      if (data.status === "success") setItems(data.items);
      setLoading(false);
    };
    fetchWishlist();
  }, [user, queryUsername, rarityFilter, typeFilter, packFilter, searchQuery]);

  const onResetFilters = () => {
    setRarityFilter("");
    setTypeFilter("");
    setPackFilter("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Client-side filtering and pagination (similar to collection.js)
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

  const pageTitle = queryUsername ? `${queryUsername}'s Wishlist` : 'My Wishlist';

  return (
    <Layout>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">{pageTitle}</h2>
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
          allCards={items} // Pass all items for filter options
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
                No cards found in wishlist.
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
                        type: i.type, // Added type for consistency
                        imageURL: i.imageURL,
                      }}
                      canAdd={false}
                      isWishlist={true}
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
