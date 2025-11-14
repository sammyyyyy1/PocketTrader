import React from "react";

export default function Card({ card, onAdd, canAdd, onDelete }) {
  const fallback =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='420' viewBox='0 0 300 420'%3E%3Crect width='300' height='420' fill='%23f8fafc'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial, sans-serif' font-size='16'%3ENo Image%3C/text%3E%3C/svg%3E";
  return (
    <div className="w-48 p-2 pb-3 bg-white rounded shadow text-center relative">
      <div className="w-full h-64 mb-2 flex items-center justify-center bg-gray-50">
        <img
          src={card.imageURL || fallback}
          alt={card.name}
          onError={(e) => {
            if (e?.target) e.target.src = fallback;
          }}
          className="max-h-full w-auto object-contain"
        />
      </div>
      <div className="text-sm font-semibold">{card.name}</div>
      <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
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
      {typeof card.quantity === "number" && (
        <div className="text-sm mt-1">Owned: {card.quantity}</div>
      )}
      {canAdd && (
        <button
          onClick={() => onAdd(card.cardID, card.name)}
          className={`mt-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-sm`}
        >
          + Add
        </button>
      )}
      {typeof card.quantity === "number" && (
        <button
          onClick={() => onDelete(card.cardID, card.name)}
          className={`absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-md font-extrabold shadow-lg`}
        >
          -
        </button>
      )}
    </div>
  );
}
