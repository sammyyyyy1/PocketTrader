import React from 'react';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <header className="bg-[#2c3e50] text-white p-4 shadow-md">
                <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="m-0 text-2xl font-bold text-white">
                            🎮 PocketTrader - Pokemon Trading App
                        </h1>
                        <p className="mt-2 opacity-80 text-sm text-white">
                            Full-Stack Database Demo with Flask &amp; Next.js
                        </p>
                    </div>
                    <nav className="mt-4 sm:mt-0 flex gap-4">
                        <a
                            href="/cards"
                            className="bg-[#16a085] hover:bg-[#1abc9c] text-white font-semibold py-2 px-4 rounded transition-colors duration-200"
                        >
                            Cards
                        </a>
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