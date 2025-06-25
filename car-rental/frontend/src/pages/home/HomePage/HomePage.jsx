import React from "react"
import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Swiper, SwiperSlide } from "swiper/react"
import { Pagination, Autoplay, EffectFade } from "swiper/modules"
import {
    FaCarSide,
    FaSearch,
    FaChevronDown,
    FaBars,
    FaTimes,
    FaHome,
    FaCar,
    FaMapMarkerAlt,
    FaTag,
    FaPhone,
    FaHeart,
    FaUser,
    FaCalendarAlt,
    FaSignOutAlt,
    FaSignInAlt,
    FaUserPlus,
    FaArrowUp,
    FaPlay,
    FaFacebookF,
    FaTwitter,
    FaInstagram,
    FaLinkedinIn,
    FaEnvelope,
    FaCcVisa,
    FaCcMastercard,
    FaCcAmex,
    FaCcPaypal,
    FaStar,
    FaClock,
    FaCheckCircle,
    FaShieldAlt,
    FaHeadset,
    FaStore,
    FaGift,
    FaThumbsUp,
    FaRocket,
    FaAward,
    FaUsers,
    FaGasPump,
    FaCog,
} from "react-icons/fa"
import "swiper/css"
import "swiper/css/pagination"
import "swiper/css/effect-fade"
import { toast } from "react-toastify"
import api, { getCarBrands, createBooking, getRegions, loginWithGoogle, logout } from "../../../services/api"
import { useAuth } from "@/hooks/useAuth"

// Images
const bg1 = "/images/bg_1.jpg"
const car5 = "/images/bg_2.jpg"
const car9 = "/images/car-5.jpg"
const zaloLogo = "/images/zalo.jpg"
const bannerImage = "/images/bn_1.png"

// Hero slides data
const heroSlides = [
    {
        id: 1,
        image: bg1,
        title: "DỊCH VỤ CHO THUÊ XE TỰ LÁI",
        subtitle: "DẪNG ĐẦU TƯƠNG LAI",
        description: "Trải nghiệm sự tự do với dịch vụ cho thuê xe cao cấp của chúng tôi",
        gradient: "from-blue-900/80 via-sky-900/60 to-cyan-900/80",
    },
    {
        id: 2,
        image: car5,
        title: "XE SANG TRỌNG, ĐẲNG CẤP",
        subtitle: "PHONG CÁCH LỊCH LÃM",
        description: "Khám phá bộ sưu tập xe sang trọng, phù hợp mọi nhu cầu di chuyển của bạn",
        gradient: "from-indigo-900/80 via-blue-900/60 to-sky-900/80",
    },
    {
        id: 3,
        image: car9,
        title: "AN TOÀN & TIỆN NGHI",
        subtitle: "HỖ TRỢ 24/7",
        description: "Đội ngũ hỗ trợ tận tâm, đảm bảo an toàn và tiện nghi cho mọi chuyến đi",
        gradient: "from-sky-900/80 via-blue-900/60 to-cyan-900/80",
    },
]

// Utility functions
const getToday = () => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
}

const getTomorrow = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`
}

const getCurrentTimePlusHours = (hours) => {
    const now = new Date()
    now.setHours(now.getHours() + hours)
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
}

const getTomorrowFromDate = (dateStr) => {
    const date = new Date(dateStr)
    date.setDate(date.getDate() + 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

const getTimePlusHours = (timeStr, hours) => {
    const [hh, mm] = timeStr.split(":")
    let newHh = Number.parseInt(hh) + hours
    if (newHh >= 24) newHh -= 24
    return `${String(newHh).padStart(2, "0")}:${String(Number.parseInt(mm)).padStart(2, "0")}`
}

// Enhanced Loading Spinner Component
const LoadingSpinner = ({ size = "medium", color = "blue" }) => {
    const sizeClasses = {
        small: "w-4 h-4",
        medium: "w-8 h-8",
        large: "w-12 h-12",
    }

    const colorClasses = {
        blue: "border-blue-600",
        white: "border-white",
        gray: "border-gray-600",
    }

    return (
        <div className="flex justify-center items-center">
            <div
                className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]}`}
            >
                <div className="sr-only">Đang tải...</div>
            </div>
        </div>
    )
}

// Enhanced Error Message Component
const ErrorMessage = ({ message, className = "" }) => {
    return (
        <div
            className={`bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm ${className}`}
        >
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
                <div className="ml-3">
                    <p className="text-sm font-medium">{message}</p>
                </div>
            </div>
        </div>
    )
}

