// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const logoutHandler = () => {
        console.log('AuthContext: Logout called');
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('expiresAt');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        navigate('/login?error=session_expired', { replace: true });
    };

    useEffect(() => {
        const handleAuthError = () => {
            console.error('AuthContext: Caught auth-error event, logging out.');
            logoutHandler();
        };

        window.addEventListener('auth-error', handleAuthError);
        return () => window.removeEventListener('auth-error', handleAuthError);
    }, []);

    useEffect(() => {
        // Check token validity on mount
        const checkToken = () => {
            console.log('AuthContext: Checking token validity...');
            const storedToken = localStorage.getItem('token');
            const expiresAt = localStorage.getItem('expiresAt');
            const role = localStorage.getItem('role');
            const username = localStorage.getItem('username');

            if (storedToken && expiresAt && parseInt(expiresAt, 10) > Date.now()) {
                console.log('AuthContext: Token is valid, setting user data');
                setToken(storedToken);
                setUser({
                    username: username || null,
                    role: role || null,
                });
            } else if (storedToken) {
                console.log('AuthContext: Token is expired, logging out');
                logoutHandler();
            } else {
                console.log('AuthContext: No token found.');
                setToken(null);
                setUser(null);
            }
            setIsLoading(false);
        };

        checkToken();
    }, []);

    const login = (newToken, userData) => {
        console.log('AuthContext: Login called with token:', !!newToken);
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

    const isTokenExpired = () => {
        const expiresAt = localStorage.getItem('expiresAt');
        if (!expiresAt) return true;
        return Date.now() > parseInt(expiresAt, 10);
    };

    if (isLoading) {
        console.log('AuthContext: Still loading...');
        return null;
    }

    console.log('AuthContext: Rendering with isAuthenticated:', !!token && !isTokenExpired());

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