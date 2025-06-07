import { Link } from 'react-router-dom';
import styles from './SearchPage.module.scss';

const CarList = ({ cars, viewMode, onViewModeChange }) => {
    return (
        <div className={styles.carList}>
            <div className={styles.controls}>
                <select className={styles.sortSelect}>
                    <option value="price-asc">Giá thấp đến cao</option>
                    <option value="price-desc">Giá cao đến thấp</option>
                    <option value="rating">Đánh giá cao</option>
                    <option value="newest">Mới nhất</option>
                </select>
                <button
                    onClick={() => onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
                    className={styles.viewToggle}
                >
                    {viewMode === 'grid' ? 'Danh sách' : 'Lưới'}
                </button>
            </div>
            <div className={viewMode === 'grid' ? styles.carGrid : styles.carListView}>
                {cars.length > 0 ? (
                    cars.map(car => (
                        <div key={car.carId} className={styles.carCard}>
                            <img
                                src={car.image || 'https://via.placeholder.com/300'}
                                alt={car.model}
                                className={styles.carImage}
                            />
                            <div className={styles.carInfo}>
                                <h3 className={styles.carName}>{car.model} ({car.brandName})</h3>
                                <p className={styles.carPrice}>{car.dailyRate?.toLocaleString()} VND/ngày</p>
                                <p className={styles.carRating}>Đánh giá: {car.averageRating || 'Chưa có'}</p>
                                <Link to={`/cars/${car.carId}`} className={styles.viewDetailsLink}>
                                    Xem chi tiết
                                </Link>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>Không tìm thấy xe nào.</p>
                )}
            </div>
            <div className={styles.pagination}>
                <button className={styles.pageButton}>Previous</button>
                <button className={styles.pageButton}>Next</button>
            </div>
        </div>
    );
};

export default CarList;