// HomePage component
const HomePage = () => {
    const { isAuthenticated, user } = useAuth();
    const todayStr = getToday()
    const tomorrowStr = getTomorrow()
    const currentTimePlus4 = getCurrentTimePlusHours(4)
    const dropoffTime = getCurrentTimePlusHours(8)
    const navigate = useNavigate()

    // State
    const [formData, setFormData] = useState({
        pickupLocation: "",
        dropoffLocation: "",
        pickupDate: todayStr,
        dropoffDate: tomorrowStr,
        pickupTime: currentTimePlus4,
        dropoffTime: dropoffTime,
    })
    const [featuredCars, setFeaturedCars] = useState([])
    const [popularCars, setPopularCars] = useState([])
    const [brands, setBrands] = useState([])
    const [locations, setLocations] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const [searchError, setSearchError] = useState("")
    const [heroIdx, setHeroIdx] = useState(0)
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
    const [showScrollToTop, setShowScrollToTop] = useState(false)
    const [showCookieConsent, setShowCookieConsent] = useState(true)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [userEmail, setUserEmail] = useState("");

    useEffect(() => {
        const email = localStorage.getItem("userEmail");
        if (email) setUserEmail(email);
    }, []);

    // Enhanced CarCard component
    const CarCard = ({ car, type = "featured", isLoading: cardLoading }) => {
        const [isHovered, setIsHovered] = useState(false)
        const [imageLoaded, setImageLoaded] = useState(false)

        const handleBookNow = async () => {
            if (!formData.pickupLocation || !formData.dropoffLocation || !formData.pickupDate || !formData.pickupTime) {
                toast.error("Vui lòng điền thông tin nhận xe trước khi đặt.")
                return
            }

            try {
                const bookingData = {
                    carId: car.carId,
                    pickupLocation: formData.pickupLocation,
                    dropoffLocation: formData.dropoffLocation,
                    pickupDateTime: `${formData.pickupDate}T${formData.pickupTime}:00`,
                    dropoffDateTime: `${formData.dropoffDate}T${formData.dropoffTime || "23:59"}:00`,
                }
                await createBooking(bookingData)
                toast.success("Đặt xe thành công!")
                navigate("/bookings")
            } catch (err) {
                toast.error(err.response?.data?.message || "Không thể tạo đặt chỗ")
            }
        }

        return (
            <div
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 border border-blue-100 hover:border-blue-300"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="relative h-64 overflow-hidden cursor-pointer" onClick={() => navigate(`/cars/${car.carId}`)}>
                    {!imageLoaded && (
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-sky-300 animate-pulse"></div>
                    )}
                    <img
                        src={
                            car.images && car.images.length > 0
                                ? car.images.find((img) => img.isMain)?.imageUrl || car.images[0].imageUrl
                                : "https://via.placeholder.com/400x250?text=Car+Image"
                        }
                        alt={car.model}
                        className={`w-full h-full object-cover object-center transition-all duration-700 ${
                            isHovered ? "scale-110" : "scale-100"
                        } ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                        loading="lazy"
                        onLoad={() => setImageLoaded(true)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                    <div className="absolute top-4 left-4 flex flex-col space-y-2">
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm ${
                                type === "featured"
                                    ? "bg-gradient-to-r from-blue-500 to-sky-500 text-white"
                                    : "bg-gradient-to-r from-sky-500 to-cyan-500 text-white"
                            }`}
                        >
                            {type === "featured" ? "🔥 Nổi bật" : "⭐ Phổ biến"}
                        </span>
                        <span className="bg-white/90 backdrop-blur-sm text-blue-600 px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                            📞 Hỗ trợ 24/7
                        </span>
                    </div>
                    <div className="absolute top-4 right-4">
                        <button className="bg-white/90 backdrop-blur-sm hover:bg-white text-red-500 hover:text-red-600 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl">
                            <FaHeart className="text-sm" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => navigate(`/cars/${car.carId}`)}>
                                {car.model}
                            </h3>
                            <p className="text-gray-500 text-sm">{car.brand || "Luxury Car"}</p>
                        </div>
                        <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-lg">
                            <FaStar className="text-yellow-400 text-sm" />
                            <span className="text-sm font-semibold text-gray-700">4.8</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
                                {car.discountedPrice || car.dailyRate}K
                            </span>
                            <span className="text-gray-500 text-sm ml-1">/ngày</span>
                        </div>
                        {car.dailyRate && car.discountedPrice && (
                            <div className="text-right">
                                <span className="text-sm text-gray-500 line-through">{car.dailyRate}K</span>
                                <span className="text-xs text-green-600 font-semibold ml-1">-15%</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="flex items-center justify-center bg-blue-50 rounded-lg py-2 px-1">
                            <FaUsers className="text-blue-500 mr-1 text-sm" />
                            <span className="text-xs font-medium text-gray-700">{car.seats || 5} chỗ</span>
                        </div>
                        <div className="flex items-center justify-center bg-sky-50 rounded-lg py-2 px-1">
                            <FaCog className="text-sky-500 mr-1 text-sm" />
                            <span className="text-xs font-medium text-gray-700">{car.transmission || "Tự động"}</span>
                        </div>
                        <div className="flex items-center justify-center bg-cyan-50 rounded-lg py-2 px-1">
                            <FaGasPump className="text-cyan-500 mr-1 text-sm" />
                            <span className="text-xs font-medium text-gray-700">{car.fuelType || "Xăng"}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleBookNow}
                        className="w-full bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 hover:from-blue-700 hover:via-sky-700 hover:to-cyan-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 flex justify-center items-center shadow-lg hover:shadow-xl transform hover:scale-105"
                        disabled={cardLoading}
                        aria-label={`Đặt xe ${car.model}`}
                    >
                        {cardLoading ? (
                            <LoadingSpinner size="small" color="white" />
                        ) : (
                            <>
                                <FaCar className="mr-2" />
                                Đặt ngay
                            </>
                        )}
                    </button>
                </div>
            </div>
        )
    }

    // Fetch data from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                setError("")

                const token = localStorage.getItem('token');
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                const [featuredResponse, popularResponse, brandsResponse, regionsResponse] = await Promise.all([
                    api.get("/api/cars/featured", config),
                    api.get("/api/cars/popular", config),
                    getCarBrands(),
                    getRegions(),
                ])

                setFeaturedCars(featuredResponse?.data || [])
                setPopularCars(popularResponse?.data || [])
                setBrands(brandsResponse || [])
                setLocations(regionsResponse?.map((region) => region.name) || [])
            } catch (err) {
                const errorMessage = err.message || "Lỗi khi tải dữ liệu"
                toast.error(`Lỗi khi tải dữ liệu: ${errorMessage}`)
                setError(errorMessage)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    // Auto-slide hero
    useEffect(() => {
        const interval = setInterval(() => {
            setHeroIdx((prev) => (prev + 1) % heroSlides.length)
        }, 6000)
        return () => clearInterval(interval)
    }, [])

    // Scroll handler for back-to-top button
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollToTop(window.scrollY > 300)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    // Scroll to top
    const scrollToTop = useCallback(() => {
        window.scrollTo({ top: 0, behavior: "smooth" })
    }, [])

    // Handle form input change
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target
        setFormData((prev) => {
            const updated = { ...prev, [name]: value }

            if (name === "pickupDate" && value > prev.dropoffDate) {
                updated.dropoffDate = getTomorrowFromDate(value)
            } else if (name === "pickupTime" && prev.pickupDate === prev.dropoffDate && value > prev.dropoffTime) {
                updated.dropoffTime = getTimePlusHours(value, 4)
            }
            return updated
        })
    }, [])

    // Handle car search
    const handleSearchCars = useCallback(
        async (e) => {
            e.preventDefault()
            setSearchError("")

            if (
                !formData.pickupLocation ||
                !formData.dropoffLocation ||
                !formData.pickupDate ||
                !formData.dropoffDate ||
                !formData.pickupTime ||
                !formData.dropoffTime
            ) {
                setSearchError("Vui lòng điền đầy đủ các trường bắt buộc.")
                return
            }

            const pickupDateTime = new Date(`${formData.pickupDate}T${formData.pickupTime}`)
            const dropoffDateTime = new Date(`${formData.dropoffDate}T${formData.dropoffTime}`)
            if (pickupDateTime < new Date()) {
                setSearchError("Thời gian nhận xe phải lớn hơn thời gian hiện tại.")
                return
            }

            if (dropoffDateTime <= pickupDateTime) {
                setSearchError("Thời gian trả xe phải lớn hơn thời gian nhận xe.")
                return
            }

            try {
                const searchResults = await api.get("/api/cars/search", {
                    params: {
                        pickupLocation: formData.pickupLocation,
                        dropoffLocation: formData.dropoffLocation,
                        pickupDateTime: `${formData.pickupDate}T${formData.pickupTime}:00`,
                        dropoffDateTime: `${formData.dropoffDate}T${formData.dropoffTime}:00`,
                    },
                })
                navigate("/search", { state: { search: formData, results: searchResults.data } })
            } catch (err) {
                setSearchError(err.response?.data?.message || "Tìm kiếm thất bại")
            }
        },
        [formData, navigate],
    )

    // Handle Google login
    const handleGoogleLogin = useCallback(async () => {
        try {
            await loginWithGoogle()
        } catch (err) {
            toast.error(err.message || "Đăng nhập Google thất bại")
        }
    }, [])

    // Handle logout
    const handleLogout = useCallback(async () => {
        try {
            await logout()
            window.location.href = "/login"
        } catch (err) {
            toast.error(err.message || "Đăng xuất thất bại")
        }
    }, [])

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-white">
                <div className="text-center">
                    <div className="mb-8">
                        <div className="bg-gradient-to-r from-blue-600 to-sky-600 p-4 rounded-2xl inline-block shadow-2xl">
                            <FaCarSide className="text-4xl text-white animate-bounce" />
                        </div>
                    </div>
                    <LoadingSpinner size="large" />
                    <p className="mt-6 text-gray-700 text-lg font-medium">Đang tải dữ liệu...</p>
                    <p className="mt-2 text-gray-500">Vui lòng chờ trong giây lát</p>
                </div>
            </div>
        )
    }

    const currentHero = heroSlides[heroIdx]

