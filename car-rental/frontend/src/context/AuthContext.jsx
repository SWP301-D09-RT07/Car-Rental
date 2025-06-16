// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check token validity on mount
        const checkToken = () => {
            const storedToken = localStorage.getItem('token');
            const expiresAt = localStorage.getItem('expiresAt');
            const role = localStorage.getItem('role');
            const username = localStorage.getItem('username');

            if (storedToken && expiresAt && new Date(expiresAt) > new Date()) {
                setToken(storedToken);
                setUser({
                    username: username || null,
                    role: role || null,
                });
            } else {
                // Clear invalid token
                localStorage.removeItem('token');
                localStorage.removeItem('expiresAt');
                localStorage.removeItem('role');
                localStorage.removeItem('username');
                setToken(null);
                setUser(null);
            }
            setIsLoading(false);
        };

        checkToken();
    }, []);

    const login = (newToken, userData) => {
        setToken(newToken);
        const userInfo = {
            username: userData.username || null,
            role: userData.role || null,
        };
        setUser(userInfo);

        if (newToken) {
            localStorage.setItem('token', newToken);
            if (userData.expiresAt) localStorage.setItem('expiresAt', userData.expiresAt);
            if (userData.role) localStorage.setItem('role', userData.role);
            if (userData.username) localStorage.setItem('username', userData.username);
        }
    };

    const logoutHandler = async () => {
        try {
            await logout();
        } catch (error) {
            console.error(error);
        }
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('expiresAt');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
    };

    const isTokenExpired = () => {
        const expiresAt = localStorage.getItem('expiresAt');
        if (!expiresAt) return true;
        return Date.now() > parseInt(expiresAt, 10);
    };

    if (isLoading) {
        return null; // or a loading spinner
    }

    return (
        <AuthContext.Provider value={{ 
            user, 
            token, 
            login, 
            logout: logoutHandler,
            isAuthenticated: !!token && !isTokenExpired() 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;