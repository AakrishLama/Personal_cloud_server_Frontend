import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import './App.css';
import Myfiles from './components/Myfiles';
import Myfriends from './components/Myfriends';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Check if user is logged in on app load
    useEffect(() => {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            setCurrentUser(JSON.parse(savedUser));
            setIsLoggedIn(true);
        }
    }, []);

    const handleLogin = (user) => {
        setCurrentUser(user);
        setIsLoggedIn(true);
        localStorage.setItem('currentUser', JSON.stringify(user));
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setIsLoggedIn(false);
        localStorage.removeItem('currentUser');
    };

    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route
                        path="/login"
                        element={
                            isLoggedIn ?
                                <Navigate to="/dashboard" replace /> :
                                <Login onLogin={handleLogin} />
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            isLoggedIn ?
                                <Navigate to="/dashboard" replace /> :
                                <Register />
                        }
                    />
                    <Route
                        path="/dashboard"
                        element={
                            isLoggedIn ?
                                <Dashboard user={currentUser} onLogout={handleLogout} /> :
                                <Navigate to="/login" replace />
                        }
                    />
                    <Route
                        path="/"
                        element={
                            <Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />
                        }
                    />
                    <Route
                        path="/Myfiles"
                        element={
                            isLoggedIn ?
                                <Myfiles user={currentUser} onLogout={handleLogout} /> :
                                <Navigate to="/login" replace />
                        }
                    />
                    <Route
                        path="/Myfriends"
                        element={
                            isLoggedIn ?
                                <Myfriends user={currentUser} onLogout={handleLogout} /> :
                                <Navigate to="/login" replace />
                        }
                    />

                </Routes>
            </div>
        </Router>
    );
}

export default App;
