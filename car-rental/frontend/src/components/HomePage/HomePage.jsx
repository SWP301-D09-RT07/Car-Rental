import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import styles from "./HomePage.module.scss";
import Navbar from "../../components/Common/Navbar"; // Import Navbar component
import Footer from "../../components/Common/Footer"; // Import Footer component

const bg1 = "/images/bg_1.jpg";
const car5 = "/images/bg_2.jpg";
const car9 = "/images/car-5.jpg";
const zaloLogo = "/images/zalo.jpg";
const bannerImage = "/images/bn_1.png";
const bottomCarImage = "/images/car-7.jpg";

const heroSlides = [
    { image: bg1, title: "DỊCH VỤ CHO THUÊ XE TỰ LÁI", subtitle: "DẪN ĐẦU TƯƠNG LAI", description: "Trải nghiệm sự tự do với dịch vụ cho thuê xe cao cấp của chúng tôi" },
    { image: car5, title: "XE SANG TRỌNG, ĐẲNG CẤP", subtitle: "PHONG CÁCH LỊCH LÃM", description: "Khám phá bộ sưu tập xe sang trọng, phù hợp mọi nhu cầu di chuyển của bạn" },
    { image: car9, title: "AN TOÀN & TIỆN NGHI", subtitle: "HỖ TRỢ 24/7", description: "Đội ngũ hỗ trợ tận tâm, đảm bảo an toàn và tiện nghi cho mọi chuyến đi" },
];

function getToday() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function getTomorrow() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function getCurrentTimePlusHours(hours) {
    const now = new Date();
    now.setHours(now.getHours() + hours);
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
}

const carSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
    responsive: [
        { breakpoint: 1024, settings: { slidesToShow: 2, slidesToScroll: 1 } },
        { breakpoint: 768, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ],
};

const brandSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 1,
    arrows: true,
    responsive: [
        { breakpoint: 1024, settings: { slidesToShow: 3 } },
        { breakpoint: 768, settings: { slidesToShow: 2 } },
        { breakpoint: 480, settings: { slidesToShow: 1 } },
    ],
};

