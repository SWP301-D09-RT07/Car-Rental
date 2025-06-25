import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "../../../../../styles/Sidebar.module.scss";
import { FaHome, FaUsers, FaCar, FaClipboardList, FaMoneyBillWave, FaChartBar, FaBars, FaTimes } from "react-icons/fa";

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const menuItems = [
    { path: "/admin", icon: <FaHome />, label: "Trang chủ" },
    { path: "/admin/users", icon: <FaUsers />, label: "Người dùng" },
    { path: "/admin/cars", icon: <FaCar />, label: "Xe" },
    { path: "/admin/bookings", icon: <FaClipboardList />, label: "Đặt xe" },
    { path: "/admin/payments", icon: <FaMoneyBillWave />, label: "Thanh toán" },
    { path: "/admin/reports", icon: <FaChartBar />, label: "Báo cáo" },
  ];

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
      <button className={styles.toggleButton} onClick={toggleSidebar}>
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>
      <nav className={styles.nav}>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ""}`}
          >
            {item.icon}
            {isOpen && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
};