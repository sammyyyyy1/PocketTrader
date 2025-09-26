import React from 'react';

const Layout = ({ children }) => {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            <header style={{ 
                backgroundColor: '#2c3e50', 
                color: 'white', 
                padding: '1rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h1 style={{ margin: 0, fontSize: '1.8rem' }}>
                        🎮 PocketTrader - Pokemon Trading App
                    </h1>
                    <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8, fontSize: '0.9rem' }}>
                        Full-Stack Database Demo with Flask & Next.js
                    </p>
                </div>
            </header>
            <main style={{ maxWidth: '1200px', margin: '0 auto', minHeight: 'calc(100vh - 140px)' }}>
                {children}
            </main>
            <footer style={{ 
                backgroundColor: '#34495e', 
                color: 'white', 
                textAlign: 'center', 
                padding: '1rem',
                marginTop: 'auto'
            }}>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    © 2025 PocketTrader - Pokemon Trading Platform
                </p>
            </footer>
        </div>
    );
};

export default Layout;