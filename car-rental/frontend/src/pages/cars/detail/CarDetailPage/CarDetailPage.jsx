"use client"

import { useState, useEffect } from "react"
import { useParams, Link, useNavigate, useLocation } from "react-router-dom"
import {
    getCarById,
    getRatingsByCarId,
    getRatingSummaryByCarId,
    createRating,
    createBooking,
    getSimilarCarsAdvanced,
    getCarSpecifications,
    getAdditionalServices,
    getRentalHistory,
    getFavorites,
    removeFavorite,
    addFavorite,
    getCars,
    searchCars
} from "@/services/api"
import {
    FaImages,
    FaPlus,
    FaCarSide,
    FaUser,
    FaTachometerAlt,
    FaCog,
    FaGasPump,
    FaStar,
    FaStarHalf,
    FaRegStar,
    FaMapMarkerAlt,
    FaPhone,
    FaEnvelope,
    FaCalendarAlt,
    FaClock,
    FaMoneyBillWave,
    FaShieldAlt,
    FaFileAlt,
    FaInfoCircle,
    FaCheck,
    FaArrowRight,
    FaComments,
    FaHeart,
    FaShare,
    FaChevronLeft,
    FaChevronRight,
    FaChevronDown,
    FaChevronUp,
    FaBluetooth,
    FaCamera,
    FaMapPin,
    FaSun,
    FaUsb,
    FaMusic,
    FaCar,
} from "react-icons/fa"
import { toast } from "react-toastify"
import { useAuth } from '@/hooks/useAuth';

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
                <h3 className="text-lg font-semibold mb-2">Oops! Đã có lỗi xảy ra</h3>
                <p className="text-sm mb-4">{message}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
                    >
                        Thử lại
                    </button>
                )}
            </div>
        </div>
    )
}

// Star Rating Component
const StarRating = ({ rating, size = "small" }) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStar = 5 - fullStars - (hasHalfStar ? 1 : 0)

    const starSizes = {
        small: "text-sm",
        medium: "text-lg",
        large: "text-xl",
    }

    for (let i = 0; i < fullStars; i++) {
        stars.push(<FaStar key={`full-${i}`} className={`text-yellow-400 ${starSizes[size]}`} />)
    }

    if (hasHalfStar) {
        stars.push(<FaStarHalf key="half" className={`text-yellow-400 ${starSizes[size]}`} />)
    }

    for (let i = 0; i < emptyStar; i++) {
        stars.push(<FaRegStar key={`empty-${i}`} className={`text-gray-300 ${starSizes[size]}`} />)
    }

    return <div className="flex items-center">{stars}</div>
}

// Feature Icon Component
const FeatureIcon = ({ feature }) => {
    const iconMap = {
        Bluetooth: <FaBluetooth />,
        "Camera 360": <FaCamera />,
        "Cảm biến lùi": <FaCamera />,
        "Camera lùi": <FaCamera />,
        "Định vị GPS": <FaMapPin />,
        "Điều hòa": <FaSun />,
        "Cổng sạc USB": <FaUsb />,
        "Hệ thống âm thanh": <FaMusic />,
        "Lốp dự phòng": <FaCar />,
    }

    return <div className="w-8 h-8 flex items-center justify-center text-blue-600">{iconMap[feature] || <FaCheck />}</div>
}

