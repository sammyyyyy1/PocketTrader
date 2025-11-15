import React, { useEffect, useState } from "react";

const Layout = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // read auth on client only
    try {
      const raw = localStorage.getItem("pt_user");
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {
      console.error("Failed to read user from localStorage", e);
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("pt_user");
    setUser(null);
    // reload to refresh client-side data
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-sky-900 text-white p-4 shadow-md">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-white no-underline">
              <h1 className="m-0 text-2xl font-bold text-white">PocketTrader</h1>
            </a>
            <div className="flex gap-2">
              <a
                href="/cards"
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-4 rounded transition-colors duration-200"
              >
                Cards
              </a>
              <a
                href="/collection"
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-1 px-4 rounded transition-colors duration-200"
              >
                Collection
              </a>
              <a
                href="/wishlist"
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-1 px-4 rounded transition-colors duration-200"
              >
                Wishlist
              </a>
              <a
                href="/trade-suggestions"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-1 px-4 rounded transition-colors duration-200"
              >
                Trade Suggestions
              </a>
            </div>
          </div>

          <nav className="mt-4 sm:mt-0 flex gap-4 items-center">
            <div className="ml-4 text-sm text-white">
              {user ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>Hi, {user.username}</span>
                  <button
                    onClick={handleSignOut}
                    className="bg-[#e74c3c] text-white py-1 px-3 rounded"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <a
                    href="/login"
                    className="bg-[#27ae60] hover:bg-[#2ecc71] text-white font-semibold py-2 px-4 rounded transition-colors duration-200"
                  >
                    Sign In
                  </a>
                  <a
                    href="/signup"
                    className="bg-[#8e44ad] hover:bg-[#9b59b6] text-white font-semibold py-2 px-4 rounded transition-colors duration-200"
                  >
                    Sign Up
                  </a>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-[1200px] mx-auto w-full min-h-[calc(100vh-140px)]">
        {children}
      </main>

      <footer className="bg-[#34495e] text-white text-center p-4 mt-auto">
        <p className="m-0 text-sm text-white">
          © 2025 PocketTrader - Pokemon Trading Platform
        </p>
      </footer>
    </div>
  );
};

export default Layout;