const HomePage = () => {
    const todayStr = getToday();
    const tomorrowStr = getTomorrow();
    const currentTimePlus4 = getCurrentTimePlusHours(4); // 20:59 + 4 = 00:59 ngày 06/06/2025
    const dropoffTime = getCurrentTimePlusHours(8); // 00:59 + 4 = 04:59 ngày 06/06/2025

    const [formData, setFormData] = useState({
        pickupLocation: "",
        dropoffLocation: "",
        pickupDate: todayStr,
        dropoffDate: tomorrowStr,
        pickupTime: currentTimePlus4,
        dropoffTime: dropoffTime,
    });
    const [featuredCars, setFeaturedCars] = useState([]);
    const [popularCars, setPopularCars] = useState([]);
    const [brands, setBrands] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [heroIdx, setHeroIdx] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => {
            setHeroIdx((prev) => (prev + 1) % heroSlides.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchFeaturedCars = async () => {
            try {
                setLoading(true);
                const response = await axios.get("http://localhost:8080/api/cars/featured", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
                });
                setFeaturedCars(response.data || []);
            } catch (err) {
                setError("Không thể tải xe nổi bật: " + (err.response?.data?.message || err.message));
            } finally {
                setLoading(false);
            }
        };

        const fetchPopularCars = async () => {
            try {
                const response = await axios.get("http://localhost:8080/api/cars/popular", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
                });
                setPopularCars(response.data || []);
            } catch (err) {
                setError("Không thể tải xe phổ biến: " + (err.response?.data?.message || err.message));
            }
        };

        const fetchBrands = async () => {
            try {
                const response = await axios.get("http://localhost:8080/api/cars/car-brands");
                setBrands(response.data || []);
            } catch (err) {
                console.error("Error fetching brands:", err);
            }
        };

        fetchFeaturedCars();
        fetchPopularCars();
        fetchBrands();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };
            if (name === "pickupDate" && value > prev.dropoffDate) {
                updated.dropoffDate = getTomorrowFromDate(value);
            } else if (name === "pickupTime" && value > prev.dropoffTime) {
                updated.dropoffTime = getTimePlusHours(value, 4);
            }
            return updated;
        });
    };

    const getTomorrowFromDate = (dateStr) => {
        const date = new Date(dateStr);
        date.setDate(date.getDate() + 1);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    };

    const getTimePlusHours = (timeStr, hours) => {
        const [hh, mm] = timeStr.split(":");
        let newHh = parseInt(hh) + hours;
        let newMm = parseInt(mm);
        if (newHh >= 24) {
            newHh -= 24;
            return `${String(newHh).padStart(2, "0")}:${String(newMm).padStart(2, "0")}`;
        }
        return `${String(newHh).padStart(2, "0")}:${String(newMm).padStart(2, "0")}`;
    };

    const handleSearchCars = (e) => {
        e.preventDefault();
        if (!formData.pickupLocation || !formData.dropoffLocation || !formData.pickupDate || !formData.dropoffDate) {
            setError("Vui lòng điền đầy đủ các trường bắt buộc.");
            return;
        }
        navigate("/cars", { state: { search: formData } });
    };

    const handleBookNow = async (carId) => {
        if (!formData.pickupLocation || !formData.dropoffLocation || !formData.pickupDate || !formData.pickupTime) {
            setError("Vui lòng điền thông tin nhận xe trước khi đặt.");
            return;
        }
        try {
            await axios.post(
                "http://localhost:8080/api/bookings",
                {
                    carId,
                    pickupLocation: formData.pickupLocation,
                    dropoffLocation: formData.dropoffLocation,
                    pickupDateTime: `${formData.pickupDate}T${formData.pickupTime}:00`,
                    dropoffDateTime: `${formData.dropoffDate}T${formData.dropoffTime || "23:59"}:00`,
                },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } }
            );
            alert("Đặt xe thành công!");
            navigate("/bookings");
        } catch (err) {
            setError("Không thể tạo đặt chỗ: " + (err.response?.data?.message || err.message));
        }
    };

    const CarCard = ({ car, type = "featured" }) => (
        <div className={styles.carCard}>
            <div className={styles.carImageContainer}>
                <img
                    src={
                        car.images && car.images.length > 0
                            ? car.images.find((img) => img.isMain)?.imageUrl || car.images[0].imageUrl
                            : "https://via.placeholder.com/300x200?text=Car+Image"
                    }
                    alt={car.model}
                    className={styles.carImage}
                />
                <div className={styles.carBadges}>
                    <span className={`${styles.carBadge} ${type === "featured" ? styles.featured : styles.popular}`}>
                        {type === "featured" ? "Giảm giá 15%" : "Phổ Biến"}
                    </span>
                    <span className={styles.supportBadge}>
                        <span>📞</span> 24/7
                    </span>
                </div>
            </div>
            <div className={styles.carInfo}>
                <h3 className={styles.carTitle}>{car.model}</h3>
                <div className={styles.carPrice}>
                    <span className={styles.price}>{car.discountedPrice || car.dailyRate}K</span>
                    <span className={styles.originalPrice}>{car.dailyRate}K/4 giờ</span>
                </div>
                <div className={styles.carFeatures}>
                    <span className={styles.feature}>
                        <span>👥</span> {car.seats || 5} chỗ
                    </span>
                    <span className={styles.feature}>
                        <span>⚙️</span> {car.transmission || "Tự Động"}
                    </span>
                    <span className={styles.feature}>
                        <span>⛽</span> {car.fuelType || "Xăng"}
                    </span>
                </div>
                <div className={styles.carActions}>
                    <button onClick={() => handleBookNow(car.carId)} className={`${styles.actionBtn} ${styles.primary}`}>
                        Đặt Ngay
                    </button>
                    <Link to={`/car/${car.carId}`} className={`${styles.actionBtn} ${styles.secondary}`}>
                        Xem Chi Tiết
                    </Link>
                </div>
            </div>
        </div>
    );

    const currentHero = heroSlides[heroIdx];
    const nextHero = heroSlides[(heroIdx + 1) % heroSlides.length];

    return (
        <div>
            {/* Navbar */}
            <Navbar />

            {/* Main Content */}
            <div className={styles.homeContainer}>
                {/* Hero Section */}
                <section className={styles.heroSection}>
                    <div
                        className={styles.heroBgImage}
                        style={{ backgroundImage: `url(${currentHero.image})` }}
                    />
                    <div
                        className={`${styles.heroBgImage} ${styles.heroBgNext}`}
                        style={{ backgroundImage: `url(${nextHero.image})` }}
                    />
                    <div className={styles.heroOverlay}></div>
                    <div className={styles.heroContent}>
                        <div className={styles.heroText}>
                            <h1 className={styles.heroTitle}>
                                {currentHero.title}
                                <span className={styles.heroSubtitle}>{currentHero.subtitle}</span>
                            </h1>
                            <p className={styles.heroDescription}>{currentHero.description}</p>
                        </div>
                        <div className={styles.heroSliderDots}>
                            {heroSlides.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setHeroIdx(idx)}
                                    className={idx === heroIdx ? styles.active : ""}
                                ></button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Search Section */}
                <section className={styles.searchSection}>
                    <form onSubmit={handleSearchCars} className={styles.searchForm}>
                        <div className={styles.searchField}>
                            <label><span>📍</span> Địa điểm nhận xe</label>
                            <select name="pickupLocation" value={formData.pickupLocation} onChange={handleInputChange}>
                                <option value="">Chọn địa điểm</option>
                                <option value="Hà Nội">Hà Nội</option>
                                <option value="Đà Nẵng">Đà Nẵng</option>
                                <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                                <option value="Bình Dương">Bình Dương</option>
                            </select>
                        </div>
                        <div className={styles.searchField}>
                            <label><span>📅</span> Ngày nhận xe</label>
                            <input
                                type="date"
                                name="pickupDate"
                                value={formData.pickupDate}
                                onChange={handleInputChange}
                                min={todayStr}
                            />
                        </div>
                        <div className={styles.searchField}>
                            <label><span>🕐</span> Giờ nhận xe</label>
                            <input
                                type="time"
                                name="pickupTime"
                                value={formData.pickupTime}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className={styles.searchField}>
                            <label><span>📅</span> Ngày trả xe</label>
                            <input
                                type="date"
                                name="dropoffDate"
                                value={formData.dropoffDate}
                                onChange={handleInputChange}
                                min={formData.pickupDate || todayStr}
                            />
                        </div>
                        <div className={styles.searchField}>
                            <label><span>🕐</span> Giờ trả xe</label>
                            <input
                                type="time"
                                name="dropoffTime"
                                value={formData.dropoffTime}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className={styles.searchField}>
                            <button type="submit" className={styles.searchButton}>Tìm Xe</button>
                        </div>
                    </form>
                </section>

                {/* Brand Selection */}
                <section className={styles.brandSection}>
                    <div className={styles.sectionContainer}>
                        <h2 className={styles.sectionTitle}>Chọn xe theo hãng</h2>
                        <Slider {...brandSettings}>
                            {brands.map((brand) => (
                                <div key={brand.id} className={styles.brandItem}>
                                    <img
                                        src={brand.logoUrl || "https://via.placeholder.com/80x80?text=Brand+Logo"}
                                        alt={brand.name}
                                        className={styles.brandLogo}
                                        onClick={() => navigate(`/cars?brand=${brand.id}`)}
                                    />
                                    <p className={styles.brandName}>{brand.name}</p>
                                </div>
                            ))}
                        </Slider>
                    </div>
                </section>

                {/* Featured Cars */}
                <section className={styles.featuredSection}>
                    <div className={styles.sectionContainer}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Xe Nổi Bật</h2>
                            <p className={styles.sectionSubtitle}>Khám Phá Những Lựa Chọn Hàng Đầu</p>
                        </div>
                        <div className={styles.sectionBody}>
                            {loading ? (
                                <div className={styles.loadingState}>Đang tải xe nổi bật...</div>
                            ) : featuredCars.length > 0 ? (
                                <Slider {...carSettings}>
                                    {featuredCars.map((car) => (
                                        <div key={car.carId} className={styles.sliderItem}>
                                            <CarCard car={car} type="featured" />
                                        </div>
                                    ))}
                                </Slider>
                            ) : (
                                <div className={styles.noData}>Không có xe nổi bật nào.</div>
                            )}
                        </div>
                        <div className={styles.sectionFooter}>
                            <Link to="/cars" className={styles.viewAllBtn}>
                                Xem Tất Cả Xe <span>→</span>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Popular Cars */}
                <section className={styles.popularSection}>
                    <div className={styles.sectionContainer}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Xe Phổ Biến</h2>
                            <p className={styles.sectionSubtitle}>Được Khách Hàng Yêu Thích Nhất</p>
                        </div>
                        <div className={styles.sectionBody}>
                            {popularCars.length > 0 ? (
                                <Slider {...carSettings}>
                                    {popularCars.map((car) => (
                                        <div key={car.carId} className={styles.sliderItem}>
                                            <CarCard car={car} type="popular" />
                                        </div>
                                    ))}
                                </Slider>
                            ) : (
                                <div className={styles.noData}>Không có xe phổ biến nào.</div>
                            )}
                        </div>
                        <div className={styles.sectionFooter}>
                            <Link to="/cars" className={styles.viewAllBtn}>
                                Xem Tất Cả Xe <span>→</span>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Banner Section */}
                <section className={styles.bannerPatternSection}>
                    <div className={styles.bannerPatternContainer}>
                        <div className={styles.bannerPatternImageWrapper}>
                            <img src={bannerImage} alt="Banner" className={styles.bannerPatternImage} />
                        </div>
                        <div className={styles.bannerPatternContent}>
                            <h3 className={styles.bannerPatternTitle}>1,000+ xe và hơn thế nữa</h3>
                            <p className={styles.bannerPatternSubtitle}>Hãy trải nghiệm hôm nay!</p>
                            <Link to="/cars" className={styles.bannerPatternBtn}>Tìm Xe</Link>
                        </div>
                    </div>
                </section>

                {/* Steps Section */}
                <section className={styles.stepsSection}>
                    <div className={styles.sectionContainer}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>3 Bước Đơn Giản Để Thuê Xe</h2>
                            <p className={styles.sectionSubtitle}>Quy trình đơn giản để bạn lên đường</p>
                        </div>
                        <div className={styles.stepsContainer}>
                            <div className={styles.stepItem}>
                                <div className={styles.stepNumber}>1</div>
                                <h3 className={styles.stepTitle}>Chọn & Đặt</h3>
                                <p className={styles.stepDescription}>
                                    Chọn xe ưa thích và đặt trực tuyến qua website hoặc ứng dụng di động
                                </p>
                            </div>
                            <div className={styles.stepItem}>
                                <div className={styles.stepNumber}>2</div>
                                <h3 className={styles.stepTitle}>Xác Minh Nhanh</h3>
                                <p className={styles.stepDescription}>
                                    Hoàn thành quy trình xác minh nhanh chóng qua ứng dụng di động
                                </p>
                            </div>
                            <div className={styles.stepItem}>
                                <div className={styles.stepNumber}>3</div>
                                <h3 className={styles.stepTitle}>Nhận Xe & Lái</h3>
                                <p className={styles.stepDescription}>
                                    Nhận xe bất cứ lúc nào, bất cứ đâu và bắt đầu hành trình
                                </p>
                            </div>
                        </div>
                        <div className={styles.stepsImage}>
                            <img src={bottomCarImage} alt="Xe Cao Cấp" className={styles.bottomCarImage} />
                            <div className={styles.imageOverlay}>
                                <div className={styles.overlayContent}>
                                    <h3>Xe Cao Cấp Chất Lượng</h3>
                                    <p>Trải nghiệm lái xe đẳng cấp với đội xe hiện đại</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Zalo Chat Icon */}
                <div className={styles.zaloChat}>
                    <a href="https://zalo.me" target="_blank" rel="noopener noreferrer">
                        <img src={zaloLogo} alt="Zalo Chat" className={styles.zaloIcon} />
                    </a>
                </div>

                {/* Error Notification */}
                {error && (
                    <div className={styles.errorNotification}>
                        <span>{error}</span>
                        <button onClick={() => setError("")} className={styles.errorClose}>×</button>
                    </div>
                )}
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default HomePage;