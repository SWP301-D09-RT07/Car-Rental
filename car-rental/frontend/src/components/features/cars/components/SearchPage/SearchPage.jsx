"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { toast } from "react-toastify"
import {
    FaSearch,
    FaSort,
    FaFilter,
    FaCar,
    FaMapMarkerAlt,
    FaCalendarAlt,
    FaMoneyBillWave,
    FaGasPump,
    FaStar,
    FaCog,
    FaTimes,
    FaUndo,
    FaCarSide,
    FaChevronDown,
    FaBars,
    FaHome,
    FaTag,
    FaPhone,
    FaHeart,
    FaArrowUp,
    FaFacebookF,
    FaTwitter,
    FaInstagram,
    FaLinkedinIn,
    FaEnvelope,
    FaCcVisa,
    FaCcMastercard,
    FaCcAmex,
    FaCcPaypal,
    FaExchangeAlt,
    FaEye,
    FaThLarge,
    FaList,
    FaComments,
    FaStore,
    FaUsers,
    FaAward,
    FaCheckCircle,
} from "react-icons/fa"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
import api from "@/services/api"
import { getToken } from "@/utils/auth"
import "react-toastify/dist/ReactToastify.css"

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
const ErrorMessage = ({ message, onRetry, className = "" }) => {
    return (
        <div
            className={`bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-8 rounded-2xl shadow-sm text-center ${className}`}
        >
            <div className="flex flex-col items-center">
                <div className="bg-red-100 p-4 rounded-full mb-4">
                    <FaCar className="text-red-500 text-3xl" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Oops! Something went wrong</h3>
                <p className="text-sm mb-4">{message}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
                    >
                        Try Again
                    </button>
                )}
            </div>
        </div>
    )
}

