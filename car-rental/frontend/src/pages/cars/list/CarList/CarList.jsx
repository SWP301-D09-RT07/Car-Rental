import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCar, FaMapMarkerAlt, FaCalendarAlt, FaGasPump, FaChair, FaStar, FaHeart, FaExchangeAlt, FaFilter, FaSave, FaSearch, FaUser, FaCog, FaMoneyBillWave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import styles from './CarList.module.scss';
import api from '../../../../services/api';
import { Link } from 'react-router-dom';

const CarList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState('');
    const [compareCars, setCompareCars] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [savedFilters, setSavedFilters] = useState([]);
    const [showSavedFilters, setShowSavedFilters] = useState(false);
    const [filters, setFilters] = useState({
        brand: '',
        location: '',
        priceRange: '',
        seats: '',
        fuelType: '',
        year: '',
        searchQuery: ''
    });
    const [filterOptions, setFilterOptions] = useState({
        brands: [],
        locations: [],
        priceRanges: [],
        seatOptions: [],
        fuelTypes: [],
        years: []
    });
    const [showPriceFilter, setShowPriceFilter] = useState(false);
    const [selectedPriceRange, setSelectedPriceRange] = useState(null);
    const [priceRanges] = useState([
        { min: 0, max: 500 },
        { min: 500, max: 1000 },
        { min: 1000, max: 2000 },
        { min: 2000, max: 5000 },
        { min: 5000, max: 10000 },
        { min: 10000, max: 20000 }
    ]);

    const itemsPerPage = 9;

    useEffect(() => {
        // Load saved filters and favorites from localStorage
        const savedFiltersData = localStorage.getItem('savedFilters');
        const favoritesData = localStorage.getItem('favorites');
        if (savedFiltersData) setSavedFilters(JSON.parse(savedFiltersData));
        if (favoritesData) setFavorites(JSON.parse(favoritesData));

        // Check for search query in URL
        const searchParams = new URLSearchParams(location.search);
        const searchQuery = searchParams.get('search');
        if (searchQuery) {
            setFilters(prev => ({ ...prev, searchQuery }));
        }

        fetchCars();
        fetchFilterOptions();
    }, [location.search, currentPage]); // Add currentPage as dependency

    const fetchCars = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const config = {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                params: {
                    page: currentPage - 1,
                    size: itemsPerPage,
                    ...filters,
                    ...(sortBy && { sort: sortBy })
                }
            };

            let response;
            if (location.state?.filterType === 'featured') {
                response = await api.get('/api/cars/featured', config);
                setCars(response.data || []);
                setTotalPages(Math.ceil((response.data?.length || 0) / itemsPerPage));
            } else if (location.state?.filterType === 'popular') {
                response = await api.get('/api/cars/popular', config);
                setCars(response.data || []);
                setTotalPages(Math.ceil((response.data?.length || 0) / itemsPerPage));
            } else {
                response = await api.get('/api/cars', config);
                if (response.data && Array.isArray(response.data.content)) {
                    const validCars = response.data.content.map(car => ({
                        ...car,
                        price: car.price || 0,
                        name: car.name || car.model || 'Unnamed Car',
                        brand: car.brand || car.brandName || 'Unknown Brand',
                        location: car.location || car.regionName || 'Unknown Location',
                        seats: car.seats || car.numOfSeats || 0,
                        fuelType: car.fuelType || car.fuelTypeName || 'Unknown',
                        year: car.year || 'Unknown'
                    }));
                    setCars(validCars);
                    setTotalPages(response.data.totalPages || 1);
                } else {
                    console.error('Invalid API response format:', response.data);
                    setCars([]);
                    setTotalPages(1);
                }
            }
        } catch (err) {
            setError('Không thể tải danh sách xe. Vui lòng thử lại sau.');
            console.error('Error fetching cars:', err);
            toast.error('Không thể tải danh sách xe. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const fetchFilterOptions = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

            const [brandsRes, locationsRes, priceRangesRes, seatOptionsRes, fuelTypesRes, yearsRes] = await Promise.all([
                api.get('/api/cars/car-brands', config),
                api.get('/api/cars/country-codes', config),
                api.get('/api/cars/price-ranges', config),
                api.get('/api/cars/seat-options', config),
                api.get('/api/cars/fuel-types', config),
                api.get('/api/cars/years', config)
            ]);

            setFilterOptions({
                brands: brandsRes.data || [],
                locations: locationsRes.data || [],
                priceRanges: priceRangesRes.data || [],
                seatOptions: seatOptionsRes.data || [],
                fuelTypes: fuelTypesRes.data || [],
                years: yearsRes.data || []
            });
        } catch (err) {
            console.error('Error fetching filter options:', err);
            toast.error('Không thể tải dữ liệu bộ lọc. Vui lòng thử lại sau.');
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1); // Reset to first page when filters change
        fetchCars();
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleSort = (sortBy) => {
        setSortBy(sortBy);
        setCurrentPage(1); // Reset to first page when sort changes
        fetchCars();
    };

    const handleSaveFilter = () => {
        const newFilter = {
            id: Date.now(),
            name: `Bộ lọc ${savedFilters.length + 1}`,
            filters: { ...filters }
        };
        const updatedFilters = [...savedFilters, newFilter];
        setSavedFilters(updatedFilters);
        localStorage.setItem('savedFilters', JSON.stringify(updatedFilters));
        toast.success('Đã lưu bộ lọc');
    };

    const handleLoadFilter = (savedFilter) => {
        setFilters(savedFilter.filters);
        setCurrentPage(1);
        fetchCars();
        setShowSavedFilters(false);
    };

    const handleDeleteFilter = (filterId) => {
        const updatedFilters = savedFilters.filter(f => f.id !== filterId);
        setSavedFilters(updatedFilters);
        localStorage.setItem('savedFilters', JSON.stringify(updatedFilters));
        toast.success('Đã xóa bộ lọc');
    };

    const handleToggleFavorite = (carId) => {
        const updatedFavorites = favorites.includes(carId)
            ? favorites.filter(id => id !== carId)
            : [...favorites, carId];
        setFavorites(updatedFavorites);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
        toast.success(favorites.includes(carId) ? 'Đã xóa khỏi yêu thích' : 'Đã thêm vào yêu thích');
    };

    const handleCompare = (car) => {
        if (compareCars.length >= 3) {
            toast.warning('Chỉ có thể so sánh tối đa 3 xe');
            return;
        }
        if (compareCars.some(c => c.carId === car.carId)) {
            setCompareCars(compareCars.filter(c => c.carId !== car.carId));
            toast.success('Đã xóa khỏi danh sách so sánh');
        } else {
            setCompareCars([...compareCars, car]);
            toast.success('Đã thêm vào danh sách so sánh');
        }
    };

    const getPageNumbers = () => {
        const maxPages = 5;
        const start = Math.max(1, currentPage - Math.floor(maxPages / 2));
        const end = Math.min(totalPages, start + maxPages - 1);
        const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

        const result = [];
        if (start > 1) {
            result.push(1);
            if (start > 2) result.push('...');
        }
        result.push(...pages);
        if (end < totalPages) {
            if (end < totalPages - 1) result.push('...');
            result.push(totalPages);
        }
        return result;
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            const priceFilter = document.querySelector(`.${styles.priceFilterDropdown}`);
            const priceButton = document.querySelector(`.${styles.filterButton}`);
            if (showPriceFilter && priceFilter && !priceFilter.contains(event.target) && !priceButton?.contains(event.target)) {
                setShowPriceFilter(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showPriceFilter]);

    const handlePriceFilterClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowPriceFilter(!showPriceFilter);
    };

    const handlePriceRangeSelect = (range) => {
        setSelectedPriceRange(range);
        setShowPriceFilter(false);
        setFilters(prev => ({
            ...prev,
            minPrice: range.min,
            maxPrice: range.max
        }));
        fetchCars();
    };

    const clearPriceFilter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedPriceRange(null);
        setFilters(prev => {
            const newFilters = { ...prev };
            delete newFilters.minPrice;
            delete newFilters.maxPrice;
            return newFilters;
        });
        fetchCars();
    };

    return (
        <div className={styles.carListContainer}>
            <div className={styles.filtersSection}>
                <div className={styles.filterHeader}>
                    <h2>Bộ lọc</h2>
                    <div className={styles.filterActions}>
                        <button onClick={handleSaveFilter} className={styles.saveFilterBtn}>
                            <FaSave /> Lưu bộ lọc
                        </button>
                        <button onClick={() => setShowSavedFilters(true)} className={styles.loadFilterBtn}>
                            <FaFilter /> Bộ lọc đã lưu
                        </button>
                    </div>
                </div>
                <div className={styles.filterGrid}>
                    <div className={styles.filterItem}>
                        <label>Thương hiệu</label>
                        <select
                            value={filters.brand}
                            onChange={(e) => handleFilterChange({ ...filters, brand: e.target.value })}
                        >
                            <option value="">Tất cả</option>
                            {filterOptions.brands.map(brand => (
                                <option key={brand.carBrandId} value={brand.carBrandId}>
                                    {brand.brandName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.filterItem}>
                        <label>Vị trí</label>
                        <select
                            value={filters.location}
                            onChange={(e) => handleFilterChange({ ...filters, location: e.target.value })}
                        >
                            <option value="">Tất cả</option>
                            {filterOptions.locations.map(location => (
                                <option key={location.countryCode} value={location.countryCode}>
                                    {location.countryName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.filterItem}>
                        <label>Số ghế</label>
                        <select
                            value={filters.seats}
                            onChange={(e) => handleFilterChange({ ...filters, seats: e.target.value })}
                        >
                            <option value="">Tất cả</option>
                            {filterOptions.seatOptions.map(seats => (
                                <option key={seats} value={seats}>
                                    {seats} ghế
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.filterItem}>
                        <label>Nhiên liệu</label>
                        <select
                            value={filters.fuelType}
                            onChange={(e) => handleFilterChange({ ...filters, fuelType: e.target.value })}
                        >
                            <option value="">Tất cả</option>
                            {filterOptions.fuelTypes.map(fuel => (
                                <option key={fuel.fuelTypeId} value={fuel.fuelTypeId}>
                                    {fuel.fuelTypeName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.filterItem}>
                        <label>Năm sản xuất</label>
                        <select
                            value={filters.year}
                            onChange={(e) => handleFilterChange({ ...filters, year: e.target.value })}
                        >
                            <option value="">Tất cả</option>
                            {filterOptions.years.map(year => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <button
                            type="button"
                            className={`${styles.filterButton} ${selectedPriceRange ? styles.active : ''}`}
                            onClick={handlePriceFilterClick}
                        >
                            <FaMoneyBillWave /> Giá tiền
                            {selectedPriceRange && (
                                <span className={styles.selectedFilter}>
                                    {selectedPriceRange.min}K - {selectedPriceRange.max}K
                                </span>
                            )}
                        </button>
                        {showPriceFilter && (
                            <div className={styles.priceFilterDropdown}>
                                <div className={styles.priceFilterHeader}>
                                    <h4>Chọn khoảng giá</h4>
                                    {selectedPriceRange && (
                                        <button
                                            type="button"
                                            className={styles.clearButton}
                                            onClick={clearPriceFilter}
                                        >
                                            Xóa
                                        </button>
                                    )}
                                </div>
                                <div className={styles.priceRanges}>
                                    {priceRanges.map((range) => (
                                        <button
                                            key={`${range.min}-${range.max}`}
                                            type="button"
                                            className={`${styles.priceRangeButton} ${
                                                selectedPriceRange?.min === range.min &&
                                                selectedPriceRange?.max === range.max
                                                    ? styles.active
                                                    : ''
                                            }`}
                                            onClick={() => handlePriceRangeSelect(range)}
                                        >
                                            {range.min}K - {range.max}K
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className={styles.sortSection}>
                    <label>Sắp xếp theo:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => handleSort(e.target.value)}
                    >
                        <option value="">Mặc định</option>
                        <option value="price:asc">Giá tăng dần</option>
                        <option value="price:desc">Giá giảm dần</option>
                        <option value="name:asc">Tên A-Z</option>
                        <option value="name:desc">Tên Z-A</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Đang tải danh sách xe...</p>
                </div>
            ) : error ? (
                <div className={styles.errorContainer}>
                    <p className={styles.errorMessage}>{error}</p>
                    <button onClick={fetchCars} className={styles.retryButton}>
                        Thử lại
                    </button>
                </div>
            ) : cars.length === 0 ? (
                <div className={styles.noResults}>
                    <p>Không tìm thấy xe nào phù hợp với tiêu chí tìm kiếm</p>
                </div>
            ) : (
                <>
                    <div className={styles.carsGrid}>
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

                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Trước
                            </button>
                            {getPageNumbers().map((page, index) => (
                                <button
                                    key={index}
                                    onClick={() => typeof page === 'number' && handlePageChange(page)}
                                    className={page === currentPage ? styles.active : ''}
                                    disabled={page === '...'}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Sau
                            </button>
                        </div>
                    )}
                </>
            )}

            {showCompareModal && compareCars.length > 0 && (
                <div className={styles.compareModal}>
                    <div className={styles.compareContent}>
                        <h2>So sánh xe</h2>
                        <div className={styles.compareGrid}>
                            {compareCars.map(car => (
                                <div key={car.carId} className={styles.compareItem}>
                                    <img src={car.imageUrl || '/default-car.jpg'} alt={car.name} />
                                    <h3>{car.name}</h3>
                                    <p>Giá: {car.price?.toLocaleString()}đ/ngày</p>
                                    <p>Số ghế: {car.seats}</p>
                                    <p>Nhiên liệu: {car.fuelType}</p>
                                    <p>Năm: {car.year}</p>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setShowCompareModal(false)}>Đóng</button>
                    </div>
                </div>
            )}

            {showSavedFilters && (
                <div className={styles.savedFiltersModal}>
                    <div className={styles.savedFiltersContent}>
                        <h2>Bộ lọc đã lưu</h2>
                        {savedFilters.length === 0 ? (
                            <p>Chưa có bộ lọc nào được lưu</p>
                        ) : (
                            <div className={styles.savedFiltersList}>
                                {savedFilters.map(filter => (
                                    <div key={filter.id} className={styles.savedFilterItem}>
                                        <span>{filter.name}</span>
                                        <div className={styles.savedFilterActions}>
                                            <button onClick={() => handleLoadFilter(filter)}>Áp dụng</button>
                                            <button onClick={() => handleDeleteFilter(filter.id)}>Xóa</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button onClick={() => setShowSavedFilters(false)}>Đóng</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CarList; 