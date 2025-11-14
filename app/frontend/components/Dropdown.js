import React, { useState, useRef, useEffect } from "react";

export default function Dropdown({ labelComponent, options, value, onChange, iconMap }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {labelComponent ? labelComponent : null}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="border rounded px-2 py-1 w-36 text-left flex items-center justify-between bg-white hover:bg-gray-50"
        >
          <span className="flex items-center flex-1">
            {selectedOption?.component ? (
              selectedOption.component
            ) : (
              selectedOption?.label
            )}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 12l7 7 7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 border rounded bg-white shadow-lg z-50 max-h-64 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange({ target: { value: opt.value } });
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2 py-2 flex items-center hover:bg-gray-100 ${value === opt.value ? "bg-blue-100" : ""
                  }`}
              >
                {opt.component ? opt.component : opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
