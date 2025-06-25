import { useContext } from 'react';
import { ToastContainer } from 'react-toastify';
import { AuthContext } from './store/AuthContext';
import AuthHandler from './components/features/auth/AuthHandler.jsx';
import AppRoutes from './routes/index.jsx';

const App = () => {
    const { user } = useContext(AuthContext);

    const isAdminRoute = window.location.pathname.startsWith('/admin');
    const isAdmin = user && user.role === 'admin';

    return (
        <>
            <div className="app-container">
                {/* {isAdmin && isAdminRoute && <Sidebar />} */}
                <div className={isAdmin && isAdminRoute ? 'main-content' : ''}>
                    <AuthHandler />
                    <AppRoutes />
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={3000} />
        </>
    );
};

export default App;