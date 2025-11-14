import React from "react";

const PaginationControls = ({ currentPage, totalPages, setCurrentPage }) => {
  return (
    <div className="mt-3 mb-3 flex justify-center items-center gap-4">
      <button
        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-2 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition"
        title="Previous page"
      >
        ←
      </button>
      <div className="text-gray-400">
        Page {currentPage} of {totalPages}
      </div>
      <button
        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-2 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition"
        title="Next page"
      >
        →
      </button>
    </div>
  );
};

export default PaginationControls;
