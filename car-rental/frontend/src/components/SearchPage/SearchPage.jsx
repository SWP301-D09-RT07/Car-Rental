import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { searchCars } from '../../services/api';
import FilterPanel from './FilterPanel';
import CarList from './CarList';
import styles from './SearchPage.module.scss';

const SearchPage = () => {
    const [cars, setCars] = useState([]);
    const [filters, setFilters] = useState({});
    const [viewMode, setViewMode] = useState('grid');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCars = async () => {
            setLoading(true);
            try {
                const response = await searchCars(filters);
                setCars(response);
            } catch (err) {
                setError(err.message || 'Không thể tải danh sách xe');
            } finally {
                setLoading(false);
            }
        };
        fetchCars();
    }, [filters]);

    const handleFilterChange = (newFilters) => setFilters(newFilters);
    const handleViewModeChange = (newMode) => setViewMode(newMode);

    return (
        <div className={styles.searchPage}>
            <header className={styles.header}>
                <div className={styles.logo}>RentCar</div>
                <nav>
                    <Link to="/" className={styles.navLink}>Trang chủ</Link>
                    <Link to="/login" className={styles.navLink}>Đăng nhập</Link>
                    <Link to="/register" className={styles.navLink}>Đăng ký</Link>
                    <Link to="/favorites" className={styles.navLink}>Yêu thích</Link>
                    <Link to="/profile" className={styles.navLink}>Hồ sơ</Link>
                </nav>
            </header>

            <div className={styles.content}>
                <FilterPanel onFilterChange={handleFilterChange} />
                <div className={styles.carListWrapper}>
                    {loading ? (
                        <p>Đang tải...</p>
                    ) : error ? (
                        <p className={styles.error}>{error}</p>
                    ) : (
                        <CarList cars={cars} viewMode={viewMode} onViewModeChange={handleViewModeChange} />
                    )}
                </div>
            </div>

            <footer className={styles.footer}>
                <p className={styles.footerLinks}>
                    <a href="#" className={styles.footerLink}>Facebook</a> |
                    <a href="#" className={styles.footerLink}>Twitter</a> |
                    <a href="#" className={styles.footerLink}>Instagram</a>
                </p>
                <p>Liên hệ: contact@rentcar.com | Hotline: 1900 1234</p>
                <p>Chính sách bảo mật | Điều khoản dịch vụ</p>
            </footer>
        </div>
    );
};

export default SearchPage;