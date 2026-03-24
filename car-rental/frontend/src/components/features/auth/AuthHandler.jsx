import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.js';
import { useAuthHandler } from '@/hooks/useAuthHandler.js';

export const AuthHandler = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const prevPathRef = useRef(location.pathname);

  useAuthHandler();

  useEffect(() => {
    if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/register')) {
      navigate(
        prevPathRef.current === '/login' || prevPathRef.current === '/register'
          ? '/'
          : prevPathRef.current
      );
    }

    prevPathRef.current = location.pathname;
  }, [isAuthenticated, location.pathname, navigate]);

  return null;
};

export default AuthHandler;
