import React from 'react';
import { Link } from 'react-router-dom';
import { FaCar, FaMapMarkerAlt, FaCalendarAlt, FaUser, FaStar, FaGasPump, FaCog } from 'react-icons/fa';
import styles from './SearchPage.module.scss';

const CarList = ({ cars, viewMode, onViewModeChange, onViewSchedule, isLoading, error }) => {
    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.error}>
                <p>{error}</p>
            </div>
        );
    }

    if (!cars || cars.length === 0) {
        return (
            <div className={styles.noResults}>
                <FaCar />
                <h3>Không tìm thấy xe nào</h3>
                <p>Vui lòng thử lại với bộ lọc khác</p>
                <button onClick={() => window.location.reload()}>
                    <FaCar /> Tải lại trang
                </button>
            </div>
        );
    }

    return (
        <div className={styles.carList}>
            <div className={styles.controls}>
                <div className={styles.viewControls}>
                    <button
                        onClick={() => onViewModeChange('grid')}
                        className={`${styles.viewToggle} ${viewMode === 'grid' ? styles.active : ''}`}
                        aria-label="Xem dạng lưới"
                    >
                        <i className="fas fa-th"></i>
                    </button>
                    <button
                        onClick={() => onViewModeChange('list')}
                        className={`${styles.viewToggle} ${viewMode === 'list' ? styles.active : ''}`}
                        aria-label="Xem dạng danh sách"
                    >
                        <i className="fas fa-list"></i>
                    </button>
                </div>
            </div>

            <div className={viewMode === 'grid' ? styles.carsGrid : styles.carListView}>
                {cars.map((car) => (
                    <div
                        key={car.carId}
                        className={`${styles.carCard} ${car.statusName?.toLowerCase() === 'rented' ? styles.rented : ''}`}
                    >
                        <div className={styles.carImage}>
                            <img
                                src={
                                    car.images?.find((img) => img.isMain)?.imageUrl ||
                                    car.images?.[0]?.imageUrl ||
                                    'https://via.placeholder.com/300'
                                }
                                alt={`${car.brandName} ${car.model}`}
                                loading="lazy"
                            />
                            <div
                                className={`${styles.statusBadge} ${
                                    car.statusName?.toLowerCase() === 'rented' ? styles.rented : styles.available
                                }`}
                            >
                                {car.statusName?.toLowerCase() === 'rented' ? 'Bận' : 'Có sẵn'}
                            </div>
                            {car.discount && (
                                <div className={styles.discountBadge}>
                                    Giảm {car.discount}%
                                </div>
                            )}
                        </div>

                        <div className={styles.carInfo}>
                            <div className={styles.carHeader}>
                                <h3 className={styles.carTitle}>
                                    {car.model} {car.year}
                                </h3>
                                <p className={styles.carBrand}>{car.brandName}</p>
                            </div>

                            <div className={styles.carDetails}>
                                <div className={styles.detail}>
                                    <FaUser />
                                    <span>{car.seats} chỗ</span>
                                </div>
                                <div className={styles.detail}>
                                    <FaGasPump />
                                    <span>{car.fuelType}</span>
                                </div>
                                <div className={styles.detail}>
                                    <FaCog />
                                    <span>{car.transmission}</span>
                                </div>
                                <div className={styles.detail}>
                                    <FaCalendarAlt />
                                    <span>{car.year}</span>
                                </div>
                            </div>

                            <div className={styles.carFooter}>
                                <div className={styles.price}>
                                    {car.discount ? (
                                        <>
                                            <span className={styles.originalPrice}>
                                                {car.dailyRate?.toLocaleString()}K
                                            </span>
                                            <span className={styles.discountedPrice}>
                                                {(car.dailyRate * (1 - car.discount / 100))?.toLocaleString()}K
                                            </span>
                                        </>
                                    ) : (
                                        <span className={styles.amount}>
                                            {car.dailyRate?.toLocaleString()}K
                                        </span>
                                    )}
                                    <span className={styles.period}>/ngày</span>
                                </div>
                                <div className={styles.rating}>
                                    <FaStar />
                                    <span>{car.rating || 5.0}</span>
                                </div>
                            </div>

                            <div className={styles.carActions}>
                                {car.statusName?.toLowerCase() === 'rented' ? (
                                    <button
                                        className={styles.scheduleButton}
                                        onClick={() => onViewSchedule(car)}
                                    >
                                        <FaCalendarAlt /> Xem Lịch
                                    </button>
                                ) : (
                                    <Link
                                        to={`/cars/${car.carId}`}
                                        className={styles.detailsButton}
                                    >
                                        <FaCar /> Xem Chi Tiết
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CarList;