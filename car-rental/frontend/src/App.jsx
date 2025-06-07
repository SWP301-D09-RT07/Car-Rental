import { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthContext } from './context/AuthContext';

import HomePage from './components/HomePage/HomePage';
import SearchPage from './components/SearchPage/SearchPage';
import CarDetailPage from './components/CarDetailPage/CarDetailPage';
import BookingConfirmationPage from './components/BookingConfirmationPage/BookingConfirmationPage';
import PaymentPage from './components/PaymentPage/PaymentPage';
import LoginRegister from './pages/Auth/LoginRegister';
import FavoritePage from './components/FavoritePage/FavoritePage';
import ProfilePage from './components/ProfilePage/ProfilePage';
import Cars from './components/CarPage/Cars';
import Sidebar from './components/Admin/Sidebar';

import ProtectedRoute from './components/ProtectedRoute';

// Admin Pages
import AdminHome from './components/Admin/Home.jsx';
import Bookings from './components/Admin/Bookings.jsx';
import CarListings from './components/Admin/CarListings.jsx';
import Payments from './components/Admin/Payments.jsx';
import Reports from './components/Admin/Reports.jsx';
import Users from './components/Admin/Users.jsx';

const App = () => {
    const { user } = useContext(AuthContext);

    // Kiểm tra xem có phải tuyến đường admin không
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    const isAdmin = user && user.role === 'admin';

    return (
        <BrowserRouter>
            <div className="app-container">
                {/* Hiển thị Sidebar chỉ cho admin và trên các tuyến đường admin */}
                {isAdmin && isAdminRoute && <Sidebar />}
                <div className={isAdmin && isAdminRoute ? 'main-content' : ''}>
                    <Routes>
                        {/* Đăng nhập / đăng ký */}
                        <Route path="/login" element={<LoginRegister />} />

                        {/* Chuyển hướng "/" tùy vai trò */}
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

                        {/* Các route không yêu cầu quyền */}
                        <Route path="/cars" element={<Cars />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/cars/:carId" element={<CarDetailPage />} />

                        {/* Yêu cầu đăng nhập */}
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

                        {/* Admin-only routes */}
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

                        {/* Fallback: trang không tồn tại */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={3000} />
        </BrowserRouter>
    );
};

export default App;