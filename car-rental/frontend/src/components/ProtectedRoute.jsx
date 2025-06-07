import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, token } = useContext(AuthContext);
    const location = useLocation();

    // Nếu chưa đăng nhập
    if (!token || !user) {
        return (
            <Navigate
                to={`/login?redirectTo=${encodeURIComponent(location.pathname + location.search)}`}
                replace
            />
        );
    }

    // Nếu không đúng vai trò
    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
