import { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext } from './context/AuthContext';

// Pages
import HomePage from './pages/home/HomePage/HomePage';
import CarDetailPage from './pages/cars/detail/CarDetailPage/CarDetailPage';
import BookingConfirmationPage from './pages/bookings/confirmation/BookingConfirmationPage/BookingConfirmationPage';
import PaymentPage from './pages/payments/components/PaymentPage/PaymentPage';
import LoginRegister from './pages/Auth/LoginRegister';
import FavoritePage from './pages/favorites/FavoritePage/FavoritePage';
import ProfilePage from './pages/profile/ProfilePage/ProfilePage';
import CarList from './pages/cars/list/CarList/CarList';


// Components
import { Sidebar } from './components/features/admin/components/Admin/Sidebar';
import { ProtectedRoute } from './components/features/auth/components/ProtectedRoute';
import { AuthHandler } from './components/features/auth/components/AuthHandler';

// Admin Pages
import AdminHome from './components/features/admin/components/Admin/Home';
import Bookings from './components/features/admin/components/Admin/Bookings';
import CarListings from './components/features/admin/components/Admin/CarListings';
import Payments from './components/features/admin/components/Admin/Payments';
import Reports from './components/features/admin/components/Admin/Reports';
import Users from './components/features/admin/components/Admin/Users';
import SearchPage from "@/components/features/cars/components/SearchPage/SearchPage";

const App = () => {
    const { user } = useContext(AuthContext);

    const isAdminRoute = window.location.pathname.startsWith('/admin');
    const isAdmin = user && user.role === 'admin';

    return (
        <BrowserRouter>
            <div className="app-container">
                {isAdmin && isAdminRoute && <Sidebar />}
                <div className={isAdmin && isAdminRoute ? 'main-content' : ''}>
                    <AuthHandler />
                    <Routes>
                        <Route path="/login" element={<LoginRegister />} />
                        <Route
                            path="/"
                            element={
                                user ? (
                                    user.role === 'admin' ? (
                                        <Navigate to="/admin" replace />
                                    ) : (
                                        <HomePage />
                                    )
                                ) : (
                                    <HomePage />
                                )
                            }
                        />
                
                        <Route path="/cars/:carId" element={<CarDetailPage />} />
                        <Route path="/cars" element={<CarList />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route
                            path="/booking-confirmation"
                            element={
                                <ProtectedRoute>
                                    <BookingConfirmationPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/payment"
                            element={
                                <ProtectedRoute>
                                    <PaymentPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/favorites"
                            element={
                                <ProtectedRoute>
                                    <FavoritePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <ProfilePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute requiredRole="admin">
                                    <AdminHome />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/bookings"
                            element={
                                <ProtectedRoute requiredRole="admin">
                                    <Bookings />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/car-listings"
                            element={
                                <ProtectedRoute requiredRole="admin">
                                    <CarListings />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/payments"
                            element={
                                <ProtectedRoute requiredRole="admin">
                                    <Payments />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/reports"
                            element={
                                <ProtectedRoute requiredRole="admin">
                                    <Reports />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/users"
                            element={
                                <ProtectedRoute requiredRole="admin">
                                    <Users />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={3000} />
        </BrowserRouter>
    );
};

export default App;