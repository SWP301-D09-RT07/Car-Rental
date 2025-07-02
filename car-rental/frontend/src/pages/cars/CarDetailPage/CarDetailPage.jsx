"use client"

import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { getCarById, getRatingsByCarId, createBooking, post, searchCars, getRatingSummaryByCarId } from "@/services/api.js"
import {
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
  FaBullseye,
  FaMapPin,
  FaSun,
  FaUsb,
  FaMusic,
  FaCar,
  FaImages,
} from "react-icons/fa"
import { toast } from "react-toastify"
import { useAuth } from "@/hooks/useAuth.js"
import Header from '@/components/layout/Header/Header';
import Footer from '@/components/layout/Footer/Footer';
import TestimonialCarousel from '../../../components/Rating/TestimonialCarousel';

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
    "Cảm biến lùi": <FaBullseye />,
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
  const { isAuthenticated,user } = useAuth()
  const [car, setCar] = useState(null)
  const [ratings, setRatings] = useState([])
  const [similarCars, setSimilarCars] = useState([])
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
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [carRatings, setCarRatings] = useState([])
  const [ratingSummary, setRatingSummary] = useState([])
  const [calculatedRating, setCalculatedRating] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const carData = await getCarById(carId)
        setCar(carData)

        // Fetch ratings for this car
        const ratingsResponse = await getRatingsByCarId(carId)
        setCarRatings(ratingsResponse)

        // Fetch rating summary
        const summaryResponse = await getRatingSummaryByCarId(carId)
        setRatingSummary(summaryResponse)

        const ratingsPromise = isAuthenticated ? getRatingsByCarId(carId) : Promise.resolve([]);
        const similarCarsPromise = searchCars({
          brand: carData?.brandName,
          priceRange: `${carData?.dailyRate * 0.8}-${carData?.dailyRate * 1.2}`,
          excludeId: carId,
          size: 4,
        });

        const [ratingsResult, similarCarsResult] = await Promise.allSettled([
          ratingsPromise,
          similarCarsPromise,
        ]);

        if (ratingsResult.status === 'fulfilled') {
          setRatings(ratingsResult.value);
        } else {
          console.error("Failed to fetch ratings:", ratingsResult.reason);
        }

        if (similarCarsResult.status === 'fulfilled') {
          setSimilarCars(similarCarsResult.value.content || []);
        } else {
          console.error("Failed to fetch similar cars:", similarCarsResult.reason);
        }
      } catch (err) {
        setError(err.message || "Không thể tải thông tin xe")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [carId, isAuthenticated])
  
  useEffect(() => {
  if (carRatings.length > 0) {
    const avgRating = carRatings.reduce((sum, r) => sum + r.ratingScore, 0) / carRatings.length
    setCalculatedRating(avgRating)
    
    // Cập nhật car object với rating mới tính
    if (car && (!car.averageRating || car.averageRating === 0)) {
      setCar(prev => ({
        ...prev,
        averageRating: avgRating
      }))
    }
  } else {
    setCalculatedRating(null)
  }
}, [carRatings, car])
  const [isAnonymous, setIsAnonymous] = useState(false)
  const getDisplayRating = () => {
  if (car?.averageRating && car?.averageRating > 0) {
    return car.averageRating
  }
  if (calculatedRating) {
    return calculatedRating
  }
  if (carRatings.length > 0) {
    return carRatings.reduce((sum, r) => sum + r.ratingScore, 0) / carRatings.length
  }
  return 0
}
  // Tìm hàm handleSubmitReview (khoảng dòng 250) và thay thế:
