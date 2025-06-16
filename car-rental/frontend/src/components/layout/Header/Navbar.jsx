import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import styles from './Navbar.module.scss';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 10;
            setScrolled(isScrolled);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const renderMenu = () => {
        if (!user) {
            return (
                <>
                    <Link to="/" className={styles.menuLink}>
                        <span>Home</span>
                    </Link>
                    <Link to="/cars" className={styles.menuLink}>
                        <span>Cars</span>
                    </Link>
                    <Link to="/login" className={`${styles.menuLink} ${styles.loginBtn}`}>
                        <span>Login</span>
                    </Link>
                    <Link to="/register" className={`${styles.menuLink} ${styles.registerBtn}`}>
                        <span>Register</span>
                    </Link>
                </>
            );
        }

        switch (user.role) {
            case 'customer':
                return (
                    <>
                        <Link to="/" className={styles.menuLink}>
                            <span>Home</span>
                        </Link>
                        <Link to="/cars" className={styles.menuLink}>
                            <span>Cars</span>
                        </Link>
                        <Link to="/bookings" className={styles.menuLink}>
                            <span>Bookings</span>
                        </Link>
                        <Link to="/profile" className={styles.menuLink}>
                            <span>Profile</span>
                        </Link>
                        <button onClick={handleLogout} className={`${styles.menuLink} ${styles.logoutBtn}`}>
                            <span>Logout</span>
                        </button>
                    </>
                );
            case 'supplier':
                return (
                    <>
                        <Link to="/dashboard" className={styles.menuLink}>
                            <span>Dashboard</span>
                        </Link>
                        <Link to="/manage-cars" className={styles.menuLink}>
                            <span>Manage Cars</span>
                        </Link>
                        <Link to="/profile" className={styles.menuLink}>
                            <span>Profile</span>
                        </Link>
                        <button onClick={handleLogout} className={`${styles.menuLink} ${styles.logoutBtn}`}>
                            <span>Logout</span>
                        </button>
                    </>
                );
            case 'admin':
                return (
                    <>
                        <Link to="/dashboard" className={styles.menuLink}>
                            <span>Dashboard</span>
                        </Link>
                        <Link to="/users" className={styles.menuLink}>
                            <span>Users</span>
                        </Link>
                        <Link to="/profile" className={styles.menuLink}>
                            <span>Profile</span>
                        </Link>
                        <button onClick={handleLogout} className={`${styles.menuLink} ${styles.logoutBtn}`}>
                            <span>Logout</span>
                        </button>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
            <div className={styles.container}>
                <div className={styles.logoContainer}>
                    <Link to="/" className={styles.logoLink}>
                        <div className={styles.logo}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                            </svg>
                        </div>
                        <span className={styles.brandName}>CAR RENTAL</span>
                    </Link>
                </div>
                
                <div className={styles.menuContainer}>
                    {renderMenu()}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;