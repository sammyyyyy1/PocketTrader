import React from "react";

export default function Card({ card, onAdd, canAdd }) {
  const fallback =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='420' viewBox='0 0 300 420'%3E%3Crect width='300' height='420' fill='%23f8fafc'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial, sans-serif' font-size='16'%3ENo Image%3C/text%3E%3C/svg%3E";
  return (
    <div className="w-48 p-2 bg-white rounded shadow text-center">
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
      <div className="text-xs text-gray-500">
        {card.packName} • {card.rarity}
      </div>
      {typeof card.quantity === "number" && (
        <div className="text-sm mt-1">Qty: {card.quantity}</div>
      )}
      {canAdd && (
        <button
          onClick={() => onAdd(card.cardID, card.name)}
          className={`mt-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-sm`}
        >
          Add
        </button>
      )}
    </div>
  );
}