const handleSubmitReview = async () => {
  if (!rating || !comment.trim()) {
    toast.error("Vui lòng nhập đầy đủ đánh giá và bình luận")
    return
  }

  if (!isAuthenticated || !user) {
    toast.error("Bạn cần đăng nhập để đánh giá")
    return
  }

  try {
    const reviewData = {
      carId: Number(carId),
      customerId: user?.id || user?.userId, // Thử cả hai trường hợp
      ratingScore: rating,
      comment: comment.trim(),
      isAnonymous: isAnonymous,
      ratingDate: new Date().toISOString()
    }

    console.log('Submitting review data:', reviewData) // Debug log

    // Sử dụng createRating từ api.js
    const response = await post('/api/ratings', reviewData)

    toast.success("Đánh giá của bạn đã được gửi thành công!")

    // Reset form
    setRating(0)
    setComment("")
    setIsAnonymous(false)
    setShowReviewForm(false)

    // Refresh ratings
    const updatedRatings = await getRatingsByCarId(carId)
    setCarRatings(updatedRatings)

    // Refresh car data to get new average rating
    const updatedCar = await getCarById(carId)
    setCar(updatedCar)
  } catch (err) {
    console.error('Error submitting review:', err)
    toast.error(err.message || "Có lỗi xảy ra khi gửi đánh giá")
  }
}

  const handleBookingChange = (e) => {
    const { name, value, type, checked } = e.target
    setBookingData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmitBooking = async () => {
    if (
      !bookingData.startDate ||
      !bookingData.endDate ||
      !bookingData.pickupLocation ||
      !bookingData.dropoffLocation ||
      !bookingData.termsAgreed ||
      !bookingData.privacyAgreed
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin và đồng ý với các điều khoản.")
      return
    }
    try {
      await createBooking({
        carId,
        pickupLocation: bookingData.pickupLocation,
        dropoffLocation: bookingData.dropoffLocation,
        pickupDateTime: new Date(bookingData.startDate).toISOString(),
        dropoffDate: new Date(bookingData.endDate).toISOString(),
        delivery: bookingData.delivery,
      })
      navigate("/booking-confirmation", { state: { bookingData } })
      setError(null)
      toast.success("Đặt xe thành công!")
    } catch (err) {
      toast.error(err.message || "Không thể đặt xe")
    }
  }

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
    toast.success(isFavorite ? "Đã xóa khỏi danh sách yêu thích" : "Đã thêm vào danh sách yêu thích")
  }

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
              src={car?.images?.[modalImageIndex]?.imageUrl || "https://via.placeholder.com/800x450"}
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
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${modalImageIndex === idx ? "border-blue-500 scale-110" : "border-transparent opacity-60"
                  }`}
              >
                <img
                  src={img.imageUrl || "https://via.placeholder.com/100"}
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

  const mainImage = car.images?.[activeImageIndex] || car.images?.[0]
  const subImages = car.images?.filter((_, index) => index !== activeImageIndex) || []

  const FavoriteButton = ({ carId }) => {
    const [isFavorite, setIsFavorite] = useState(false)

    const toggleFavorite = () => {
      setIsFavorite(!isFavorite)
      toast.success(isFavorite ? "Đã xóa khỏi danh sách yêu thích" : "Đã thêm vào danh sách yêu thích")
    }

    return (
      <button
        onClick={toggleFavorite}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300 ${isFavorite
          ? "bg-red-100 text-red-500 hover:bg-red-50 hover:text-red-600"
          : "bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-500"
          } shadow-lg hover:scale-110`}
      >
        <FaHeart className="mx-auto" />
      </button>
    )
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
      <Header />
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

        {/* Enhanced Header Section */}
        <div className="mb-10">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 leading-tight">
                  {car.model} {car.year}
                </h1>

                {/* Enhanced Price Section */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
                  <div className="flex items-baseline gap-4 mb-2">
                    <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {(car.dailyRate / 1000).toFixed(0)}K
                    </div>
                    <div className="text-gray-500 text-lg line-through">{car.dailyRate?.toLocaleString()}đ</div>
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                      Tiết kiệm 15%
                    </div>
                  </div>
                  <div className="text-gray-600 text-sm font-medium">/ ngày • Giá đã bao gồm thuế và phí dịch vụ</div>
                </div>

                {/* Enhanced Info Row */}
                <div className="flex flex-wrap items-center gap-6 text-gray-600">
                  {car.averageRating && car.averageRating > 0 ? (
                    <div className="flex items-center bg-white rounded-xl px-4 py-2 shadow-md">
                      <StarRating rating={car.averageRating} />
                      <span className="ml-2 font-bold text-gray-800">{car.averageRating.toFixed(1)}</span>
                      <span className="ml-1 text-sm">/5.0</span>
                    </div>
                  ) : carRatings.length > 0 ? (
                    <div className="flex items-center bg-white rounded-xl px-4 py-2 shadow-md">
                      <StarRating rating={carRatings.reduce((sum, r) => sum + r.ratingScore, 0) / carRatings.length} />
                      <span className="ml-2 font-bold text-gray-800">
                        {(carRatings.reduce((sum, r) => sum + r.ratingScore, 0) / carRatings.length).toFixed(1)}
                      </span>
                      <span className="ml-1 text-sm">/5.0</span>
                    </div>
                  ) : null}

                  {carRatings.length > 0 && (
                    <div className="flex items-center bg-white rounded-xl px-4 py-2 shadow-md">
                      <FaComments className="mr-2 text-blue-500" />
                      <span className="font-medium">{carRatings.length} đánh giá</span>
                    </div>
                  )}

                  <div className="flex items-center bg-white rounded-xl px-4 py-2 shadow-md">
                    <FaMapMarkerAlt className="mr-2 text-red-500" />
                    <span className="font-medium">{car.location || "TP. Hồ Chí Minh"}</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex items-center gap-4 lg:flex-col lg:items-end">
                <div className="flex gap-3">
                  <FavoriteButton carId={carId} />
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-500 transition-all duration-300 shadow-lg hover:scale-110"
                  >
                    <FaShare />
                  </button>
                </div>

                {/* Quick Book Button for Desktop */}
                <button
                  onClick={() => setIsBookingModalOpen(true)}
                  className="hidden lg:flex bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-xl items-center"
                >
                  <FaCalendarAlt className="mr-2" />
                  Đặt xe ngay
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Section - Enhanced Version */}
        <div className="mb-12">
          <div className="relative">
            {/* Desktop Gallery Layout */}
            <div className="hidden md:grid grid-cols-12 gap-4 h-[500px] rounded-3xl overflow-hidden shadow-2xl">
              {/* Main Image - Takes 8 columns */}
              <div
                className="col-span-8 relative group cursor-pointer overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200"
                onClick={() => setShowGalleryModal(true)}
              >
                <img
                  src={mainImage?.imageUrl || "https://via.placeholder.com/800x500"}
                  alt={car.model + " Main Image"}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                />
                {/* Enhanced Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <div className="absolute bottom-8 left-8 right-8">
                    <button className="bg-white/95 backdrop-blur-md text-gray-800 px-8 py-4 rounded-2xl font-bold hover:bg-white transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 hover:scale-105">
                      <FaImages className="inline mr-3 text-lg" />
                      Xem tất cả {car.images?.length || 5} ảnh
                    </button>
                  </div>
                  {/* Enhanced Image counter */}
                  <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold border border-white/20">
                    {activeImageIndex + 1} / {car.images?.length || 5}
                  </div>
                </div>

                {/* Enhanced Navigation arrows */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    prevImage()
                  }}
                  className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/30 hover:bg-white/60 backdrop-blur-md rounded-full p-4 text-white transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-125 shadow-lg"
                >
                  <FaChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    nextImage()
                  }}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/30 hover:bg-white/60 backdrop-blur-md rounded-full p-4 text-white transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-125 shadow-lg"
                >
                  <FaChevronRight size={20} />
                </button>
              </div>

              {/* Side Images Grid - Takes 4 columns */}
              <div className="col-span-4 grid grid-rows-2 gap-4 h-full">
                {subImages.slice(0, 2).map((img, index) => (
                  <div
                    key={index}
                    className="relative group cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-xl hover:shadow-2xl transition-all duration-500 h-[240px]"
                    onClick={() => setShowGalleryModal(true)}
                  >
                    <img
                      src={img.imageUrl || "https://via.placeholder.com/400x240"}
                      alt={car.model + " Image " + (index + 2)}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Enhanced overlay for last image */}
                    {index === 1 && car.images?.length > 3 && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="text-2xl font-bold mb-1">+{car.images.length - 3}</div>
                          <div className="text-sm opacity-90 font-medium">ảnh khác</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Mobile Gallery Layout */}
            <div className="md:hidden">
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-100 to-gray-200">
                <img
                  src={car.images?.[activeImageIndex]?.imageUrl || "https://via.placeholder.com/400x300"}
                  alt={car.model + " Image " + (activeImageIndex + 1)}
                  className="w-full h-full object-cover"
                />

                {/* Enhanced Mobile overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                    <button
                      onClick={() => setShowGalleryModal(true)}
                      className="bg-white/95 backdrop-blur-md text-gray-800 px-6 py-3 rounded-xl font-bold text-sm hover:bg-white transition-all duration-300 shadow-lg"
                    >
                      <FaImages className="inline mr-2" />
                      Xem tất cả
                    </button>
                    <div className="bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold">
                      {activeImageIndex + 1}/{car.images?.length || 5}
                    </div>
                  </div>
                </div>

                {/* Enhanced Mobile navigation */}
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/40 hover:bg-white/70 backdrop-blur-md rounded-full p-3 text-white transition-all duration-300 shadow-lg"
                >
                  <FaChevronLeft size={18} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/40 hover:bg-white/70 backdrop-blur-md rounded-full p-3 text-white transition-all duration-300 shadow-lg"
                >
                  <FaChevronRight size={18} />
                </button>
              </div>

              {/* Enhanced Mobile Thumbnails */}
              <div className="flex gap-3 mt-6 overflow-x-auto pb-3 px-1">
                {car.images?.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-16 rounded-xl overflow-hidden border-3 transition-all duration-300 ${activeImageIndex === idx
                      ? "border-blue-500 shadow-xl scale-110 ring-2 ring-blue-200"
                      : "border-transparent opacity-70 hover:opacity-100 hover:scale-105"
                      }`}
                  >
                    <img
                      src={img.imageUrl || "https://via.placeholder.com/80x64"}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* Enhanced Mobile Dots Indicator */}
              <div className="flex justify-center mt-4 gap-2">
                {car.images?.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${activeImageIndex === idx
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 w-10 shadow-lg"
                      : "bg-gray-300 w-2 hover:bg-gray-400"
                      }`}
                  ></button>
                ))}
              </div>
            </div>

            {/* Enhanced Floating Gallery Stats */}
            <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-md rounded-2xl px-6 py-3 shadow-xl border border-white/30">
              <div className="flex items-center gap-3 text-sm">
                <FaCamera className="text-blue-500 text-lg" />
                <span className="font-bold text-gray-700">{car.images?.length || 5} ảnh</span>
              </div>
            </div>

            {/* Enhanced Quick Action Buttons */}
            <div className="absolute top-6 right-6 flex gap-3">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-1 shadow-xl">
                <FavoriteButton carId={carId} />
              </div>
              <button
                onClick={handleShare}
                className="w-12 h-12 rounded-2xl bg-white/95 backdrop-blur-md text-gray-600 hover:bg-blue-50 hover:text-blue-500 transition-all duration-300 shadow-xl hover:scale-110"
              >
                <FaShare className="mx-auto" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column */}
          <div className="w-full lg:w-2/3">
            {/* Price Tag for Mobile */}
            <div className="lg:hidden bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {(car.dailyRate / 1000).toFixed(0)}K
                  </div>
                  <div className="text-gray-500 text-sm">/ ngày</div>
                </div>
                <div className="text-right">
                  <div className="text-gray-500 text-sm line-through">{car.dailyRate?.toLocaleString()}đ giá gốc</div>
                  <div className="text-green-600 text-sm font-medium">Tiết kiệm 15%</div>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center shadow-lg">
                  <FaCalendarAlt className="mr-2" />
                  Đặt xe ngay
                </button>
                <button className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all">
                  <FaComments className="text-xl" />
                </button>
              </div>
            </div>

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
                  <div className="font-semibold text-gray-800">{car.numOfSeats || 5} chỗ</div>
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
                  <div className="font-semibold text-gray-800">{car.fuelTypeName || "8L/100km"}</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl mb-8 border border-gray-100">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                Mô tả
              </h2>
              <div className="prose prose-blue max-w-none text-gray-700">
                <p>{car.describe || "Không có mô tả chi tiết cho xe này."}</p>
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

            {/* Reviews - Gộp thành 1 phần duy nhất */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl mb-8 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Đánh giá từ khách hàng
                </h2>
              </div>

              {carRatings.length > 0 ? (
                <>
                  {/* Rating Summary */}
                  <div className="flex flex-col md:flex-row gap-6 mb-8">
                    <div className="md:w-1/3 bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl text-center">
                      <div className="text-5xl font-bold text-gray-800 mb-2">
                        {car.averageRating && car.averageRating > 0
                          ? car.averageRating.toFixed(1)
                          : carRatings.length > 0
                            ? (carRatings.reduce((sum, r) => sum + r.ratingScore, 0) / carRatings.length).toFixed(1)
                            : "Chưa có"
                        }
                      </div>
                      <div className="flex justify-center mb-2">
                        <StarRating rating={
                          car.averageRating && car.averageRating > 0
                            ? car.averageRating
                            : carRatings.length > 0
                              ? carRatings.reduce((sum, r) => sum + r.ratingScore, 0) / carRatings.length
                              : 0
                        } size="medium" />
                      </div>
                      <div className="text-gray-600">{carRatings.length} đánh giá</div>
                    </div>

                    <div className="md:w-2/3">
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = carRatings.filter((r) => Math.round(r.ratingScore) === star).length
                          const percentage = carRatings.length > 0 ? (count / carRatings.length) * 100 : 0

                          return (
                            <div key={star} className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-600 w-12">{star} sao</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-500 w-12">{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Reviews Carousel - Luôn hiển thị */}
                  <div className="mb-8">
  {/* <div className="flex justify-between items-center mb-6">
    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
      Đánh giá từ khách hàng ({carRatings.length})
    </h3>
    
    Quick stats
    <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
      <div className="flex items-center">
        <FaStar className="text-yellow-400 mr-1" />
        <span>Trung bình: {getDisplayRating().toFixed(1)}/5</span>
      </div>
      <div>
        {carRatings.filter(r => r.ratingScore >= 4).length} đánh giá tích cực
      </div>
    </div>
  </div> */}
  
  <TestimonialCarousel carId={carId} 
  ratings={carRatings} 
  loading={loading}  
  error={error} />
</div>

{/* Enhanced View All Button */}
{carRatings.length > 6 && (
  <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
    <p className="text-gray-600 mb-4">
      Còn {carRatings.length - 6} đánh giá khác từ khách hàng
    </p>
    <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg">
      Xem tất cả {carRatings.length} đánh giá
      <FaArrowRight className="ml-2 inline" />
    </button>
  </div>
)}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaComments className="text-gray-400 text-2xl" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Chưa có đánh giá nào</h3>
                  <p className="text-gray-600 mb-6">Xe này chưa có đánh giá từ khách hàng</p>
                </div>
              )}
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
            {/* Enhanced Booking Widget */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl sticky top-6 border border-white/50 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Đặt thuê xe ngay
                </h2>
                <p className="text-gray-600 text-sm">Hoàn thành đặt xe chỉ trong vài phút</p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-6 text-center border border-red-200 shadow-sm">
                  {error}
                </div>
              )}

              {/* Enhanced Form Fields */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-700">Thời gian nhận xe</label>
                  <div className="relative">
                    <div className="flex items-center border-2 border-gray-200 rounded-2xl p-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 bg-white transition-all duration-300">
                      <FaCalendarAlt className="text-blue-500 mr-3 text-lg" />
                      <input
                        type="datetime-local"
                        name="startDate"
                        value={bookingData.startDate}
                        onChange={handleBookingChange}
                        className="w-full border-none text-gray-700 focus:outline-none font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-700">Thời gian trả xe</label>
                  <div className="relative">
                    <div className="flex items-center border-2 border-gray-200 rounded-2xl p-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 bg-white transition-all duration-300">
                      <FaCalendarAlt className="text-purple-500 mr-3 text-lg" />
                      <input
                        type="datetime-local"
                        name="endDate"
                        value={bookingData.endDate}
                        onChange={handleBookingChange}
                        className="w-full border-none text-gray-700 focus:outline-none font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Enhanced Location Selects */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Địa điểm nhận xe</label>
                    <div className="relative">
                      <select
                        name="pickupLocation"
                        value={bookingData.pickupLocation}
                        onChange={handleBookingChange}
                        className="w-full border-2 border-gray-200 rounded-2xl p-4 pr-12 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 appearance-none bg-white font-medium transition-all duration-300"
                      >
                        <option value="">Chọn địa điểm nhận xe</option>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="TP.HCM">TP. Hồ Chí Minh</option>
                        <option value="Đà Nẵng">Đà Nẵng</option>
                        <option value="Nha Trang">Nha Trang</option>
                        <option value="Đà Lạt">Đà Lạt</option>
                      </select>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <FaChevronDown className="text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Địa điểm trả xe</label>
                    <div className="relative">
                      <select
                        name="dropoffLocation"
                        value={bookingData.dropoffLocation}
                        onChange={handleBookingChange}
                        className="w-full border-2 border-gray-200 rounded-2xl p-4 pr-12 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 appearance-none bg-white font-medium transition-all duration-300"
                      >
                        <option value="">Chọn địa điểm trả xe</option>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="TP.HCM">TP. Hồ Chí Minh</option>
                        <option value="Đà Nẵng">Đà Nẵng</option>
                        <option value="Nha Trang">Nha Trang</option>
                        <option value="Đà Lạt">Đà Lạt</option>
                      </select>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <FaChevronDown className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Delivery Option */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="delivery"
                      checked={bookingData.delivery}
                      onChange={handleBookingChange}
                      className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="ml-3 text-sm font-bold text-gray-700">
                      Giao xe tận nơi
                      <span className="text-blue-600 ml-1">(+100.000đ)</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Enhanced Price Breakdown */}
              <div className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">Chi tiết giá</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Giá thuê ({rentalDays} ngày)</span>
                    <span className="font-bold text-gray-800">{(rentalPrice * rentalDays).toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Phí giao xe</span>
                    <span className="font-bold text-gray-800">{deliveryFee.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Phí dịch vụ</span>
                    <span className="font-bold text-gray-800">{serviceFee.toLocaleString()}đ</span>
                  </div>
                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-gray-900 text-xl">Tổng cộng</span>
                      <span className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {totalPrice.toLocaleString()}đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Terms */}
              <div className="mt-6 space-y-3">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    name="termsAgreed"
                    checked={bookingData.termsAgreed}
                    onChange={handleBookingChange}
                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-0.5"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    Tôi đồng ý với{" "}
                    <a href="#" className="text-blue-600 hover:text-blue-800 underline font-medium">
                      điều khoản dịch vụ
                    </a>
                  </span>
                </label>
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    name="privacyAgreed"
                    checked={bookingData.privacyAgreed}
                    onChange={handleBookingChange}
                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-0.5"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    Tôi đã đọc và hiểu{" "}
                    <a href="#" className="text-blue-600 hover:text-blue-800 underline font-medium">
                      chính sách bảo mật
                    </a>
                  </span>
                </label>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="mt-8 space-y-4">
                <button
                  onClick={() => setIsBookingModalOpen(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-5 rounded-2xl font-black text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="flex items-center justify-center">
                    <FaCalendarAlt className="mr-3 text-xl" />
                    Đặt xe ngay
                  </div>
                </button>
                <button className="w-full border-3 border-blue-600 text-blue-600 py-4 rounded-2xl font-bold hover:bg-blue-50 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl">
                  <FaComments className="mr-2" />
                  Liên hệ chủ xe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Cars */}
        <div className="mt-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Xe tương tự
            </h2>
            <Link to="/search" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
              Xem tất cả
              <FaArrowRight className="ml-2" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarCars.map((similarCar) => (
              <div
                key={similarCar.id}
                className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={similarCar.images?.[0]?.imageUrl || "https://via.placeholder.com/300x200"}
                    alt={similarCar.model}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                  <div className="absolute top-3 right-3">
                    <button className="w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors">
                      <FaHeart />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-gray-800">
                      {similarCar.rentalCount || 15} lượt thuê
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 text-gray-800">{similarCar.model}</h3>
                  {similarCar.averageRating && similarCar.averageRating > 0 && (
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <StarRating rating={similarCar.averageRating} />
                      <span className="ml-2">{similarCar.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {(similarCar.dailyRate / 1000).toFixed(0)}K
                      </div>
                      <div className="text-xs text-gray-500">/ ngày</div>
                    </div>
                    <Link
                      to={`/cars/${similarCar.carId}`}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      {showGalleryModal && <GalleryModal />}
      <Footer />
    </div>
  )
}

export default CarDetailPage
