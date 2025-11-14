import Dropdown from "./Dropdown";

export default function CardFilters({
  rarityFilter,
  setRarityFilter,
  typeFilter,
  setTypeFilter,
  packFilter,
  setPackFilter,
  searchQuery,
  setSearchQuery,
  onResetFilters,
  showPackFilter = true,
  showSearchQuery = true,
  allCards = null,
}) {
  const handleResetFilters = () => {
    setRarityFilter("");
    setTypeFilter("");
    setPackFilter("");
    setSearchQuery("");
    if (onResetFilters) {
      onResetFilters();
    }
  };

  return (
    <div className="mb-4 mt-4 flex flex-wrap gap-6 items-center">
      <button
        onClick={handleResetFilters}
        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
        title="Reset all filters"
      >
        Reset
      </button>

      {showSearchQuery && (
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 bg-gray-100 text-gray-900 rounded border border-gray-300 focus:outline-none focus:border-blue-500 transition bg-white"
        />
      )}

      <Dropdown
        labelComponent={
          <span className="mr-2 font-semibold flex items-center">Rarity:</span>
        }
        options={[
          { value: "", label: "All" },
          {
            value: "1D",
            component: (
              <span className="flex items-center">
                {Array.from({ length: 1 }, (_, i) => (
                  <img
                    key={i}
                    src="/diamond.png"
                    alt="Diamond"
                    className="w-4 h-4 mr-1 object-contain"
                  />
                ))}
              </span>
            ),
          },
          {
            value: "2D",
            component: (
              <span className="flex items-center">
                {Array.from({ length: 2 }, (_, i) => (
                  <img
                    key={i}
                    src="/diamond.png"
                    alt="Diamond"
                    className="w-4 h-4 mr-1 object-contain"
                  />
                ))}
              </span>
            ),
          },
          {
            value: "3D",
            component: (
              <span className="flex items-center">
                {Array.from({ length: 3 }, (_, i) => (
                  <img
                    key={i}
                    src="/diamond.png"
                    alt="Diamond"
                    className="w-4 h-4 mr-1 object-contain"
                  />
                ))}
              </span>
            ),
          },
          {
            value: "4D",
            component: (
              <span className="flex items-center">
                {Array.from({ length: 4 }, (_, i) => (
                  <img
                    key={i}
                    src="/diamond.png"
                    alt="Diamond"
                    className="w-4 h-4 mr-1 object-contain"
                  />
                ))}
              </span>
            ),
          },
          {
            value: "1S",
            component: (
              <span className="flex items-center">
                {Array.from({ length: 1 }, (_, i) => (
                  <img
                    key={i}
                    src="/star.png"
                    alt="Star"
                    className="w-4 h-4 mr-1 object-contain"
                  />
                ))}
              </span>
            ),
          },
          {
            value: "2S",
            component: (
              <span className="flex items-center">
                {Array.from({ length: 2 }, (_, i) => (
                  <img
                    key={i}
                    src="/star.png"
                    alt="Star"
                    className="w-4 h-4 mr-1 object-contain"
                  />
                ))}
              </span>
            ),
          },
          {
            value: "3S",
            component: (
              <span className="flex items-center">
                {Array.from({ length: 3 }, (_, i) => (
                  <img
                    key={i}
                    src="/star.png"
                    alt="Star"
                    className="w-4 h-4 mr-1 object-contain"
                  />
                ))}
              </span>
            ),
          },
          {
            value: "C",
            component: (
              <span className="flex items-center">
                <img
                  src="/crown.png"
                  alt="Crown"
                  className="w-4 h-4 object-contain"
                />
              </span>
            ),
          },
        ]}
        value={rarityFilter}
        onChange={(e) => setRarityFilter(e.target.value)}
        iconMap={{
          "1D": "/diamond.png",
        }}
      />

      <Dropdown
        labelComponent={
          <span className="mr-2 font-semibold flex items-center">Type:</span>
        }
        options={[
          { value: "", label: "All" },
          { value: "Grass", label: "Grass" },
          { value: "Fire", label: "Fire" },
          { value: "Water", label: "Water" },
          { value: "Lightning", label: "Lightning" },
          { value: "Psychic", label: "Psychic" },
          { value: "Fighting", label: "Fighting" },
          { value: "Darkness", label: "Darkness" },
          { value: "Metal", label: "Metal" },
          { value: "Fairy", label: "Fairy" },
          { value: "Dragon", label: "Dragon" },
          { value: "Colorless", label: "Colorless" },
          { value: "Trainer", label: "Trainer" },
        ]}
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
      />

      {showPackFilter && allCards && (
        <Dropdown
          labelComponent={
            <span className="mr-2 font-semibold flex items-center">Pack:</span>
          }
          options={[
            { value: "", label: "All" },
            ...Array.from(new Set(allCards.map((card) => card.packName)))
              .sort()
              .map((pack) => ({ value: pack, label: pack })),
          ]}
          value={packFilter}
          onChange={(e) => setPackFilter(e.target.value)}
        />
      )}
    </div>
  );
}
