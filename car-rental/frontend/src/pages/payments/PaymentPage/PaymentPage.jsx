"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate, Link } from "react-router-dom"
import { post } from "@/services/api.js"
import { useAuth } from "@/hooks/useAuth.js"

const PaymentPage = () => {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  // Lấy dữ liệu từ location.state với validation
  const { 
    withDriver, 
    deliveryRequested, 
    customerInfo, 
    depositAmount, 
    collateralAmount,
    bookingId: stateBookingId,
    priceBreakdown: statePriceBreakdown
  } = location.state || {}

  // State management
  const [bookingId, setBookingId] = useState(stateBookingId)
  const [priceBreakdown, setPriceBreakdown] = useState(statePriceBreakdown)
  const [paymentMethod, setPaymentMethod] = useState("")
    const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: "",
  })
  const [error, setError] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [paymentId, setPaymentId] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCardForm, setShowCardForm] = useState(false)
  const [toast, setToast] = useState({ show: false, message: "", type: "" })
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  // Load data from localStorage if not available from state
  useEffect(() => {
    const loadDataFromStorage = () => {
      try {
        if (!bookingId) {
          const storedBookingId = localStorage.getItem("lastBookingId")
          if (storedBookingId) {
            setBookingId(storedBookingId)
          }
        }
        
        if (!priceBreakdown) {
          const storedPriceBreakdown = localStorage.getItem("lastPriceBreakdown")
          if (storedPriceBreakdown) {
            const parsed = JSON.parse(storedPriceBreakdown)
            setPriceBreakdown(parsed)
          }
        }
      } catch (error) {
        console.error('Error loading data from localStorage:', error)
        setError("Lỗi khi tải dữ liệu từ bộ nhớ. Vui lòng thử lại.")
      } finally {
        setIsLoading(false)
      }
    }

    loadDataFromStorage()
  }, [bookingId, priceBreakdown])

  // Validation và error handling
  useEffect(() => {
    if (!isAuthenticated) {
      setError("Vui lòng đăng nhập để tiếp tục thanh toán")
      setTimeout(() => navigate("/login"), 3000)
      return
    }

    if (!bookingId) {
      setError("Không tìm thấy thông tin đặt xe. Vui lòng quay lại trang đặt xe.")
      return
    }

    if (!priceBreakdown) {
      setError("Không tìm thấy thông tin giá. Vui lòng quay lại trang đặt xe.")
      return
    }

    // Validate priceBreakdown structure
    const requiredFields = ['total', 'deposit', 'serviceFee', 'tax']
    const missingFields = requiredFields.filter(field => !priceBreakdown[field])
    
    if (missingFields.length > 0) {
      setError(`Thiếu thông tin giá: ${missingFields.join(', ')}. Vui lòng quay lại trang đặt xe.`)
      return
    }

    setError(null)
  }, [bookingId, priceBreakdown, isAuthenticated, navigate])

  // Calculate amounts with validation
  const DEPOSIT = depositAmount || (priceBreakdown?.deposit || 0)
  const COLLATERAL = collateralAmount || 5000000

  // Toast notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000)
  }

  const handleCardChange = (e) => {
    const { name, value } = e.target
    let formattedValue = value

    if (name === "cardNumber") {
      formattedValue = value
        .replace(/\s/g, "")
        .replace(/(.{4})/g, "$1 ")
        .trim()
      if (formattedValue.length > 19) formattedValue = formattedValue.slice(0, 19)
    } else if (name === "expiryDate") {
      formattedValue = value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1/$2")
      if (formattedValue.length > 5) formattedValue = formattedValue.slice(0, 5)
    } else if (name === "cvv") {
      formattedValue = value.replace(/\D/g, "").slice(0, 4)
    }

    setCardDetails((prev) => ({ ...prev, [name]: formattedValue }))
  }

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method)
    setError(null)
  }

  const validateCardDetails = () => {
    if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, "").length < 16) {
      return "Số thẻ không hợp lệ"
    }
    if (!cardDetails.cardHolder.trim()) {
      return "Vui lòng nhập tên chủ thẻ"
    }
    if (!cardDetails.expiryDate || cardDetails.expiryDate.length < 5) {
      return "Ngày hết hạn không hợp lệ"
    }
    if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
      return "Mã CVV không hợp lệ"
    }
    return null
  }

  const validatePaymentData = () => {
    if (!bookingId) {
      return "Không tìm thấy mã đặt xe"
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
    
    return null
  }

  // Function để kiểm tra kết nối server
  const checkServerConnection = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/payments/test`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      return response.ok
    } catch (error) {
      console.error('Server connection check failed:', error)
      return false
    }
  }

    const handlePayment = async () => {
    // Validate before processing
    const validationError = validatePaymentData()
    if (validationError) {
      setError(validationError)
      return
    }

    // Kiểm tra kết nối server trước khi thanh toán
    const isServerConnected = await checkServerConnection()
    if (!isServerConnected) {
      setError("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.")
      return
        }
        
        try {
      setIsProcessing(true)
      setCurrentStep(2)
      setError(null)

      console.log('[PaymentPage] Bắt đầu thanh toán với dữ liệu:', {
        bookingId,
        amount: DEPOSIT,
        paymentMethod,
        priceBreakdown,
        withDriver,
        deliveryRequested,
        customerInfo
      })
            
            const paymentData = {
        bookingId: Number.parseInt(bookingId),
        amount: DEPOSIT,
        currency: "VND",
                paymentMethod: paymentMethod,
        // Thêm thông tin bổ sung nếu cần
        customerInfo: customerInfo || {
          fullName: user?.fullName || user?.username,
          email: user?.email,
          phone: user?.phone
        },
        withDriver: withDriver || false,
        deliveryRequested: deliveryRequested || false
      }

      console.log('[PaymentPage] Gọi API payment với:', paymentData)

      // Thêm timeout cho API call
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000) // 30 seconds
      })

      const paymentPromise = post("/api/payments", paymentData)
      
      console.log('[PaymentPage] Đã gọi post("/api/payments", paymentData)')
      
      const response = await Promise.race([paymentPromise, timeoutPromise])
      console.log('[PaymentPage] Response từ API payment:', response)
            
            if (response.redirectUrl) {
        console.log('[PaymentPage] Redirect to:', response.redirectUrl)
        window.location.href = response.redirectUrl
            } else {
        setCurrentStep(3)
        setPaymentStatus("success")
        setPaymentId(response.paymentId || response.transactionId)
        showToast("Thanh toán thành công!", "success")

        // Clean up localStorage
        localStorage.removeItem("lastBookingId")
        localStorage.removeItem("lastPriceBreakdown")

                setTimeout(() => {
          // Lấy thông tin xe từ state có sẵn hoặc localStorage
          const carInfo = location.state?.bookingData?.car || JSON.parse(localStorage.getItem('selectedCar') || '{}')
          
          navigate("/booking-success", {
                        state: { 
              bookingId: response.bookingId || bookingId,
              paymentId: response.paymentId || response.transactionId,
              amount: response.amount || DEPOSIT,
                            priceBreakdown: priceBreakdown,
                            withDriver: withDriver,
                            deliveryRequested: deliveryRequested,
              customerInfo: customerInfo,
              bookingData: {
                pickupDateTime: location.state?.bookingData?.pickupDateTime || new Date().toISOString(),
                dropoffDateTime: location.state?.bookingData?.dropoffDateTime || new Date().toISOString(),
                pickupLocation: customerInfo?.pickupAddress || 'Không xác định',
                dropoffLocation: customerInfo?.dropoffAddress || 'Không xác định',
                car: carInfo || { model: 'Không xác định' }
              }
            },
          })
        }, 2000)
            }
        } catch (err) {
      console.error('[PaymentPage] Lỗi thanh toán:', err)
      setCurrentStep(1)
      setPaymentStatus("failed")
      showToast("Thanh toán thất bại!", "error")

      if (err.message === 'Request timeout') {
        setError("Thanh toán bị timeout. Vui lòng thử lại sau.")
      } else if (err.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.")
        setTimeout(() => navigate("/login"), 2000)
            } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Dữ liệu thanh toán không hợp lệ")
            } else if (err.response?.status === 404) {
        setError("Không tìm thấy thông tin đặt xe. Vui lòng thử lại.")
      } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError("Kết nối đến server bị timeout. Vui lòng kiểm tra kết nối mạng và thử lại.")
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
    setCurrentStep(1)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Đang tải thông tin thanh toán...</p>
        </div>
      </div>
    )
  }

  // Error state - không có bookingId hoặc priceBreakdown
  if (!bookingId || !priceBreakdown) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-lg">
          <div className="mb-6">
            <div className="bg-red-100 p-6 rounded-full inline-block">
              <i className="ri-error-warning-line text-4xl text-red-500"></i>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không có thông tin thanh toán</h2>
          <p className="text-gray-600 mb-6">
            {error || "Vui lòng quay lại trang đặt xe để tiếp tục."}
          </p>
          <div className="space-x-4">
            <Link to="/search" className="text-blue-600 hover:underline">
              Tìm xe khác
            </Link>
            <Link to="/" className="text-blue-600 hover:underline">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
            toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5">
              {toast.type === "success" ? <i className="ri-check-line"></i> : <i className="ri-error-warning-line"></i>}
            </div>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Đang xử lý thanh toán</h3>
            <p className="text-gray-600">Vui lòng không đóng trang này...</p>
            <div className="mt-4 bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse"
                style={{ width: "60%" }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white">
                <i className="ri-car-line"></i>
              </div>
              RentCar
            </Link>

            {/* Progress Steps */}
            <div className="hidden md:flex items-center gap-4">
              <div className={`flex items-center gap-2 ${currentStep >= 1 ? "text-blue-600" : "text-gray-400"}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  1
                </div>
                <span className="text-sm font-medium">Chọn thanh toán</span>
              </div>
              <div className={`w-8 h-0.5 ${currentStep >= 2 ? "bg-blue-600" : "bg-gray-200"}`}></div>
              <div className={`flex items-center gap-2 ${currentStep >= 2 ? "text-blue-600" : "text-gray-400"}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  2
                </div>
                <span className="text-sm font-medium">Xử lý</span>
              </div>
              <div className={`w-8 h-0.5 ${currentStep >= 3 ? "bg-blue-600" : "bg-gray-200"}`}></div>
              <div className={`flex items-center gap-2 ${currentStep >= 3 ? "text-green-600" : "text-gray-400"}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= 3 ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  3
                </div>
                <span className="text-sm font-medium">Hoàn thành</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <i className="ri-shield-check-line"></i>
                <span>Bảo mật SSL</span>
              </div>
            </div>
          </div>
        </div>
            </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
            <i className="ri-error-warning-line"></i>
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Payment Form */}
          <div className="lg:col-span-2">
            {paymentStatus === "success" ? (
              <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="ri-check-line text-3xl text-green-600"></i>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Thanh toán thành công!</h2>
                <p className="text-gray-600 mb-2">
                  Mã giao dịch: <span className="font-medium">{paymentId}</span>
                </p>
                <p className="text-gray-600 mb-6">Xác nhận đã được gửi qua email của bạn.</p>
                <div className="space-y-3">
                  <Link
                    to="/booking-success"
                    state={{
                      bookingId: bookingId,
                      paymentId: paymentId,
                      amount: DEPOSIT,
                      priceBreakdown: priceBreakdown,
                      withDriver: withDriver,
                      deliveryRequested: deliveryRequested,
                      customerInfo: customerInfo,
                      bookingData: {
                        pickupDateTime: new Date().toISOString(), // Fallback
                        dropoffDateTime: new Date().toISOString(), // Fallback
                        pickupLocation: customerInfo?.pickupAddress || 'Không xác định',
                        dropoffLocation: customerInfo?.dropoffAddress || 'Không xác định',
                        car: { model: 'Không xác định' }
                      }
                    }}
                    className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                  >
                    Xem chi tiết đặt xe
                  </Link>
                  <Link
                    to="/"
                    className="block w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all duration-300"
                  >
                    Về trang chủ
                  </Link>
                </div>
              </div>
            ) : paymentStatus === "failed" ? (
              <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="ri-close-line text-3xl text-red-600"></i>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Thanh toán thất bại</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <div className="space-y-3">
                  <button
                    onClick={handleRetry}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                  >
                    Thử lại
                  </button>
                  <Link
                    to="/search"
                    className="block w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all duration-300"
                  >
                    Tìm xe khác
                  </Link>
                    </div>
                    </div>
                ) : (
              <div className="space-y-6">
                {/* Payment Methods */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Chọn phương thức thanh toán</h2>

                  <div className="space-y-4">
                    {/* VNPay */}
                    <label
                      className={`block p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                        paymentMethod === "vnpay"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="vnpay"
                            checked={paymentMethod === "vnpay"}
                            onChange={(e) => handlePaymentMethodChange(e.target.value)}
                            className="w-5 h-5 text-blue-600"
                          />
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i className="ri-bank-card-line text-xl text-blue-600"></i>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">VNPay</div>
                            <div className="text-sm text-gray-600">
                              Thanh toán online qua VNPay - Nhanh chóng & An toàn
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                            Khuyến nghị
                          </span>
                          <i className="ri-shield-check-line text-green-600"></i>
                        </div>
                                </div>
                            </label>

                    {/* Cash */}
                    <label
                      className={`block p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                        paymentMethod === "cash"
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-orange-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="cash"
                            checked={paymentMethod === "cash"}
                            onChange={(e) => handlePaymentMethodChange(e.target.value)}
                            className="w-5 h-5 text-orange-600"
                          />
                          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <i className="ri-money-dollar-circle-line text-xl text-orange-600"></i>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Tiền mặt</div>
                            <div className="text-sm text-gray-600">Thanh toán trực tiếp khi nhận xe</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            Truyền thống
                          </span>
                        </div>
                                </div>
                            </label>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <i className="ri-shield-check-line text-blue-600 text-xl mt-0.5"></i>
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Thanh toán an toàn</h4>
                      <p className="text-sm text-blue-700">
                        Thông tin thanh toán của bạn được mã hóa và bảo mật bằng công nghệ SSL 256-bit. Chúng tôi không
                        lưu trữ thông tin thẻ của bạn.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
                                </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt đơn hàng</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Mã đặt xe:</span>
                  <span className="font-medium">#{bookingId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tổng tiền thuê:</span>
                  <span className="font-medium">{priceBreakdown?.total?.toLocaleString()} VND</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phí dịch vụ:</span>
                  <span className="font-medium">{priceBreakdown?.serviceFee?.toLocaleString()} VND</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Thuế VAT:</span>
                  <span className="font-medium">{priceBreakdown?.tax?.toLocaleString()} VND</span>
                </div>
                {priceBreakdown?.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Giảm giá:</span>
                    <span className="font-medium">-{priceBreakdown.discount.toLocaleString()} VND</span>
                  </div>
                )}
                {withDriver && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Thuê tài xế:</span>
                    <span className="font-medium text-green-600">✓ Đã chọn</span>
                  </div>
                )}
                {deliveryRequested && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Giao xe tận nơi:</span>
                    <span className="font-medium text-green-600">✓ Đã chọn</span>
                                </div>
                            )}
                        </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">Cần thanh toán ngay:</span>
                  <span className="text-xl font-bold text-blue-600">{DEPOSIT.toLocaleString()} VND</span>
                </div>
                <p className="text-xs text-gray-500">Số tiền còn lại sẽ thanh toán khi nhận xe</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <div className="flex items-start gap-2">
                  <i className="ri-information-line text-yellow-600 mt-0.5"></i>
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 mb-1">Thế chấp khi nhận xe:</p>
                    <p className="text-yellow-700">{COLLATERAL.toLocaleString()} VND (hoàn lại sau khi trả xe)</p>
                  </div>
                </div>
              </div>

                        <button 
                            onClick={handlePayment} 
                disabled={!paymentMethod || isProcessing}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang xử lý...</span>
                  </div>
                ) : (
                  `Thanh toán ${DEPOSIT.toLocaleString()} VND`
                )}
              </button>

              {/* Test Button */}
              <button
                onClick={async () => {
                  try {
                    console.log('Testing cash payment...');
                    const testData = {
                      bookingId: Number.parseInt(bookingId),
                      amount: DEPOSIT,
                      currency: "VND",
                      paymentMethod: "cash"
                    };
                    const response = await post("/api/payments/test-cash", testData);
                    console.log('Test response:', response);
                    alert(`Test successful: ${JSON.stringify(response)}`);
                  } catch (error) {
                    console.error('Test failed:', error);
                    alert(`Test failed: ${error.message}`);
                  }
                }}
                className="w-full mt-2 py-2 bg-gray-500 text-white rounded-xl font-medium"
              >
                Test Cash Payment
              </button>

              <div className="mt-4 text-center">
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <i className="ri-shield-check-line"></i>
                    <span>SSL Secure</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <i className="ri-lock-line"></i>
                    <span>256-bit Encryption</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">© 2024 RentCar. Tất cả quyền được bảo lưu.</p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <Link to="/terms" className="hover:text-blue-600">
                Điều khoản dịch vụ
              </Link>
              <span>•</span>
              <Link to="/privacy" className="hover:text-blue-600">
                Chính sách bảo mật
              </Link>
              <span>•</span>
              <Link to="/support" className="hover:text-blue-600">
                Hỗ trợ
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PaymentPage
