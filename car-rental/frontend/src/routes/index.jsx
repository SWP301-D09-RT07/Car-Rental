import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from '../store/AuthContext';

// Pages
import HomePage from '../pages/home/HomePage/HomePage';
import CarDetailPage from '../pages/cars/CarDetailPage/CarDetailPage';
import BookingConfirmationPage from '../pages/bookings/confirmation/BookingConfirmationPage/BookingConfirmationPage';
import BookingSuccessPage from '../pages/bookings/confirmation/BookingSuccessPage/BookingSuccessPage';
import PaymentPage from '../pages/payments/PaymentPage/PaymentPage';
import LoginRegister from '../pages/Auth/LoginRegister';
import FavoritePage from '../pages/favorites/FavoritePage/FavoritePage';
import ProfilePage from '../pages/profile/ProfilePage/ProfilePage';
import SearchPage from "@/pages/cars/SearchPage/SearchPage";
import PaymentFailedPage from '../pages/payments/PaymentFailedPage';

// Components
import { ProtectedRoute } from '../components/features/auth/ProtectedRoute.jsx';

// Admin Pages
import AdminHome from '../components/features/admin/Admin/Home';
import Bookings from '../components/features/admin/Admin/Bookings';
import CarListings from '../components/features/admin/Admin/CarListings';
import Payments from '../components/features/admin/Admin/Payments';
import Reports from '../components/features/admin/Admin/Reports';
import Users from '../components/features/admin/Admin/Users';

const AppRoutes = () => {
    const { user } = useContext(AuthContext);

    return (
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
            <Route path="/search" element={<SearchPage />} />
            <Route
                path="/bookings/confirmation"
                element={
                    <ProtectedRoute>
                        <BookingConfirmationPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/booking-success"
                element={
                    <ProtectedRoute>
                        <BookingSuccessPage />
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
                path="/payment-failed"
                element={
                    <ProtectedRoute>
                        <PaymentFailedPage />
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
    );
}

export default AppRoutes; 