// src/hooks/useAuthHandler.js
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

export const useAuthHandler = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token');
        const expiresAt = urlParams.get('expiresAt');
        const role = urlParams.get('role');
        const redirectTo = urlParams.get('redirectTo');

        if (token && expiresAt && role) {
            try {
                const decodedToken = JSON.parse(atob(token.split('.')[1]));
                const currentTime = Date.now();
                if (decodedToken.exp * 1000 < currentTime) {
                    console.log('Token expired');
                } else {
                    login(token, { expiresAt: parseInt(expiresAt), role, username: urlParams.get('username') });
                    navigate(redirectTo || '/', { replace: true });
                    console.log('Login successful, redirected to:', redirectTo || '/');
                }
            } catch (error) {
                console.error('Lỗi xử lý token:', error);
            }
        }
    }, [location, navigate, login]);
};