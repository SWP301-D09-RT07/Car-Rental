// src/hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../store/AuthContext';

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};