return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Enhanced Header */}
        <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-xl shadow-lg z-50 border-b border-blue-100">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Enhanced Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center group">
                            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-3 rounded-2xl mr-3 group-hover:scale-110 transition-all duration-300 shadow-xl group-hover:shadow-2xl">
                                <FaCarSide className="text-xl text-white" />
                            </div>
                            <div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    DriveLuxe
                                </span>
                                <p className="text-xs text-gray-500 -mt-1">Premium Car Rental</p>
                            </div>
                        </Link>
                    </div>

                    {/* Enhanced Desktop Navigation */}
                    <div className="hidden lg:flex items-center space-x-8">
                        {/* Main Navigation */}
                        <nav className="flex items-center space-x-8">
                            {[
                                { name: "Trang chủ", path: "/", icon: FaHome, active: true },
                                { name: "Xe", path: "/xe", icon: FaCar },
                                { name: "Địa điểm", path: "/dia-diem", icon: FaMapMarkerAlt },
                                { name: "Ưu đãi", path: "/uu-dai", icon: FaTag },
                            ].map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`font-semibold transition-all duration-300 relative group flex items-center space-x-2 px-4 py-2 rounded-xl ${
                                        item.active ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                                    }`}
                                >
                                    <item.icon className="text-sm" />
                                    <span>{item.name}</span>
                                    {item.active && (
                                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                                    )}
                                </Link>
                            ))}
                        </nav>

                        {/* Enhanced Search Bar */}
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Tìm xe mơ ước..."
                                className="py-3 px-4 pr-12 rounded-2xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-blue-50/50 hover:bg-white transition-all duration-300 w-64 focus:w-72 group-hover:shadow-lg"
                                aria-label="Tìm kiếm xe"
                            />
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-lg cursor-pointer hover:scale-110 transition-transform">
                                <FaSearch className="text-white text-xs" />
                            </div>
                        </div>

                        {/* Enhanced Action Buttons */}
                        <div className="flex items-center space-x-4">
                            {/* Provider Registration */}
                            {!localStorage.getItem("token") && (
                                <Link
                                    to="/provider-register"
                                    className="flex items-center text-indigo-600 hover:text-indigo-700 transition-all duration-300 px-4 py-2 rounded-xl hover:bg-indigo-50 group text-sm font-semibold border border-indigo-200 hover:border-indigo-300"
                                >
                                    <FaStore className="text-sm mr-2 group-hover:scale-110 transition-transform" />
                                    <span>Đối tác</span>
                                </Link>
                            )}

                            {/* Enhanced User Account */}
                            <div className="relative">
                                {localStorage.getItem("token") ? (
                                    <button
                                        onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                        className="flex items-center text-gray-700 hover:text-blue-600 transition-all duration-300 p-2 rounded-xl hover:bg-blue-50 group"
                                    >
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-3 shadow-lg group-hover:shadow-xl transition-all">
                                            <span className="text-white text-sm font-bold">U</span>
                                        </div>
                                        <FaChevronDown
                                            className={`text-xs transition-all duration-300 ${isUserDropdownOpen ? "rotate-180" : ""}`}
                                        />
                                    </button>
                                ) : (
                                    <div className="flex items-center space-x-3">
                                        <Link
                                            to="/login"
                                            className="text-gray-700 hover:text-blue-600 transition-all duration-300 px-4 py-2 rounded-xl hover:bg-blue-50 text-sm font-semibold"
                                        >
                                            Đăng nhập
                                        </Link>
                                        <Link
                                            to="/register"
                                            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white py-2 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm"
                                        >
                                            Đăng ký
                                        </Link>
                                    </div>
                                )}

                                {/* Enhanced User Dropdown */}
                                {isAuthenticated && isUserDropdownOpen && (
                                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl py-3 border border-blue-100 animate-in slide-in-from-top-5 duration-200">
                                        <div className="px-6 py-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
                                            <p className="text-sm font-semibold text-gray-900">Xin chào!</p>
                                            <p className="text-xs text-gray-500">{userEmail || "user@example.com"}</p>
                                        </div>
                                        {[
                                            { icon: FaUser, text: "Hồ sơ của tôi", path: "/profile" },
                                            { icon: FaCalendarAlt, text: "Lịch sử thuê xe", path: "/my-bookings" },
                                            { icon: FaStore, text: "Quản lý xe", path: "/provider-dashboard", color: "text-blue-600" },
                                        ].map((item, index) => (
                                            <Link
                                                key={index}
                                                to={item.path}
                                                className={`flex items-center px-6 py-3 text-sm hover:bg-blue-50 transition-all duration-200 rounded-xl mx-2 ${item.color || "text-gray-700 hover:text-blue-600"}`}
                                                onClick={() => setIsUserDropdownOpen(false)}
                                            >
                                                <item.icon className="mr-3 text-gray-400" />
                                                {item.text}
                                            </Link>
                                        ))}
                                        <div className="border-t border-blue-100 mt-2 pt-2">
                                            <button
                                                onClick={() => {
                                                    handleLogout()
                                                    setIsUserDropdownOpen(false)
                                                }}
                                                className="flex items-center w-full text-left px-6 py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 rounded-xl mx-2"
                                            >
                                                <FaSignOutAlt className="mr-3 text-red-400" />
                                                Đăng xuất
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Contact Button */}
                            <Link
                                to="/lien-he"
                                className="flex items-center text-gray-700 hover:text-emerald-600 transition-all duration-300 p-3 rounded-xl hover:bg-emerald-50 shadow-sm hover:shadow-md"
                            >
                                <FaPhone className="text-sm" />
                            </Link>
                        </div>
                    </div>

                    {/* Enhanced Mobile Menu Button */}
                    <button
                        className="lg:hidden p-3 rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-sm"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? (
                            <FaTimes className="text-xl text-gray-700" />
                        ) : (
                            <FaBars className="text-xl text-gray-700" />
                        )}
                    </button>
                </div>

                {/* Enhanced Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden mt-6 pb-6 border-t border-blue-100 animate-in slide-in-from-top duration-300">
                        <nav className="flex flex-col space-y-2 mt-6">
                            {[
                                { name: "Trang chủ", path: "/", icon: FaHome, active: true },
                                { name: "Xe", path: "/xe", icon: FaCar },
                                { name: "Địa điểm", path: "/dia-diem", icon: FaMapMarkerAlt },
                                { name: "Ưu đãi", path: "/uu-dai", icon: FaTag },
                                { name: "Liên hệ", path: "/lien-he", icon: FaPhone },
                            ].map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`font-semibold p-4 rounded-xl transition-all duration-300 flex items-center space-x-3 ${
                                        item.active ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-blue-50"
                                    }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <item.icon className="text-lg" />
                                    <span>{item.name}</span>
                                </Link>
                            ))}

                            {/* Mobile User Actions */}
                            <div className="pt-4 border-t border-blue-100 space-y-2">
                                {isAuthenticated ? (
                                    <>
                                        <Link
                                            to="/profile"
                                            className="flex items-center text-gray-700 p-4 hover:bg-blue-50 hover:text-blue-600 rounded-xl space-x-3 transition-all"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <FaUser className="text-lg" />
                                            <span>Hồ sơ của tôi</span>
                                        </Link>
                                        <button
                                            onClick={() => {
                                                handleLogout()
                                                setIsMobileMenuOpen(false)
                                            }}
                                            className="flex items-center w-full text-left text-red-600 p-4 hover:bg-red-50 rounded-xl space-x-3 transition-all"
                                        >
                                            <FaSignOutAlt className="text-lg" />
                                            <span>Đăng xuất</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/login"
                                            className="flex items-center text-gray-700 p-4 hover:bg-blue-50 hover:text-blue-600 rounded-xl space-x-3 transition-all"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <FaSignInAlt className="text-lg" />
                                            <span>Đăng nhập</span>
                                        </Link>
                                        <Link
                                            to="/register"
                                            className="flex items-center text-white bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-xl space-x-3 font-semibold shadow-lg"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <FaUserPlus className="text-lg" />
                                            <span>Đăng ký</span>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </nav>
                    </div>
                )}
            </div>
        </header>

        <main className="pt-24">
            {/* Enhanced Hero Section */}
            <section className="relative h-screen overflow-hidden">
                <Swiper
                    modules={[EffectFade, Autoplay]}
                    effect="fade"
                    autoplay={{ delay: 6000, disableOnInteraction: false }}
                    loop={true}
                    onSlideChange={(swiper) => setHeroIdx(swiper.realIndex)}
                    className="h-full"
                >
                    {heroSlides.map((slide, index) => (
                        <SwiperSlide key={slide.id}>
                            <div className="relative h-full">
                                <img
                                    src={slide.image || "/placeholder.svg"}
                                    alt={slide.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className={`absolute inset-0 bg-gradient-to-r from-blue-900/80 via-indigo-900/70 to-purple-900/60`}></div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>

                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto text-center text-white">
                            <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
                                <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-tight">
                                    {currentHero.title.split(" ").map((word, idx) => (
                                        <span
                                            key={idx}
                                            className={
                                                idx % 2 === 0
                                                    ? "text-white drop-shadow-lg"
                                                    : "bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent"
                                            }
                                        >
                                            {word}{" "}
                                        </span>
                                    ))}
                                </h1>
                                <h2 className="text-xl md:text-3xl font-semibold mb-6 text-blue-200 drop-shadow-lg">
                                    {currentHero.subtitle}
                                </h2>
                                <p className="text-lg md:text-xl mb-12 text-indigo-100 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
                                    {currentHero.description}
                                </p>

                                <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                                    <button className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white py-4 px-10 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl">
                                        <FaRocket className="inline mr-3" />
                                        Khám phá ngay
                                    </button>
                                    <button className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white py-4 px-10 rounded-2xl font-semibold text-lg transition-all duration-300 border border-white/30 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl">
                                        <FaPlay className="text-sm" />
                                        Xem video giới thiệu
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce z-10">
                    <div className="flex flex-col items-center">
                        <span className="text-sm mb-3 font-medium">Khám phá thêm</span>
                        <div className="w-6 h-10 border-2 border-white/70 rounded-full flex justify-center backdrop-blur-sm">
                            <div className="w-1 h-3 bg-white/90 rounded-full mt-2 animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Enhanced Search Section */}
            <section className="relative -mt-40 z-20 px-4">
                <div className="container mx-auto">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-blue-100 max-w-7xl mx-auto">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                Tìm xe hoàn hảo cho chuyến đi của bạn
                            </h3>
                            <p className="text-gray-600">Điền thông tin để tìm xe phù hợp nhất</p>
                        </div>

                        <form
                            onSubmit={handleSearchCars}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6"
                            noValidate
                        >
                            <div className="lg:col-span-2">
                                <label
                                    htmlFor="pickupLocation"
                                    className="block text-sm font-bold text-gray-700 mb-3 flex items-center"
                                >
                                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                        <FaMapMarkerAlt className="text-blue-600" />
                                    </div>
                                    Điểm nhận xe
                                </label>
                                <input
                                    type="text"
                                    id="pickupLocation"
                                    name="pickupLocation"
                                    value={formData.pickupLocation}
                                    onChange={handleInputChange}
                                    placeholder="Nhập địa điểm nhận xe"
                                    className="w-full px-4 py-4 border-2 border-blue-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50/50 hover:bg-white transition-all duration-300 text-sm font-medium"
                                    list="locations"
                                    required
                                />
                                <datalist id="locations">
                                    {locations.map((loc, index) => (
                                        <option key={index} value={loc} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="lg:col-span-2">
                                <label
                                    htmlFor="dropoffLocation"
                                    className="block text-sm font-bold text-gray-700 mb-3 flex items-center"
                                >
                                    <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                                        <FaMapMarkerAlt className="text-indigo-600" />
                                    </div>
                                    Điểm trả xe
                                </label>
                                <input
                                    type="text"
                                    id="dropoffLocation"
                                    name="dropoffLocation"
                                    value={formData.dropoffLocation}
                                    onChange={handleInputChange}
                                    placeholder="Nhập địa điểm trả xe"
                                    className="w-full px-4 py-4 border-2 border-indigo-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-indigo-50/50 hover:bg-white transition-all duration-300 text-sm font-medium"
                                    list="locations"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="pickupDate" className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                                    <div className="bg-emerald-100 p-2 rounded-lg mr-3">
                                        <FaCalendarAlt className="text-emerald-600" />
                                    </div>
                                    Ngày nhận
                                </label>
                                <input
                                    type="date"
                                    id="pickupDate"
                                    name="pickupDate"
                                    value={formData.pickupDate}
                                    onChange={handleInputChange}
                                    min={todayStr}
                                    className="w-full px-4 py-4 border-2 border-emerald-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50/50 hover:bg-white transition-all duration-300 text-sm font-medium"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="pickupTime" className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                                    <div className="bg-amber-100 p-2 rounded-lg mr-3">
                                        <FaClock className="text-amber-600" />
                                    </div>
                                    Giờ nhận
                                </label>
                                <input
                                    type="time"
                                    id="pickupTime"
                                    name="pickupTime"
                                    value={formData.pickupTime}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-4 border-2 border-amber-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-amber-50/50 hover:bg-white transition-all duration-300 text-sm font-medium"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="dropoffDate" className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                                    <div className="bg-pink-100 p-2 rounded-lg mr-3">
                                        <FaCalendarAlt className="text-pink-600" />
                                    </div>
                                    Ngày trả
                                </label>
                                <input
                                    type="date"
                                    id="dropoffDate"
                                    name="dropoffDate"
                                    value={formData.dropoffDate}
                                    onChange={handleInputChange}
                                    min={formData.pickupDate}
                                    className="w-full px-4 py-4 border-2 border-pink-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-pink-50/50 hover:bg-white transition-all duration-300 text-sm font-medium"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="dropoffTime" className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                                    <div className="bg-purple-100 p-2 rounded-lg mr-3">
                                        <FaClock className="text-purple-600" />
                                    </div>
                                    Giờ trả
                                </label>
                                <input
                                    type="time"
                                    id="dropoffTime"
                                    name="dropoffTime"
                                    value={formData.dropoffTime}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-4 border-2 border-purple-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50/50 hover:bg-white transition-all duration-300 text-sm font-medium"
                                    required
                                />
                            </div>

                            <div className="lg:col-span-6 flex justify-center mt-6">
                                <button
                                    type="submit"
                                    className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white py-4 px-16 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl flex items-center"
                                    disabled={isLoading}
                                >
                                    <FaSearch className="mr-3 text-xl" />
                                    Tìm xe ngay
                                    <FaRocket className="ml-3 text-xl" />
                                </button>
                            </div>
                        </form>
                        {searchError && <ErrorMessage message={searchError} className="mt-6" />}
                    </div>
                </div>
            </section>

            {/* Enhanced Brand Section */}
            <section className="py-24 bg-gradient-to-b from-white via-blue-50 to-indigo-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-20">
                        <h2 className="text-5xl font-bold text-gray-900 mb-6">
                            Thương hiệu{" "}
                            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                xe hàng đầu
                            </span>
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            Chọn xe từ những thương hiệu uy tín và chất lượng nhất thế giới với dịch vụ chăm sóc khách hàng tận tâm
                        </p>
                    </div>

                    <Swiper
                        modules={[Autoplay]}
                        autoplay={{ delay: 3000, disableOnInteraction: false }}
                        slidesPerView={6}
                        spaceBetween={30}
                        breakpoints={{
                            320: { slidesPerView: 2, spaceBetween: 15 },
                            640: { slidesPerView: 3, spaceBetween: 20 },
                            1024: { slidesPerView: 4, spaceBetween: 25 },
                            1280: { slidesPerView: 6, spaceBetween: 30 },
                        }}
                        className="pb-8"
                    >
                        {brands.map((brand) => (
                            <SwiperSlide key={`brand-${brand.id}`}>
                                <div
                                    className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden hover:-translate-y-3 border border-blue-100 hover:border-indigo-300"
                                    onClick={() => navigate(`/cars?brand=${brand.id}`)}
                                >
                                    <div className="p-8 text-center">
                                        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 p-3 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                                            <img
                                                src={brand.logoUrl || "https://via.placeholder.com/96x96?text=Brand+Logo"}
                                                alt={brand.name}
                                                className="w-full h-full object-contain"
                                                loading="lazy"
                                            />
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-indigo-600 transition-colors">
                                            {brand.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">Premium Quality</p>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </section>

            {/* Enhanced Featured Cars Section */}
            <section className="py-24 bg-gradient-to-b from-indigo-50 via-white to-purple-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full px-6 py-2 mb-6">
                            <FaAward className="text-blue-600 mr-2" />
                            <span className="text-blue-600 font-semibold text-sm">XE NỔI BẬT</span>
                        </div>
                        <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
                            Xe Được Yêu Thích Nhất
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            Khám phá những chiếc xe được khách hàng đánh giá cao nhất với công nghệ hiện đại và thiết kế sang trọng
                        </p>
                    </div>

                    {error ? (
                        <ErrorMessage message={error} />
                    ) : isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <LoadingSpinner size="large" />
                        </div>
                    ) : !featuredCars || featuredCars.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                                <FaCar className="text-blue-500 text-3xl" />
                            </div>
                            <p className="text-gray-600 text-lg">Không có xe nổi bật nào.</p>
                        </div>
                    ) : (
                        <>
                            <Swiper
                                modules={[Pagination, Autoplay]}
                                pagination={{
                                    clickable: true,
                                    bulletClass: "swiper-pagination-bullet !bg-blue-600",
                                    bulletActiveClass: "swiper-pagination-bullet-active !bg-indigo-600",
                                }}
                                autoplay={{ delay: 4000, disableOnInteraction: false }}
                                slidesPerView={3}
                                spaceBetween={30}
                                breakpoints={{
                                    320: { slidesPerView: 1, spaceBetween: 20 },
                                    768: { slidesPerView: 2, spaceBetween: 25 },
                                    1024: { slidesPerView: 3, spaceBetween: 30 },
                                }}
                                className="pb-16"
                            >
                                {featuredCars.map((car) => (
                                    <SwiperSlide key={`featured-car-${car.id}`}>
                                        <CarCard car={car} type="featured" isLoading={isLoading} />
                                    </SwiperSlide>
                                ))}
                            </Swiper>

                            <div className="text-center mt-12">
                                <Link
                                    to="/search"
                                    state={{ filterType: "featured" }}
                                    className="inline-flex items-center bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white py-4 px-10 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                                >
                                    <FaCar className="mr-3" />
                                    Xem tất cả xe nổi bật
                                    <FaArrowUp className="ml-3 rotate-45" />
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Enhanced Popular Cars Section */}
            <section className="py-24 bg-gradient-to-b from-purple-50 via-white to-emerald-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full px-6 py-2 mb-6">
                            <FaThumbsUp className="text-emerald-600 mr-2" />
                            <span className="text-emerald-600 font-semibold text-sm">XE PHỔ BIẾN</span>
                        </div>
                        <h2 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-6">
                            Được Khách Hàng Tin Tưởng
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            Những mẫu xe được thuê nhiều nhất với đánh giá tích cực từ khách hàng
                        </p>
                    </div>

                    {error ? (
                        <ErrorMessage message={error} />
                    ) : isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <LoadingSpinner size="large" />
                        </div>
                    ) : !popularCars || popularCars.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                                <FaCar className="text-emerald-500 text-3xl" />
                            </div>
                            <p className="text-gray-600 text-lg">Không có xe phổ biến nào.</p>
                        </div>
                    ) : (
                        <>
                            <Swiper
                                modules={[Pagination, Autoplay]}
                                pagination={{
                                    clickable: true,
                                    bulletClass: "swiper-pagination-bullet !bg-emerald-600",
                                    bulletActiveClass: "swiper-pagination-bullet-active !bg-teal-600",
                                }}
                                autoplay={{ delay: 4000, disableOnInteraction: false }}
                                slidesPerView={3}
                                spaceBetween={30}
                                breakpoints={{
                                    320: { slidesPerView: 1, spaceBetween: 20 },
                                    768: { slidesPerView: 2, spaceBetween: 25 },
                                    1024: { slidesPerView: 3, spaceBetween: 30 },
                                }}
                                className="pb-16"
                            >
                                {popularCars.map((car) => (
                                    <SwiperSlide key={`popular-car-${car.id}`}>
                                        <CarCard car={car} type="popular" isLoading={isLoading} />
                                    </SwiperSlide>
                                ))}
                            </Swiper>

                            <div className="text-center mt-12">
                                <Link
                                    to="/search"
                                    state={{ filterType: "popular" }}
                                    className="inline-flex items-center bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white py-4 px-10 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                                >
                                    <FaThumbsUp className="mr-3" />
                                    Xem tất cả xe phổ biến
                                    <FaArrowUp className="ml-3 rotate-45" />
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Enhanced CTA Banner Section */}
            <section className="py-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-center bg-white/10 backdrop-blur-lg rounded-3xl overflow-hidden shadow-2xl border border-white/20">
                        <div className="lg:w-1/2 p-12 text-center lg:text-left">
                            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                                <FaGift className="text-yellow-300 mr-2" />
                                <span className="text-white font-semibold text-sm">ƯU ĐÃI ĐỘC QUYỀN</span>
                            </div>
                            <h3 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                                1,000+ xe và hơn thế nữa
                            </h3>
                            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                                Hãy trải nghiệm dịch vụ cho thuê xe cao cấp với đội xe đa dạng và chất lượng hàng đầu!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    to="/cars"
                                    className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-4 px-8 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                                >
                                    <FaSearch className="mr-3" />
                                    Tìm Xe Ngay
                                </Link>
                                <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30 font-semibold py-4 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center">
                                    <FaPhone className="mr-3" />
                                    Liên Hệ Tư Vấn
                                </button>
                            </div>
                        </div>
                        <div className="lg:w-1/2">
                            <img
                                src={bannerImage || "/placeholder.svg"}
                                alt="Premium Car Collection"
                                className="w-full h-auto object-cover"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Enhanced Why Choose Us Section */}
            <section className="py-24 bg-gradient-to-b from-gray-50 via-white to-emerald-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center bg-gradient-to-r from-amber-100 to-orange-100 rounded-full px-6 py-2 mb-6">
                            <FaAward className="text-amber-600 mr-2" />
                            <span className="text-amber-600 font-semibold text-sm">TẠI SAO CHỌN CHÚNG TÔI</span>
                        </div>
                        <h2 className="text-5xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent mb-6">
                            Dịch Vụ Xuất Sắc
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            Chúng tôi tự hào cung cấp dịch vụ cho thuê xe cao cấp với những ưu điểm vượt trội
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: FaCheckCircle,
                                title: "Đặt xe dễ dàng",
                                description: "Quy trình đặt xe nhanh chóng chỉ trong vài cú nhấp chuột với giao diện thân thiện.",
                                gradient: "from-emerald-500 to-teal-500",
                            },
                            {
                                icon: FaHeadset,
                                title: "Hỗ trợ 24/7",
                                description: "Đội ngũ chăm sóc khách hàng chuyên nghiệp sẵn sàng hỗ trợ bạn mọi lúc mọi nơi.",
                                gradient: "from-blue-500 to-indigo-500",
                            },
                            {
                                icon: FaShieldAlt,
                                title: "Giá tốt nhất",
                                description: "Cam kết mức giá cạnh tranh và minh bạch, không phí ẩn, đảm bảo giá trị tốt nhất.",
                                gradient: "from-amber-500 to-orange-500",
                            },
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className="group bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-100 hover:border-gray-300"
                            >
                                <div className={`bg-gradient-to-r ${feature.gradient} w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                    <feature.icon className="text-white text-3xl" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-gray-700 transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Enhanced How It Works Section */}
            <section className="py-24 bg-gradient-to-b from-emerald-50 via-white to-blue-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full px-6 py-2 mb-6">
                            <FaRocket className="text-blue-600 mr-2" />
                            <span className="text-blue-600 font-semibold text-sm">QUY TRÌNH THUÊ XE</span>
                        </div>
                        <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
                            Chỉ 4 Bước Đơn Giản
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            Thuê xe mơ ước của bạn một cách nhanh chóng và thuận tiện
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                step: 1,
                                icon: FaCarSide,
                                title: "Chọn xe",
                                description: "Duyệt qua bộ sưu tập xe đa dạng và chọn chiếc xe hoàn hảo cho chuyến đi.",
                                bgColor: "from-blue-50 to-indigo-50",
                                iconColor: "text-blue-600",
                                stepColor: "from-blue-600 to-indigo-600",
                            },
                            {
                                step: 2,
                                icon: FaMapMarkerAlt,
                                title: "Chọn địa điểm & thời gian",
                                description: "Xác định địa điểm nhận xe và thời gian thuê phù hợp với lịch trình.",
                                bgColor: "from-emerald-50 to-teal-50",
                                iconColor: "text-emerald-600",
                                stepColor: "from-emerald-600 to-teal-600",
                            },
                            {
                                step: 3,
                                icon: FaStar,
                                title: "Đặt & thanh toán",
                                description: "Hoàn tất đặt xe với hệ thống thanh toán bảo mật và nhận xác nhận.",
                                bgColor: "from-amber-50 to-orange-50",
                                iconColor: "text-amber-600",
                                stepColor: "from-amber-600 to-orange-600",
                            },
                            {
                                step: 4,
                                icon: FaCheckCircle,
                                title: "Tận hưởng chuyến đi",
                                description: "Nhận xe tại địa điểm đã chọn và bắt đầu hành trình tuyệt vời.",
                                bgColor: "from-purple-50 to-pink-50",
                                iconColor: "text-purple-600",
                                stepColor: "from-purple-600 to-pink-600",
                            },
                        ].map((item, index) => (
                            <div key={item.step} className="relative text-center group">
                                <div className={`bg-gradient-to-r ${item.stepColor} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    {item.step}
                                </div>

                                {index < 3 && (
                                    <div className="hidden lg:block absolute top-8 left-1/2 w-full h-1 bg-gradient-to-r from-gray-200 to-gray-300 transform translate-x-1/2 -z-10"></div>
                                )}

                                <div className={`bg-gradient-to-br ${item.bgColor} w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                    <item.icon className={`${item.iconColor} text-4xl`} />
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-gray-700 transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Enhanced Floating Elements */}
            <div className="fixed bottom-8 right-8 z-30 flex flex-col space-y-4">
                <a href="https://zalo.me" target="_blank" rel="noopener noreferrer" className="group relative">
                    <div className="bg-blue-500 hover:bg-blue-600 w-14 h-14 rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110">
                        <img
                            src={zaloLogo || "/placeholder.svg"}
                            alt="Zalo Chat"
                            className="w-8 h-8 rounded-full"
                            loading="lazy"
                        />
                    </div>
                    <div className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                        Chat với chúng tôi
                    </div>
                </a>

                {showScrollToTop && (
                    <button
                        onClick={scrollToTop}
                        className="group relative bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white w-14 h-14 rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                        aria-label="Lên đầu trang"
                    >
                        <FaArrowUp className="text-lg" />
                        <div className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                            Lên đầu trang
                        </div>
                    </button>
                )}
            </div>

            {/* Enhanced Cookie Consent Banner */}
            {showCookieConsent && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl shadow-2xl p-6 z-40 border-t border-gray-200">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col lg:flex-row items-center justify-between">
                            <div className="mb-6 lg:mb-0 text-center lg:text-left lg:mr-8">
                                <h4 className="font-bold text-gray-900 mb-2">🍪 Chúng tôi sử dụng Cookie</h4>
                                <p className="text-gray-700 leading-relaxed">
                                    Chúng tôi sử dụng cookie để cải thiện trải nghiệm của bạn và cung cấp dịch vụ tốt nhất. Bằng cách
                                    tiếp tục sử dụng trang web, bạn đồng ý với chính sách cookie của chúng tôi.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                                <button
                                    onClick={() => setShowCookieConsent(false)}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                                >
                                    Từ chối
                                </button>
                                <button
                                    onClick={() => setShowCookieConsent(false)}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                                >
                                    Chấp nhận tất cả
                                </button>
                            </div>
                        </div>
                    </div>
                    </div>
                )}
            
        </main>

        {/* Enhanced Footer với bảng màu đa dạng */}
<footer className="relative bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white pt-20 pb-10 overflow-hidden">
    {/* Decorative background elements */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]"></div>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(14,165,233,0.1),transparent_50%)]"></div>
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 via-pink-500 via-orange-500 to-yellow-500"></div>

    <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Company Info */}
            <div className="lg:col-span-1">
                <div className="flex items-center mb-6">
                    <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-3 rounded-2xl mr-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110">
                        <FaCarSide className="text-2xl text-white" />
                    </div>
                    <div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            DriveLuxe
                        </span>
                        <p className="text-xs text-gray-400">Premium Car Rental</p>
                    </div>
                </div>
                <p className="text-gray-300 mb-8 leading-relaxed">
                    Trải nghiệm sự sang trọng và hiệu suất với dịch vụ cho thuê xe tự lái cao cấp hàng đầu Việt Nam.
                </p>
                <div className="flex space-x-4">
                    {[
                        { icon: FaFacebookF, href: "#", color: "from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400" },
                        { icon: FaTwitter, href: "#", color: "from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400" },
                        { icon: FaInstagram, href: "#", color: "from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400" },
                        { icon: FaLinkedinIn, href: "#", color: "from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500" },
                    ].map((social, index) => (
                        <a
                            key={index}
                            href={social.href}
                            className={`bg-gradient-to-r ${social.color} w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl transform hover:-translate-y-1`}
                            aria-label={`Social media link ${index + 1}`}
                        >
                            <social.icon className="text-white" />
                        </a>
                    ))}
                </div>
            </div>

            {/* Quick Links */}
            <div>
                <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent flex items-center">
                    <div className="w-2 h-6 bg-gradient-to-b from-emerald-400 to-cyan-400 rounded-full mr-3"></div>
                    Liên kết nhanh
                </h3>
                <ul className="space-y-4">
                    {[
                        { name: "Trang chủ", path: "/" },
                        { name: "Giới thiệu", path: "/gioi-thieu" },
                        { name: "Xe cho thuê", path: "/xe-cho-thue" },
                        { name: "Địa điểm", path: "/dia-diem" },
                        { name: "Ưu đãi", path: "/uu-dai" },
                        { name: "Liên hệ", path: "/lien-he" }
                    ].map((item, idx) => (
                        <li key={idx}>
                            <Link
                                to={item.path}
                                className="text-gray-300 hover:text-emerald-400 transition-all duration-300 hover:translate-x-2 inline-flex items-center group"
                            >
                                <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                {item.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Contact Info */}
            <div>
                <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent flex items-center">
                    <div className="w-2 h-6 bg-gradient-to-b from-orange-400 to-red-400 rounded-full mr-3"></div>
                    Thông tin liên hệ
                </h3>
                <ul className="space-y-4">
                    <li className="flex items-start group">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg mr-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <FaMapMarkerAlt className="text-white text-sm" />
                        </div>
                        <span className="text-gray-300 group-hover:text-orange-400 transition-colors duration-300">
                            123 Luxury Drive, Beverly Hills, CA 90210, USA
                        </span>
                    </li>
                    <li className="flex items-center group">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-lg mr-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <FaPhone className="text-white text-sm" />
                        </div>
                        <span className="text-gray-300 group-hover:text-green-400 transition-colors duration-300">+1 (800) 123-4567</span>
                    </li>
                    <li className="flex items-center group">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg mr-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <FaEnvelope className="text-white text-sm" />
                        </div>
                        <span className="text-gray-300 group-hover:text-purple-400 transition-colors duration-300">info@driveluxe.com</span>
                    </li>
                </ul>
            </div>

            {/* Newsletter */}
            <div>
                <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent flex items-center">
                    <div className="w-2 h-6 bg-gradient-to-b from-violet-400 to-purple-400 rounded-full mr-3"></div>
                    Đăng ký nhận tin
                </h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                    Nhận thông tin về ưu đãi độc quyền và xe mới nhất từ chúng tôi.
                </p>
                <div className="flex mb-8">
                    <input
                        type="email"
                        placeholder="Email của bạn"
                        className="flex-grow py-3 px-4 bg-slate-800/50 border border-slate-600 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-white text-sm backdrop-blur-sm transition-all duration-300"
                        aria-label="Nhập email để đăng ký bản tin"
                    />
                    <button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-6 rounded-r-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-violet-500/25">
                        <FaEnvelope />
                    </button>
                </div>
                
                {/* Payment Methods */}
                <div>
                    <h4 className="text-sm font-bold mb-4 text-gray-300 flex items-center">
                        <div className="w-1 h-4 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-full mr-2"></div>
                        Phương thức thanh toán
                    </h4>
                    <div className="flex space-x-3">
                        {[
                            { icon: FaCcVisa, color: "from-blue-600 to-blue-500" },
                            { icon: FaCcMastercard, color: "from-red-600 to-orange-500" },
                            { icon: FaCcAmex, color: "from-green-600 to-emerald-500" },
                            { icon: FaCcPaypal, color: "from-blue-500 to-cyan-500" }
                        ].map(({ icon: Icon, color }, index) => (
                            <div key={index} className={`bg-gradient-to-r ${color} p-2 rounded-lg hover:scale-110 transition-all duration-300 shadow-lg cursor-pointer`}>
                                <Icon className="text-2xl text-white" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gradient-to-r from-slate-700 via-slate-600 to-slate-700 pt-8">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent mb-8"></div>
            
            {/* Footer Bottom */}
            <div className="flex flex-col lg:flex-row justify-between items-center">
                <div className="mb-4 lg:mb-0">
                    <p className="text-gray-400 text-sm flex items-center">
                        <span>© {new Date().getFullYear()} DriveLuxe. All rights reserved.</span>
                        <span className="mx-2 text-red-400">❤️</span>
                        <span>Made with love in Vietnam</span>
                    </p>
                </div>
                
                <div className="flex flex-wrap justify-center lg:justify-end space-x-6 text-sm text-gray-400">
                    {[
                        { name: "Chính sách bảo mật", color: "hover:text-blue-400" },
                        { name: "Điều khoản dịch vụ", color: "hover:text-green-400" },
                        { name: "Chính sách cookie", color: "hover:text-purple-400" }
                    ].map((item, index) => (
                        <Link
                            key={index}
                            to={`/${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                            className={`${item.color} transition-colors duration-300 hover:underline relative group`}
                        >
                            {item.name}
                            <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 group-hover:w-full transition-all duration-300"></div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    </div>

    {/* Animated background particles */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full opacity-20 animate-ping"></div>
        <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-purple-400 rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute bottom-1/4 left-2/3 w-1.5 h-1.5 bg-pink-400 rounded-full opacity-25 animate-bounce"></div>
    </div>
</footer>
</div>
)
}

export default HomePage
            