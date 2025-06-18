// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);    useEffect(() => {
        // Check token validity on mount
        const checkToken = () => {
            const storedToken = localStorage.getItem('token');
            const expiresAt = localStorage.getItem('expiresAt');
            const role = localStorage.getItem('role');
            const username = localStorage.getItem('username');
            const userEmail = localStorage.getItem('userEmail');

            console.log('🔍 AuthContext checkToken:', {
                hasToken: !!storedToken,
                expiresAt: expiresAt,
                expiresAtDate: expiresAt ? new Date(parseInt(expiresAt, 10)).toISOString() : 'N/A',
                currentTime: new Date().getTime(),
                currentTimeDate: new Date().toISOString(),
                isExpired: expiresAt ? new Date().getTime() >= parseInt(expiresAt, 10) : true
            });            if (storedToken && expiresAt) {
                const currentTime = new Date().getTime();
                const expirationTime = parseInt(expiresAt, 10);
                const isExpired = currentTime >= expirationTime;
                
                console.log('🔍 Token validation details:', {
                    currentTime,
                    expirationTime,
                    isExpired,
                    timeDiff: expirationTime - currentTime,
                    timeDiffHours: (expirationTime - currentTime) / (1000 * 60 * 60)
                });

                if (!isExpired) {
                    console.log('✅ Token is valid, setting user');
                    setToken(storedToken);
                    setUser({
                        username: username || null,
                        role: role || null,
                        token: storedToken,
                        userEmail: userEmail || null,
                    });
                } else {
                    console.warn('⚠️ Token is expired, clearing localStorage');
                    localStorage.removeItem('token');
                    localStorage.removeItem('expiresAt');
                    localStorage.removeItem('role');
                    localStorage.removeItem('username');
                    localStorage.removeItem('userEmail');
                    setToken(null);
                    setUser(null);
                }            } else {
                // Clear invalid token
                console.warn('⚠️ Token or expiresAt missing, clearing localStorage');
                localStorage.removeItem('token');
                localStorage.removeItem('expiresAt');
                localStorage.removeItem('role');
                localStorage.removeItem('username');
                localStorage.removeItem('userEmail');
                setToken(null);
                setUser(null);
            }
            setIsLoading(false);
        };

        checkToken();
    }, []);

    const login = (newToken, userData) => {
        setToken(newToken);        const userInfo = {
            username: userData.username || null,
            role: userData.role || null,
            token: newToken,
            userEmail: userData.userEmail || null,
        };
        setUser(userInfo);

        if (newToken) {
            localStorage.setItem('token', newToken);            if (userData.expiresAt) localStorage.setItem('expiresAt', userData.expiresAt);
            if (userData.role) localStorage.setItem('role', userData.role);
            if (userData.username) localStorage.setItem('username', userData.username);
            if (userData.userEmail) localStorage.setItem('userEmail', userData.userEmail);
        }
    };    const logoutHandler = async () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('expiresAt');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        localStorage.removeItem('userEmail');
    };const isTokenExpired = () => {
        const expiresAt = localStorage.getItem('expiresAt');
        if (!expiresAt) return true;
        return Date.now() > parseInt(expiresAt, 10);
    };

    const updateUser = (updatedUserData) => {
        setUser(prev => ({ ...prev, ...updatedUserData }));
    };

    if (isLoading) {
        return null; // or a loading spinner
    }

    return (        <AuthContext.Provider value={{ 
            user, 
            token, 
            login, 
            logout: logoutHandler,
            updateUser,
            isAuthenticated: !!token && !isTokenExpired() 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;