// src/components/AuthHandler.jsx
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAuthHandler } from "@/hooks/useAuthHandler.js";

export const AuthHandler = () => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const prevPathRef = useRef(location.pathname);

    // Handle OAuth callback
    useAuthHandler();

    useEffect(() => {
        console.log('AuthHandler: Current path:', location.pathname);
        console.log('AuthHandler: isAuthenticated:', isAuthenticated);
        console.log('AuthHandler: user role:', user?.role);
        
        // Only redirect if user is authenticated and on login page
        if (isAuthenticated && location.pathname === "/login") {
            console.log('AuthHandler: Redirecting authenticated user from login page');
            const redirectPath = user?.role === 'admin' ? '/admin' : '/';
            navigate(redirectPath, { replace: true });
        }

        // Update previous path
        prevPathRef.current = location.pathname;
    }, [isAuthenticated, location.pathname, navigate, user?.role]);

    return null;
};