const SearchPage = () => {
    const location = useLocation()
    const navigate = useNavigate()

    // State Management
    const [cars, setCars] = useState({ content: [], totalElements: 0, totalPages: 1 })
    const [filteredCars, setFilteredCars] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(true)
    const [filterLoading, setFilterLoading] = useState(true)
    const [brands, setBrands] = useState([])
    const [countries, setCountries] = useState([])
    const [regions, setRegions] = useState([])
    const [seatOptions, setSeatOptions] = useState([])
    const [priceRanges, setPriceRanges] = useState([])
    const [years, setYears] = useState([])
    const [fuelTypes, setFuelTypes] = useState([])
    const [viewMode, setViewMode] = useState("grid")
    const [showAllRented, setShowAllRented] = useState(false)
    const [showSchedule, setShowSchedule] = useState(false)
    const [selectedCar, setSelectedCar] = useState(null)
    const [rentalHistory, setRentalHistory] = useState([])
    const [filters, setFilters] = useState({})
    const [searchQuery, setSearchQuery] = useState("")
    const [showFilters, setShowFilters] = useState(true)
    const [showCompareBar, setShowCompareBar] = useState(false)
    const [compareVehicles, setCompareVehicles] = useState([])
    const [showScrollToTop, setShowScrollToTop] = useState(false)
    const [showCookieConsent, setShowCookieConsent] = useState(true)
    const [showSortDropdown, setShowSortDropdown] = useState(false)
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [favoriteVehicles, setFavoriteVehicles] = useState([])
    const carsPerPage = 9
    const rentedCarsLimit = 3

    // Form Management for Filters
    const { register, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: {
            brand: "",
            countryCode: "",
            regionId: "",
            seats: "",
            priceRange: "",
            year: "",
            fuelType: "",
            sortBy: "",
        },
    })
    const selectedCountry = watch("countryCode")

    // Authentication
    const isTokenExpired = () => {
        const expiresAt = localStorage.getItem("expiresAt")
        return !expiresAt || new Date().getTime() > Number.parseInt(expiresAt, 10)
    }

    // API Functions
    const getCars = async (filters = {}, page = 0) => {
    try {
        const token = getToken()
        const response = await api.get("/api/cars", {
            params: { ...filters, page, size: carsPerPage },
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        // Nếu response.data là mảng, chuyển thành object chuẩn
        if (Array.isArray(response.data)) {
            return {
                content: response.data,
                totalElements: response.data.length,
                totalPages: 1,
            }
        }
        // Nếu response.data.content là mảng, trả về luôn
        if (response.data && Array.isArray(response.data.content)) {
            return response.data
        }
        // Trường hợp khác, trả về object rỗng
        return { content: [], totalElements: 0, totalPages: 1 }
    } catch (error) {
        console.error("Error fetching cars:", error)
        return { content: [], totalElements: 0, totalPages: 1 }
    }
}

    const getFeaturedCars = async (page = 0) => {
        try {
            const token = getToken()
            const response = await api.get("/api/cars/featured", {
                params: { page, size: carsPerPage },
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            return {
                content: response.data || [],
                totalElements: response.data?.length || 0,
                totalPages: Math.ceil((response.data?.length || 0) / carsPerPage),
            }
        } catch (error) {
            console.error("Error fetching featured cars:", error)
            return { content: [], totalElements: 0, totalPages: 1 }
        }
    }

    const getPopularCars = async (page = 0) => {
        try {
            const token = getToken()
            const response = await api.get("/api/cars/popular", {
                params: { page, size: carsPerPage },
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            return {
                content: response.data || [],
                totalElements: response.data?.length || 0,
                totalPages: Math.ceil((response.data?.length || 0) / carsPerPage),
            }
        } catch (error) {
            console.error("Error fetching popular cars:", error)
            return { content: [], totalElements: 0, totalPages: 1 }
        }
    }

    // Fetch Initial Data
    const fetchInitialData = async () => {
        try {
            setLoading(true)
            setFilterLoading(true)
            const token = getToken()
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}

            // Fetch filter data
            const [brandsRes, countriesRes, seatOptionsRes, priceRangesRes, yearsRes, fuelTypesRes] = await Promise.all([
                api.get("/api/cars/car-brands", config),
                api.get("/api/cars/country-codes", config),
                api.get("/api/cars/seat-options", config),
                api.get("/api/cars/price-ranges", config),
                api.get("/api/cars/years", config),
                api.get("/api/cars/fuel-types", config),
            ])

            setBrands(brandsRes.data || [])
            setCountries(countriesRes.data || [])
            setSeatOptions(seatOptionsRes.data || [])
            setPriceRanges(priceRangesRes.data || [])
            setYears(yearsRes.data || [])
            setFuelTypes(fuelTypesRes.data || [])

            // Fetch initial cars
            fetchCars(filters, currentPage - 1)
        } catch (error) {
            console.error("Error fetching initial data:", error)
            toast.error("Failed to load data. Please try again later.")
        } finally {
            setFilterLoading(false)
        }
    }

    const fetchCars = async (filters = {}, page = 0) => {
        try {
            setLoading(true)
            setError("")

            let response
            if (location.state?.filterType === "featured") {
                response = await getFeaturedCars(page)
            } else if (location.state?.filterType === "popular") {
                response = await getPopularCars(page)
            } else {
                response = await getCars({ ...filters, search: searchQuery }, page)
            }

            setCars(response)
            setFilteredCars(response.content || [])
        } catch (error) {
            console.error("Error fetching cars:", error)
            setError("Failed to load cars. Please try again later.")
            toast.error("Failed to load cars. Please try again later.")
            setCars({ content: [], totalElements: 0, totalPages: 1 })
            setFilteredCars([])
        } finally {
            setLoading(false)
        }
    }

    // Effects
    useEffect(() => {
        fetchInitialData()
    }, [])

    useEffect(() => {
        if (selectedCountry) {
            api
                .get(`/api/cars/regions/country/${selectedCountry}`)
                .then((response) => setRegions(response.data || []))
                .catch(() => setRegions([]))
        } else {
            setRegions([])
        }
    }, [selectedCountry])

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollToTop(window.scrollY > 300)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    useEffect(() => {
        setShowCompareBar(compareVehicles.length > 0)
    }, [compareVehicles])

    // Handlers
    const handleFilterChange = (newFilters) => {
        setFilters(newFilters)
        setCurrentPage(1)
        fetchCars(newFilters, 0)
    }

    const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    fetchCars({ ...filters, search: searchQuery }, newPage - 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
}

    const handleViewModeChange = (newMode) => {
        setViewMode(newMode)
        localStorage.setItem("viewMode", newMode)
    }

    const handleViewSchedule = async (car) => {
        try {
            setSelectedCar(car)
            const token = getToken()
            const response = await api.get(`/api/cars/${car.carId}/rentals`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            setRentalHistory(response.data || [])
            setShowSchedule(true)
        } catch (err) {
            toast.error("Failed to load car schedule.")
        }
    }

    const toggleCompare = (id) => {
        if (compareVehicles.includes(id)) {
            setCompareVehicles(compareVehicles.filter((vehicleId) => vehicleId !== id))
        } else if (compareVehicles.length < 3) {
            setCompareVehicles([...compareVehicles, id])
            toast.success("Vehicle added to comparison!")
        } else {
            toast.warning("You can only compare up to 3 vehicles at once.")
        }
    }

    const toggleFavorite = (id) => {
        if (favoriteVehicles.includes(id)) {
            setFavoriteVehicles(favoriteVehicles.filter((vehicleId) => vehicleId !== id))
            toast.info("Removed from favorites")
        } else {
            setFavoriteVehicles([...favoriteVehicles, id])
            toast.success("Added to favorites!")
        }
    }

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const onFilterSubmit = (data) => {
        const newFilters = {
            ...data,
            pickupDate: filters.pickupDate,
            dropoffDate: filters.dropoffDate,
            pickupTime: filters.pickupTime,
            dropoffTime: filters.dropoffTime,
        }

        Object.keys(newFilters).forEach((key) => {
            if (newFilters[key] === "") {
                delete newFilters[key]
            }
        })

        handleFilterChange(newFilters)
        toast.success("Filters applied successfully.")
    }

    const handleResetFilters = () => {
        reset()
        setFilters({})
        setSearchQuery("")
        handleFilterChange({})
        toast.info("Filters reset.")
    }

    // Pagination Logic
    const getPageNumbers = () => {
        const maxPages = 5
        const start = Math.max(1, currentPage - Math.floor(maxPages / 2))
        const end = Math.min(cars.totalPages, start + maxPages - 1)
        const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

        const result = []
        if (start > 1) {
            result.push(1)
            if (start > 2) result.push("...")
        }
        result.push(...pages)
        if (end < cars.totalPages) {
            if (end < cars.totalPages - 1) result.push("...")
            result.push(cars.totalPages)
        }
        return result
    }

    // Car Categorization
    const carContent = Array.isArray(filteredCars) ? filteredCars : []
    const rentedCars = carContent.filter((car) => car?.statusName?.toLowerCase() === "rented")
    const availableCars = carContent.filter((car) => car?.statusName?.toLowerCase() === "available")
    const displayedRentedCars = showAllRented ? rentedCars : rentedCars.slice(0, rentedCarsLimit)

    // Enhanced Car Card Component
    const CarCard = ({ car, isRented = false }) => {
        const [imageLoaded, setImageLoaded] = useState(false)
        const [isHovered, setIsHovered] = useState(false)

        return (
            <div
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 border border-gray-100"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="relative h-64 overflow-hidden cursor-pointer" onClick={() => navigate(`/cars/${car.carId}`)}>
                    {!imageLoaded && (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"></div>
                    )}
                    <img
                        src={
                            car.images?.find((img) => img.isMain)?.imageUrl ||
                            car.images?.[0]?.imageUrl ||
                            "https://via.placeholder.com/400x250?text=Car+Image" ||
                            "/placeholder.svg"
                        }
                        alt={`${car.brandName} ${car.model}`}
                        className={`w-full h-full object-cover object-center transition-all duration-700 ${
                            isHovered ? "scale-110" : "scale-100"
                        } ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                        loading="lazy"
                        onLoad={() => setImageLoaded(true)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>

                    {/* Status Badge */}
                    <div className="absolute top-4 left-4 flex flex-col space-y-2">
            <span
                className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm ${
                    isRented
                        ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                        : "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                }`}
            >
              {isRented ? "🚗 Đang thuê" : "✅ Có sẵn"}
            </span>
                        {car.discount && (
                            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                -{car.discount}% OFF
              </span>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute top-4 right-4 flex flex-col space-y-2">
                        <button
                            onClick={() => toggleFavorite(car.carId)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm ${
                                favoriteVehicles.includes(car.carId)
                                    ? "bg-red-500 text-white"
                                    : "bg-white/90 text-gray-600 hover:text-red-500"
                            }`}
                        >
                            <FaHeart className="text-sm" />
                        </button>
                        <button
                            onClick={() => toggleCompare(car.carId)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm ${
                                compareVehicles.includes(car.carId)
                                    ? "bg-blue-500 text-white"
                                    : "bg-white/90 text-gray-600 hover:text-blue-500"
                            }`}
                        >
                            <FaExchangeAlt className="text-sm" />
                        </button>
                        <button
                            onClick={() => handleViewSchedule(car)}
                            className="w-10 h-10 rounded-full bg-white/90 text-gray-600 hover:text-purple-500 flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm"
                        >
                            <FaCalendarAlt className="text-sm" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => navigate(`/cars/${car.carId}`)}>
                                {car.model} {car.year}
                            </h3>
                            <p className="text-gray-500 text-sm">{car.brandName}</p>
                        </div>
                        <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-lg">
                            <FaStar className="text-yellow-400 text-sm" />
                            <span className="text-sm font-semibold text-gray-700">{car.rating || "4.8"}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ${car.dailyRate}
              </span>
                            <span className="text-gray-500 text-sm ml-1">/ngày</span>
                        </div>
                        {car.discount && (
                            <div className="text-right">
                <span className="text-sm text-gray-500 line-through">
                  ${Math.round(car.dailyRate / (1 - car.discount / 100))}
                </span>
                                <span className="text-xs text-green-600 font-semibold ml-1">-{car.discount}%</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="flex items-center justify-center bg-gray-50 rounded-lg py-2 px-1">
                            <FaUsers className="text-blue-500 mr-1 text-sm" />
                            <span className="text-xs font-medium text-gray-700">{car.seats || 5} chỗ</span>
                        </div>
                        <div className="flex items-center justify-center bg-gray-50 rounded-lg py-2 px-1">
                            <FaCog className="text-green-500 mr-1 text-sm" />
                            <span className="text-xs font-medium text-gray-700">{car.transmission || "Tự động"}</span>
                        </div>
                        <div className="flex items-center justify-center bg-gray-50 rounded-lg py-2 px-1">
                            <FaGasPump className="text-orange-500 mr-1 text-sm" />
                            <span className="text-xs font-medium text-gray-700">{car.fuelType || "Xăng"}</span>
                        </div>
                        <div className="flex items-center justify-center bg-gray-50 rounded-lg py-2 px-1">
                            <FaCalendarAlt className="text-purple-500 mr-1 text-sm" />
                            <span className="text-xs font-medium text-gray-700">{car.year}</span>
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        <button
                            onClick={() => navigate(`/cars/${car.carId}`)}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 flex justify-center items-center shadow-lg hover:shadow-xl transform hover:scale-105"
                            disabled={isRented}
                        >
                            {isRented ? (
                                <>
                                    <FaEye className="mr-2" />
                                    Xem lịch
                                </>
                            ) : (
                                <>
                                    <FaCar className="mr-2" />
                                    Đặt ngay
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Schedule Popup Component
    const SchedulePopup = () => {
        if (!showSchedule || !selectedCar) return null

        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform animate-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Lịch thuê xe
                        </h2>
                        <button
                            onClick={() => {
                                setShowSchedule(false)
                                setSelectedCar(null)
                            }}
                            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                        >
                            <FaTimes className="text-gray-600" />
                        </button>
                    </div>

                    <div className="mb-4">
                        <h3 className="font-semibold text-gray-900 mb-2">
                            {selectedCar.brandName} {selectedCar.model} {selectedCar.year}
                        </h3>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-3">
                        {rentalHistory.length > 0 ? (
                            rentalHistory.map((rental) => (
                                <div key={rental.id} className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm text-gray-700">
                                            <div className="font-medium">
                                                {new Date(rental.pickupDateTime).toLocaleDateString("vi-VN")} -{" "}
                                                {new Date(rental.dropoffDateTime).toLocaleDateString("vi-VN")}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {new Date(rental.pickupDateTime).toLocaleTimeString("vi-VN", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}{" "}
                                                -{" "}
                                                {new Date(rental.dropoffDateTime).toLocaleTimeString("vi-VN", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </div>
                                        </div>
                                        <div
                                            className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                                rental.status === "COMPLETED" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                                            }`}
                                        >
                                            {rental.status === "COMPLETED" ? "Hoàn thành" : "Đang thuê"}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <FaCalendarAlt className="text-gray-300 text-3xl mb-3 mx-auto" />
                                <p className="text-gray-600">Chưa có lịch sử thuê xe.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => {
                                setShowSchedule(false)
                                setSelectedCar(null)
                            }}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl font-medium transition-all duration-300"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
            {/* Enhanced Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-xl shadow-lg z-50 border-b border-gray-100">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        {/* Enhanced Logo */}
                        <div className="flex items-center">
                            <a href="/" className="flex items-center group">
                                <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-3 rounded-2xl mr-3 group-hover:scale-110 transition-all duration-300 shadow-xl group-hover:shadow-2xl">
                                    <FaCarSide className="text-xl text-white" />
                                </div>
                                <div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    DriveLuxe
                  </span>
                                    <p className="text-xs text-gray-500 -mt-1">Premium Car Rental</p>
                                </div>
                            </a>
                        </div>

                        {/* Enhanced Desktop Navigation */}
                        <div className="hidden lg:flex items-center space-x-8">
                            <nav className="flex items-center space-x-8">
                                {[
                                    { name: "Trang chủ", path: "/", icon: FaHome },
                                    { name: "Xe", path: "/xe", icon: FaCar, active: true },
                                    { name: "Địa điểm", path: "/dia-diem", icon: FaMapMarkerAlt },
                                    { name: "Ưu đãi", path: "/uu-dai", icon: FaTag },
                                ].map((item) => (
                                    <a
                                        key={item.name}
                                        href={item.path}
                                        className={`font-semibold transition-all duration-300 relative group flex items-center space-x-2 px-4 py-2 rounded-xl ${
                                            item.active ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                                        }`}
                                    >
                                        <item.icon className="text-sm" />
                                        <span>{item.name}</span>
                                        {item.active && (
                                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                                        )}
                                    </a>
                                ))}
                            </nav>

                            {/* Enhanced Search Bar */}
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Tìm xe mơ ước..."
                                    className="py-3 px-4 pr-12 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 hover:bg-white transition-all duration-300 w-64 focus:w-72 group-hover:shadow-lg"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg cursor-pointer hover:scale-110 transition-transform">
                                    <FaSearch className="text-white text-xs" />
                                </div>
                            </div>

                            {/* Enhanced Action Buttons */}
                            <div className="flex items-center space-x-4">
                                {!localStorage.getItem("token") && (
                                    <a
                                        href="/provider-register"
                                        className="flex items-center text-green-600 hover:text-green-700 transition-all duration-300 px-4 py-2 rounded-xl hover:bg-green-50 group text-sm font-semibold border border-green-200 hover:border-green-300"
                                    >
                                        <FaStore className="text-sm mr-2 group-hover:scale-110 transition-transform" />
                                        <span>Đối tác</span>
                                    </a>
                                )}

                                <div className="relative">
                                    {localStorage.getItem("token") ? (
                                        <button
                                            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                            className="flex items-center text-gray-700 hover:text-blue-600 transition-all duration-300 p-2 rounded-xl hover:bg-blue-50 group"
                                        >
                                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-3 shadow-lg group-hover:shadow-xl transition-all">
                                                <span className="text-white text-sm font-bold">U</span>
                                            </div>
                                            <FaChevronDown
                                                className={`text-xs transition-all duration-300 ${isUserDropdownOpen ? "rotate-180" : ""}`}
                                            />
                                        </button>
                                    ) : (
                                        <div className="flex items-center space-x-3">
                                            <a
                                                href="/login"
                                                className="text-gray-700 hover:text-blue-600 transition-all duration-300 px-4 py-2 rounded-xl hover:bg-blue-50 text-sm font-semibold"
                                            >
                                                Đăng nhập
                                            </a>
                                            <a
                                                href="/register"
                                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm"
                                            >
                                                Đăng ký
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <a
                                    href="/lien-he"
                                    className="flex items-center text-gray-700 hover:text-blue-600 transition-all duration-300 p-3 rounded-xl hover:bg-blue-50 shadow-sm hover:shadow-md"
                                >
                                    <FaPhone className="text-sm" />
                                </a>
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="lg:hidden p-3 rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-sm"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? (
                                <FaTimes className="text-xl text-gray-700" />
                            ) : (
                                <FaBars className="text-xl text-gray-700" />
                            )}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {isMobileMenuOpen && (
                        <div className="lg:hidden mt-6 pb-6 border-t border-gray-100 animate-in slide-in-from-top duration-300">
                            <nav className="flex flex-col space-y-2 mt-6">
                                {[
                                    { name: "Trang chủ", path: "/", icon: FaHome },
                                    { name: "Xe", path: "/xe", icon: FaCar, active: true },
                                    { name: "Địa điểm", path: "/dia-diem", icon: FaMapMarkerAlt },
                                    { name: "Ưu đãi", path: "/uu-dai", icon: FaTag },
                                    { name: "Liên hệ", path: "/lien-he", icon: FaPhone },
                                ].map((item) => (
                                    <a
                                        key={item.name}
                                        href={item.path}
                                        className={`font-semibold p-4 rounded-xl transition-all duration-300 flex items-center space-x-3 ${
                                            item.active ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <item.icon className="text-lg" />
                                        <span>{item.name}</span>
                                    </a>
                                ))}
                            </nav>
                        </div>
                    )}
                </div>
            </header>

            <main className="pt-24 pb-16">
                {/* Enhanced Hero Section */}
                <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-16">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col lg:flex-row justify-between items-center">
                            <div className="text-center lg:text-left mb-8 lg:mb-0">
                                <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
                                    <FaAward className="text-yellow-300 mr-2" />
                                    <span className="text-white font-semibold text-sm">
                    {location.state?.filterType === "featured"
                        ? "XE NỔI BẬT"
                        : location.state?.filterType === "popular"
                            ? "XE PHỔ BIẾN"
                            : "TÌM KIẾM XE"}
                  </span>
                                </div>
                                <h1 className="text-4xl lg:text-6xl font-bold mb-4 leading-tight">
                                    {location.state?.filterType === "featured"
                                        ? "Xe Nổi Bật"
                                        : location.state?.filterType === "popular"
                                            ? "Xe Phổ Biến"
                                            : "Chọn Xe Của Bạn"}
                                </h1>
                                <p className="text-xl text-white/90 max-w-2xl">
                                    Tìm và đặt xe hoàn hảo từ bộ sưu tập xe cao cấp của chúng tôi
                                </p>
                            </div>
                            <nav className="flex" aria-label="Breadcrumb">
                                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                                    <li className="inline-flex items-center">
                                        <a href="/" className="text-white/80 hover:text-white transition-colors">
                                            <FaHome className="mr-2" />
                                            Trang chủ
                                        </a>
                                    </li>
                                    <li>
                                        <div className="flex items-center">
                                            <FaChevronDown className="text-white/60 mx-2 text-xs rotate-[-90deg]" />
                                            <span className="text-white font-semibold">Xe</span>
                                        </div>
                                    </li>
                                </ol>
                            </nav>
                        </div>
                    </div>
                </section>

                {/* Enhanced Filters and Cars Section */}
                <section className="py-12">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Enhanced Filter Panel */}
                            <div className={`lg:w-1/4 ${showFilters ? "block" : "hidden lg:block"}`}>
                                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl p-6 sticky top-28 border border-gray-100">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                                            <FaFilter className="mr-2 text-blue-600" />
                                            Bộ lọc tìm kiếm
                                        </h2>
                                        <button
                                            onClick={handleResetFilters}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:bg-blue-50 px-3 py-1 rounded-lg transition-all"
                                        >
                                            Xóa tất cả
                                        </button>
                                    </div>

                                    {filterLoading ? (
                                        <div className="space-y-4">
                                            {Array.from({ length: 6 }).map((_, index) => (
                                                <div key={index}>
                                                    <Skeleton height={20} className="mb-2" />
                                                    <Skeleton height={40} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit(onFilterSubmit)} className="space-y-6">
                                            {/* Brand Filter */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                                        <FaCar className="text-blue-600 text-sm" />
                                                    </div>
                                                    Thương hiệu
                                                </label>
                                                <select
                                                    {...register("brand")}
                                                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all"
                                                >
                                                    <option value="">Tất cả thương hiệu</option>
                                                    {brands.map((brand) => (
                                                        <option key={brand.carBrandId || brand.brandName} value={brand.brandName}>
                                                            {brand.brandName}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Location Filter */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                                    <div className="bg-purple-100 p-2 rounded-lg mr-3">
                                                        <FaMapMarkerAlt className="text-purple-600 text-sm" />
                                                    </div>
                                                    Địa điểm
                                                </label>
                                                <div className="space-y-3">
                                                    <select
                                                        {...register("countryCode")}
                                                        className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all"
                                                    >
                                                        <option value="">Tất cả quốc gia</option>
                                                        {countries.map((country) => (
                                                            <option key={country.countryCode} value={country.countryCode}>
                                                                {country.countryName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <select
                                                        {...register("regionId")}
                                                        disabled={!selectedCountry}
                                                        className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all disabled:opacity-50"
                                                    >
                                                        <option value="">Tất cả khu vực</option>
                                                        {regions.map((region) => (
                                                            <option key={region.regionId} value={region.regionId}>
                                                                {region.regionName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Seats Filter */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                                    <div className="bg-green-100 p-2 rounded-lg mr-3">
                                                        <FaUsers className="text-green-600 text-sm" />
                                                    </div>
                                                    Số chỗ ngồi
                                                </label>
                                                <select
                                                    {...register("seats")}
                                                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all"
                                                >
                                                    <option value="">Tất cả</option>
                                                    {seatOptions.map((seats, idx) => (
                                                        <option key={seats || idx} value={seats}>
                                                            {seats} chỗ
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Price Range Filter */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                                    <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                                                        <FaMoneyBillWave className="text-yellow-600 text-sm" />
                                                    </div>
                                                    Khoảng giá
                                                </label>
                                                <select
                                                    {...register("priceRange")}
                                                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all"
                                                >
                                                    <option value="">Tất cả mức giá</option>
                                                    {priceRanges.map((range, idx) => (
                                                        <option key={range || idx} value={range}>
                                                            {range}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Year Filter */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                                    <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                                                        <FaCalendarAlt className="text-indigo-600 text-sm" />
                                                    </div>
                                                    Năm sản xuất
                                                </label>
                                                <select
                                                    {...register("year")}
                                                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all"
                                                >
                                                    <option value="">Tất cả năm</option>
                                                    {years.map((year, idx) => (
                                                        <option key={year || idx} value={year}>
                                                            {year}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Fuel Type Filter */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                                    <div className="bg-orange-100 p-2 rounded-lg mr-3">
                                                        <FaGasPump className="text-orange-600 text-sm" />
                                                    </div>
                                                    Loại nhiên liệu
                                                </label>
                                                <select
                                                    {...register("fuelType")}
                                                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all"
                                                >
                                                    <option value="">Tất cả loại</option>
                                                    {fuelTypes.map((fuelType) => (
                                                        <option key={fuelType.fuelTypeId || fuelType.fuelTypeName} value={fuelType.fuelTypeName}>
                                                            {fuelType.fuelTypeName}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Sort Filter */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                                    <div className="bg-pink-100 p-2 rounded-lg mr-3">
                                                        <FaSort className="text-pink-600 text-sm" />
                                                    </div>
                                                    Sắp xếp theo
                                                </label>
                                                <select
                                                    {...register("sortBy")}
                                                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all"
                                                >
                                                    <option value="">Mặc định</option>
                                                    <option value="price-low">Giá: Thấp đến cao</option>
                                                    <option value="price-high">Giá: Cao đến thấp</option>
                                                    <option value="name">Tên: A-Z</option>
                                                </select>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex space-x-3 pt-4">
                                                <button
                                                    type="submit"
                                                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
                                                >
                                                    <FaFilter className="mr-2" />
                                                    Áp dụng
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleResetFilters}
                                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center"
                                                >
                                                    <FaUndo className="mr-2" />
                                                    Đặt lại
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>

                            {/* Enhanced Car List */}
                            <div className="lg:w-3/4">
                                {/* Enhanced Search and Controls Bar */}
                                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
                                    <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                                        <div className="w-full lg:w-auto">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Tìm theo tên, model..."
                                                    className="w-full lg:w-96 pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 hover:bg-white transition-all"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-4">
                                            {/* View Mode Toggle */}
                                            <div className="hidden md:flex items-center bg-gray-100 rounded-xl p-1">
                                                <span className="text-sm text-gray-600 mr-3 px-2">Hiển thị:</span>
                                                <button
                                                    onClick={() => handleViewModeChange("grid")}
                                                    className={`p-2 rounded-lg transition-all ${
                                                        viewMode === "grid" ? "bg-blue-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"
                                                    }`}
                                                >
                                                    <FaThLarge />
                                                </button>
                                                <button
                                                    onClick={() => handleViewModeChange("list")}
                                                    className={`p-2 rounded-lg transition-all ${
                                                        viewMode === "list" ? "bg-blue-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"
                                                    }`}
                                                >
                                                    <FaList />
                                                </button>
                                            </div>

                                            {/* Sort Dropdown */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                                                    className="flex items-center space-x-2 bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-sm hover:border-blue-300 transition-all"
                                                >
                                                    <FaSort className="text-gray-500" />
                                                    <span>
                            Sắp xếp:{" "}
                                                        {filters.sortBy === "price-low"
                                                            ? "Giá thấp"
                                                            : filters.sortBy === "price-high"
                                                                ? "Giá cao"
                                                                : filters.sortBy === "name"
                                                                    ? "Tên A-Z"
                                                                    : "Mặc định"}
                          </span>
                                                    <FaChevronDown
                                                        className={`text-xs transition-transform ${showSortDropdown ? "rotate-180" : ""}`}
                                                    />
                                                </button>
                                                {showSortDropdown && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl z-10 border border-gray-100 overflow-hidden">
                                                        {[
                                                            { value: "", label: "Mặc định" },
                                                            { value: "price-low", label: "Giá: Thấp đến cao" },
                                                            { value: "price-high", label: "Giá: Cao đến thấp" },
                                                            { value: "name", label: "Tên: A-Z" },
                                                        ].map((option) => (
                                                            <button
                                                                key={option.value}
                                                                className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-left"
                                                                onClick={() => {
                                                                    setValue("sortBy", option.value)
                                                                    setShowSortDropdown(false)
                                                                    handleFilterChange({ ...filters, sortBy: option.value })
                                                                }}
                                                            >
                                                                {option.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Mobile Filter Toggle */}
                                            <button
                                                className="lg:hidden bg-blue-600 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                                                onClick={() => setShowFilters(!showFilters)}
                                            >
                                                <FaFilter />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex justify-between items-center">
                                        <div className="text-sm text-gray-600">
                                            Hiển thị <span className="font-semibold text-blue-600">{carContent.length}</span> xe
                                            {cars.totalElements > 0 && (
                                                <span>
                          {" "}
                                                    trong tổng số <span className="font-semibold text-blue-600">{cars.totalElements}</span> xe
                        </span>
                                            )}
                                        </div>
                                        {compareVehicles.length > 0 && (
                                            <div className="text-sm text-purple-600 font-medium">
                                                {compareVehicles.length} xe được chọn để so sánh
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Car Content */}
                                {loading ? (
                                    <div
                                        className={
                                            viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-6"
                                        }
                                    >
                                        {Array.from({ length: 6 }).map((_, index) => (
                                            <div key={index} className="bg-white rounded-2xl shadow-lg p-6">
                                                <Skeleton height={200} className="mb-4" />
                                                <Skeleton count={3} height={20} style={{ margin: "0.5rem 0" }} />
                                                <Skeleton height={40} className="mt-4" />
                                            </div>
                                        ))}
                                    </div>
                                ) : error ? (
                                    <ErrorMessage message={error} onRetry={() => fetchCars(filters, currentPage - 1)} />
                                ) : (
                                    <>
                                        {/* Available Cars */}
                                        {availableCars.length > 0 && (
                                            <div className="mb-12">
                                                <div className="flex items-center mb-6">
                                                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl mr-4">
                                                        <FaCheckCircle className="text-white text-xl" />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-2xl font-bold text-gray-900">Xe có sẵn</h2>
                                                        <p className="text-gray-600">Sẵn sàng cho chuyến đi của bạn</p>
                                                    </div>
                                                </div>
                                                <div
                                                    className={
                                                        viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-6"
                                                    }
                                                >
                                                    {availableCars.map((car) => (
                                                        <CarCard key={car.carId} car={car} isRented={false} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Rented Cars */}
                                        {rentedCars.length > 0 && (
                                            <div className="mb-12">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="flex items-center">
                                                        <div className="bg-gradient-to-r from-red-500 to-pink-500 p-3 rounded-xl mr-4">
                                                            <FaCar className="text-white text-xl" />
                                                        </div>
                                                        <div>
                                                            <h2 className="text-2xl font-bold text-gray-900">Xe đang được thuê</h2>
                                                            <p className="text-gray-600">Xem lịch trình và đặt trước</p>
                                                        </div>
                                                    </div>
                                                    {rentedCars.length > rentedCarsLimit && (
                                                        <button
                                                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
                                                            onClick={() => setShowAllRented(!showAllRented)}
                                                        >
                                                            {showAllRented ? "Thu gọn" : `Xem thêm ${rentedCars.length - rentedCarsLimit} xe`}
                                                        </button>
                                                    )}
                                                </div>
                                                <div
                                                    className={
                                                        viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-6"
                                                    }
                                                >
                                                    {displayedRentedCars.map((car) => (
                                                        <CarCard key={car.carId} car={car} isRented={true} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* No Results */}
                                        {carContent.length === 0 && (
                                            <div className="text-center py-16">
                                                <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                                                    <FaCar className="text-gray-400 text-4xl" />
                                                </div>
                                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy xe nào</h3>
                                                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                                    Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác để tìm xe phù hợp.
                                                </p>
                                                <button
                                                    onClick={handleResetFilters}
                                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                                                >
                                                    Đặt lại bộ lọc
                                                </button>
                                            </div>
                                        )}

                                        {/* Enhanced Pagination */}
                                        {cars.totalPages > 1 && (
                                            <div className="flex flex-col sm:flex-row justify-between items-center mt-12 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-100">
                                                <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                                                    Trang {currentPage} trong tổng số {cars.totalPages} trang
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handlePageChange(currentPage - 1)}
                                                        disabled={currentPage === 1}
                                                        className="px-4 py-2 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                                                    >
                                                        Trước
                                                    </button>
                                                    <div className="flex space-x-1">
                                                        {getPageNumbers().map((page) => (
                                                            <button
                                                                key={page}
                                                                onClick={() => typeof page === "number" && handlePageChange(page)}
                                                                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                                                                    page === currentPage
                                                                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                                                                        : page === "..."
                                                                            ? "text-gray-400 cursor-default"
                                                                            : "text-gray-700 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300"
                                                                }`}
                                                                disabled={page === "..."}
                                                            >
                                                                {page}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={() => handlePageChange(currentPage + 1)}
                                                        disabled={currentPage === cars.totalPages}
                                                        className="px-4 py-2 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                                                    >
                                                        Sau
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Enhanced Footer */}
            <footer className="bg-gradient-to-b from-gray-900 to-black text-white pt-20 pb-10">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                        {/* Company Info */}
                        <div className="lg:col-span-1">
                            <div className="flex items-center mb-6">
                                <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-3 rounded-2xl mr-4 shadow-xl">
                                    <FaCarSide className="text-2xl text-white" />
                                </div>
                                <div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    DriveLuxe
                  </span>
                                    <p className="text-xs text-gray-400">Premium Car Rental</p>
                                </div>
                            </div>
                            <p className="text-gray-400 mb-8 leading-relaxed">
                                Trải nghiệm sự sang trọng và hiệu suất với dịch vụ cho thuê xe tự lái cao cấp hàng đầu Việt Nam.
                            </p>
                            <div className="flex space-x-4">
                                {[
                                    { icon: FaFacebookF, href: "#", color: "hover:bg-blue-600" },
                                    { icon: FaTwitter, href: "#", color: "hover:bg-blue-400" },
                                    { icon: FaInstagram, href: "#", color: "hover:bg-pink-600" },
                                    { icon: FaLinkedinIn, href: "#", color: "hover:bg-blue-700" },
                                ].map((social) => (
                                    <a
                                        key={social.color}
                                        href={social.href}
                                        className={`bg-gray-800 ${social.color} w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl`}
                                    >
                                        <social.icon className="text-white" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Liên kết nhanh
                            </h3>
                            <ul className="space-y-4">
                                {["Trang chủ", "Giới thiệu", "Xe cho thuê", "Địa điểm", "Ưu đãi", "Liên hệ"].map((item) => (
                                    <li key={item}>
                                        <a
                                            href={item === "Trang chủ" ? "/" : `/${item.toLowerCase().replace(" ", "-")}`}
                                            className="text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-2 inline-block"
                                        >
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Thông tin liên hệ
                            </h3>
                            <ul className="space-y-4">
                                <li className="flex items-start group">
                                    <div className="bg-blue-600 p-2 rounded-lg mr-4 group-hover:scale-110 transition-transform">
                                        <FaMapMarkerAlt className="text-white text-sm" />
                                    </div>
                                    <span className="text-gray-400 group-hover:text-white transition-colors">
                    123 Luxury Drive, Beverly Hills, CA 90210, USA
                  </span>
                                </li>
                                <li className="flex items-center group">
                                    <div className="bg-green-600 p-2 rounded-lg mr-4 group-hover:scale-110 transition-transform">
                                        <FaPhone className="text-white text-sm" />
                                    </div>
                                    <span className="text-gray-400 group-hover:text-white transition-colors">+1 (800) 123-4567</span>
                                </li>
                                <li className="flex items-center group">
                                    <div className="bg-purple-600 p-2 rounded-lg mr-4 group-hover:scale-110 transition-transform">
                                        <FaEnvelope className="text-white text-sm" />
                                    </div>
                                    <span className="text-gray-400 group-hover:text-white transition-colors">info@driveluxe.com</span>
                                </li>
                            </ul>
                        </div>

                        {/* Newsletter */}
                        <div>
                            <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent">
                                Đăng ký nhận tin
                            </h3>
                            <p className="text-gray-400 mb-6 leading-relaxed">
                                Nhận thông tin về ưu đãi độc quyền và xe mới nhất từ chúng tôi.
                            </p>
                            <div className="flex mb-8">
                                <input
                                    type="email"
                                    placeholder="Email của bạn"
                                    className="flex-grow py-3 px-4 bg-gray-800 border border-gray-700 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                                />
                                <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 rounded-r-xl transition-all duration-300 hover:scale-105 shadow-lg">
                                    <FaEnvelope />
                                </button>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold mb-4 text-gray-300">Phương thức thanh toán</h4>
                                <div className="flex space-x-3">
                                    {[FaCcVisa, FaCcMastercard, FaCcAmex, FaCcPaypal].map((Icon, index) => (
                                        <div key={Icon.displayName || index} className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-colors">
                                            <Icon className="text-2xl text-gray-400 hover:text-white transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-8">
                        <div className="flex flex-col lg:flex-row justify-between items-center">
                            <p className="text-gray-400 text-sm mb-4 lg:mb-0">
                                © {new Date().getFullYear()} DriveLuxe. All rights reserved. Made with ❤️ in Vietnam
                            </p>
                            <div className="flex flex-wrap justify-center lg:justify-end space-x-6 text-sm text-gray-400">
                                {["Chính sách bảo mật", "Điều khoản dịch vụ", "Chính sách cookie"].map((item, index) => (
                                    <a
                                        key={index}
                                        href={`/${item.toLowerCase().replace(/\s+/g, "-")}`}
                                        className="hover:text-white transition-colors hover:underline"
                                    >
                                        {item}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Enhanced Comparison Bar */}
            {showCompareBar && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl shadow-2xl border-t border-gray-200 z-40">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex flex-col sm:flex-row justify-between items-center">
                            <div className="flex items-center mb-4 sm:mb-0">
                <span className="font-bold text-gray-800 mr-4 flex items-center">
                  <FaExchangeAlt className="mr-2 text-blue-600" />
                  So sánh xe:
                </span>
                                <div className="flex space-x-3">
                                    {compareVehicles.map((id) => {
                                        const car = filteredCars.find((v) => v.carId === id)
                                        return car ? (
                                            <div key={id} className="relative group">
                                                <img
                                                    src={
                                                        car.images?.find((img) => img.isMain)?.imageUrl ||
                                                        car.images?.[0]?.imageUrl ||
                                                        "https://via.placeholder.com/300" ||
                                                        "/placeholder.svg"
                                                    }
                                                    alt={car.model}
                                                    className="w-16 h-16 object-cover rounded-xl shadow-lg group-hover:scale-110 transition-transform"
                                                />
                                                <button
                                                    onClick={() => toggleCompare(id)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-lg"
                                                >
                                                    <FaTimes />
                                                </button>
                                                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap">
                                                    {car.model}
                                                </div>
                                            </div>
                                        ) : null
                                    })}
                                    {Array.from({ length: 3 - compareVehicles.length }).map((_, index) => (
                                        <div
                                            key={`empty-${index}`}
                                            className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 bg-gray-50"
                                        >
                                            <FaCarSide className="text-2xl" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setCompareVehicles([])}
                                    className="px-4 py-2 border-2 border-gray-300 rounded-xl text-gray-600 hover:bg-gray-100 text-sm font-medium transition-all"
                                >
                                    Xóa tất cả
                                </button>
                                <button
                                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                    disabled={compareVehicles.length < 2}
                                    onClick={() => navigate("/compare", { state: { compareIds: compareVehicles } })}
                                >
                                    So sánh ngay ({compareVehicles.length})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Popup */}
            {showSchedule && <SchedulePopup />}

            {/* Enhanced Floating Elements */}
            <div className="fixed bottom-8 right-8 z-30 flex flex-col space-y-4">
                {/* Chat Button */}
                <div className="group relative">
                    <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white w-14 h-14 rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110">
                        <FaComments className="text-xl" />
                    </button>
                    <div className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                        Chat với chúng tôi
                    </div>
                </div>

                {/* Back to Top */}
                {showScrollToTop && (
                    <div className="group relative">
                        <button
                            onClick={scrollToTop}
                            className="bg-gray-800 hover:bg-gray-700 text-white w-14 h-14 rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                        >
                            <FaArrowUp className="text-lg" />
                        </button>
                        <div className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                            Lên đầu trang
                        </div>
                    </div>
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
                                    Chúng tôi sử dụng cookie để cải thiện trải nghiệm của bạn và cung cấp dịch vụ tốt nhất. Bằng cách tiếp
                                    tục sử dụng trang web, bạn đồng ý với chính sách cookie của chúng tôi.
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
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                                >
                                    Chấp nhận tất cả
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SearchPage
