"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate, Link } from "react-router-dom"
import { post, getBookingById, getBookingByTransactionId } from "@/services/api.js"
import { useAuth } from "@/hooks/useAuth.js"
import {
  FaCreditCard,
  FaHandHoldingUsd,
  FaShieldAlt,
  FaLock,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCar,
  FaCarSide,
  FaHeadset,
  FaHeart,
  FaArrowLeft,
  FaFileAlt,
  FaMapMarkerAlt,
  FaEnvelope,
  FaUndoAlt,
  FaMobile,
} from "react-icons/fa"
import { getItem } from '@/utils/auth'

// Enhanced Progress Steps Component
const ProgressSteps = ({ currentStep = 1 }) => {
  const steps = [
    { id: 1, name: "Chọn xe", icon: FaCar },
    { id: 2, name: "Xác nhận", icon: FaFileAlt },
    { id: 3, name: "Thanh toán", icon: FaCreditCard },
    { id: 4, name: "Hoàn tất", icon: FaCheckCircle },
  ]

  return (
    <div className="hidden md:flex items-center justify-center">
      <div className="flex items-center space-x-4">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = step.id === currentStep
          const isCompleted = step.id < currentStep

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 transform ${
                    isCompleted
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-110"
                      : isActive
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl scale-125 animate-pulse"
                        : "bg-gray-200 text-gray-400 hover:bg-gray-300"
                  }`}
                >
                  {isCompleted ? <FaCheckCircle className="text-lg" /> : <Icon className="text-lg" />}
                </div>
                <div
                  className={`mt-3 text-sm font-semibold transition-colors duration-300 ${
                    isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {step.name}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-1 mx-4 rounded-full transition-all duration-500 ${
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

// Enhanced Page Header Component
const PageHeader = ({
  currentStep = 3,
  backText = "Quay lại xác nhận",
  bookingInfo,
  priceBreakdown,
  customerInfo,
  withDriver,
  deliveryRequested,
}) => {
  const navigate = useNavigate();
  const handleBack = () => {
    navigate("/bookings/confirmation", {
      state: {
        bookingData: bookingInfo,
        priceBreakdown,
        customerInfo,
        withDriver,
        deliveryRequested,
      },
    });
  };
  return (
    <header className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100 z-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center text-gray-700 hover:text-blue-600 transition-all duration-300 group"
          >
            <div className="w-12 h-12 flex items-center justify-center mr-4 bg-gray-100 rounded-2xl group-hover:bg-blue-100 transition-all duration-300 group-hover:scale-110">
              <FaArrowLeft className="text-lg" />
            </div>
            <span className="font-semibold hidden sm:block">{backText}</span>
          </button>

          <ProgressSteps currentStep={currentStep} />

          {/* Logo */}
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
      </div>
    </header>
  );
};

// Enhanced PageFooter component
const PageFooter = () => {
  return (
    <footer className="bg-white/95 backdrop-blur-xl border-t border-gray-200 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white">
                <FaCar />
              </div>
              <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                DriveLuxe
              </span>
            </Link>
            <p className="text-gray-600 mb-6">
              Dịch vụ thuê xe uy tín, an toàn và tiện lợi. Mang đến trải nghiệm tuyệt vời cho mọi chuyến đi.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FaShieldAlt className="text-green-600" />
                <span>Bảo hiểm toàn diện</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-6">Liên kết nhanh</h3>
            <ul className="space-y-3 text-gray-600">
              <li>
                <Link to="/" className="hover:text-blue-600 transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-blue-600 transition-colors">
                  Tìm kiếm xe
                </Link>
              </li>
              <li>
                <Link to="/favorites" className="hover:text-blue-600 transition-colors">
                  Xe yêu thích
                </Link>
              </li>
              <li>
                <Link to="/bookings" className="hover:text-blue-600 transition-colors">
                  Đặt xe của tôi
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-6">Hỗ trợ</h3>
            <ul className="space-y-3 text-gray-600">
              <li>
                <Link to="/help" className="hover:text-blue-600 transition-colors">
                  Trung tâm trợ giúp
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-blue-600 transition-colors">
                  Điều khoản dịch vụ
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-blue-600 transition-colors">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-blue-600 transition-colors">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-6">Liên hệ</h3>
            <div className="space-y-3 text-gray-600">
              <div className="flex items-center gap-3">
                <FaHeadset className="text-blue-600" />
                <span>Hotline: 1900 1234</span>
              </div>
              <div className="flex items-center gap-3">
                <FaEnvelope className="text-blue-600" />
                <span>support@driveluxe.com</span>
              </div>
              <div className="flex items-center gap-3">
                <FaMapMarkerAlt className="text-blue-600" />
                <span>123 Đường ABC, Quận 1, TP.HCM</span>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-gray-600">© 2024 DriveLuxe. Tất cả quyền được bảo lưu.</p>
          <div className="flex items-center gap-2 text-gray-600 mt-4 md:mt-0">
            <span>Made with</span>
            <FaHeart className="text-red-500" />
            <span>in Vietnam</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

// Enhanced LoadingSpinner component
const LoadingSpinner = ({ size = "medium", color = "blue", text }) => {
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
    <div className="flex flex-col items-center justify-center">
      <div
        className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]}`}
      >
        <div className="sr-only">Đang tải...</div>
      </div>
      {text && <p className="mt-3 text-gray-600 text-sm font-medium">{text}</p>}
    </div>
  )
}

// Enhanced ErrorMessage component
const ErrorMessage = ({ message, type = "error", onClose, className = "" }) => {
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
      className={`bg-gradient-to-r ${typeStyles[type]} border-2 px-6 py-4 rounded-2xl shadow-lg animate-in slide-in-from-top duration-500 ${className}`}
    >
      <div className="flex items-center">
        <Icon className="mr-4 flex-shrink-0 text-xl" />
        <span className="flex-1 font-medium">{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 hover:opacity-70 transition-opacity duration-200 p-1 rounded-full hover:bg-white/20"
            aria-label="Đóng thông báo"
          >
            <FaTimesCircle className="text-lg" />
          </button>
        )}
      </div>
    </div>
  )
}

// Enhanced Payment Method Card Component
const PaymentMethodCard = ({ method, selected, onSelect, icon: Icon, title, description, badge, color = "blue", logoImg }) => {
  const colorClasses = {
    blue: "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100",
    pink: "border-pink-500 bg-gradient-to-br from-pink-50 to-pink-100",
    orange: "border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100",
    green: "border-green-500 bg-gradient-to-br from-green-50 to-green-100",
  }

  return (
    <label
      className={`block p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
        selected
          ? `${colorClasses[color]} shadow-xl border-opacity-100`
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="radio"
            name="paymentMethod"
            value={method}
            checked={selected}
            onChange={() => onSelect(method)}
            className="sr-only"
          />
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              selected ? `bg-${color}-100 text-${color}-600 shadow-lg` : "bg-gray-100 text-gray-600"
            }`}
          >
            {logoImg ? (
              <img
                src={logoImg}
                alt={title + " Logo"}
                className="w-10 h-10 object-contain"
                loading="lazy"
                onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML += '<span class=\"text-2xl text-pink-600 font-bold\">MoMo</span>'; }}
              />
            ) : (
              <Icon className="text-2xl" />
            )}
          </div>
          <div>
            <div className="font-bold text-gray-800 text-lg mb-1">{title}</div>
            <div className="text-gray-600 text-sm leading-relaxed">{description}</div>
            {badge && (
              <span
                className={`inline-block mt-2 px-3 py-1 text-xs rounded-full font-semibold ${
                  badge === "Khuyến nghị"
                    ? "bg-green-100 text-green-700"
                    : badge === "Mới"
                      ? "bg-pink-100 text-pink-700"
                      : "bg-blue-100 text-blue-700"
                }`}
              >
                {badge}
              </span>
            )}
          </div>
        </div>
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
            selected ? `border-${color}-500 bg-${color}-500` : "border-gray-300"
          }`}
        >
          {selected && <div className="w-3 h-3 bg-white rounded-full"></div>}
        </div>
      </div>
    </label>
  )
}

// Enhanced Order Summary Component
const OrderSummary = ({
  priceBreakdown,
  DEPOSIT,
  COLLATERAL,
  withDriver,
  deliveryRequested,
  paymentMethod,
  isProcessing,
  handlePayment,
}) => (
  <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl sticky top-32 border border-gray-100">
    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
      Tóm tắt đơn hàng
    </h3>

    {/* Price Breakdown */}
    <div className="space-y-4 mb-8">
      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
        <span className="text-gray-700 font-medium">Tổng tiền thuê:</span>
        <span className="font-bold text-lg">{priceBreakdown?.total?.toLocaleString()} VND</span>
      </div>
      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
        <span className="text-gray-700 font-medium">Phí dịch vụ:</span>
        <span className="font-bold text-lg">{priceBreakdown?.serviceFee?.toLocaleString()} VND</span>
      </div>
      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
        <span className="text-gray-700 font-medium">Thuế VAT:</span>
        <span className="font-bold text-lg">{priceBreakdown?.tax?.toLocaleString()} VND</span>
      </div>
      {priceBreakdown?.discount > 0 && (
        <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
          <span className="text-green-700 font-medium">Giảm giá:</span>
          <span className="font-bold text-green-600 text-lg">-{priceBreakdown.discount.toLocaleString()} VND</span>
        </div>
      )}
      {withDriver && (
        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
          <span className="text-gray-700 font-medium">Thuê tài xế:</span>
          <span className="font-medium text-green-600 flex items-center gap-2">
            <FaCheckCircle />
            Đã chọn
          </span>
        </div>
      )}
      {deliveryRequested && (
        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
          <span className="text-gray-700 font-medium">Giao xe tận nơi:</span>
          <span className="font-medium text-green-600 flex items-center gap-2">
            <FaCheckCircle />
            Đã chọn
          </span>
        </div>
      )}
    </div>

    {/* Payment Amount */}
    <div className="border-t border-gray-200 pt-6 mb-8">
      <div className="flex justify-between items-center mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
        <span className="font-bold text-gray-900 text-base">Cần thanh toán ngay:</span>
        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {DEPOSIT.toLocaleString()} VND
        </span>
      </div>
      <p className="text-center text-sm text-gray-500 mb-4">Số tiền còn lại sẽ thanh toán khi nhận xe</p>
    </div>

    {/* Collateral Notice */}
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6 mb-8">
      <div className="flex items-start gap-3">
        <FaInfoCircle className="text-yellow-600 text-xl mt-1" />
        <div>
          <p className="font-bold text-yellow-800 mb-2">Thế chấp khi nhận xe:</p>
          <p className="text-yellow-700 font-semibold text-lg">{COLLATERAL.toLocaleString()} VND</p>
          <p className="text-yellow-600 text-sm mt-1">(Hoàn lại sau khi trả xe)</p>
        </div>
      </div>
    </div>

    {/* Benefits */}
    <div className="space-y-4 mb-8">
      <div className="flex items-center text-sm text-gray-700 p-4 bg-green-50 rounded-xl border border-green-100">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-4">
          <FaShieldAlt />
        </div>
        <span className="font-medium">Bảo hiểm xe và hành khách theo quy định</span>
      </div>
      <div className="flex items-center text-sm text-gray-700 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-4">
          <FaHeadset />
        </div>
        <span className="font-medium">Hỗ trợ kỹ thuật 24/7</span>
      </div>
      <div className="flex items-center text-sm text-gray-700 p-4 bg-purple-50 rounded-xl border border-purple-100">
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mr-4">
          <FaUndoAlt />
        </div>
        <span className="font-medium">Chính sách hủy linh hoạt</span>
      </div>
    </div>

    {/* Payment Button */}
    <button
      onClick={handlePayment}
      disabled={!paymentMethod || isProcessing}
      className={`w-full py-5 rounded-2xl font-bold text-lg transition-all duration-300 transform ${
        !paymentMethod || isProcessing
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:scale-105 shadow-xl hover:shadow-2xl"
      }`}
    >
      {isProcessing ? (
        <div className="flex items-center justify-center gap-3">
          <FaSpinner className="animate-spin text-xl" />
          <span>Đang xử lý...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-3">
          <FaCreditCard className="text-xl" />
          <span>Thanh toán {DEPOSIT.toLocaleString()} VND</span>
        </div>
      )}
    </button>

    {/* Security Notice */}
    <div className="mt-6 text-center">
      <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mb-2">
        <div className="flex items-center gap-1">
          <FaShieldAlt />
          <span>SSL Secure</span>
        </div>
        <div className="flex items-center gap-1">
          <FaLock />
          <span>256-bit Encryption</span>
        </div>
      </div>
      <p className="text-xs text-gray-400">Thông tin thanh toán được bảo mật tuyệt đối</p>
    </div>
  </div>
)

// Main Payment Page Component
const PaymentPage = () => {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Lấy dữ liệu từ location.state với validation
  const {
    withDriver,
    deliveryRequested,
    customerInfo: stateCustomerInfo,
    depositAmount,
    collateralAmount,
    bookingId: stateBookingId,
    paymentId: statePaymentId,
    priceBreakdown: statePriceBreakdown,
    bookingInfo: stateBookingInfo,
    fromHistory,
  } = location.state || {}

  // State management
  const [bookingId, setBookingId] = useState(stateBookingId)
  const [priceBreakdown, setPriceBreakdown] = useState(statePriceBreakdown)
  const [bookingInfo, setBookingInfo] = useState(stateBookingInfo)
  const [customerInfo, setCustomerInfo] = useState(stateCustomerInfo)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [error, setError] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [paymentId, setPaymentId] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [toast, setToast] = useState({ show: false, message: "", type: "" })
  const [isLoading, setIsLoading] = useState(true)

  // Calculate amounts with validation
  const DEPOSIT = depositAmount || priceBreakdown?.deposit || 0
  const COLLATERAL = collateralAmount || 5000000

  // Load data from localStorage if not available from state
  useEffect(() => {
    const loadDataFromStorage = () => {
      try {
        if (!bookingId) {
          const storedBookingId = getItem('lastBookingId')
          if (storedBookingId) {
            setBookingId(storedBookingId)
          }
        }

        if (!priceBreakdown) {
          const storedPriceBreakdown = getItem('lastPriceBreakdown')
          if (storedPriceBreakdown) {
            const parsed = JSON.parse(storedPriceBreakdown)
            setPriceBreakdown(parsed)
          }
        }
        if (!bookingInfo) {
          const storedBookingInfo = getItem('lastBookingInfo')
          if (storedBookingInfo) {
            const parsed = JSON.parse(storedBookingInfo)
            setBookingInfo(parsed)
          }
        }
        if (!customerInfo) {
          const storedCustomerInfo = getItem('lastCustomerInfo')
          if (storedCustomerInfo) {
            const parsed = JSON.parse(storedCustomerInfo)
            setCustomerInfo(parsed)
          }
        }
      } catch (error) {
        console.error("Error loading data from localStorage:", error)
        setError("Lỗi khi tải dữ liệu từ bộ nhớ. Vui lòng thử lại.")
      } finally {
        setIsLoading(false)
      }
    }

    loadDataFromStorage()
  }, [bookingId, priceBreakdown, bookingInfo, customerInfo])

  // Validation và error handling
  useEffect(() => {
    if (!isAuthenticated) {
      setError("Vui lòng đăng nhập để tiếp tục thanh toán")
      setTimeout(() => navigate("/login"), 3000)
      return
    }

    if (!bookingInfo && !bookingId) {
      setError("Không tìm thấy thông tin đặt xe. Vui lòng quay lại trang đặt xe.")
      return
    }

    if (!priceBreakdown) {
      setError("Không tìm thấy thông tin giá. Vui lòng quay lại trang đặt xe.")
      return
    }

    if (!customerInfo) {
      setError("Không tìm thấy thông tin khách hàng. Vui lòng quay lại trang đặt xe.")
      return
    }

    setError(null)
  }, [bookingId, bookingInfo, priceBreakdown, customerInfo, isAuthenticated, navigate])

  // Nếu vào từ lịch sử đặt, tự động lấy lại thông tin booking/payment
  useEffect(() => {
    const fetchBookingForRetry = async () => {
      if (fromHistory && (stateBookingId || statePaymentId)) {
        setIsLoading(true);
        try {
          let bookingData = null;
          if (stateBookingId) {
            bookingData = await getBookingById(stateBookingId);
          } else if (statePaymentId) {
            bookingData = await getBookingByTransactionId(statePaymentId);
          }
          if (bookingData) {
            setBookingId(bookingData.bookingId);
            setBookingInfo({
              carId: bookingData.car?.carId,
              pickupLocation: bookingData.pickupLocation,
              dropoffLocation: bookingData.dropoffLocation,
              pickupDateTime: bookingData.pickupDateTime,
              dropoffDateTime: bookingData.dropoffDateTime,
              seatNumber: bookingData.seatNumber,
              withDriver: bookingData.withDriver,
              deliveryRequested: bookingData.deliveryRequested,
              car: bookingData.car,
            });
            setPriceBreakdown(bookingData.priceBreakdown || {});
            setCustomerInfo({
              fullName: bookingData.customer?.fullName || '',
              phone: bookingData.customer?.phone || '',
              email: bookingData.customer?.email || '',
              pickupAddress: bookingData.pickupLocation || '',
              dropoffAddress: bookingData.dropoffLocation || '',
            });
            // Nếu trạng thái là failed, hiển thị thông báo
            if (bookingData.statusName === 'failed') {
              setError('Đơn đặt này chưa thanh toán thành công. Bạn có thể thanh toán lại ngay tại đây.');
            }
          }
        } catch (err) {
          setError('Không thể lấy lại thông tin đơn đặt. Vui lòng thử lại hoặc liên hệ hỗ trợ.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchBookingForRetry();
    // eslint-disable-next-line
  }, [fromHistory, stateBookingId, statePaymentId]);

  // Toast notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000)
  }

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method)
    setError(null)
  }

  const validatePaymentData = () => {
    if (!bookingInfo && !bookingId) {
      return "Không tìm thấy thông tin đặt xe"
    }

    if (!priceBreakdown) {
      return "Không tìm thấy thông tin giá"
    }

    if (!paymentMethod) {
      return "Vui lòng chọn phương thức thanh toán"
    }

    if (DEPOSIT <= 0) {
      return "Số tiền thanh toán không hợp lệ"
    }

    if (!customerInfo || !customerInfo.fullName || !customerInfo.email || !customerInfo.phone) {
      return "Thông tin khách hàng không đầy đủ"
    }

    return null
  }

  const handlePayment = async () => {
    const validationError = validatePaymentData()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setIsProcessing(true)
      setError(null)

      let paymentData
      let endpoint

      if (bookingInfo) {
        paymentData = {
          carId: bookingInfo.carId,
          pickupDateTime: bookingInfo.pickupDateTime,
          dropoffDateTime: bookingInfo.dropoffDateTime,
          pickupLocation: bookingInfo.pickupLocation,
          dropoffLocation: bookingInfo.dropoffLocation,
          seatNumber: bookingInfo.seatNumber,
          withDriver: bookingInfo.withDriver || false,
          deliveryRequested: bookingInfo.deliveryRequested || false,
          amount: DEPOSIT,
          currency: "VND",
          paymentMethod: paymentMethod,
          customerInfo: customerInfo,
        }
        endpoint = "/api/payments/with-booking"
      } else {
        paymentData = {
          bookingId: Number.parseInt(bookingId),
          amount: DEPOSIT,
          currency: "VND",
          paymentMethod: paymentMethod,
          customerInfo: customerInfo,
          withDriver: withDriver || false,
          deliveryRequested: deliveryRequested || false,
        }
        endpoint = "/api/payments"
      }

      const response = await post(endpoint, paymentData)

      if (response.redirectUrl) {
        window.location.href = response.redirectUrl
      } else {
        setPaymentStatus("success")
        setPaymentId(response.paymentId || response.transactionId)
        showToast("Thanh toán thành công!", "success")

        // Clean up localStorage
        localStorage.removeItem("lastBookingId")
        localStorage.removeItem("lastPriceBreakdown")
        localStorage.removeItem("lastBookingInfo")
        localStorage.removeItem("lastCustomerInfo")

        setTimeout(() => {
          navigate("/booking-success", {
            state: {
              bookingId: response.bookingId || bookingId,
              paymentId: response.paymentId || response.transactionId,
              amount: paymentMethod === "cash" ? 0 : (response.amount || DEPOSIT),
              priceBreakdown: response.priceBreakdown || priceBreakdown,
              totalAmount: response.totalAmount || priceBreakdown?.total || 0,
              withDriver: withDriver,
              deliveryRequested: deliveryRequested,
              customerInfo: customerInfo,
              bookingData: {
                ...bookingInfo,
                car: bookingInfo?.car || { model: "Không xác định" }
              },
            },
          })
        }, 2000)
      }
    } catch (err) {
      console.error("Payment error:", err)
      setPaymentStatus("failed")
      showToast("Thanh toán thất bại!", "error")

      if (err.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.")
        setTimeout(() => navigate("/login"), 2000)
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Dữ liệu thanh toán không hợp lệ")
      } else if (!err.response) {
        setError("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.")
      } else {
        setError(err.message || "Thanh toán thất bại. Vui lòng thử lại.")
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRetry = () => {
    setPaymentStatus(null)
    setError(null)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <PageHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="mb-12">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-3xl inline-block shadow-2xl animate-pulse">
              <FaCarSide className="text-6xl text-white animate-bounce" />
            </div>
          </div>
          <LoadingSpinner size="large" text="Đang tải thông tin thanh toán..." />
          <p className="mt-8 text-gray-700 text-2xl font-bold">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    )
  }

  // Error state
  if ((!bookingInfo && !bookingId) || !priceBreakdown || !customerInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <PageHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-lg mx-auto">
            <div className="mb-8">
              <div className="bg-red-100 p-8 rounded-full inline-block shadow-lg">
                <FaExclamationTriangle className="text-5xl text-red-500" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Không có thông tin thanh toán</h2>
            <p className="text-gray-600 mb-8 text-lg">{error || "Vui lòng quay lại trang đặt xe để tiếp tục."}</p>
            <div className="space-x-4">
              <Link to="/search" className="text-blue-600 hover:underline font-semibold">
                Tìm xe khác
              </Link>
              <Link to="/" className="text-blue-600 hover:underline font-semibold">
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>
        <PageFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-2xl shadow-xl transform transition-all duration-300 ${
            toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6">{toast.type === "success" ? <FaCheckCircle /> : <FaTimesCircle />}</div>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-10 max-w-sm w-full mx-4 text-center shadow-2xl">
            <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Đang xử lý thanh toán</h3>
            <p className="text-gray-600 mb-6">Vui lòng không đóng trang này...</p>
            <div className="bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full animate-pulse"
                style={{ width: "75%" }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        bookingInfo={bookingInfo}
        priceBreakdown={priceBreakdown}
        customerInfo={customerInfo}
        withDriver={withDriver}
        deliveryRequested={deliveryRequested}
      />

      {/* Main Title and Subtitle */}
      <div className="text-center mb-12 pt-8">
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Thanh toán
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">Hoàn tất thanh toán để xác nhận đặt xe của bạn</p>
      </div>

      <main className="container mx-auto px-4 py-12">
        {error && <ErrorMessage message={error} type="error" onClose={() => setError(null)} className="mb-8" />}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          {/* Left Column - Payment Form */}
          <div className="xl:col-span-2">
            <div className="sticky top-0 z-30">
              {paymentStatus === "success" ? (
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-10 shadow-2xl text-center border border-gray-100">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                    <FaCheckCircle className="text-4xl text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Thanh toán thành công!</h2>
                  <p className="text-gray-600 mb-2 text-lg">
                    Mã giao dịch: <span className="font-semibold">{paymentId}</span>
                  </p>
                  <p className="text-gray-600 mb-8">Xác nhận đã được gửi qua email của bạn.</p>
                  <div className="space-y-4">
                    <Link
                      to="/booking-success"
                      className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      Xem chi tiết đặt xe
                    </Link>
                    <Link
                      to="/"
                      className="block w-full border-2 border-gray-300 text-gray-700 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition-all duration-300"
                    >
                      Về trang chủ
                    </Link>
                  </div>
                </div>
              ) : paymentStatus === "failed" ? (
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-10 shadow-2xl text-center border border-gray-100">
                  <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8">
                    <FaTimesCircle className="text-4xl text-red-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Thanh toán thất bại</h2>
                  <p className="text-gray-600 mb-8 text-lg">{error}</p>
                  <div className="space-y-4">
                    <button
                      onClick={handleRetry}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      Thử lại
                    </button>
                    <Link
                      to="/search"
                      className="block w-full border-2 border-gray-300 text-gray-700 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition-all duration-300"
                    >
                      Tìm xe khác
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Payment Methods */}
                  <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-100">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
                      Chọn phương thức thanh toán
                    </h2>

                    <div className="space-y-6">
                      <PaymentMethodCard
                        method="vnpay"
                        selected={paymentMethod === "vnpay"}
                        onSelect={handlePaymentMethodChange}
                        icon={FaCreditCard}
                        title="VNPay"
                        description="Thanh toán online qua VNPay - Nhanh chóng, an toàn và tiện lợi"
                        badge="Khuyến nghị"
                        color="blue"
                      />

                      <PaymentMethodCard
                        method="momo"
                        selected={paymentMethod === "momo"}
                        onSelect={handlePaymentMethodChange}
                        icon={FaMobile}
                        title="MoMo"
                        description="Thanh toán qua ví MoMo - Nhanh chóng và tiện lợi với nhiều ưu đãi"
                        badge="Mới"
                        color="pink"
                        logoImg="/images/momo-logo.png"
                      />

                      <PaymentMethodCard
                        method="cash"
                        selected={paymentMethod === "cash"}
                        onSelect={handlePaymentMethodChange}
                        icon={FaHandHoldingUsd}
                        title="Tiền mặt"
                        description="Thanh toán trực tiếp khi nhận xe - Phương thức truyền thống"
                        badge="Truyền thống"
                        color="orange"
                      />
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <FaLock className="text-blue-600 text-2xl mt-1" />
                      <div>
                        <h4 className="font-bold text-blue-900 mb-2 text-lg">Thanh toán an toàn tuyệt đối</h4>
                        <p className="text-blue-700 leading-relaxed">
                          Thông tin thanh toán của bạn được mã hóa và bảo mật bằng công nghệ SSL 256-bit. Chúng tôi không
                          lưu trữ thông tin thẻ của bạn và tuân thủ các tiêu chuẩn bảo mật quốc tế.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="xl:col-span-1">
            <OrderSummary
              priceBreakdown={priceBreakdown}
              DEPOSIT={DEPOSIT}
              COLLATERAL={COLLATERAL}
              withDriver={withDriver}
              deliveryRequested={deliveryRequested}
              paymentMethod={paymentMethod}
              isProcessing={isProcessing}
              handlePayment={handlePayment}
            />
          </div>
        </div>
      </main>

      <PageFooter />
    </div>
  )
}

export default PaymentPage