const CarDetailPage = () => {
    const { carId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const { isAuthenticated } = useAuth()
    const [car, setCar] = useState(null)
    const [ratings, setRatings] = useState([])
    const [ratingSummary, setRatingSummary] = useState(null)
    const [similarCars, setSimilarCars] = useState([])
    const [specifications, setSpecifications] = useState(null)
    const [additionalServices, setAdditionalServices] = useState([])
    const [rentalHistory, setRentalHistory] = useState([])
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState("")
    const [bookingData, setBookingData] = useState({
        startDate: "2025-06-11T08:00",
        endDate: "2025-06-12T08:00",
        pickupLocation: "",
        dropoffLocation: "",
        delivery: false,
        termsAgreed: false,
        privacyAgreed: false,
    })
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeImageIndex, setActiveImageIndex] = useState(0)
    const [showAllFeatures, setShowAllFeatures] = useState(false)
    const [showAllTerms, setShowAllTerms] = useState(false)
    const [isFavorite, setIsFavorite] = useState(false)
    const [showGalleryModal, setShowGalleryModal] = useState(false)
    const [showReviewForm, setShowReviewForm] = useState(false)

    const fetchSimilarCars = async () => {
        try {
            const data = await getSimilarCarsAdvanced(carId, 0, 4);
            return data.content || [];
        } catch (err) {
            console.error('Error fetching similar cars:', err);
            return [];
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!carId || carId === 'undefined') {
                setError('Không tìm thấy thông tin xe');
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                // Get car details first
                const carData = await getCarById(carId).catch(err => {
                    console.error('Error fetching car details:', err);
                    throw new Error('Không thể tải thông tin xe');
                });
                setCar(carData);

                // Get specifications
                const specificationsData = await getCarSpecifications(carId).catch(err => {
                    console.error('Error fetching specifications:', err);
                    return { specifications: {} };
                });
                setSpecifications(specificationsData.specifications || {});

                // Get similar cars with fallback logic
                const similarCars = await fetchSimilarCars();
                setSimilarCars(similarCars);

                // Get favorites if authenticated
                if (isAuthenticated) {
                    const favoritesData = await getFavorites().catch(err => {
                        console.error('Error fetching favorites:', err);
                        return { content: [] };
                    });
                    setIsFavorite(favoritesData.content?.some(fav => fav.carId === carId) || false);
                }
            } catch (error) {
                setError(error.message);
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [carId, isAuthenticated]);

    const handleSubmitReview = async () => {
        if (!rating) {
            toast.error('Vui lòng chọn số sao đánh giá');
            return;
        }

        try {
            const newRating = await createRating({
                carId,
                rating,
                comment: comment.trim()
            });

            setRatings(prev => [newRating, ...prev]);
            setRating(0);
            setComment('');
            setShowReviewForm(false);
            toast.success('Đánh giá của bạn đã được gửi thành công!');

            // Refresh rating summary
            const updatedSummary = await getRatingSummaryByCarId(carId);
            setRatingSummary(updatedSummary);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleSubmitBooking = async () => {
        if (!bookingData.startDate || !bookingData.endDate) {
            toast.error('Vui lòng chọn ngày bắt đầu và kết thúc');
            return;
        }

        if (!bookingData.termsAgreed || !bookingData.privacyAgreed) {
            toast.error('Vui lòng đồng ý với các điều khoản và chính sách');
            return;
        }

        try {
            const booking = await createBooking({
                carId,
                pickupDateTime: bookingData.startDate,
                dropoffDate: bookingData.endDate,
                pickupLocation: bookingData.pickupLocation || car.location,
                dropoffLocation: bookingData.dropoffLocation || car.location,
                delivery: bookingData.delivery,
                additionalServices: bookingData.additionalServices || []
            });

            toast.success('Đặt xe thành công!');
            navigate(`/bookings/${booking.id}`);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const toggleFavorite = async () => {
        try {
            if (isFavorite) {
                const favorite = favoritesData.content.find(fav => fav.carId === carId);
                if (favorite) {
                    await removeFavorite(favorite.id);
                    setIsFavorite(false);
                    toast.success('Đã xóa khỏi danh sách yêu thích');
                }
            } else {
                await addFavorite(carId);
                setIsFavorite(true);
                toast.success('Đã thêm vào danh sách yêu thích');
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href)
        toast.success("Đã sao chép đường dẫn vào clipboard!")
    }

    const nextImage = () => {
        if (car?.images?.length) {
            setActiveImageIndex((prev) => (prev + 1) % car.images.length)
        }
    }

    const prevImage = () => {
        if (car?.images?.length) {
            setActiveImageIndex((prev) => (prev === 0 ? car.images.length - 1 : prev - 1))
        }
    }

    const handleBookingChange = (e) => {
        const { name, value, type, checked } = e.target;
        setBookingData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    // Gallery Modal Component
    const GalleryModal = () => {
        const [modalImageIndex, setModalImageIndex] = useState(activeImageIndex)

        const nextModalImage = () => {
            if (car?.images?.length) {
                setModalImageIndex((prev) => (prev + 1) % car.images.length)
            }
        }

        const prevModalImage = () => {
            if (car?.images?.length) {
                setModalImageIndex((prev) => (prev === 0 ? car.images.length - 1 : prev - 1))
            }
        }

        return (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                <button
                    onClick={() => setShowGalleryModal(false)}
                    className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>

                <div className="relative w-full max-w-4xl">
                    <div className="relative aspect-[16/9] bg-gray-900 rounded-lg overflow-hidden">
                        <img
                            src={car?.images?.[modalImageIndex]?.url || "https://via.placeholder.com/800x450"}
                            alt={`${car?.model} Image ${modalImageIndex + 1}`}
                            className="w-full h-full object-contain"
                        />
                    </div>

                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
                        <button
                            onClick={prevModalImage}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 text-white transition-all"
                        >
                            <FaChevronLeft className="text-xl" />
                        </button>
                    </div>

                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                        <button
                            onClick={nextModalImage}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 text-white transition-all"
                        >
                            <FaChevronRight className="text-xl" />
                        </button>
                    </div>

                    <div className="mt-4 flex justify-center">
                        <div className="text-white text-sm">
                            {modalImageIndex + 1} / {car?.images?.length || 0}
                        </div>
                    </div>

                    <div className="mt-4 flex justify-center gap-2 overflow-x-auto pb-2">
                        {car?.images?.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setModalImageIndex(idx)}
                                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                    modalImageIndex === idx ? "border-blue-500 scale-110" : "border-transparent opacity-60"
                                }`}
                            >
                                <img
                                    src={img.url || "https://via.placeholder.com/100"}
                                    alt={`Thumbnail ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="text-center">
                    <div className="mb-8">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl inline-block shadow-2xl">
                            <FaCarSide className="text-4xl text-white animate-bounce" />
                        </div>
                    </div>
                    <LoadingSpinner size="large" />
                    <p className="mt-6 text-gray-700 text-lg font-medium">Đang tải thông tin xe...</p>
                    <p className="mt-2 text-gray-500">Vui lòng chờ trong giây lát</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
                <ErrorMessage message={error} onRetry={() => window.location.reload()} className="max-w-lg w-full" />
            </div>
        )
    }

    if (!car) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="text-center max-w-lg">
                    <div className="mb-6">
                        <div className="bg-gray-200 p-6 rounded-full inline-block">
                            <FaCarSide className="text-4xl text-gray-400" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy xe</h2>
                    <p className="text-gray-600 mb-6">
                        Xe bạn đang tìm kiếm không tồn tại hoặc đã bị xóa. Vui lòng thử tìm kiếm xe khác.
                    </p>
                    <Link
                        to="/search"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-8 rounded-xl font-semibold transition-all duration-300 inline-block"
                    >
                        Tìm xe khác
                    </Link>
                </div>
            </div>
        )
    }

    // Calculate rental duration and total price
    const startDate = new Date(bookingData.startDate)
    const endDate = new Date(bookingData.endDate)
    const rentalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    const rentalHours = Math.ceil((endDate - startDate) / (1000 * 60 * 60))

    // Calculate price based on duration
    let rentalPrice = car.dailyRate
    if (rentalDays >= 7) {
        rentalPrice = car.dailyRate * 0.9
    } else if (rentalDays >= 2) {
        rentalPrice = car.dailyRate * 0.95
    }

    const deliveryFee = bookingData.delivery ? 100000 : 0
    const serviceFee = 55000
    const totalPrice = rentalPrice * rentalDays + deliveryFee + serviceFee

    // Xác định ảnh chính và ảnh phụ
    const mainImage = car.images?.find(img => img.isMain) || car.images?.[0];
    const subImages = car.images?.filter(img => !img.isMain) || [];

    return (
        <div className="bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center text-sm text-gray-500 mb-6">
                    <Link to="/" className="hover:text-blue-600 transition-colors">
                        Trang chủ
                    </Link>
                    <FaChevronRight className="mx-2 text-xs text-gray-400" />
                    <Link to="/search" className="hover:text-blue-600 transition-colors">
                        Danh sách xe
                    </Link>
                    <FaChevronRight className="mx-2 text-xs text-gray-400" />
                    <span className="text-gray-700 font-medium">{car.model}</span>
                </div>

                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                {car.model} {car.year}
                            </h1>
                            {/* Price Section under car name */}
                            <div className="flex items-baseline gap-4 mb-1">
                                <div className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    {(car.dailyRate / 1000).toFixed(0)}K
                                </div>
                                <div className="text-gray-500 text-base line-through">{car.dailyRate?.toLocaleString()}đ/ngày</div>
                            </div>
                            <div className="text-gray-600 text-sm mb-2">Giá đã bao gồm thuế và phí dịch vụ, không phí ẩn</div>
                            <div className="flex flex-wrap items-center gap-3 text-gray-600">
                                <div className="flex items-center">
                                    <StarRating rating={car.averageRating || 4.8} />
                                    <span className="ml-2 font-medium">{car.averageRating || 4.8}/5.0</span>
                                </div>
                                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                <div className="flex items-center">
                                    <FaComments className="mr-2 text-blue-500" />
                                    <span>{ratings.length} đánh giá</span>
                                </div>
                                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                <div className="flex items-center">
                                    <FaMapMarkerAlt className="mr-2 text-blue-500" />
                                    <span>{car.location || "TP. Hồ Chí Minh"}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleFavorite}
                                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                                    isFavorite ? "bg-red-500 text-white" : "bg-white text-gray-600 hover:bg-red-50 hover:text-red-500"
                                } shadow-md`}
                            >
                                <FaHeart />
                            </button>
                            <button
                                onClick={handleShare}
                                className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-500 transition-all shadow-md"
                            >
                                <FaShare />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Gallery Section - Improved Version */}
                    <div className="mb-12">
                        <div className="relative">
                            {/* Desktop Gallery Layout */}
                            <div className="hidden md:grid grid-cols-12 gap-3 h-[450px] rounded-2xl overflow-hidden shadow-2xl">
                                {/* Main Image - Takes 8 columns */}
                                <div className="col-span-8 relative group cursor-pointer overflow-hidden bg-gray-100" onClick={() => setShowGalleryModal(true)}>
                                    <img
                                        src={mainImage?.imageUrl || "https://via.placeholder.com/800x500"}
                                        alt={car.model + ' Main Image'}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    {/* Overlay with view all photos button */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        <div className="absolute bottom-6 left-6 right-6">
                                            <button className="bg-white/90 backdrop-blur-sm text-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                                                <FaImages className="inline mr-2" />
                                                Xem tất cả {car.images?.length || 5} ảnh
                                            </button>
                                        </div>
                                        {/* Image counter */}
                                        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                                            {activeImageIndex + 1} / {car.images?.length || 5}
                                        </div>
                                    </div>
                                    
                                    {/* Navigation arrows on main image */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            prevImage();
                                        }}
                                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full p-3 text-white transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
                                    >
                                        <FaChevronLeft size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            nextImage();
                                        }}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full p-3 text-white transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
                                    >
                                        <FaChevronRight size={18} />
                                    </button>
                                </div>

                                {/* Side Images Grid - Takes 4 columns */}
                                <div className="col-span-4 grid grid-rows-2 gap-3 h-full">
                                    {subImages.slice(0, 2).map((img, index) => (
                                        <div
                                            key={index}
                                            className="relative group cursor-pointer overflow-hidden rounded-xl bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 h-[216px]"
                                            onClick={() => setShowGalleryModal(true)}
                                        >
                                            <img
                                                src={img.imageUrl || "https://via.placeholder.com/400x240"}
                                                alt={car.model + ' Image ' + (index + 2)}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            
                                            {/* Special overlay for last image if there are more images */}
                                            {index === 1 && car.images?.length > 3 && (
                                                <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                                                    <div className="text-center text-white">
                                                        
                                                        <div className="text-lg font-bold">+{car.images.length - 3}</div>
                                                        <div className="text-sm opacity-90">ảnh khác</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Mobile Gallery Layout */}
                            <div className="md:hidden">
                                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl bg-gray-100">
                                    <img
                                        src={car.images?.[activeImageIndex]?.imageUrl || "https://via.placeholder.com/400x300"}
                                        alt={car.model + ' Image ' + (activeImageIndex + 1)}
                                        className="w-full h-full object-cover"
                                    />
                                    
                                    {/* Mobile overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent">
                                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                            <button 
                                                onClick={() => setShowGalleryModal(true)}
                                                className="bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-lg font-medium text-sm hover:bg-white transition-colors"
                                            >
                                                <FaImages className="inline mr-1" />
                                                Xem tất cả
                                            </button>
                                            <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                                                {activeImageIndex + 1}/{car.images?.length || 5}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile navigation */}
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded-full p-2 text-white transition-all"
                                    >
                                        <FaChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded-full p-2 text-white transition-all"
                                    >
                                        <FaChevronRight size={16} />
                                    </button>
                                </div>

                                {/* Mobile Thumbnails */}
                                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                                    {car.images?.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                                                activeImageIndex === idx 
                                                    ? "border-blue-500 shadow-lg scale-105" 
                                                    : "border-transparent opacity-70 hover:opacity-100"
                                            }`}
                                        >
                                            <img
                                                src={img.imageUrl || "https://via.placeholder.com/64x48"}
                                                alt={`Thumbnail ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>

                                {/* Mobile Dots Indicator */}
                                <div className="flex justify-center mt-3 gap-2">
                                    {car.images?.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                activeImageIndex === idx 
                                                    ? "bg-blue-600 w-8 shadow-lg" 
                                                    : "bg-gray-300 w-2 hover:bg-gray-400"
                                            }`}
                                        ></button>
                                    ))}
                                </div>
                            </div>

                            {/* Floating Gallery Stats */}
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border border-white/20">
                                <div className="flex items-center gap-2 text-sm">
                                    <FaCamera className="text-blue-500" />
                                    <span className="font-medium text-gray-700">{car.images?.length || 5} ảnh</span>
                                </div>
                            </div>

                            {/* Quick Action Buttons */}
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button
                                    onClick={toggleFavorite}
                                    className={`w-10 h-10 rounded-full backdrop-blur-sm transition-all duration-300 shadow-lg hover:scale-110 ${
                                        isFavorite 
                                            ? "bg-red-500/90 text-white" 
                                            : "bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500"
                                    }`}
                                >
                                    <FaHeart className="mx-auto" />
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-blue-50 hover:text-blue-500 transition-all duration-300 shadow-lg hover:scale-110"
                                >
                                    <FaShare className="mx-auto" />
                                </button>
                            </div>
                        </div>
                    </div>                {/* Main Content */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column */}
                    <div className="w-full lg:w-2/3">
                        {/* Basic Features */}
                        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl mb-8 border border-gray-100">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                                Đặc điểm
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl hover:shadow-md transition-all hover:-translate-y-1">
                                    <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full mb-3">
                                        <FaUser className="text-xl" />
                                    </div>
                                    <div className="text-sm text-gray-500">Số chỗ</div>
                                    <div className="font-semibold text-gray-800">{car.seats || 5} chỗ</div>
                                </div>
                                <div className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl hover:shadow-md transition-all hover:-translate-y-1">
                                    <div className="w-12 h-12 flex items-center justify-center bg-green-100 text-green-600 rounded-full mb-3">
                                        <FaTachometerAlt className="text-xl" />
                                    </div>
                                    <div className="text-sm text-gray-500">Số km đã đi</div>
                                    <div className="font-semibold text-gray-800">{car.mileage || "50.000"} km</div>
                                </div>
                                <div className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl hover:shadow-md transition-all hover:-translate-y-1">
                                    <div className="w-12 h-12 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full mb-3">
                                        <FaCog className="text-xl" />
                                    </div>
                                    <div className="text-sm text-gray-500">Truyền động</div>
                                    <div className="font-semibold text-gray-800">{car.transmission || "Tự động"}</div>
                                </div>
                                <div className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl hover:shadow-md transition-all hover:-translate-y-1">
                                    <div className="w-12 h-12 flex items-center justify-center bg-orange-100 text-orange-600 rounded-full mb-3">
                                        <FaGasPump className="text-xl" />
                                    </div>
                                    <div className="text-sm text-gray-500">Nhiên liệu</div>
                                    <div className="font-semibold text-gray-800">{car.fuelConsumption || "8L/100km"}</div>
                                </div>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl mb-8 border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Tính năng
                                </h2>
                                <button
                                    onClick={() => setShowAllFeatures(!showAllFeatures)}
                                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center text-sm"
                                >
                                    {showAllFeatures ? "Thu gọn" : "Xem tất cả"}
                                    {showAllFeatures ? <FaChevronUp className="ml-1" /> : <FaChevronDown className="ml-1" />}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {(
                                    car.features || "Bluetooth, Camera 360, Cảm biến lùi, Camera lùi, Định vị GPS, Điều hòa, Cổng sạc USB"
                                )
                                    .split(", ")
                                    .slice(0, showAllFeatures ? undefined : 6)
                                    .map((feature, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors"
                                        >
                                            <FeatureIcon feature={feature} />
                                            <span className="text-gray-700">{feature}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Specifications */}
                        {specifications && Object.keys(specifications).length > 0 && (
                            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl mb-8 border border-gray-100">
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                                    Thông số kỹ thuật
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {Object.entries(specifications).map(([key, value]) => (
                                        <div key={key} className="flex flex-col p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                                            <div className="text-sm text-gray-500">{key}</div>
                                            <div className="font-semibold text-gray-800">{value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reviews */}
                        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl mb-8 border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Đánh giá
                                </h2>
                                <button
                                    onClick={() => setShowReviewForm(!showReviewForm)}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 text-sm flex items-center"
                                >
                                    <FaStar className="mr-2" />
                                    Viết đánh giá
                                </button>
                            </div>

                            <div className="flex flex-col md:flex-row gap-6 mb-8">
                                <div className="md:w-1/3 bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl text-center">
                                    <div className="text-5xl font-bold text-gray-800 mb-2">{car.averageRating || "4.8"}</div>
                                    <div className="flex justify-center mb-2">
                                        <StarRating rating={car.averageRating || 4.8} size="medium" />
                                    </div>
                                    <div className="text-gray-600">{ratings.length} đánh giá</div>
                                </div>

                                <div className="md:w-2/3">
                                    <div className="space-y-2">
                                        {[5, 4, 3, 2, 1].map((star) => {
                                            const count = ratings.filter((r) => Math.round(r.rating) === star).length
                                            const percentage = ratings.length > 0 ? (count / ratings.length) * 100 : 0
                                            return (
                                                <div key={star} className="flex items-center gap-3">
                                                    <div className="flex items-center w-24">
                                                        <span className="mr-1">{star}</span>
                                                        <FaStar className="text-yellow-400" />
                                                    </div>
                                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="w-12 text-right text-sm text-gray-600">{percentage.toFixed(0)}%</div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Review Form */}
                            {showReviewForm && (
                                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl mb-8 animate-in slide-in-from-top duration-300">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Viết đánh giá của bạn</h3>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Đánh giá của bạn</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setRating(star)}
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                        rating >= star ? "bg-yellow-400 text-white" : "bg-gray-200 text-gray-400 hover:bg-gray-300"
                                                    } transition-colors`}
                                                >
                                                    <FaStar />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                                            Bình luận
                                        </label>
                                        <textarea
                                            id="comment"
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Chia sẻ trải nghiệm của bạn với xe này..."
                                            className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            rows="4"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowReviewForm(false)}
                                            className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSubmitReview}
                                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl font-medium transition-all duration-300"
                                            disabled={!rating || !comment}
                                        >
                                            Gửi đánh giá
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Reviews List */}
                            <div className="space-y-6">
                                {ratings.length > 0 ? (
                                    ratings.map((r, index) => (
                                        <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                                                    {r.userName?.charAt(0) || "U"}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-800">{r.userName || "Người dùng ẩn danh"}</h4>
                                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                <StarRating rating={r.rating} />
                                                                <span>•</span>
                                                                <span>{new Date(r.createdAt || Date.now()).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="mt-2 text-gray-700">{r.comment || "Không có bình luận"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FaComments className="text-gray-400 text-2xl" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-800 mb-1">Chưa có đánh giá nào</h3>
                                        <p className="text-gray-600">Hãy là người đầu tiên đánh giá xe này</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl mb-8 border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Điều khoản
                                </h2>
                                <button
                                    onClick={() => setShowAllTerms(!showAllTerms)}
                                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center text-sm"
                                >
                                    {showAllTerms ? "Thu gọn" : "Xem chi tiết"}
                                    {showAllTerms ? <FaChevronUp className="ml-1" /> : <FaChevronDown className="ml-1" />}
                                </button>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                            <FaFileAlt />
                                        </div>
                                        <h3 className="font-semibold text-gray-800 text-lg">Giấy tờ thuê xe</h3>
                                    </div>
                                    <ul className="space-y-3 pl-12">
                                        {(
                                            car.rentalTerms?.documents || [
                                                "CMND/CCCD + Giấy phép lái xe",
                                                "Hộ khẩu/KT3 hoặc Passport",
                                                "Đặt cọc 5 triệu đồng",
                                            ]
                                        ).map((doc, index) => (
                                            <li key={index} className="flex items-center gap-2 text-gray-700">
                                                <FaCheck className="text-green-500 flex-shrink-0" />
                                                <span>{doc}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {showAllTerms && (
                                    <>
                                        <div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                                                    <FaShieldAlt />
                                                </div>
                                                <h3 className="font-semibold text-gray-800 text-lg">Quy định khác</h3>
                                            </div>
                                            <ul className="space-y-3 pl-12">
                                                {(
                                                    car.rentalTerms?.rules || [
                                                        "Sử dụng xe đúng mục đích",
                                                        "Không hút thuốc trên xe",
                                                        "Không vận chuyển hàng cấm",
                                                        "Vệ sinh xe trước khi trả",
                                                        "Trả xe đúng giờ, quá giờ tính phí 100.000đ/giờ",
                                                    ]
                                                ).map((rule, index) => (
                                                    <li key={index} className="flex items-center gap-2 text-gray-700">
                                                        <FaCheck className="text-green-500 flex-shrink-0" />
                                                        <span>{rule}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
                                                    <FaInfoCircle />
                                                </div>
                                                <h3 className="font-semibold text-gray-800 text-lg">Chính sách hủy chuyến</h3>
                                            </div>
                                            <ul className="space-y-3 pl-12">
                                                {[
                                                    "Miễn phí hủy chuyến trước 24h",
                                                    "Hủy trong vòng 24h mất 30% tiền cọc",
                                                    "Hủy trong vòng 12h mất 50% tiền cọc",
                                                    "Hủy trong vòng 6h mất 100% tiền cọc",
                                                ].map((policy, index) => (
                                                    <li key={index} className="flex items-center gap-2 text-gray-700">
                                                        <FaCheck className="text-green-500 flex-shrink-0" />
                                                        <span>{policy}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Rental Policy */}
                        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl mb-8 border border-gray-100">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                                Chính sách thuê chuyến
                            </h2>
                            <div className="border-b border-gray-200 pb-6 mb-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-gray-800 text-lg">Bảng giá theo thời gian</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 text-center hover:shadow-md transition-all hover:-translate-y-1">
                                        <div className="text-sm text-gray-600 mb-1">Dưới 24 giờ</div>
                                        <div className="text-xl font-bold text-gray-800">{car.dailyRate?.toLocaleString()}đ</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 text-center hover:shadow-md transition-all hover:-translate-y-1">
                                        <div className="text-sm text-gray-600 mb-1">2-6 ngày</div>
                                        <div className="text-xl font-bold text-gray-800">{(car.dailyRate * 0.95).toLocaleString()}đ</div>
                                        <div className="text-xs text-green-600">Giảm 5%</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 text-center hover:shadow-md transition-all hover:-translate-y-1">
                                        <div className="text-sm text-gray-600 mb-1">7+ ngày</div>
                                        <div className="text-xl font-bold text-gray-800">{(car.dailyRate * 0.9).toLocaleString()}đ</div>
                                        <div className="text-xs text-green-600">Giảm 10%</div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-gray-800 text-lg">Thời gian nhận/trả xe</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-4">
                                            <FaClock />
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">Giờ nhận xe</div>
                                            <div className="font-medium text-gray-800">{car.rentalTerms?.pickupTime || "7:00 - 22:00"}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mr-4">
                                            <FaClock />
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">Giờ trả xe</div>
                                            <div className="font-medium text-gray-800">{car.rentalTerms?.returnTime || "Trước 22:00"}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Car Owner */}
                        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl mb-8 border border-gray-100">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                                Thông tin chủ xe
                            </h2>
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full overflow-hidden flex-shrink-0">
                                    <img
                                        src={car.owner?.avatarUrl || "https://via.placeholder.com/96"}
                                        alt="Chủ xe"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-xl font-bold text-gray-800 mb-1">{car.owner?.fullName || "Nguyễn Văn Tuấn"}</h3>
                                    <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                                        <StarRating rating={car.owner?.rating || 4.9} />
                                        <span className="text-gray-600">{car.owner?.rating || 4.9}</span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-600">
                      {car.owner?.verified ? (
                          <span className="flex items-center text-green-600">
                          <FaCheck className="mr-1" /> Đã xác thực
                        </span>
                      ) : (
                          "Chưa xác thực"
                      )}
                    </span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-center md:justify-start gap-3 text-gray-700">
                                            <FaPhone className="text-blue-600" />
                                            <span>{car.owner?.phoneNumber || "0987 123 456"}</span>
                                        </div>
                                        <div className="flex items-center justify-center md:justify-start gap-3 text-gray-700">
                                            <FaEnvelope className="text-blue-600" />
                                            <span>{car.owner?.email || "tuannguyen@gmail.com"}</span>
                                        </div>
                                        <div className="flex items-center justify-center md:justify-start gap-3 text-gray-700">
                                            <FaMapMarkerAlt className="text-blue-600" />
                                            <span>{car.owner?.address || "Quận 2, TP. Hồ Chí Minh"}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="md:self-center">
                                    <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center">
                                        <FaComments className="mr-2" />
                                        Chat với chủ xe
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="w-full lg:w-1/3">
                        {/* Booking Widget */}
                        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl sticky top-24 border border-gray-100">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                                Đặt thuê xe ngay
                            </h2>
                            {error && (
                                <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-center border border-red-200">
                                    {error}
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian nhận xe</label>
                                <div className="flex items-center border-2 border-gray-200 rounded-xl p-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 bg-white">
                                    <FaCalendarAlt className="text-gray-400 mr-3" />
                                    <input
                                        type="datetime-local"
                                        name="startDate"
                                        value={bookingData.startDate}
                                        onChange={handleBookingChange}
                                        className="w-full border-none text-gray-700 focus:outline-none focus:ring-0"
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian trả xe</label>
                                <div className="flex items-center border-2 border-gray-200 rounded-xl p-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 bg-white">
                                    <FaCalendarAlt className="text-gray-400 mr-3" />
                                    <input
                                        type="datetime-local"
                                        name="endDate"
                                        value={bookingData.endDate}
                                        onChange={handleBookingChange}
                                        className="w-full border-none text-gray-700 focus:outline-none focus:ring-0"
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Địa điểm nhận xe</label>
                                <div className="relative">
                                    <select
                                        name="pickupLocation"
                                        value={bookingData.pickupLocation}
                                        onChange={handleBookingChange}
                                        className="w-full border-2 border-gray-200 rounded-xl p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 appearance-none bg-white"
                                    >
                                        <option value="">Chọn địa điểm</option>
                                        <option value="Hà Nội">Hà Nội</option>
                                        <option value="TP.HCM">TP.HCM</option>
                                        <option value="Đà Nẵng">Đà Nẵng</option>
                                        <option value="Nha Trang">Nha Trang</option>
                                        <option value="Đà Lạt">Đà Lạt</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                        <FaChevronDown className="text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Địa điểm trả xe</label>
                                <div className="relative">
                                    <select
                                        name="dropoffLocation"
                                        value={bookingData.dropoffLocation}
                                        onChange={handleBookingChange}
                                        className="w-full border-2 border-gray-200 rounded-xl p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 appearance-none bg-white"
                                    >
                                        <option value="">Chọn địa điểm</option>
                                        <option value="Hà Nội">Hà Nội</option>
                                        <option value="TP.HCM">TP.HCM</option>
                                        <option value="Đà Nẵng">Đà Nẵng</option>
                                        <option value="Nha Trang">Nha Trang</option>
                                        <option value="Đà Lạt">Đà Lạt</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                        <FaChevronDown className="text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="flex items-center mb-2">
                                    <input
                                        type="checkbox"
                                        name="delivery"
                                        checked={bookingData.delivery}
                                        onChange={handleBookingChange}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Giao xe tận nơi (100.000đ)</span>
                                </label>
                            </div>

                            <div className="border-t border-gray-200 pt-4 mb-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700">Giá thuê ({rentalDays} ngày)</span>
                                        <span className="font-medium">{(rentalPrice * rentalDays).toLocaleString()}đ</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700">Phí giao xe</span>
                                        <span className="font-medium">{deliveryFee.toLocaleString()}đ</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700">Phí dịch vụ</span>
                                        <span className="font-medium">{serviceFee.toLocaleString()}đ</span>
                                    </div>
                                    <div className="flex justify-between items-center text-blue-600 font-medium">
                                        <div className="flex items-center">
                                            <FaMoneyBillWave className="mr-2" />
                                            <span>Mã giảm giá</span>
                                        </div>
                                        <span>- 0đ</span>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4 mb-6">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-900 text-lg">Tổng cộng</span>
                                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {totalPrice.toLocaleString()}đ
                  </span>
                                </div>
                            </div>

                            <div className="mb-6 space-y-3">
                                <label className="flex items-start">
                                    <input
                                        type="checkbox"
                                        name="termsAgreed"
                                        checked={bookingData.termsAgreed}
                                        onChange={handleBookingChange}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                    Tôi đồng ý với{" "}
                                        <a href="#" className="text-blue-600 hover:text-blue-800 underline">
                      điều khoản dịch vụ
                    </a>
                  </span>
                                </label>
                                <label className="flex items-start">
                                    <input
                                        type="checkbox"
                                        name="privacyAgreed"
                                        checked={bookingData.privacyAgreed}
                                        onChange={handleBookingChange}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                    Tôi đã đọc và hiểu{" "}
                                        <a href="#" className="text-blue-600 hover:text-blue-800 underline">
                      chính sách bảo mật
                    </a>
                  </span>
                                </label>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={handleSubmitBooking}
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    disabled={
                                        !bookingData.startDate ||
                                        !bookingData.endDate ||
                                        !bookingData.pickupLocation ||
                                        !bookingData.dropoffLocation ||
                                        !bookingData.termsAgreed ||
                                        !bookingData.privacyAgreed
                                    }
                                >
                                    <div className="flex items-center justify-center">
                                        <FaCalendarAlt className="mr-2" />
                                        Đặt xe ngay
                                    </div>
                                </button>
                                <button className="w-full border-2 border-blue-600 text-blue-600 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 flex items-center justify-center">
                                    <FaComments className="mr-2" />
                                    Liên hệ chủ xe
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add new sections for additional data */}
                {additionalServices.length > 0 && (
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl mb-8 border border-gray-100">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                            Dịch vụ bổ sung
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {additionalServices.map((service, index) => (
                                <div key={index} className="flex items-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-4">
                                        <FaCheck />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-800">{service.name}</div>
                                        <div className="text-sm text-gray-600">{service.description}</div>
                                        <div className="text-sm font-medium text-blue-600">{service.price.toLocaleString()}đ</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {rentalHistory.length > 0 && (
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl mb-8 border border-gray-100">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                            Lịch sử thuê xe
                        </h2>
                        <div className="space-y-4">
                            {rentalHistory.map((rental, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                                    <div>
                                        <div className="font-medium text-gray-800">
                                            {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                                        </div>
                                        <div className="text-sm text-gray-600">{rental.status}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-gray-800">{rental.totalPrice.toLocaleString()}đ</div>
                                        <div className="text-sm text-gray-600">{rental.duration} ngày</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Gallery Modal */}
            {showGalleryModal && <GalleryModal />}
            {/* Similar Cars - đặt trong cùng container với phần trên */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 mt-16 mb-8">
                <div className="px-4 py-8">
                    {similarCars.length > 0 ? (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Xe tương tự
                                </h2>
                                <Link to="/search" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                                    Xem tất cả
                                    <FaArrowRight className="ml-2" />
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {similarCars.map((car) => (
                                    <div
                                        key={car.carId}
                                        className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                                    >
                                        <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => navigate(`/cars/${car.carId}`)}>
                                            <img
                                                src={car.images && car.images.length > 0 ? (car.images.find(img => img.isMain)?.imageUrl || car.images[0].imageUrl) : "https://via.placeholder.com/300x200"}
                                                alt={car.model}
                                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                                            />
                                            <div className="absolute top-3 right-3">
                                                <button className="w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors">
                                                    <FaHeart />
                                                </button>
                                            </div>
                                            <div className="absolute bottom-3 left-3">
                                                <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-gray-800">
                                                    {car.rentalCount || 0} lượt thuê
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-lg mb-2 text-gray-800">{car.model}</h3>
                                            <div className="flex items-center text-sm text-gray-600 mb-3">
                                                <StarRating rating={car.averageRating || 4.8} />
                                                <span className="ml-2">{car.averageRating || 4.8}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                        {(car.dailyRate / 1000).toFixed(0)}K
                                                    </div>
                                                    <div className="text-xs text-gray-500">/ ngày</div>
                                                </div>
                                                <Link
                                                    to={`/cars/${car.carId}`}
                                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105"
                                                >
                                                    Xem chi tiết
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-gray-400">Không có xe tương tự để hiển thị.</div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default CarDetailPage
