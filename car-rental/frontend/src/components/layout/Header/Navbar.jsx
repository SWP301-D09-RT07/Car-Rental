import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
    FaHome,
    FaCar,
    FaMapMarkerAlt,
    FaTag,
    FaPhone,
    FaBars,
    FaTimes,
    FaSignInAlt,
    FaUserPlus,
    FaUser,
    FaCalendarAlt,
    FaStore,
    FaSignOutAlt
} from 'react-icons/fa';

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        logout && logout();
        navigate('/login');
    };

    return (
        <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-xl shadow-lg z-50 border-b border-blue-100">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center group">
                            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-3 rounded-2xl mr-3 group-hover:scale-110 transition-all duration-300 shadow-xl group-hover:shadow-2xl">
                                <FaCar className="text-xl text-white" />
                            </div>
                            <div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    DriveLuxe
                                </span>
                                <p className="text-xs text-gray-500 -mt-1">Premium Car Rental</p>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center space-x-8">
                        <nav className="flex items-center space-x-8">
                            {[
                                { name: "Trang chủ", path: "/", icon: FaHome, active: true },
                                { name: "Xe", path: "/xe", icon: FaCar },
                                { name: "Địa điểm", path: "/dia-diem", icon: FaMapMarkerAlt },
                                { name: "Ưu đãi", path: "/uu-dai", icon: FaTag },
                            ].map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`font-semibold transition-all duration-300 relative group flex items-center space-x-2 px-4 py-2 rounded-xl ${
                                        item.active ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                                    }`}
                                >
                                    <item.icon className="text-sm" />
                                    <span>{item.name}</span>
                                    {item.active && (
                                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                                    )}
                                </Link>
                            ))}
                        </nav>
                        <Link
                            to="/lien-he"
                            className="flex items-center text-gray-700 hover:text-emerald-600 transition-all duration-300 p-3 rounded-xl hover:bg-emerald-50 shadow-sm hover:shadow-md"
                        >
                            <FaPhone className="text-sm" />
                        </Link>
                        {/* User Dropdown */}
                        {isAuthenticated ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    className="flex items-center px-4 py-2 rounded-xl hover:bg-blue-50 transition-all duration-300 text-gray-700 font-semibold focus:outline-none"
                                    onClick={() => setIsDropdownOpen((v) => !v)}
                                >
                                    <FaUser className="text-lg mr-2" />
                                    <span>{user?.name || user?.username || 'Tài khoản'}</span>
                                </button>
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-blue-100 z-50 animate-in slide-in-from-top-5 duration-200">
                                        <ul className="py-2">
                                            {user?.role === 'SUPPLIER' && (
                                                <li>
                                                    <Link
                                                        to="/supplier/dashboard"
                                                        className="flex items-center px-6 py-3 text-sm hover:bg-blue-50 transition-all duration-200 rounded-xl text-gray-700 hover:text-blue-600"
                                                        onClick={() => setIsDropdownOpen(false)}
                                                    >
                                                        <FaCar className="mr-3 text-gray-400" />
                                                        Quản lý xe
                                                    </Link>
                                                </li>
                                            )}
                                            <li>
                                                <Link
                                                    to={user?.role === 'SUPPLIER' ? "/supplier/profile" : "/profile"}
                                                    className="flex items-center px-6 py-3 text-sm hover:bg-blue-50 transition-all duration-200 rounded-xl text-gray-700 hover:text-blue-600"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                >
                                                    <FaUser className="mr-3 text-gray-400" />
                                                    Hồ sơ của tôi
                                                </Link>
                                            </li>
                                            {user?.role === 'CUSTOMER' && (
                                                <li>
                                                    <Link
                                                        to="/my-bookings"
                                                        className="flex items-center px-6 py-3 text-sm hover:bg-blue-50 transition-all duration-200 rounded-xl text-gray-700 hover:text-blue-600"
                                                        onClick={() => setIsDropdownOpen(false)}
                                                    >
                                                        <FaCalendarAlt className="mr-3 text-gray-400" />
                                                        Lịch sử thuê xe
                                                    </Link>
                                                </li>
                                            )}
                                            <li>
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center w-full text-left px-6 py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 rounded-xl"
                                                >
                                                    <FaSignOutAlt className="mr-3 text-red-400" />
                                                    Đăng xuất
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="flex items-center text-gray-700 hover:text-blue-600 transition-all duration-300 p-3 rounded-xl hover:bg-blue-50 shadow-sm hover:shadow-md"
                                >
                                    <FaSignInAlt className="text-sm mr-2" />
                                    <span>Đăng nhập</span>
                                </Link>
                                <Link
                                    to="/register"
                                    className="flex items-center text-white bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    <FaUserPlus className="text-sm mr-2" />
                                    <span>Đăng ký</span>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="lg:hidden p-3 rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-sm"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? (
                            <FaTimes className="text-xl text-gray-700" />
                        ) : (
                            <FaBars className="text-xl text-gray-700" />
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden mt-6 pb-6 border-t border-blue-100 animate-in slide-in-from-top duration-300">
                        <nav className="flex flex-col space-y-2 mt-6">
                            {[
                                { name: "Trang chủ", path: "/", icon: FaHome, active: true },
                                { name: "Xe", path: "/xe", icon: FaCar },
                                { name: "Địa điểm", path: "/dia-diem", icon: FaMapMarkerAlt },
                                { name: "Ưu đãi", path: "/uu-dai", icon: FaTag },
                                { name: "Liên hệ", path: "/lien-he", icon: FaPhone },
                            ].map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`font-semibold p-4 rounded-xl transition-all duration-300 flex items-center space-x-3 ${
                                        item.active ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-blue-50"
                                    }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <item.icon className="text-lg" />
                                    <span>{item.name}</span>
                                </Link>
                            ))}
                            <div className="mt-4 space-y-2">
                                {isAuthenticated ? (
                                    <>
                                        {user?.role === 'SUPPLIER' && (
                                            <Link
                                                to="/supplier/dashboard"
                                                className="flex items-center text-gray-700 p-4 hover:bg-blue-50 hover:text-blue-600 rounded-xl space-x-3 transition-all"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                <FaCar className="text-lg" />
                                                <span>Quản lý xe</span>
                                            </Link>
                                        )}
                                        <Link
                                            to={user?.role === 'SUPPLIER' ? "/supplier/profile" : "/profile"}
                                            className="flex items-center text-gray-700 p-4 hover:bg-blue-50 hover:text-blue-600 rounded-xl space-x-3 transition-all"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <FaUser className="text-lg" />
                                            <span>Hồ sơ của tôi</span>
                                        </Link>
                                        {user?.role === 'CUSTOMER' && (
                                                    <Link
                                                        to="/my-bookings"
                                                        className="flex items-center text-gray-700 p-4 hover:bg-blue-50 hover:text-blue-600 rounded-xl space-x-3 transition-all"
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                    >
                                                        <FaCalendarAlt className="text-lg" />
                                                        <span>Lịch sử thuê xe</span>
                                                    </Link>
                                                )}
                                        <button
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                handleLogout();
                                            }}
                                            className="flex items-center w-full text-left text-red-600 p-4 hover:bg-red-50 rounded-xl space-x-3 transition-all"
                                        >
                                            <FaSignOutAlt className="text-lg" />
                                            <span>Đăng xuất</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/login"
                                            className="flex items-center text-gray-700 p-4 hover:bg-blue-50 hover:text-blue-600 rounded-xl space-x-3 transition-all"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <FaSignInAlt className="text-lg" />
                                            <span>Đăng nhập</span>
                                        </Link>
                                        <Link
                                            to="/register"
                                            className="flex items-center text-white bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-xl space-x-3 font-semibold shadow-lg"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <FaUserPlus className="text-lg" />
                                            <span>Đăng ký</span>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Navbar;