"use client"

import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { getCarById, post, getProfile } from "@/services/api"
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
  FaGift,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaHeadset,
  FaUndoAlt,
  FaCar,
  FaHeart,
  FaThumbsUp,
} from "react-icons/fa"
import { toast } from "react-toastify"
import { useAuth } from "@/hooks/useAuth"
import { getItem } from '@/utils/auth'

// Enhanced Loading Spinner Component
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

// Enhanced Error Message Component
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

// Enhanced Form Input Component
const FormInput = ({ label, icon: Icon, required, error, className = "", ...props }) => {
  return (
    <div className={`mb-6 ${className}`}>
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        {label} {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div
        className={`relative flex items-center border-2 rounded-2xl p-4 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-white ${
          error
            ? "border-red-300 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-100"
            : "border-gray-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100"
        }`}
      >
        {Icon && <Icon className="text-gray-400 mr-4 flex-shrink-0 text-lg" />}
        <input
          {...props}
          className="w-full border-none text-gray-700 focus:outline-none focus:ring-0 placeholder-gray-400 bg-transparent font-medium"
        />
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-2 font-medium flex items-center">
          <FaExclamationTriangle className="mr-2" />
          {error}
        </p>
      )}
    </div>
  )
}

// Enhanced Service Toggle Component
const ServiceToggle = ({ icon: Icon, title, description, price, checked, onChange, color = "blue" }) => {
  const colorClasses = {
    blue: "border-blue-500 bg-blue-50",
    green: "border-green-500 bg-green-50",
    purple: "border-purple-500 bg-purple-50",
    orange: "border-orange-500 bg-orange-50",
  }

  return (
    <div
      className={`p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
        checked ? `${colorClasses[color]} shadow-lg` : "border-gray-200 bg-white hover:border-gray-300"
      }`}
      onClick={() => onChange(!checked)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mr-4 ${
              checked ? `bg-${color}-100 text-${color}-600` : "bg-gray-100 text-gray-600"
            }`}
          >
            <Icon className="text-2xl" />
          </div>
          <div>
            <div className="font-bold text-gray-800 text-lg">{title}</div>
            <div className="text-gray-600 text-sm">{description}</div>
            <div className="text-green-600 font-semibold text-sm mt-1">{price}</div>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  )
}

// Enhanced Page Header Component
const PageHeader = ({ currentStep = 2, backLink = "/search", backText = "Quay lại trang xe" }) => (
  <header className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100 z-50">
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
)

// Enhanced Car Info Card Component
const CarInfoCard = ({ car, bookingData, rentalDays }) => {
  // Get car image with fallback logic
  const getCarImage = () => {
    if (car.images && car.images.length > 0) {
      // Try url first, then imageUrl, then any other image property
      const firstImage = car.images[0];
      return firstImage.url || firstImage.imageUrl || firstImage.src || firstImage;
    }
    return car.image || car.imageUrl || "/placeholder.svg";
  };

  const carImage = getCarImage();

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl mb-8 border border-gray-100 hover:shadow-3xl transition-all duration-500">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Image, Price, Rental Duration, Insurance */}
        <div className="w-full lg:w-2/5 flex flex-col items-center">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden group w-full">
            <img
              src={carImage}
              alt={`Xe ${car.model}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute top-4 right-4">
              <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl text-sm font-semibold text-gray-800 flex items-center gap-2">
                <FaThumbsUp className="text-green-500" />
                {(car.rentalCount ?? car.rental_count ?? 0) > 0
                  ? `${car.rentalCount ?? car.rental_count} lượt thuê`
                  : "Chưa có lượt thuê"}
              </div>
            </div>
          </div>
          {/* Price below image */}
          <div className="mt-4 w-full flex flex-col items-start">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold text-2xl mb-2 shadow-lg">
              {((car.dailyRate || car.daily_rate) / 1000).toFixed(0)}K/ngày
            </div>
            {/* Rental duration below price */}
            <div className="flex items-center text-gray-700 mt-2">
              <FaClock className="text-blue-600 mr-2 text-xl" />
              <span className="font-bold text-lg">Thời gian thuê: {rentalDays} ngày</span>
            </div>
            
          </div>
        </div>
        {/* Right: Car details and trip details */}
        <div className="w-full lg:w-3/5">
          <h3 className="text-3xl font-bold text-gray-800 mb-4">{car.model}</h3>
          {/* Car Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Hãng xe</div>
              <div className="font-bold text-gray-800">{car.brand?.brandName || car.brandName || "-"}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Số ghế</div>
              <div className="font-bold text-gray-800">{car.numOfSeats || "-"}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Năm SX</div>
              <div className="font-bold text-gray-800">{car.year || "-"}</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Biển số</div>
              <div className="font-bold text-gray-800">{car.licensePlate || "-"}</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Màu sắc</div>
              <div className="font-bold text-gray-800">{car.color || "-"}</div>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Nhiên liệu</div>
              <div className="font-bold text-gray-800">{car.fuelType?.fuelTypeName || car.fuelTypeName || "-"}</div>
            </div>
          </div>
          {/* Trip Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mr-4">
                <FaCalendarAlt className="text-xl" />
              </div>
              <div>
                <div className="text-sm text-gray-600 font-medium">Nhận xe</div>
                <div className="font-bold text-gray-800 text-lg">
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
            <div className="flex items-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mr-4">
                <FaCalendarAlt className="text-xl" />
              </div>
              <div>
                <div className="text-sm text-gray-600 font-medium">Trả xe</div>
                <div className="font-bold text-gray-800 text-lg">
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
        </div>
      </div>
    </div>
  );
};

// Enhanced Order Summary Component
const OrderSummary = ({
  priceBreakdown,
  rentalDays,
  promoCode,
  setPromoCode,
  handleApplyPromo,
  isApplyingPromo,
  agreeTerms,
  setAgreeTerms,
  handleConfirm,
  isLoading,
  contactErrors,
}) => (
  <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl sticky top-0 border border-gray-100">
    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
      Tóm tắt đơn hàng
    </h2>

    {/* Price Breakdown */}
    <div className="border-b border-gray-200 pb-8 mb-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
          <span className="text-gray-700 font-medium">Giá thuê ({rentalDays} ngày)</span>
          <span className="font-bold text-lg">{priceBreakdown.basePrice.toLocaleString("vi-VN")}đ</span>
        </div>

        {priceBreakdown.extraFee > 0 && (
          <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
            <span className="text-gray-700 font-medium">Phí dịch vụ bổ sung</span>
            <span className="font-bold text-blue-600 text-lg">{priceBreakdown.extraFee.toLocaleString("vi-VN")}đ</span>
          </div>
        )}

        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
          <span className="text-gray-700 font-medium">Phí dịch vụ (10%)</span>
          <span className="font-bold text-lg">{priceBreakdown.serviceFee.toLocaleString("vi-VN")}đ</span>
        </div>

        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
          <span className="text-gray-700 font-medium">Thuế VAT (10%)</span>
          <span className="font-bold text-lg">{priceBreakdown.tax.toLocaleString("vi-VN")}đ</span>
        </div>

        {priceBreakdown.discount > 0 && (
          <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
            <span className="text-green-700 font-medium">Giảm giá</span>
            <span className="font-bold text-green-600 text-lg">
              -{priceBreakdown.discount.toLocaleString("vi-VN")}đ
            </span>
          </div>
        )}
      </div>
    </div>

    {/* Promo Code */}
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <FaGift className="text-blue-600 text-xl" />
        <span className="font-bold text-gray-800 text-lg">Mã giảm giá</span>
      </div>
      <div className="flex gap-3">
        <input
          type="text"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          placeholder="Nhập mã giảm giá"
          className="flex-1 border-2 border-gray-200 rounded-2xl p-4 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-medium"
        />
        <button
          onClick={handleApplyPromo}
          disabled={isApplyingPromo || !promoCode.trim()}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
        >
          {isApplyingPromo ? <FaSpinner className="animate-spin" /> : "Áp dụng"}
        </button>
      </div>
    </div>

    {/* Total */}
    <div className="border-t border-gray-200 pt-8 mb-8">
      <div className="flex justify-between items-center mb-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
        <span className="font-bold text-gray-900 text-xl">Tổng cộng</span>
        <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {priceBreakdown.total.toLocaleString("vi-VN")}đ
        </span>
      </div>
      <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
        <div className="text-sm text-gray-600 mb-1">Cần thanh toán ngay</div>
        <div className="text-xl font-bold text-yellow-700">{priceBreakdown.deposit.toLocaleString("vi-VN")}đ (30%)</div>
        <div className="text-xs text-gray-500 mt-1">Số tiền còn lại thanh toán khi nhận xe</div>
      </div>
    </div>

    {/* Benefits */}
    <div className="space-y-4 mb-8">
      <div className="flex items-center text-sm text-gray-700 p-3 bg-green-50 rounded-xl">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-4">
          <FaShieldAlt />
        </div>
        <span className="font-medium">Bảo hiểm xe và hành khách theo quy định</span>
      </div>
      <div className="flex items-center text-sm text-gray-700 p-3 bg-blue-50 rounded-xl">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-4">
          <FaHeadset />
        </div>
        <span className="font-medium">Hỗ trợ kỹ thuật 24/7</span>
      </div>
      <div className="flex items-center text-sm text-gray-700 p-3 bg-purple-50 rounded-xl">
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mr-4">
          <FaUndoAlt />
        </div>
        <span className="font-medium">Chính sách hủy linh hoạt</span>
      </div>
    </div>

    {/* Terms Agreement */}
    <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
      <label className="flex items-start cursor-pointer">
        <input
          type="checkbox"
          checked={agreeTerms}
          onChange={(e) => setAgreeTerms(e.target.checked)}
          className="w-6 h-6 text-blue-600 border-gray-300 rounded-lg focus:ring-blue-500 mt-1 mr-4"
        />
        <span className="text-sm text-gray-700 font-medium">
          Tôi đã đọc và đồng ý với các{" "}
          <Link to="/terms" className="text-blue-600 hover:text-blue-800 underline font-semibold">
            điều khoản và điều kiện
          </Link>{" "}
          của dịch vụ
        </span>
      </label>
    </div>

    {/* Confirm Button */}
    <button
      onClick={handleConfirm}
      disabled={!agreeTerms || isLoading || Object.keys(contactErrors).length > 0}
      className={`w-full py-5 rounded-2xl font-bold text-lg transition-all duration-300 transform ${
        !agreeTerms || isLoading || Object.keys(contactErrors).length > 0
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:scale-105 shadow-xl hover:shadow-2xl"
      }`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <FaSpinner className="animate-spin mr-3 text-xl" />
          Đang xử lý...
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <FaCheck className="mr-3 text-xl" />
          Xác nhận đặt xe - Chuyển đến thanh toán
        </div>
      )}
    </button>

    <div className="text-center text-xs text-gray-500 mt-4 font-medium">
      Bằng cách nhấn "Xác nhận đặt xe", bạn đồng ý với các điều khoản và điều kiện của dịch vụ
    </div>
  </div>
)

// Main Component
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
      const savedData = getItem('bookingFormData')
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        setContactInfo((prev) => ({
          ...prev,
          ...parsedData,
        }))
        if (parsedData.withDriver !== undefined) {
          setWithDriver(parsedData.withDriver)
        }
        if (parsedData.deliveryRequested !== undefined) {
          setDeliveryRequested(parsedData.deliveryRequested)
        }
      }
    } catch (error) {
      console.error("Error loading saved form data:", error)
    }
  }

  // Load booking data from localStorage
  const loadBookingData = () => {
    try {
      const bookingData = getItem('lastBookingData')
      if (bookingData) {
        const parsedData = JSON.parse(bookingData)
        setContactInfo((prev) => ({
          ...prev,
          pickupAddress: parsedData.pickupLocation || prev.pickupAddress,
          dropoffAddress: parsedData.dropoffLocation || prev.dropoffAddress,
        }))
      }
    } catch (error) {
      console.error("Error loading booking data:", error)
    }
  }

  // Get user info from localStorage as fallback
  const getUserInfoFromStorage = () => {
    try {
      const username = getItem('username')
      const email = getItem('email')
      const phone = getItem('phone')
      const fullName = getItem('fullName')

      return {
        username,
        email,
        phone,
        fullName,
      }
    } catch (error) {
      console.error("Error getting user info from localStorage:", error)
      return {}
    }
  }

  // Save form data to localStorage
  const saveFormData = (data) => {
    try {
      localStorage.setItem("bookingFormData", JSON.stringify(data))
    } catch (error) {
      console.error("Error saving form data:", error)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login")
      return
    }

    // Load user profile data
    const loadUserProfile = async () => {
      try {
        const userProfile = await getProfile()
        if (userProfile) {
          setContactInfo((prev) => ({
            ...prev,
            fullName: userProfile.userDetail?.fullName || userProfile.username || "",
            phone: userProfile.phone || "",
            email: userProfile.email || "",
            pickupAddress: prev.pickupAddress || userProfile.userDetail?.address || "",
            dropoffAddress: prev.dropoffAddress || userProfile.userDetail?.address || "",
          }))
        }
      } catch (error) {
        if (user) {
          setContactInfo((prev) => ({
            ...prev,
            fullName: user.fullName || user.username || "",
            phone: user.phone || "",
            email: user.email || "",
          }))
        }

        const storageUserInfo = getUserInfoFromStorage()
        if (storageUserInfo.username || storageUserInfo.email) {
          setContactInfo((prev) => ({
            ...prev,
            fullName: prev.fullName || storageUserInfo.fullName || storageUserInfo.username || "",
            phone: prev.phone || storageUserInfo.phone || "",
            email: prev.email || storageUserInfo.email || "",
          }))
        }
      }
    }

    loadUserProfile()
    loadSavedFormData()
    loadBookingData()
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

      let extraFee = 0
      if (withDriver) {
        extraFee += 300000 * days
      }
      if (deliveryRequested) {
        extraFee += 100000
      }

      const serviceFee = Math.round(basePrice * 0.1)
      const tax = Math.round(basePrice * 0.1)
      const total = basePrice + extraFee + serviceFee + tax
      const deposit = Math.round(total * 0.3)

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
    else if (!/^\+?[1-9]\d{7,14}$/.test(contactInfo.phone.replace(/\s/g, ""))) {
      errors.phone = "Số điện thoại không hợp lệ (ví dụ: +84977227788)"
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

      const bookingInfo = {
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

      localStorage.setItem("lastBookingInfo", JSON.stringify(bookingInfo))
      localStorage.setItem("lastPriceBreakdown", JSON.stringify(priceBreakdown))
      localStorage.setItem("lastCustomerInfo", JSON.stringify(contactInfo))

      toast.success("Thông tin đã được lưu! Chuyển đến trang thanh toán.")

      const navigationData = {
        bookingInfo: bookingInfo,
        priceBreakdown,
        depositAmount: priceBreakdown.deposit,
        collateralAmount: 5000000,
        withDriver,
        deliveryRequested,
        customerInfo: { ...contactInfo },
      }

      navigate("/payment", { state: navigationData })
    } catch (err) {
      console.error("Lỗi trong handleConfirm:", err)

      if (err.response?.status === 400) {
        const message = err.response?.data?.message || "Dữ liệu không hợp lệ"
        toast.error(message)
        return
      }
      if (err.response?.status === 401) {
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.")
        navigate("/login")
        return
      }

      toast.error(err.message || "Không thể xử lý yêu cầu. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleContactInfoChange = (e) => {
    const { name, value } = e.target
    setContactInfo((prev) => ({ ...prev, [name]: value }))
    if (contactErrors[name]) {
      setContactErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center max-w-lg mx-auto p-8">
          <div className="mb-8">
            <div className="bg-red-100 p-8 rounded-full inline-block shadow-lg">
              <FaExclamationTriangle className="text-5xl text-red-500" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Không có thông tin đặt xe</h2>
          <p className="text-gray-600 mb-8 text-lg">Vui lòng quay lại trang tìm kiếm để chọn xe.</p>
          <Link
            to="/search"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-8 rounded-2xl font-bold text-lg transition-all duration-300 inline-block transform hover:scale-105 shadow-xl"
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
          <div className="mb-12">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-3xl inline-block shadow-2xl animate-pulse">
              <FaCarSide className="text-6xl text-white animate-bounce" />
            </div>
          </div>
          <LoadingSpinner size="large" />
          <p className="mt-8 text-gray-700 text-2xl font-bold">Đang tải thông tin đặt xe...</p>
          <p className="mt-4 text-gray-500 text-lg">Vui lòng chờ trong giây lát</p>
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
      <PageHeader currentStep={2} backLink="/search" backText="Quay lại trang xe" />

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Xác nhận đặt xe
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Kiểm tra thông tin và hoàn tất đặt xe của bạn</p>
        </div>

        {error && <ErrorMessage message={error} type="error" onClose={() => setError(null)} className="mb-8" />}

        <div className="flex flex-col xl:flex-row gap-12">
          {/* Left Column - Main Content */}
          <div className="w-full xl:w-2/3">
            {/* Car Information */}
            {car && <CarInfoCard car={car} bookingData={bookingData} rentalDays={rentalDays} />}

            {/* Contact Information */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl mb-8 border border-gray-100">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
                Thông tin liên hệ
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl mb-8 border border-gray-100">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
                Tùy chọn dịch vụ
              </h2>

              <div className="space-y-6">
                <ServiceToggle
                  icon={FaUser}
                  title="Thuê tài xế"
                  description="Tài xế chuyên nghiệp, kinh nghiệm lái xe an toàn"
                  price="300,000 VND/ngày"
                  checked={withDriver}
                  onChange={setWithDriver}
                  color="blue"
                />

                <ServiceToggle
                  icon={FaMapMarkerAlt}
                  title="Giao xe tận nơi"
                  description="Giao xe đến địa chỉ của bạn, tiết kiệm thời gian"
                  price="100,000 VND"
                  checked={deliveryRequested}
                  onChange={setDeliveryRequested}
                  color="green"
                />
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-100">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Điều khoản quan trọng
                </h2>
                <button
                  onClick={() => setShowTermsDetails(!showTermsDetails)}
                  className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 transition-colors duration-300 px-4 py-2 rounded-xl hover:bg-blue-50"
                >
                  {showTermsDetails ? "Thu gọn" : "Xem chi tiết"}
                  {showTermsDetails ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mr-4">
                      <FaFileAlt className="text-xl" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-xl">Giấy tờ thuê xe</h3>
                  </div>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-center">
                      <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                      <span className="font-medium">CMND/CCCD + Giấy phép lái xe (bản gốc)</span>
                    </li>
                    <li className="flex items-center">
                      <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                      <span className="font-medium">Hộ khẩu/KT3 hoặc Passport (bản gốc)</span>
                    </li>
                    <li className="flex items-center">
                      <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                      <span className="font-medium">Đặt cọc 5 triệu đồng hoặc xe máy có giá trị tương đương</span>
                    </li>
                  </ul>
                </div>

                {showTermsDetails && (
                  <>
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-yellow-600 mr-4">
                          <FaShieldAlt className="text-xl" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-xl">Quy định sử dụng xe</h3>
                      </div>
                      <ul className="space-y-3 text-gray-700">
                        <li className="flex items-center">
                          <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                          <span className="font-medium">Sử dụng xe đúng mục đích, tuân thủ luật giao thông</span>
                        </li>
                        <li className="flex items-center">
                          <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                          <span className="font-medium">Không sử dụng xe vào mục đích phi pháp, trái pháp luật</span>
                        </li>
                        <li className="flex items-center">
                          <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                          <span className="font-medium">Không hút thuốc, ăn uống có mùi trong xe</span>
                        </li>
                        <li className="flex items-center">
                          <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                          <span className="font-medium">Vệ sinh xe trước khi trả, quá giờ tính phí 100.000đ/giờ</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mr-4">
                          <FaUndoAlt className="text-xl" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-xl">Chính sách hủy/đổi</h3>
                      </div>
                      <ul className="space-y-3 text-gray-700">
                        <li className="flex items-center">
                          <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                          <span className="font-medium">Hủy trước 24h: Hoàn tiền 100%</span>
                        </li>
                        <li className="flex items-center">
                          <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                          <span className="font-medium">Hủy trong vòng 24h: Hoàn tiền 50%</span>
                        </li>
                        <li className="flex items-center">
                          <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                          <span className="font-medium">Không đến nhận xe: Không hoàn tiền</span>
                        </li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="w-full xl:w-1/3">
            <OrderSummary
              priceBreakdown={priceBreakdown}
              rentalDays={rentalDays}
              promoCode={promoCode}
              setPromoCode={setPromoCode}
              handleApplyPromo={handleApplyPromo}
              isApplyingPromo={isApplyingPromo}
              agreeTerms={agreeTerms}
              setAgreeTerms={setAgreeTerms}
              handleConfirm={handleConfirm}
              isLoading={isLoading}
              contactErrors={contactErrors}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/95 backdrop-blur-xl border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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

          <div className="border-t border-gray-200 pt-8 mt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-600">© 2024 RentCar. Tất cả quyền được bảo lưu.</p>
            <div className="flex items-center gap-2 text-gray-600 mt-4 md:mt-0">
              <span>Made with</span>
              <FaHeart className="text-red-500" />
              <span>in Vietnam</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default BookingConfirmationPage
