"use client"

import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { getCarById, post, createBooking, ensureBookingFinancials } from "@/services/api"
import {
  FaCarSide,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaShieldAlt,
  FaFileAlt,
  FaInfoCircle,
  FaCheck,
  FaArrowLeft,
  FaStar,
  FaChevronDown,
  FaChevronUp,
  FaCreditCard,
  FaUniversity,
  FaHandHoldingUsd,
  FaGift,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaLock,
  FaHeadset,
  FaUndoAlt,
} from "react-icons/fa"
import { toast } from "react-toastify"
import { useAuth } from '@/hooks/useAuth'

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

// Progress Steps Component
const ProgressSteps = ({ currentStep = 2 }) => {
  const steps = [
    { id: 1, name: "Chọn xe", icon: FaCarSide },
    { id: 2, name: "Xác nhận", icon: FaFileAlt },
    { id: 3, name: "Thanh toán", icon: FaCreditCard },
    { id: 4, name: "Hoàn tất", icon: FaCheckCircle },
  ]

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = step.id === currentStep
          const isCompleted = step.id < currentStep
          const isUpcoming = step.id > currentStep

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                      : isActive
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                        : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {isCompleted ? <FaCheck /> : <Icon />}
                </div>
                <div
                  className={`mt-2 text-sm font-medium ${
                    isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {step.name}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 rounded-full transition-all duration-300 ${
                    isCompleted ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gray-200"
                  }`}
                ></div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Enhanced Error Message Component
const ErrorMessage = ({ message, type = "error", onClose }) => {
  const typeStyles = {
    error: "from-red-50 to-pink-50 border-red-200 text-red-700",
    warning: "from-yellow-50 to-orange-50 border-yellow-200 text-yellow-700",
    success: "from-green-50 to-emerald-50 border-green-200 text-green-700",
    info: "from-blue-50 to-purple-50 border-blue-200 text-blue-700",
  }

  const typeIcons = {
    error: FaTimesCircle,
    warning: FaExclamationTriangle,
    success: FaCheckCircle,
    info: FaInfoCircle,
  }

  const Icon = typeIcons[type]

  return (
    <div
      className={`bg-gradient-to-r ${typeStyles[type]} border px-4 py-3 rounded-xl shadow-sm mb-4 animate-in slide-in-from-top duration-300`}
    >
      <div className="flex items-center">
        <Icon className="mr-3 flex-shrink-0" />
        <span className="flex-1">{message}</span>
        {onClose && (
          <button onClick={onClose} className="ml-3 hover:opacity-70 transition-opacity">
            <FaTimesCircle />
          </button>
        )}
      </div>
    </div>
  )
}

// Form Input Component
const FormInput = ({ label, icon: Icon, required, error, ...props }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        className={`flex items-center border-2 rounded-xl p-3 transition-all duration-300 bg-white ${
          error
            ? "border-red-300 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-200"
            : "border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200"
        }`}
      >
        {Icon && <Icon className="text-gray-400 mr-3 flex-shrink-0" />}
        <input
          {...props}
          className="w-full border-none text-gray-700 focus:outline-none focus:ring-0 placeholder-gray-400"
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}

// Payment Method Card Component
const PaymentMethodCard = ({ method, selected, onSelect, icon: Icon, title, description, badge }) => {
  return (
    <label
      className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md ${
        selected
          ? "border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-md"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <input
        type="radio"
        name="payment-method"
        value={method}
        checked={selected}
        onChange={() => onSelect(method)}
        className="sr-only peer"
      />
      <div
        className={`w-12 h-12 flex items-center justify-center rounded-full mr-4 ${
          selected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
        }`}
      >
        <Icon className="text-xl" />
      </div>
      <div className="flex-1">
        <div className="flex items-center">
          <div className="font-semibold text-gray-800">{title}</div>
          {badge && (
            <span className="ml-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-1 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          selected ? "border-blue-500 bg-blue-500" : "border-gray-300"
        }`}
      >
        {selected && <div className="w-2 h-2 bg-white rounded-full"></div>}
      </div>
    </label>
  )
}

const BookingConfirmationPage = () => {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { bookingData } = location.state || {}
  const [car, setCar] = useState(null)
  const [promoCode, setPromoCode] = useState("")
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)
  const [showTermsDetails, setShowTermsDetails] = useState(false)
  const [contactInfo, setContactInfo] = useState({
    fullName: "",
    phone: "",
    email: "",
    pickupAddress: "",
    dropoffAddress: "",
  })
  const [contactErrors, setContactErrors] = useState({})
  const [withDriver, setWithDriver] = useState(false)
  const [deliveryRequested, setDeliveryRequested] = useState(false)
  const [priceBreakdown, setPriceBreakdown] = useState({
    basePrice: 0,
    extraFee: 0,
    serviceFee: 0,
    tax: 0,
    discount: 0,
    total: 0,
    deposit: 0,
  })

  // Load saved form data from localStorage
  const loadSavedFormData = () => {
    try {
      const savedData = localStorage.getItem('bookingFormData')
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        setContactInfo(prev => ({
          ...prev,
          ...parsedData
        }))
        if (parsedData.withDriver !== undefined) {
          setWithDriver(parsedData.withDriver)
        }
        if (parsedData.deliveryRequested !== undefined) {
          setDeliveryRequested(parsedData.deliveryRequested)
        }
      }
    } catch (error) {
      console.error('Error loading saved form data:', error)
    }
  }

  // Save form data to localStorage
  const saveFormData = (data) => {
    try {
      localStorage.setItem('bookingFormData', JSON.stringify(data))
    } catch (error) {
      console.error('Error saving form data:', error)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    // Auto-fill user information
    if (user) {
      setContactInfo(prev => ({
        ...prev,
        fullName: user.fullName || user.username || "",
        phone: user.phone || "",
        email: user.email || "",
      }))
    }

    // Load saved form data
    loadSavedFormData()
  }, [isAuthenticated, navigate, user])

  useEffect(() => {
    if (!bookingData) {
      setError("Không có thông tin đặt xe. Vui lòng quay lại trang tìm kiếm.")
      setTimeout(() => navigate("/search"), 3000)
      return
    }

    const fetchCar = async () => {
      try {
        setIsLoading(true)
        if (bookingData.car) {
          setCar(bookingData.car)
          calculatePrice(bookingData.car.dailyRate || bookingData.car.daily_rate)
        } else {
          const carData = await getCarById(bookingData.carId)
          setCar(carData)
          calculatePrice(carData.dailyRate || carData.daily_rate)
        }
      } catch (err) {
        setError("Không thể tải thông tin xe. Vui lòng thử lại.")
        toast.error("Không thể tải thông tin xe")
      } finally {
        setIsLoading(false)
      }
    }
    fetchCar()
  }, [bookingData, navigate, withDriver, deliveryRequested])

  const calculatePrice = (dailyRate) => {
    if (!bookingData || !dailyRate) return

    try {
      const start = new Date(bookingData.pickupDateTime)
      const end = new Date(bookingData.dropoffDateTime)
      if (isNaN(start) || isNaN(end)) {
        throw new Error("Ngày không hợp lệ")
      }

      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1
      const basePrice = dailyRate * days
      
      // Tính phí dịch vụ
      let extraFee = 0
      if (withDriver) {
        extraFee += 300000 * days // 300,000 VND/ngày cho tài xế
      }
      if (deliveryRequested) {
        extraFee += 100000 // 100,000 VND phí giao xe
      }
      
      const serviceFee = Math.round(basePrice * 0.1) // 10% service fee
      const tax = Math.round(basePrice * 0.1) // 10% VAT
      const total = basePrice + extraFee + serviceFee + tax
      const deposit = Math.round(total * 0.3) // 30% deposit

      setPriceBreakdown({
        basePrice,
        extraFee,
        serviceFee,
        tax,
        discount: 0,
        total,
        deposit,
      })
    } catch (err) {
      setError("Lỗi khi tính giá. Vui lòng thử lại.")
      toast.error("Lỗi khi tính giá")
    }
  }

  const validateContactInfo = () => {
    const errors = {}
    if (!contactInfo.fullName.trim()) errors.fullName = "Vui lòng nhập họ và tên"
    if (!contactInfo.phone.trim()) errors.phone = "Vui lòng nhập số điện thoại"
    else if (!/^[0-9]{10,11}$/.test(contactInfo.phone.replace(/\s/g, ""))) {
      errors.phone = "Số điện thoại không hợp lệ"
    }
    if (!contactInfo.email.trim()) errors.email = "Vui lòng nhập email"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email)) {
      errors.email = "Email không hợp lệ"
    }
    if (!contactInfo.pickupAddress.trim()) errors.pickupAddress = "Vui lòng nhập địa chỉ nhận xe"
    if (!contactInfo.dropoffAddress.trim()) errors.dropoffAddress = "Vui lòng nhập địa chỉ trả xe"

    setContactErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error("Vui lòng nhập mã giảm giá")
      return
    }
    try {
      setIsApplyingPromo(true)
      const response = await post("/api/promotions/apply", { promoCode })
      const discountPercentage = response?.discount_percentage || 0
      if (!discountPercentage) {
        throw new Error("Mã giảm giá không hợp lệ")
      }
      const discount = Math.round(priceBreakdown.basePrice * (discountPercentage / 100))
      const newTotal =
        priceBreakdown.basePrice + priceBreakdown.extraFee + priceBreakdown.serviceFee + priceBreakdown.tax - discount
      const newDeposit = Math.round(newTotal * 0.3)
      setPriceBreakdown((prev) => ({
        ...prev,
        discount,
        total: newTotal,
        deposit: newDeposit,
      }))
      setError(null)
      toast.success(`Áp dụng mã giảm giá thành công! Giảm ${discountPercentage}%`)
    } catch (err) {
      toast.error(err.message || "Mã giảm giá không hợp lệ")
    } finally {
      setIsApplyingPromo(false)
    }
  }

  const handleConfirm = async () => {
    console.log('[BookingConfirm] Bắt đầu handleConfirm', { bookingData, contactInfo, priceBreakdown, withDriver, deliveryRequested });
    console.log('[BookingConfirm] Auth state before createBooking:');
    console.log('[BookingConfirm] - Token:', localStorage.getItem('token') ? 'Có' : 'Không có');
    console.log('[BookingConfirm] - Username:', localStorage.getItem('username'));
    console.log('[BookingConfirm] - Role:', localStorage.getItem('role'));
    console.log('[BookingConfirm] - ExpiresAt:', localStorage.getItem('expiresAt'));
    
    if (!validateContactInfo()) {
      toast.error("Vui lòng điền đầy đủ thông tin liên hệ")
      return
    }
    if (!agreeTerms) {
      toast.error("Vui lòng đồng ý với điều khoản")
      return
    }
    try {
      setIsLoading(true)
      // Save form data for next time
      saveFormData({
        fullName: contactInfo.fullName,
        phone: contactInfo.phone,
        email: contactInfo.email,
        pickupAddress: contactInfo.pickupAddress,
        dropoffAddress: contactInfo.dropoffAddress,
        withDriver: withDriver,
        deliveryRequested: deliveryRequested,

      })
      
      const bookingPayload = {
        carId: bookingData.carId,
        pickupLocation: contactInfo.pickupAddress,
        dropoffLocation: contactInfo.dropoffAddress,
        pickupDateTime: bookingData.pickupDateTime,
        dropoffDateTime: bookingData.dropoffDateTime,
        withDriver: withDriver,
        deliveryRequested: deliveryRequested,
        seatNumber: car?.numOfSeats
      };
      
      console.log('[BookingConfirm] Gọi createBooking với:', bookingPayload);
      console.log('[BookingConfirm] Token:', localStorage.getItem('token') ? 'Có' : 'Không có');
      console.log('[BookingConfirm] Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:8080');
      
      const bookingResponse = await createBooking(bookingPayload)
      console.log('[BookingConfirm] bookingResponse:', bookingResponse);
      
      console.log('[BookingConfirm] Auth state after createBooking:');
      console.log('[BookingConfirm] - Token:', localStorage.getItem('token') ? 'Có' : 'Không có');
      console.log('[BookingConfirm] - Username:', localStorage.getItem('username'));
      console.log('[BookingConfirm] - Role:', localStorage.getItem('role'));
      console.log('[BookingConfirm] - ExpiresAt:', localStorage.getItem('expiresAt'));
      
      if (!bookingResponse || !bookingResponse.bookingId) {
        throw new Error("Không nhận được ID đặt xe từ server")
      }
      
      console.log('[BookingConfirm] Gọi ensureBookingFinancials với bookingId:', bookingResponse.bookingId);
      // Tạm thời comment out để test
      // ensureBookingFinancials(bookingResponse.bookingId)
      //   .then(res => console.log('[BookingConfirm] ensureBookingFinancials thành công:', res))
      //   .catch(err => console.warn('[BookingConfirm] ensureBookingFinancials lỗi:', err));
      
      localStorage.setItem('lastBookingId', bookingResponse.bookingId);
      localStorage.setItem('lastPriceBreakdown', JSON.stringify(priceBreakdown));
      toast.success("Xác nhận đặt xe thành công!");
      
      const navigationData = {
        bookingId: bookingResponse.bookingId, 
        priceBreakdown,
        depositAmount: priceBreakdown.deposit,
        collateralAmount: 5000000,
        withDriver,
        deliveryRequested,
        customerInfo: { ...contactInfo }
      };
      
      console.log('[BookingConfirm] Chuyển sang /payment với:', navigationData);
      console.log('[BookingConfirm] Auth state before navigate:');
      console.log('[BookingConfirm] - Token:', localStorage.getItem('token') ? 'Có' : 'Không có');
      console.log('[BookingConfirm] - Username:', localStorage.getItem('username'));
      console.log('[BookingConfirm] - Role:', localStorage.getItem('role'));
      console.log('[BookingConfirm] - ExpiresAt:', localStorage.getItem('expiresAt'));
      
      navigate("/payment", { state: navigationData });
      console.log('[BookingConfirm] Đã gọi navigate sang /payment');
    } catch (err) {
      console.error('[BookingConfirm] Lỗi trong handleConfirm:', err);
      console.error('[BookingConfirm] Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText
      });
      
      console.log('[BookingConfirm] Auth state after error:');
      console.log('[BookingConfirm] - Token:', localStorage.getItem('token') ? 'Có' : 'Không có');
      console.log('[BookingConfirm] - Username:', localStorage.getItem('username'));
      console.log('[BookingConfirm] - Role:', localStorage.getItem('role'));
      console.log('[BookingConfirm] - ExpiresAt:', localStorage.getItem('expiresAt'));
      
      if (err.response?.status === 400) {
        const message = err.response?.data?.message || "Dữ liệu không hợp lệ"
        toast.error(message)
        return
      }
      if (err.response?.status === 401) {
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.")
        navigate('/login')
        return
      }
      if (err.response?.status === 403) {
        toast.error("Bạn không có quyền thực hiện hành động này. Vui lòng đăng nhập lại.")
        navigate('/login')
        return
      }
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        toast.error("Kết nối đến server bị timeout. Vui lòng kiểm tra kết nối mạng và thử lại.")
        return
      }
      if (!err.response) {
        toast.error("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.")
        return
      }
      toast.error(err.message || "Không thể đặt xe. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleContactInfoChange = (e) => {
    const { name, value } = e.target
    setContactInfo((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (contactErrors[name]) {
      setContactErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center max-w-lg">
          <div className="mb-6">
            <div className="bg-red-100 p-6 rounded-full inline-block">
              <FaExclamationTriangle className="text-4xl text-red-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không có thông tin đặt xe</h2>
          <p className="text-gray-600 mb-6">Vui lòng quay lại trang tìm kiếm để chọn xe.</p>
          <Link
            to="/search"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-8 rounded-xl font-semibold transition-all duration-300 inline-block"
          >
            Quay lại tìm kiếm
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading && !car) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl inline-block shadow-2xl">
              <FaCarSide className="text-4xl text-white animate-bounce" />
            </div>
          </div>
          <LoadingSpinner size="large" />
          <p className="mt-6 text-gray-700 text-lg font-medium">Đang tải thông tin đặt xe...</p>
          <p className="mt-2 text-gray-500">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    )
  }

  // Calculate rental duration
  const startDate = new Date(bookingData.pickupDateTime)
  const endDate = new Date(bookingData.dropoffDateTime)
  const rentalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1

  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/search" className="flex items-center text-gray-700 hover:text-blue-600 transition-colors group">
              <div className="w-10 h-10 flex items-center justify-center mr-3 bg-gray-100 rounded-full group-hover:bg-blue-100 transition-colors">
                <FaArrowLeft />
              </div>
              <span className="font-medium">Quay lại trang xe</span>
            </Link>
            <div className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              RentCar
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <ProgressSteps currentStep={2} />

        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8 text-center">
          Xác nhận đặt xe
        </h1>

        {error && <ErrorMessage message={error} type="error" onClose={() => setError(null)} />}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Form */}
          <div className="w-full lg:w-2/3">
            {/* Car Information Summary */}
            {car && (
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl mb-8 border border-gray-100">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                  Thông tin xe đã chọn
                </h2>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/3">
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                      <img
                        src={car.images?.[0]?.url || car.image || "/placeholder.svg?height=200&width=300"}
                        alt={`Xe ${car.model}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-gray-800">
                          {(car.rentalCount ?? car.rental_count ?? 0)} lượt thuê
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-2/3">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{car.model}</h3>
                    <div className="flex items-center text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={`${
                              i < Math.floor(car.averageRating || 5) ? "text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="ml-2">{car.averageRating || 5.0}/5.0</span>
                      </div>
                      <span className="mx-2">•</span>
                      <span>{(car.rentalCount ?? car.rental_count ?? 0)} lượt thuê</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                          <FaCalendarAlt />
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Nhận xe</div>
                          <div className="font-semibold text-gray-800">
                            {new Date(bookingData.pickupDateTime).toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mr-3">
                          <FaCalendarAlt />
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Trả xe</div>
                          <div className="font-semibold text-gray-800">
                            {new Date(bookingData.dropoffDateTime).toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-700">
                        <FaClock className="text-blue-600 mr-2" />
                        <span className="font-medium">Thời gian thuê: {rentalDays} ngày</span>
                      </div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {((car.dailyRate || car.daily_rate) / 1000).toFixed(0)}K/ngày
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information Form */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl mb-8 border border-gray-100">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                Thông tin liên hệ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="Họ và tên"
                  icon={FaUser}
                  required
                  type="text"
                  name="fullName"
                  value={contactInfo.fullName}
                  onChange={handleContactInfoChange}
                  placeholder="Nhập họ và tên"
                  error={contactErrors.fullName}
                />
                <FormInput
                  label="Số điện thoại"
                  icon={FaPhone}
                  required
                  type="tel"
                  name="phone"
                  value={contactInfo.phone}
                  onChange={handleContactInfoChange}
                  placeholder="Nhập số điện thoại"
                  error={contactErrors.phone}
                />
              </div>
              <FormInput
                label="Email"
                icon={FaEnvelope}
                required
                type="email"
                name="email"
                value={contactInfo.email}
                onChange={handleContactInfoChange}
                placeholder="Nhập email"
                error={contactErrors.email}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="Địa chỉ nhận xe"
                  icon={FaMapMarkerAlt}
                  required
                  type="text"
                  name="pickupAddress"
                  value={contactInfo.pickupAddress}
                  onChange={handleContactInfoChange}
                  placeholder="Nhập địa chỉ nhận xe"
                  error={contactErrors.pickupAddress}
                />
                <FormInput
                  label="Địa chỉ trả xe"
                  icon={FaMapMarkerAlt}
                  required
                  type="text"
                  name="dropoffAddress"
                  value={contactInfo.dropoffAddress}
                  onChange={handleContactInfoChange}
                  placeholder="Nhập địa chỉ trả xe"
                  error={contactErrors.dropoffAddress}
                />
              </div>
            </div>

            {/* Service Options */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl mb-8 border border-gray-100">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                Tùy chọn dịch vụ
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                      <FaUser />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">Thuê tài xế</div>
                      <div className="text-sm text-gray-600">300,000 VND/ngày - Tài xế chuyên nghiệp</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={withDriver}
                      onChange={(e) => setWithDriver(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3">
                      <FaMapMarkerAlt />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">Giao xe tận nơi</div>
                      <div className="text-sm text-gray-600">100,000 VND - Giao xe đến địa chỉ của bạn</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deliveryRequested}
                      onChange={(e) => setDeliveryRequested(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>


            {/* Terms and Conditions */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl mb-8 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Điều khoản quan trọng
                </h2>
                <button
                  onClick={() => setShowTermsDetails(!showTermsDetails)}
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center text-sm"
                >
                  {showTermsDetails ? "Thu gọn" : "Xem chi tiết"}
                  {showTermsDetails ? <FaChevronUp className="ml-1" /> : <FaChevronDown className="ml-1" />}
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                      <FaFileAlt />
                    </div>
                    <h3 className="font-semibold text-gray-800 text-lg">Giấy tờ thuê xe</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center">
                      <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                      CMND/CCCD + Giấy phép lái xe (bản gốc)
                    </li>
                    <li className="flex items-center">
                      <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                      Hộ khẩu/KT3 hoặc Passport (bản gốc)
                    </li>
                    <li className="flex items-center">
                      <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                      Đặt cọc 5 triệu đồng hoặc xe máy có giá trị tương đương
                    </li>
                  </ul>
                </div>

                {showTermsDetails && (
                  <>
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mr-3">
                          <FaShieldAlt />
                        </div>
                        <h3 className="font-semibold text-gray-800 text-lg">Quy định sử dụng xe</h3>
                      </div>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-center">
                          <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                          Sử dụng xe đúng mục đích
                        </li>
                        <li className="flex items-center">
                          <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                          Không sử dụng xe vào mục đích phi pháp, trái pháp luật
                        </li>
                        <li className="flex items-center">
                          <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                          Không hút thuốc, ăn uống trong xe
                        </li>
                        <li className="flex items-center">
                          <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                          Không vận chuyển hàng cấm, hàng dễ cháy nổ
                        </li>
                        <li className="flex items-center">
                          <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                          Vệ sinh xe trước khi trả, quá giờ tính phí 100.000đ/giờ
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3">
                          <FaUndoAlt />
                        </div>
                        <h3 className="font-semibold text-gray-800 text-lg">Chính sách hủy/đổi</h3>
                      </div>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-center">
                          <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                          Hủy trước 24h: Hoàn tiền 100%
                        </li>
                        <li className="flex items-center">
                          <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                          Hủy trong vòng 24h: Hoàn tiền 50%
                        </li>
                        <li className="flex items-center">
                          <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                          Không đến nhận xe: Không hoàn tiền
                        </li>
                      </ul>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 mr-3"
                  />
                  <span className="text-sm text-gray-700">
                    Tôi đã đọc và đồng ý với các{" "}
                    <Link to="/terms" className="text-blue-600 hover:text-blue-800 underline font-medium">
                      điều khoản và điều kiện
                    </Link>{" "}
                    của dịch vụ
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl sticky top-24 border border-gray-100">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                Tóm tắt đơn hàng
              </h2>

              {/* Price Breakdown */}
              <div className="border-b border-gray-200 pb-6 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Giá thuê ({rentalDays} ngày)</span>
                    <span className="font-semibold">{priceBreakdown.basePrice.toLocaleString("vi-VN")}đ</span>
                  </div>
                  {priceBreakdown.extraFee > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Phí dịch vụ</span>
                      <span className="font-semibold">{priceBreakdown.extraFee.toLocaleString("vi-VN")}đ</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Phí dịch vụ (10%)</span>
                    <span className="font-semibold">{priceBreakdown.serviceFee.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Thuế VAT (10%)</span>
                    <span className="font-semibold">{priceBreakdown.tax.toLocaleString("vi-VN")}đ</span>
                  </div>
                  {priceBreakdown.discount > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span>Giảm giá</span>
                      <span className="font-semibold">-{priceBreakdown.discount.toLocaleString("vi-VN")}đ</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Promo Code */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <FaGift className="text-blue-600" />
                  <span className="font-medium text-gray-800">Mã giảm giá</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Nhập mã giảm giá"
                    className="flex-1 border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={isApplyingPromo || !promoCode.trim()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isApplyingPromo ? <FaSpinner className="animate-spin" /> : "Áp dụng"}
                  </button>
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-6 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-900 text-lg">Tổng cộng</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {priceBreakdown.total.toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Cọc trước: {priceBreakdown.deposit.toLocaleString("vi-VN")}đ (30%)
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3">
                    <FaShieldAlt />
                  </div>
                  <span>Bảo hiểm xe và hành khách theo quy định</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                    <FaHeadset />
                  </div>
                  <span>Hỗ trợ kỹ thuật 24/7</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mr-3">
                    <FaUndoAlt />
                  </div>
                  <span>Chính sách hủy linh hoạt</span>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleConfirm}
                disabled={!agreeTerms || isLoading || Object.keys(contactErrors).length > 0}
                className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 transform ${
                  !agreeTerms || isLoading || Object.keys(contactErrors).length > 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:scale-105 shadow-lg"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <FaSpinner className="animate-spin mr-2" />
                    Đang xử lý...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <FaCheck className="mr-2" />
                    Xác nhận đặt xe - Chuyển đến thanh toán
                  </div>
                )}
              </button>

              <div className="text-center text-xs text-gray-500 mt-4">
                Bằng cách nhấn "Xác nhận đặt xe", bạn đồng ý với các điều khoản và điều kiện của dịch vụ
              </div>

              {/* Test Connection Button */}
              <button
                onClick={async () => {
                  try {
                    console.log('Testing connection...');
                    const response = await fetch('http://localhost:8080/api/bookings/test');
                    const data = await response.text();
                    console.log('Test response:', data);
                    alert(`Connection test: ${data}`);
                  } catch (error) {
                    console.error('Test failed:', error);
                    alert(`Test failed: ${error.message}`);
                  }
                }}
                className="w-full mt-4 py-2 bg-gray-500 text-white rounded-xl font-medium"
              >
                Test Connection
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/95 backdrop-blur-xl border-t border-gray-200 mt-16 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            RentCar
          </div>
          <p className="text-gray-600">Dịch vụ thuê xe uy tín, an toàn và tiện lợi</p>
        </div>
      </footer>
    </div>
  )
}

export default BookingConfirmationPage
