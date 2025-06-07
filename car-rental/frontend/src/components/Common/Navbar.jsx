import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/Navbar.css';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const renderMenu = () => {
        if (!user) {
            return (
                <>
                    <Link to="/" className="menu-link">Home</Link>
                    <Link to="/cars" className="menu-link">Cars</Link>
                    <Link to="/login" className="menu-link">Login</Link>
                    <Link to="/register" className="menu-link">Register</Link>
                </>
            );
        }

        switch (user.role) {
            case 'customer':
                return (
                    <>
                        <Link to="/" className="menu-link">Home</Link>
                        <Link to="/cars" className="menu-link">Cars</Link>
                        <Link to="/bookings" className="menu-link">Bookings</Link>
                        <Link to="/profile" className="menu-link">Profile</Link>
                        <button
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                            className="menu-link"
                        >
                            Logout
                        </button>
                    </>
                );
            case 'supplier':
                return (
                    <>
                        <Link to="/supplier/dashboard" className="menu-link">Dashboard</Link>
                        <Link to="/supplier/cars" className="menu-link">Manage Cars</Link>
                        <Link to="/supplier/profile" className="menu-link">Profile</Link>
                        <button
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                            className="menu-link"
                        >
                            Logout
                        </button>
                    </>
                );
            case 'admin':
                return (
                    <>
                        <Link to="/admin/dashboard" className="menu-link">Dashboard</Link>
                        <Link to="/admin/users" className="menu-link">Users</Link>
                        <Link to="/profile" className="menu-link">Profile</Link>
                        <button
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                            className="menu-link"
                        >
                            Logout
                        </button>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <nav className="navbar">
            <div className="container">
                <div className="logo-name-container">
                    <Link to="/">
                        <img
                            src="/images/logo.png"
                            alt="Carbook Logo"
                            className="logo"
                        />
                    </Link>
                    <span className="brand-name">CAR RENTAL</span>
                </div>
                <div className="menu-container">
                    {renderMenu()}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;