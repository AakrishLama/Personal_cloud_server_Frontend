import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Myfriends({ user, onLogout }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const fetchAllUsers = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await fetch(`${API_BASE_URL}/api/getAllUsers`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const allUsers = await response.json();

            // Filter out the current user
            const otherUsers = allUsers.filter(u => u.id !== user.id && u.email !== user.email);
            setUsers(otherUsers);

        } catch (err) {
            setError('Error loading users. Please try again.');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChatClick = (friendUser) => {
        console.log("Start chat with:", friendUser);
        // You can implement chat functionality here
        alert(`Starting chat with ${friendUser.username}`);
        navigate("/ChatUi", {state: {friendUser}});
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    const handleLogout = () => {
        onLogout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="container">
                <div className="nav">
                    <h1>My Friends</h1>
                    <div className="nav-buttons">
                        <button className="btn btn-secondary" onClick={handleBackToDashboard}>
                            Back to Dashboard
                        </button>
                        <button onClick={handleLogout} className="btn btn-secondary">
                            Logout
                        </button>
                    </div>
                </div>
                <div className="card">
                    <h2>All Users</h2>
                    <div className="loading">Loading users...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container">
                <div className="nav">
                    <h1>My Friends</h1>
                    <div className="nav-buttons">
                        <button className="btn btn-secondary" onClick={handleBackToDashboard}>
                            Back to Dashboard
                        </button>
                        <button onClick={handleLogout} className="btn btn-secondary">
                            Logout
                        </button>
                    </div>
                </div>
                <div className="card">
                    <h2>All Users</h2>
                    <div className="error">{error}</div>
                    <button onClick={fetchAllUsers} className="btn">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="nav">
                <h1>My Friends</h1>
                <div className="nav-buttons">
                    <button className="btn btn-secondary" onClick={handleBackToDashboard}>
                        Back to Dashboard
                    </button>
                    <button onClick={handleLogout} className="btn btn-secondary">
                        Logout
                    </button>
                </div>
            </div>

            <div className="card">
                <h2>All Users ({users.length})</h2>

                {users.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                        No other users found.
                    </p>
                ) : (
                    <div className="user-list">
                        {users.map((user) => (
                            <div key={user.id} className="user-item">
                                <div className="user-info">
                                    <div className="user-avatar">
                                        {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="user-details">
                                        <h3>{user.username || 'Unknown User'}</h3>
                                        <p>{user.email}</p>
                                        <small>Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</small>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleChatClick(user)}
                                    className="btn btn-primary"
                                >
                                    Start Chat
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button onClick={fetchAllUsers} className="btn">
                        Refresh Users
                    </button>
                </div>
            </div>
        </div>
    );
}