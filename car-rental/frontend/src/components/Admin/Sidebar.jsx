import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "../../styles/Sidebar.module.scss";
import { FaHome, FaUsers, FaCar, FaClipboardList, FaMoneyBillWave, FaChartBar, FaBars, FaTimes } from "react-icons/fa";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false); // Trạng thái mở/đóng sidebar trên mobile
  const location = useLocation(); // Lấy URL hiện tại để xác định mục active

  // Đóng sidebar khi chuyển trang trên mobile
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  }, [location]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Nút toggle trên mobile */}
      <button className={`${styles.toggleButton} ${isOpen ? styles.hide : ""}`} onClick={toggleSidebar}>
        <FaBars />
      </button>

      <div className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <div className={styles.header}>
          <h1>Quản Trị</h1>
          <button className={styles.closeButton} onClick={toggleSidebar}>
            <FaTimes />
          </button>
        </div>
        <nav className={styles.nav}>
          <ul>
            <li className={`${styles.navItem} ${location.pathname === "/" ? styles.active : ""}`}>
              <Link to="/" className={styles.navLink}>
                <FaHome className={styles.navIcon} /> Tổng quan
              </Link>
            </li>
            <li className={`${styles.navItem} ${location.pathname === "/users" ? styles.active : ""}`}>
              <Link to="/admin/users" className={styles.navLink}>
                <FaUsers className={styles.navIcon} /> Người dùng
              </Link>
            </li>
            <li className={`${styles.navItem} ${location.pathname === "/car-listings" ? styles.active : ""}`}>
              <Link to="/admin/car-listings" className={styles.navLink}>
                <FaCar className={styles.navIcon} /> Tin đăng xe
              </Link>
            </li>
            <li className={`${styles.navItem} ${location.pathname === "/bookings" ? styles.active : ""}`}>
              <Link to="/admin/bookings" className={styles.navLink}>
                <FaClipboardList className={styles.navIcon} /> Đơn đặt xe
              </Link>
            </li>
            <li className={`${styles.navItem} ${location.pathname === "/payments" ? styles.active : ""}`}>
              <Link to="/admin/payments" className={styles.navLink}>
                <FaMoneyBillWave className={styles.navIcon} /> Thanh toán
              </Link>
            </li>
            <li className={`${styles.navItem} ${location.pathname === "/reports" ? styles.active : ""}`}>
              <Link to="/admin/reports" className={styles.navLink}>
                <FaChartBar className={styles.navIcon} /> Báo cáo
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}

export default Sidebar;