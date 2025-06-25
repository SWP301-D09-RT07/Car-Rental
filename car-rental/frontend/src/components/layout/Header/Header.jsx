import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaCarSide, FaHome, FaCar, FaStore, FaSearch, FaHeart, FaChevronDown, FaSignOutAlt, FaSignInAlt, FaUserPlus, FaTimes, FaBars, FaPhone, FaUser, FaCalendarAlt } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";

const Header = ({
    isAuthenticated,
    userEmail,
    isUserDropdownOpen,
    setIsUserDropdownOpen,
    handleLogout,
    isMobileMenuOpen,
    setIsMobileMenuOpen
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    return (
        <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-xl shadow-lg z-50 border-b border-blue-100">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo + Main Menu (all left) */}
                    <div className="flex items-center space-x-8">
                        {/* Logo */}
                        <Link to="/" className="flex items-center group">
                            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-3 rounded-2xl mr-3 group-hover:scale-110 transition-all duration-300 shadow-xl group-hover:shadow-2xl">
                                <FaCarSide className="text-xl text-white" />
                            </div>
                            <div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    DriveLuxe
                                </span>
                                <p className="text-xs text-gray-500 -mt-1">Premium Car Rental</p>
                            </div>
                        </Link>
                        {/* Main Menu */}
                        <nav className="flex items-center space-x-8">
                            <Link to="/" className={`font-semibold transition-all duration-300 relative group flex items-center space-x-2 px-4 py-2 rounded-xl ${location.pathname === '/' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}>
                                <FaHome className="text-sm" />
                                <span>Trang chủ</span>
                                {location.pathname === '/' && <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>}
                            </Link>
                            <Link to="/search" state={{ filterType: "all" }} className={`font-semibold transition-all duration-300 relative group flex items-center space-x-2 px-4 py-2 rounded-xl ${location.pathname.startsWith('/search') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}>
                                <FaCar className="text-sm" />
                                <span>Xe</span>
                                {location.pathname.startsWith('/search') && <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>}
                            </Link>
                            <Link to="/provider-register" className="flex items-center text-indigo-600 hover:text-indigo-700 transition-all duration-300 px-4 py-2 rounded-xl hover:bg-indigo-50 group text-sm font-semibold border border-indigo-200 hover:border-indigo-300">
                                <FaStore className="text-sm mr-2 group-hover:scale-110 transition-transform" />
                                <span>Đối tác</span>
                            </Link>
                        </nav>
                    </div>
                    {/* Right Side Actions (search, favorite, user, phone) */}
                    <div className="flex items-center space-x-4">
                        {/* Enhanced Search Bar */}
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Tìm xe mơ ước..."
                                className="py-3 px-4 pr-12 rounded-2xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-blue-50/50 hover:bg-white transition-all duration-300 w-64 focus:w-72 group-hover:shadow-lg"
                                aria-label="Tìm kiếm xe"
                            />
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-lg cursor-pointer hover:scale-110 transition-transform">
                                <FaSearch className="text-white text-xs" />
                            </div>
                        </div>
                        {/* Favorites Button */}
                        <Link
                            to="/favorites"
                            className="flex items-center text-gray-700 hover:text-red-600 transition-all duration-300 p-2 rounded-xl hover:bg-red-50 group"
                        >
                            <FaHeart className="text-lg" />
                        </Link>
                        {/* Enhanced User Account */}
                        <div className="relative">
                            {localStorage.getItem("token") ? (
                                <button
                                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                    className="flex items-center text-gray-700 hover:text-blue-600 transition-all duration-300 p-2 rounded-xl hover:bg-blue-50 group"
                                >
                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-3 shadow-lg group-hover:shadow-xl transition-all">
                                        <span className="text-white text-sm font-bold">U</span>
                                    </div>
                                    <FaChevronDown
                                        className={`text-xs transition-all duration-300 ${isUserDropdownOpen ? "rotate-180" : ""}`}
                                    />
                                </button>
                            ) : (
                                <div className="flex items-center space-x-3">
                                    <Link
                                        to="/login"
                                        className="text-gray-700 hover:text-blue-600 transition-all duration-300 px-4 py-2 rounded-xl hover:bg-blue-50 text-sm font-semibold"
                                    >
                                        Đăng nhập
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white py-2 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm"
                                    >
                                        Đăng ký
                                    </Link>
                                </div>
                            )}
                            {/* Enhanced User Dropdown */}
                            {isAuthenticated && isUserDropdownOpen && (
                                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl py-3 border border-blue-100 animate-in slide-in-from-top-5 duration-200">
                                    <div className="px-6 py-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
                                        <p className="text-sm font-semibold text-gray-900">Xin chào!</p>
                                        <p className="text-xs text-gray-500">{userEmail || "user@example.com"}</p>
                                    </div>
                                    {[
                                        { icon: FaUser, text: "Hồ sơ của tôi", path: "/profile" },
                                        { icon: FaCalendarAlt, text: "Lịch sử thuê xe", path: "/my-bookings" },
                                        { icon: FaStore, text: "Quản lý xe", path: "/provider-dashboard", color: "text-blue-600" },
                                    ].map((item, index) => (
                                        <Link
                                            key={index}
                                            to={item.path}
                                            className={`flex items-center px-6 py-3 text-sm hover:bg-blue-50 transition-all duration-200 rounded-xl mx-2 ${item.color || "text-gray-700 hover:text-blue-600"}`}
                                            onClick={() => setIsUserDropdownOpen(false)}
                                        >
                                            <item.icon className="mr-3 text-gray-400" />
                                            {item.text}
                                        </Link>
                                    ))}
                                    <div className="border-t border-blue-100 mt-2 pt-2">
                                        <button
                                            onClick={() => {
                                                handleLogout();
                                                setIsUserDropdownOpen(false);
                                            }}
                                            className="flex items-center w-full text-left px-6 py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 rounded-xl mx-2"
                                        >
                                            <FaSignOutAlt className="mr-3 text-red-400" />
                                            Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Contact Button */}
                        <Link
                            to="/lien-he"
                            className="flex items-center text-gray-700 hover:text-emerald-600 transition-all duration-300 p-3 rounded-xl hover:bg-emerald-50 shadow-sm hover:shadow-md"
                        >
                            <FaPhone className="text-sm" />
                        </Link>
                    </div>
                </div>
                {/* Enhanced Mobile Menu Button */}
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
            {/* Enhanced Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden mt-6 pb-6 border-t border-blue-100 animate-in slide-in-from-top duration-300">
                    <nav className="flex flex-col space-y-2 mt-6">
                        {[
                            { name: "Trang chủ", path: "/", icon: FaHome, active: true },
                            { name: "Xe", path: "/search", icon: FaCar, state: { filterType: "all" } },
                        ].map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                state={item.state}
                                className={`font-semibold p-4 rounded-xl transition-all duration-300 flex items-center space-x-3 ${
                                    item.active ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-blue-50"
                                }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <item.icon className="text-lg" />
                                <span>{item.name}</span>
                            </Link>
                        ))}
                        {/* Mobile Favorites */}
                        <Link
                            to="/favorites"
                            className="font-semibold p-4 rounded-xl transition-all duration-300 flex items-center space-x-3 text-gray-700 hover:bg-red-50 hover:text-red-600"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <FaHeart className="text-lg" />
                            <span>Yêu thích</span>
                        </Link>
                        {/* Mobile User Actions */}
                        <div className="pt-4 border-t border-blue-100 space-y-2">
                            {isAuthenticated ? (
                                <>
                                    <Link
                                        to="/profile"
                                        className="flex items-center text-gray-700 p-4 hover:bg-blue-50 hover:text-blue-600 rounded-xl space-x-3 transition-all"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <FaUser className="text-lg" />
                                        <span>Hồ sơ của tôi</span>
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsMobileMenuOpen(false);
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
        </header>
    );
};

export default Header; 