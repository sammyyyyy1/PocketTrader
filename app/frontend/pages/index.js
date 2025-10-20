import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const Home = () => {
    const [users, setUsers] = useState([]);
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch health status
        fetch('http://localhost:5000/api/health')
            .then(res => res.json())
            .then(data => setHealth(data))
            .catch(err => console.error('Health check failed:', err));

        // Fetch users
        fetch('http://localhost:5000/api/users')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    setUsers(data.users);
                } else {
                    setError(data.message);
                }
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    return (
        <Layout>
            <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
                <h1>🎮 PocketTrader</h1>
                <p>Hello World - Database Connected Application!</p>

                {/* Backend Health Status */}
                {health && (
                    <div style={{
                        padding: '15px',
                        marginBottom: '20px',
                        backgroundColor: health.status === 'healthy' ? '#d4edda' : '#f8d7da',
                        border: `1px solid ${health.status === 'healthy' ? '#c3e6cb' : '#f5c6cb'}`,
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <h3>🔌 Backend Status</h3>
                        <p><strong>API Status:</strong> {health.status}</p>
                        <p><strong>Database:</strong> {health.database}</p>
                        <p><strong>Message:</strong> {health.message}</p>
                        {health.user_count !== undefined && (
                            <p><strong>Total Users:</strong> {health.user_count}</p>
                        )}
                    </div>
                )}

                {/* Users Display */}
                <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h2>👥 Pokemon Trainers (Users from Database)</h2>
                    {loading ? (
                        <p>Loading trainers...</p>
                    ) : error ? (
                        <p style={{ color: 'red' }}>❌ Error: {error}</p>
                    ) : (
                        <div>
                            <p>Found {users.length} Pokemon trainers:</p>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {users.map(user => (
                                    <li key={user.id} style={{
                                        margin: '10px 0',
                                        padding: '10px',
                                        backgroundColor: '#ffffff',
                                        borderRadius: '5px',
                                        border: '1px solid #dee2e6'
                                    }}>
                                        <strong>🎯 {user.username}</strong>
                                        <br />
                                        <small>ID: {user.id} | Joined: {new Date(user.created_at).toLocaleDateString()}</small>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
                    <p>This demonstrates a full-stack application with:</p>
                    <ul>
                        <li>✅ Next.js Frontend (React)</li>
                        <li>✅ Flask Backend API</li>
                        <li>✅ MySQL Database</li>
                        <li>✅ Docker Containerization</li>
                    </ul>
                </div>
            </div>
        </Layout>
    );
};

export default Home;