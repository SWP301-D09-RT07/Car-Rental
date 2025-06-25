import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Footer from '../../../../src/components/Common/Footer.jsx';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import './Cars.css';

const Cars = () => {
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const api = axios.create({
        baseURL: BASE_URL,
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
    });

    axiosRetry(api, {
        retries: 3,
        retryDelay: (retryCount) => retryCount * 1000,
        retryCondition: (error) => error.response?.status === 429 || !error.response,
    });

    const getToken = () => localStorage.getItem('token');
    const isTokenExpired = () => {
        const expiresAt = localStorage.getItem('expiresAt');
        return !expiresAt || new Date().getTime() > parseInt(expiresAt, 10);
    };

    api.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('expiresAt');
                localStorage.removeItem('role');
                const publicPaths = ['/cars', '/login', '/register'];
                if (!publicPaths.includes(window.location.pathname)) {
                    window.location.href = '/login?error=unauthorized';
                }
            } else if (error.response?.status === 400) {
                const message =
                    error.response?.data?.message ||
                    error.response?.data?.errors?.join(', ') ||
                    'Dữ liệu không hợp lệ';
                return Promise.reject(new Error(message));
            }
            return Promise.reject(error);
        }
    );

    // Hàm lấy danh sách xe
    const getCars = async (filters = {}) => {
        try {
            const token = getToken();
            const response = await api.get('/api/cars', {
                params: { ...filters, page: filters.page || 0, size: filters.size || 9 },
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            console.log('Cars Response (Page:', filters.page, '):', response.data); // Debug với page
            return response.data || { content: [], totalElements: 0, totalPages: 1 };
        } catch (error) {
            console.error('Error fetching cars:', error);
            if (error.message.includes('CORS')) return { content: [], totalElements: 0, totalPages: 1 };
            throw new Error(error.response?.data?.message || 'Lấy danh sách xe thất bại');
        }
    };

    // Hàm tìm kiếm xe
    const searchCars = async (filters = {}, page = 0, size = 9) => {
        try {
            const token = getToken();
            const response = await api.get('/api/cars/search', {
                params: { ...filters, page, size },
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            console.log('Search Cars Response (Page:', page, '):', response.data); // Debug với page
            return response.data || { content: [], totalElements: 0, totalPages: 1 };
        } catch (error) {
            console.error('Error searching cars:', error);
            if (error.message.includes('CORS')) return { content: [], totalElements: 0, totalPages: 1 };
            throw new Error(error.response?.data?.message || 'Tìm kiếm xe thất bại');
        }
    };

    // Các hàm phụ khác giữ nguyên
    const getCarBrands = async () => {
        try {
            const token = getToken();
            const response = await api.get('/api/cars/car-brands', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            return response.data || [];
        } catch (error) {
            console.error('Error fetching car brands:', error);
            return [];
        }
    };

    const getRegionsByCountryCode = async (countryCode) => {
        if (!countryCode) throw new Error('Vui lòng cung cấp mã quốc gia');
        try {
            const token = getToken();
            const response = await api.get(`/api/cars/regions/country/${countryCode}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            return response.data || [];
        } catch (error) {
            console.error('Error fetching regions:', error);
            return [];
        }
    };

    const getFuelTypes = async () => {
        try {
            const token = getToken();
            const response = await api.get('/api/cars/fuel-types', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            return response.data || [];
        } catch (error) {
            console.error('Error fetching fuel types:', error);
            return [];
        }
    };

    const getCountryCodes = async () => {
        try {
            const token = getToken();
            const response = await api.get('/api/cars/country-codes', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            return response.data || [];
        } catch (error) {
            console.error('Error fetching country codes:', error);
            return [];
        }
    };

    const getRentalHistory = async (carId) => {
        if (!carId) throw new Error('Vui lòng cung cấp ID xe');
        try {
            const token = getToken();
            const response = await api.get(`/api/cars/${carId}/rentals`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            return response.data || [];
        } catch (error) {
            console.error('Error fetching rental history:', error);
            return [];
        }
    };

    const getSeatOptions = async () => {
        try {
            const token = getToken();
            const response = await api.get('/api/cars/seat-options', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            return response.data || [];
        } catch (error) {
            console.error('Error fetching seat options:', error);
            return [];
        }
    };

    const getPriceRanges = async () => {
        try {
            const token = getToken();
            const response = await api.get('/api/cars/price-ranges', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            return response.data || [];
        } catch (error) {
            console.error('Error fetching price ranges:', error);
            return [];
        }
    };

    const getYears = async () => {
        try {
            const token = getToken();
            const response = await api.get('/api/cars/years', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            return response.data || [];
        } catch (error) {
            console.error('Error fetching years:', error);
            return [];
        }
    };

    // State
    const [cars, setCars] = useState({ content: [], totalElements: 0, totalPages: 1 });
    const [filteredCars, setFilteredCars] = useState({ content: [], totalElements: 0, totalPages: 1 });
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const [brands, setBrands] = useState([]);
    const [countries, setCountries] = useState([]);
    const [regions, setRegions] = useState([]);
    const [seatOptions, setSeatOptions] = useState([]);
    const [priceRanges, setPriceRanges] = useState([]);
    const [years, setYears] = useState([]);
    const [fuelTypes, setFuelTypes] = useState([]);

    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedSeats, setSelectedSeats] = useState('');
    const [selectedPriceRange, setSelectedPriceRange] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedFuelType, setSelectedFuelType] = useState('');
    const [sortBy, setSortBy] = useState('');

    const [showAllRented, setShowAllRented] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);
    const [selectedCar, setSelectedCar] = useState(null);
    const [rentalHistory, setRentalHistory] = useState([]);

    const carsPerPage = 9;
    const rentedCarsLimit = 3;
    const location = useLocation();
    const navigate = useNavigate();

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const [
                    carsResponse,
                    brandsResponse,
                    countriesResponse,
                    seatOptionsResponse,
                    priceRangesResponse,
                    yearsResponse,
                    fuelTypesResponse,
                ] = await Promise.all([
                    getCars({ page: currentPage - 1, size: carsPerPage }),
                    getCarBrands(),
                    getCountryCodes(),
                    getSeatOptions(),
                    getPriceRanges(),
                    getYears(),
                    getFuelTypes(),
                ]);

                setCars(carsResponse);
                setFilteredCars(carsResponse);
                setBrands(brandsResponse);
                setCountries(countriesResponse);
                setSeatOptions(seatOptionsResponse);
                setPriceRanges(priceRangesResponse);
                setYears(yearsResponse);
                setFuelTypes(fuelTypesResponse);
            } catch (err) {
                console.error('Error fetching initial data:', err);
                setError('Không thể tải dữ liệu.');
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [currentPage]); // Dependency on currentPage to refetch on page change

    // Fetch regions based on selected country
    useEffect(() => {
        const fetchRegions = async () => {
            if (selectedCountry) {
                try {
                    const regionsResponse = await getRegionsByCountryCode(selectedCountry);
                    setRegions(regionsResponse);
                } catch (err) {
                    console.error('Error fetching regions:', err);
                    setError(`Không thể tải danh sách vùng: ${err.message}`);
                    setRegions([]);
                }
            } else {
                setRegions([]);
                setSelectedRegion('');
            }
        };
        fetchRegions();
    }, [selectedCountry]);

    // Handle filtering
    const handleFilter = async () => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const filters = {
                pickupLocation: selectedRegion,
                brandId: brands.find((b) => b.brandName === selectedBrand)?.carBrandId,
                regionId: regions.find((r) => r.regionName === selectedRegion)?.regionId,
                seats: selectedSeats,
                priceRange: selectedPriceRange,
                year: selectedYear,
                fuelTypeId: fuelTypes.find((f) => f.fuelTypeName === selectedFuelType)?.fuelTypeId,
                pickupDate: today,
                dropoffDate: tomorrow,
                pickupTime: '09:00:00',
                page: 0,
                size: carsPerPage,
            };
            const response = await searchCars(filters);
            setFilteredCars(response);
            setCurrentPage(1); // Reset to first page after filtering
        } catch (err) {
            console.error('Error filtering cars:', err);
            setError('Lọc xe thất bại.');
        } finally {
            setLoading(false);
        }
    };

    // Paginate and filter cars
    const rentedCars = filteredCars.content.filter((car) => car.statusName?.toLowerCase() === 'rented');
    const availableCars = filteredCars.content.filter((car) => car.statusName?.toLowerCase() === 'available');
    const displayedRentedCars = showAllRented ? rentedCars : rentedCars.slice(0, rentedCarsLimit);
    const totalPages = filteredCars.totalPages || Math.ceil((availableCars.length || 0) / carsPerPage);
    const paginatedCars = availableCars.slice(
        (currentPage - 1) * carsPerPage,
        currentPage * carsPerPage
    );

    // Handle view details and schedule
    const handleViewDetails = (carId) => {
        navigate(`/cars/${carId}`);
    };

    const handleViewSchedule = async (car) => {
        try {
            const history = await getRentalHistory(car.carId);
            setRentalHistory(history);
            setSelectedCar(car);
            setShowSchedule(true);
        } catch (err) {
            console.error('Error fetching rental history:', err);
            setError('Không thể tải lịch sử thuê xe.');
        }
    };

    // CarCard component
    const CarCard = ({ car }) => {
        const [imgError, setImgError] = useState(false);
        const mainImage =
            car.images?.find((img) => img.isMain) || car.images?.[0] || { imageUrl: '/placeholder.svg?height=200&width=300' };
        const isRented = car.statusName?.toLowerCase() === 'rented';
        return (
            <div className="car-card" onClick={() => !isRented && handleViewDetails(car.carId)} key={car.carId}>
                <div className="car-image-container">
                    <img
                        src={!imgError ? mainImage.imageUrl : '/placeholder.svg?height=200&width=300'}
                        alt={`${car.brandName} ${car.model}`}
                        className="car-image"
                        onError={() => setImgError(true)}
                    />
                    <div className={isRented ? 'rented-badge' : 'available-badge'}>
                        {isRented ? 'Bận' : 'Có sẵn'}
                    </div>
                </div>
                <div className="car-details">
                    <h3 className="car-title">{car.model}</h3>
                    <p className="car-brand">{car.brandName}</p>
                    <div className="car-price">${car.dailyRate}/ngày</div>
                    {isRented ? (
                        <button
                            className="car-schedule-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleViewSchedule(car);
                            }}
                        >
                            Xem Lịch Xe
                        </button>
                    ) : (
                        <button className="car-details-btn">Xem Chi Tiết</button>
                    )}
                </div>
            </div>
        );
    };

    // SchedulePopup component
    const SchedulePopup = () => {
        if (!selectedCar) return null;
        return (
            <div className="schedule-overlay">
                <div className="schedule-popup">
                    <div className="schedule-header">
                        <h3>Lịch Sử Thuê Xe - {selectedCar.model}</h3>
                        <button className="close-btn" onClick={() => setShowSchedule(false)}>×</button>
                    </div>
                    <div className="schedule-content">
                        <table className="schedule-table">
                            <thead>
                            <tr>
                                <th>Người thuê</th>
                                <th>Ngày bắt đầu</th>
                                <th>Ngày kết thúc</th>
                                <th>Trạng thái</th>
                            </tr>
                            </thead>
                            <tbody>
                            {rentalHistory.length > 0 ? (
                                rentalHistory.map((rental) => (
                                    <tr key={rental.id}>
                                        <td>{rental.renterName || 'N/A'}</td>
                                        <td>{rental.startDate || 'N/A'}</td>
                                        <td>{rental.endDate || 'N/A'}</td>
                                        <td>{rental.status || 'N/A'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4}>Không có lịch sử thuê xe.</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="cars-container">
            <section className="hero-section">
                <div className="hero-content">
                    <div className="breadcrumb">
                        <Link to="/" className="breadcrumb">Trang chủ</Link>
                        <span>›</span>
                        <span>Danh sách xe</span>
                    </div>
                    <h1 className="hero-title">Chọn Xe Của Bạn</h1>
                </div>
            </section>
            <section className="filters-cars-section">
                <div className="filters-sidebar">
                    <div className="filters-box">
                        <div className="filters-grid">
                            <div className="filter-item">
                                <label>Hãng xe</label>
                                <select
                                    value={selectedBrand}
                                    onChange={(e) => setSelectedBrand(e.target.value)}
                                    className="filter-item"
                                >
                                    <option value="">Tất cả hãng</option>
                                    {brands.map((brand) => (
                                        <option key={brand.carBrandId} value={brand.brandName}>
                                            {brand.brandName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-item">
                                <label>Quốc gia</label>
                                <select
                                    value={selectedCountry}
                                    onChange={(e) => setSelectedCountry(e.target.value)}
                                    className="filter-item"
                                >
                                    <option value="">Tất cả quốc gia</option>
                                    {countries.map((country) => (
                                        <option key={country.countryCode} value={country.countryCode}>
                                            {country.countryName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-item">
                                <label>Khu vực</label>
                                <select
                                    value={selectedRegion}
                                    onChange={(e) => setSelectedRegion(e.target.value)}
                                    disabled={!selectedCountry}
                                    className="filter-item"
                                >
                                    <option value="">Tất cả khu vực</option>
                                    {regions.map((region) => (
                                        <option key={region.regionId} value={region.regionName}>
                                            {region.regionName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-item">
                                <label>Số ghế</label>
                                <select
                                    value={selectedSeats}
                                    onChange={(e) => setSelectedSeats(e.target.value)}
                                    className="filter-item"
                                >
                                    <option value="">Tất cả</option>
                                    {seatOptions.map((seats) => (
                                        <option key={seats} value={seats}>
                                            {seats} chỗ
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-item">
                                <label>Khoảng giá</label>
                                <select
                                    value={selectedPriceRange}
                                    onChange={(e) => setSelectedPriceRange(e.target.value)}
                                    className="filter-item"
                                >
                                    <option value="">Tất cả giá</option>
                                    {priceRanges.map((range) => (
                                        <option key={range} value={range}>
                                            {range}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-item">
                                <label>Năm sản xuất</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="filter-item"
                                >
                                    <option value="">Tất cả năm</option>
                                    {years.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-item">
                                <label>Loại nhiên liệu</label>
                                <select
                                    value={selectedFuelType}
                                    onChange={(e) => setSelectedFuelType(e.target.value)}
                                    className="filter-item"
                                >
                                    <option value="">Tất cả loại</option>
                                    {fuelTypes.map((fuelType) => (
                                        <option key={fuelType.fuelTypeId} value={fuelType.fuelTypeName}>
                                            {fuelType.fuelTypeName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-item">
                                <label>Sắp xếp theo</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="filter-item"
                                >
                                    <option value="">Mặc định</option>
                                    <option value="price-low">Giá thấp đến cao</option>
                                    <option value="price-high">Giá cao đến thấp</option>
                                    <option value="name">Tên A-Z</option>
                                </select>
                            </div>
                        </div>
                        <button onClick={handleFilter} className="apply-filter-btn">
                            Áp dụng
                        </button>
                    </div>
                </div>
                <div className="cars-grid-container">
                    {error && <div className="error-message">{error}</div>}
                    <div className="available-cars-section">
                        {loading ? (
                            <div className="cars-grid">
                                {Array.from({ length: 3 }).map((_, index) => (
                                    <div key={index} className="car-card" style={{ backgroundColor: '#e5e7eb', height: '200px' }} />
                                ))}
                            </div>
                        ) : paginatedCars.length > 0 ? (
                            <div className="cars-grid">
                                {paginatedCars.map((car) => (
                                    <CarCard key={car.carId} car={car} />
                                ))}
                            </div>
                        ) : (
                            <div className="no-results">Không tìm thấy xe nào</div>
                        )}
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="pagination"
                                >
                                    Trước
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={page === currentPage ? 'pagination active' : 'pagination'}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="pagination"
                                >
                                    Sau
                                </button>
                            </div>
                        )}
                    </div>
                    {rentedCars.length > 0 && (
                        <div className="rented-cars-section">
                            <h2 className="section-title">Xe Đang Bận</h2>
                            <div className="cars-grid">
                                {displayedRentedCars.map((car) => (
                                    <CarCard key={car.carId} car={car} />
                                ))}
                            </div>
                            {rentedCars.length > rentedCarsLimit && (
                                <div className="show-more-container">
                                    <button
                                        className="show-more-btn"
                                        onClick={() => setShowAllRented(!showAllRented)}
                                    >
                                        {showAllRented ? 'Ẩn bớt' : 'Xem thêm'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
            {showSchedule && <SchedulePopup />}
            <Footer />
        </div>
    );
};

export default Cars;