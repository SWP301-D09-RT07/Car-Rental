import { createContext, useState, useEffect } from 'react';
import { logout } from '../services/api';

// Export AuthContext để các component có thể import
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));

    const login = (newToken, userData) => {
        setToken(newToken);
        const userInfo = {
            username: userData.username || null,
            role: userData.role || null,
        };
        setUser(userInfo);

        if (newToken) {
            localStorage.setItem('token', newToken);
            if (userData.expiresAt) {
                localStorage.setItem('expiresAt', userData.expiresAt);
            }
            if (userData.role) {
                localStorage.setItem('role', userData.role);
            }
            if (userData.username) {
                localStorage.setItem('username', userData.username);
            }
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
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedExpiresAt = localStorage.getItem('expiresAt');
        const storedRole = localStorage.getItem('role');
        if (storedToken && storedExpiresAt) {
            const now = new Date().getTime();
            if (now < parseInt(storedExpiresAt)) {
                setToken(storedToken);
                setUser({
                    username: localStorage.getItem('username') || null,
                    role: storedRole || null,
                });
            } else {
                logoutHandler();
            }
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, login, logout: logoutHandler }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;