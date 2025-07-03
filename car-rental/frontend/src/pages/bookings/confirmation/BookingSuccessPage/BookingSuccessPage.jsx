"use client"

import { useEffect, useState } from "react"
import { useLocation, useNavigate, Link, useSearchParams } from "react-router-dom"
import { getBookingByTransactionId, getBookingById } from "@/services/api"
import {
  FaCheckCircle,
  FaDownload,
  FaHome,
  FaSearch,
  FaCar,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaHeadset,
  FaStar,
  FaGift,
  FaArrowLeft,
  FaCarSide,
  FaShieldAlt,
  FaHeart,
  FaFileAlt,
  FaCreditCard,
  FaTimesCircle,
  FaExclamationTriangle,
  FaInfoCircle,
} from "react-icons/fa"

// --- HEADER (đồng bộ với BookingConfirmationPage.jsx/PaymentPage.jsx) ---
const ProgressSteps = ({ currentStep = 4 }) => {
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

const PageHeader = ({ currentStep = 4, backLink = "/", backText = "Về trang chủ" }) => (
  <header className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100 sticky top-0 z-50">
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <Link
          to={backLink}
          className="flex items-center text-gray-700 hover:text-blue-600 transition-all duration-300 group"
        >
          <div className="w-12 h-12 flex items-center justify-center mr-4 bg-gray-100 rounded-2xl group-hover:bg-blue-100 transition-all duration-300 group-hover:scale-110">
            <FaArrowLeft className="text-lg" />
          </div>
          <span className="font-semibold hidden sm:block">{backText}</span>
        </Link>
        <ProgressSteps currentStep={currentStep} />
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
)

// --- FOOTER (đồng bộ với BookingConfirmationPage.jsx/PaymentPage.jsx) ---
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
                RentCar
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
                <span>support@rentcar.com</span>
              </div>
              <div className="flex items-center gap-3">
                <FaMapMarkerAlt className="text-blue-600" />
                <span>123 Đường ABC, Quận 1, TP.HCM</span>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-gray-600">© 2024 RentCar. Tất cả quyền được bảo lưu.</p>
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

// --- LoadingSpinner (đồng bộ với các trang booking) ---
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

// --- ErrorMessage (đồng bộ với các trang booking) ---
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

const BookingSuccessPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    priceBreakdown,
    withDriver,
    deliveryRequested,
    customerInfo,
    paymentMethod,
    bookingId: stateBookingId,
    paymentId: statePaymentId,
    amount: stateAmount,
    bookingData,
  } = location.state || {}

  const [bookingDetails, setBookingDetails] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const transactionId = searchParams.get("txn_ref")
        const bookingIdFromUrl = searchParams.get("booking_id")
        let bookingDataFromApi = null

        if (transactionId) {
          try {
            bookingDataFromApi = await getBookingByTransactionId(transactionId)
          } catch (apiError) {
            console.error("API Error fetching booking details by transaction ID:", apiError)
            setError("Không tìm thấy thông tin đặt xe. Mã giao dịch có thể không hợp lệ.")
            setIsLoading(false)
            return
          }
        } else if (bookingIdFromUrl) {
          try {
            bookingDataFromApi = await getBookingById(bookingIdFromUrl)
          } catch (apiError) {
            console.error("API Error fetching booking details by bookingId:", apiError)
            setError("Không tìm thấy thông tin đặt xe. Mã đặt xe có thể không hợp lệ.")
            setIsLoading(false)
            return
          }
        }

        // Ưu tiên lấy từ state nếu có, fallback sang API
        const state = location.state || {}
        const bookingDataState = state.bookingData || {}
        const carState = bookingDataState.car || state.car || {}
        const priceBreakdownState = state.priceBreakdown || {}
        const customerInfoState = state.customerInfo || {}
        const withDriverState = state.withDriver
        const deliveryRequestedState = state.deliveryRequested
        const paymentMethodState = state.paymentMethod

        let pickupDate, dropoffDate
        if (bookingDataFromApi) {
          pickupDate = new Date(bookingDataFromApi.pickupDateTime).toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
          dropoffDate = new Date(bookingDataFromApi.dropoffDateTime).toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        } else if (bookingDataState.pickupDateTime) {
          pickupDate = new Date(bookingDataState.pickupDateTime).toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
          dropoffDate = new Date(bookingDataState.dropoffDateTime).toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        } else {
          pickupDate = dropoffDate = "Không xác định"
        }

        setBookingDetails({
          bookingId:
            state.bookingId || state.booking_id || bookingDataFromApi?.bookingId || bookingIdFromUrl || "N/A",
          paymentId:
            state.paymentId || state.payment_id || transactionId || bookingDataFromApi?.paymentId || "N/A",
          amount:
            bookingDataFromApi?.amount !== undefined ? bookingDataFromApi.amount : (state.amount || priceBreakdownState.deposit || bookingDataFromApi?.depositAmount || 0),
          carModel:
            bookingDataFromApi?.car?.model || carState.model || "Không xác định",
          pickupLocation:
            bookingDataFromApi?.pickupLocation || bookingDataState.pickupLocation || customerInfoState.pickupAddress || "Không xác định",
          dropoffLocation:
            bookingDataFromApi?.dropoffLocation || bookingDataState.dropoffLocation || customerInfoState.dropoffAddress || "Không xác định",
          pickupDate,
          dropoffDate,
          customerName:
            customerInfoState.fullName || bookingDataFromApi?.customer?.fullName || bookingDataFromApi?.customer?.username || "Không xác định",
          customerEmail:
            customerInfoState.email || bookingDataFromApi?.customer?.email || "Không xác định",
          customerPhone:
            customerInfoState.phone || bookingDataFromApi?.customer?.phone || "Không xác định",
          totalAmount:
            bookingDataFromApi?.priceBreakdown?.total || bookingDataFromApi?.totalAmount || priceBreakdownState.total || bookingDataFromApi?.priceBreakdown?.total || 0,
          depositAmount:
            priceBreakdownState.deposit || bookingDataFromApi?.depositAmount || bookingDataFromApi?.priceBreakdown?.deposit || 0,
          withDriver:
            withDriverState !== undefined ? withDriverState : bookingDataFromApi?.withDriver,
          deliveryRequested:
            deliveryRequestedState !== undefined ? deliveryRequestedState : bookingDataFromApi?.deliveryRequested,
          paymentMethod: paymentMethodState || bookingDataFromApi?.paymentMethod,
          priceBreakdown: bookingDataFromApi?.priceBreakdown || priceBreakdownState || bookingDataFromApi?.priceBreakdown,
          customerInfo: customerInfoState,
          bookingData: bookingDataState,
        })
      } catch (err) {
        console.error("Error in fetchBookingDetails:", err)
        setError("Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookingDetails()

    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [location.state, navigate, searchParams])

  const downloadBookingConfirmation = () => {
    const content = `
XÁCNHẬN ĐẶT XE - RENTCAR
========================

Mã đặt xe: #${bookingDetails.bookingId}
Mã thanh toán: ${bookingDetails.paymentId}
Xe: ${bookingDetails.carModel}
Khách hàng: ${bookingDetails.customerName}
Email: ${bookingDetails.customerEmail}
Điện thoại: ${bookingDetails.customerPhone}

Thời gian nhận xe: ${bookingDetails.pickupDate}
Địa điểm nhận xe: ${bookingDetails.pickupLocation}

Thời gian trả xe: ${bookingDetails.dropoffDate}
Địa điểm trả xe: ${bookingDetails.dropoffLocation}

Số tiền đã thanh toán: ${bookingDetails.amount.toLocaleString()} VND
Tổng giá trị đơn hàng: ${bookingDetails.totalAmount.toLocaleString()} VND

Dịch vụ bổ sung:
${bookingDetails.withDriver ? "✓ Thuê tài xế" : ""}
${bookingDetails.deliveryRequested ? "✓ Giao xe tận nơi" : ""}

Liên hệ hỗ trợ: 1900 1234
Email: support@rentcar.com
    `

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `booking-confirmation-${bookingDetails.bookingId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <PageHeader title="Đang tải..." subtitle="Vui lòng chờ trong giây lát" showProgress={false} />
        <div className="container mx-auto px-4 py-16 text-center">
          <LoadingSpinner size="large" text="Đang tải thông tin đặt xe..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50">
        <PageHeader title="Lỗi" subtitle="Không thể tải thông tin đặt xe" showProgress={false} />
        <div className="container mx-auto px-4 py-16 text-center">
          <ErrorMessage message={error} type="error" />
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
            >
              <FaHome />
              Về trang chủ
            </Link>
          </div>
        </div>
        <PageFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 animate-pulse"></div>
        <div
          className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-20 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <PageHeader currentStep={4} backLink="/" backText="Về trang chủ" />

      <main className="relative z-20 container mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-2xl">
            <FaCheckCircle className="text-4xl text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            Đặt xe thành công!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Chúng tôi đã gửi email xác nhận đến địa chỉ email của bạn. Vui lòng kiểm tra hộp thư để xem chi tiết.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enhanced Booking Summary */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FaCar className="text-blue-600" />
                Thông tin đặt xe
              </h2>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Mã đặt xe</div>
                  <div className="text-xl font-bold text-blue-600">#{bookingDetails.bookingId}</div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Mã thanh toán</div>
                  <div className="text-lg font-semibold text-green-600">{bookingDetails.paymentId}</div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Đã thanh toán</div>
                  <div className="text-xl font-bold text-purple-600">{bookingDetails.amount.toLocaleString()} VND</div>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Tổng giá trị</div>
                  <div className="text-xl font-bold text-orange-600">
                    {bookingDetails.totalAmount.toLocaleString()} VND
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Car & Trip Details */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FaCalendarAlt className="text-blue-600" />
                Chi tiết chuyến đi
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaCar className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Xe</div>
                    <div className="font-semibold text-gray-900">{bookingDetails.carModel}</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <FaMapMarkerAlt className="text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Nhận xe</div>
                      <div className="font-semibold text-gray-900">{bookingDetails.pickupLocation}</div>
                      <div className="text-sm text-gray-500">{bookingDetails.pickupDate}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <FaMapMarkerAlt className="text-red-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Trả xe</div>
                      <div className="font-semibold text-gray-900">{bookingDetails.dropoffLocation}</div>
                      <div className="text-sm text-gray-500">{bookingDetails.dropoffDate}</div>
                    </div>
                  </div>
                </div>

                {/* Additional Services */}
                {(bookingDetails.withDriver || bookingDetails.deliveryRequested) && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-2">Dịch vụ bổ sung</div>
                    <div className="space-y-1">
                      {bookingDetails.withDriver && (
                        <div className="flex items-center gap-2 text-green-600">
                          <FaCheckCircle />
                          <span>Thuê tài xế</span>
                        </div>
                      )}
                      {bookingDetails.deliveryRequested && (
                        <div className="flex items-center gap-2 text-green-600">
                          <FaCheckCircle />
                          <span>Giao xe tận nơi</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Customer Info */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FaUser className="text-blue-600" />
                Thông tin khách hàng
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <FaUser className="text-gray-600" />
                  <div>
                    <div className="text-sm text-gray-600">Tên</div>
                    <div className="font-semibold">{bookingDetails.customerName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <FaEnvelope className="text-gray-600" />
                  <div>
                    <div className="text-sm text-gray-600">Email</div>
                    <div className="font-semibold">{bookingDetails.customerEmail}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <FaPhone className="text-gray-600" />
                  <div>
                    <div className="text-sm text-gray-600">Điện thoại</div>
                    <div className="font-semibold">{bookingDetails.customerPhone}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Next Steps & Actions */}
          <div className="space-y-6">
            {/* Enhanced Next Steps */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FaCheckCircle className="text-blue-600" />
                Bước tiếp theo
              </h3>
              <div className="space-y-4">
                {[
                  { icon: "📧", text: "Kiểm tra email xác nhận", color: "text-green-600", completed: false },
                  { icon: "📄", text: "Chuẩn bị giấy tờ (CMND, GPLX)", color: "text-blue-600", completed: false },
                  { icon: "📞", text: "Liên hệ nếu có thay đổi", color: "text-purple-600", completed: false },
                  { icon: "⏰", text: "Đến đúng giờ nhận xe", color: "text-orange-600", completed: false },
                ].map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg bg-gray-50`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-100`}
                    >
                      <span className="text-lg">{step.icon}</span>
                    </div>
                    <span className={`text-gray-700`}>{step.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Contact Support */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaHeadset />
                Hỗ trợ 24/7
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FaPhone />
                  <span>Hotline: 1900 1234</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaEnvelope />
                  <span>support@rentcar.com</span>
                </div>
                <div className="text-sm opacity-90">Chúng tôi luôn sẵn sàng hỗ trợ bạn mọi lúc, mọi nơi</div>
              </div>
            </div>

            {/* Enhanced Actions */}
            <div className="space-y-3">
              <button
                onClick={downloadBookingConfirmation}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FaDownload />
                Tải xác nhận đặt xe
              </button>
              <Link
                to="/"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FaHome />
                Về trang chủ
              </Link>
              <Link
                to="/search"
                className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:border-blue-500 hover:text-blue-600 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FaSearch />
                Đặt xe khác
              </Link>
            </div>

            {/* Promotional banner */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-4 text-white">
              <div className="flex items-center gap-3">
                <FaGift className="text-2xl" />
                <div>
                  <div className="font-bold">Ưu đãi đặc biệt!</div>
                  <div className="text-sm opacity-90">Giảm 10% cho lần đặt xe tiếp theo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PageFooter />
    </div>
  )
}

export default BookingSuccessPage
