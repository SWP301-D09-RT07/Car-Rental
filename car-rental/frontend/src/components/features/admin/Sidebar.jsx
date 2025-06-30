import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "../../../styles/Sidebar.module.scss";
import {
    FaHome,
    FaUsers,
    FaChartBar,
    FaBars,
    FaTimes,
} from "react-icons/fa";

export const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(true);
    const location = useLocation();

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const menuItems = [
        { path: "/admin", icon: <FaHome />, label: "Trang chủ" },
        { path: "/admin/users", icon: <FaUsers />, label: "Người dùng" },
        { path: "/admin/reports", icon: <FaChartBar />, label: "Báo cáo" },
    ];

    // Mở sidebar mặc định khi ở trang admin
    useEffect(() => {
        if (location.pathname.startsWith("/admin")) {
            setIsOpen(true);
        }
    }, [location.pathname]);

    return (
        <div className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
            <button className={styles.toggleButton} onClick={toggleSidebar}>
                {isOpen ? <FaTimes /> : <FaBars />}
            </button>
            <div className={styles.header}>
                <h1>ADMIN</h1>
                {isOpen && <button className={styles.closeButton} onClick={toggleSidebar}><FaTimes /></button>}
            </div>
            <nav className={styles.nav}>
                <ul>
                    {menuItems.map((item) => (
                        <li key={item.path} className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ""}`}>
                            <Link to={item.path} className={styles.navLink}>
                                {item.icon}
                                {isOpen && <span>{item.label}</span>}
                            </Link>
                        </li>
                    ))}
                    <li className={`${styles.navItem} ${location.pathname === "/admin/owner-requests" ? styles.active : ""}`}>
                        <Link to="/admin/owner-requests" className={styles.navLink}>
                            Đơn đăng ký chủ xe
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;