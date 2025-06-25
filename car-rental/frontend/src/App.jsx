import { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "./context/AuthContext";

// Pages
import HomePage from "./pages/home/HomePage/HomePage";
import CarDetailPage from "./pages/cars/detail/CarDetailPage/CarDetailPage";
import BookingConfirmationPage from "./pages/bookings/confirmation/BookingConfirmationPage/BookingConfirmationPage";
import PaymentPage from "./pages/payments/components/PaymentPage/PaymentPage";
import LoginRegister from "./pages/Auth/LoginRegister";
import FavoritePage from "./pages/favorites/FavoritePage/FavoritePage";
import ProfilePage from "./pages/profile/ProfilePage/ProfilePage";
import CarList from "./pages/cars/list/CarList/CarList";

// Components
import { Sidebar } from "./components/features/admin/Sidebar.jsx";
import { ProtectedRoute } from "./components/features/auth/components/ProtectedRoute";
import { AuthHandler } from "./components/features/auth/components/AuthHandler";

// Admin Pages
import AdminHome from "./components/features/admin/Home.jsx";
import Bookings from "./components/features/admin/Bookings.jsx";
import CarListings from "./components/features/admin/CarListings.jsx";
import Payments from "./components/features/admin/Payments.jsx";
import Reports from "./components/features/admin/Reports.jsx";
import Users from "./components/features/admin/Users.jsx";
import SearchPage from "@/components/features/cars/components/SearchPage/SearchPage";

// Admin Layout Wrapper
const AdminLayout = ({ children }) => {
    return (
        <div className="app-container">
            <div className="sidebar-wrapper">
                <Sidebar />
            </div>
            <div className="main-content with-sidebar">{children}</div>
        </div>
    );
};

const App = () => {
    const { user } = useContext(AuthContext);

    const isAdmin = user && user.role === "admin";

    return (
        <BrowserRouter>
            <div className="app-container">
                {!isAdmin && <AuthHandler />}
                <Routes>
                    <Route path="/login" element={<LoginRegister />} />
                    <Route
                        path="/"
                        element={
                            user
                                ? isAdmin
                                    ? <Navigate to="/admin" replace />
                                    : <HomePage />
                                : <HomePage />
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
                                <AdminLayout>
                                    <AdminHome />
                                </AdminLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/bookings"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <AdminLayout>
                                    <Bookings />
                                </AdminLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/car-listings"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <AdminLayout>
                                    <CarListings />
                                </AdminLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/payments"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <AdminLayout>
                                    <Payments />
                                </AdminLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/reports"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <AdminLayout>
                                    <Reports />
                                </AdminLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/users"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <AdminLayout>
                                    <Users />
                                </AdminLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
            <ToastContainer position="top-right" autoClose={3000} />
        </BrowserRouter>
    );
};

export default App;