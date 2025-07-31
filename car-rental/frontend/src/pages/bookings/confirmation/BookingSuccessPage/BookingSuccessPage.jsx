"use client"

import { useEffect, useState } from "react"
import { useLocation, useNavigate, Link, useSearchParams } from "react-router-dom"
import { getBookingByTransactionId, getBookingById, getCarById } from "@/services/api"
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
  FaPrint,
  FaReceipt,
  FaClipboardList,
  FaSmile,
  FaThumbsUp,
  FaParking,
  FaGasPump,
  FaUsers,
  FaCog,
} from "react-icons/fa"
import LoadingSpinner from '@/components/ui/Loading/LoadingSpinner.jsx';
import Footer from '@/components/layout/Footer/Footer.jsx';

// Progress Steps Component
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

// Page Header Component
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

// Main BookingSuccessPage Component
const BookingSuccessPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // State management
  const [bookingData, setBookingData] = useState(null)
  const [carDetails, setCarDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)

  // Extract data from location state or search params
  const {
    bookingId: stateBookingId,
    paymentId: statePaymentId,
    amount: stateAmount,
    priceBreakdown: statePriceBreakdown,
    totalAmount: stateTotalAmount,
    withDriver: stateWithDriver,
    deliveryRequested: stateDeliveryRequested,
    customerInfo: stateCustomerInfo,
    bookingData: stateBookingData,
    collateralAmount: stateCollateralAmount,
  } = location.state || {}

  // Search params fallback - Cải tiến cách lấy thông tin từ URL
  const urlBookingId = searchParams.get("bookingId") || searchParams.get("booking_id")
  const urlPaymentId = searchParams.get("paymentId") || searchParams.get("payment_id")
  
  // VNPay parameters - sử dụng tên chuẩn từ VNPay
  const vnpTxnRef = searchParams.get("vnp_TxnRef")
  const vnpayOrderInfo = searchParams.get("vnp_OrderInfo")
  const vnpayResponseCode = searchParams.get("vnp_ResponseCode")
  const vnpayTransactionStatus = searchParams.get("vnp_TransactionStatus")
  
  // MoMo parameters - sử dụng tên chuẩn từ MoMo
  const momoOrderId = searchParams.get("orderId")
  const momoRequestId = searchParams.get("requestId")
  const momoResultCode = searchParams.get("resultCode")
  const momoMessage = searchParams.get("message")
  const momoOrderInfo = searchParams.get("orderInfo")
  const momoTransId = searchParams.get("transId")
  
  // Transaction ID có thể từ VNPay hoặc MoMo hoặc custom param
  const urlTransactionId = searchParams.get("txn_ref") || vnpTxnRef || momoOrderId
  
  // Extract booking ID từ order info với logic cải tiến
  const orderInfoBookingId = (() => {
    let orderInfo = vnpayOrderInfo || momoOrderInfo
    if (!orderInfo) return null
    
    // Nếu order info có format "booking-123" hoặc "123"
    if (orderInfo.includes('-')) {
      return orderInfo.split('-')[1]
    }
    // Nếu là số thuần
    if (/^\d+$/.test(orderInfo)) {
      return orderInfo
    }
    return null
  })()
  
  // Debug payment parameters với format rõ ràng hơn
  console.log("🔍 Payment URL Parameters:", {
    // VNPay
    vnp_TxnRef: vnpTxnRef,
    vnp_OrderInfo: vnpayOrderInfo,
    vnp_ResponseCode: vnpayResponseCode,
    vnp_TransactionStatus: vnpayTransactionStatus,
    // MoMo
    momo_orderId: momoOrderId,
    momo_requestId: momoRequestId,
    momo_resultCode: momoResultCode,
    momo_message: momoMessage,
    momo_orderInfo: momoOrderInfo,
    momo_transId: momoTransId,
    // Common
    urlBookingId,
    urlPaymentId,
    urlTransactionId,
    orderInfoBookingId,
    // URL source
    txn_ref_param: searchParams.get("txn_ref"),
    allParams: Object.fromEntries(searchParams)
  })

  const bookingId = stateBookingId || urlBookingId || orderInfoBookingId
  const paymentId = statePaymentId || urlPaymentId || urlTransactionId || vnpTxnRef || momoOrderId || momoRequestId

  // Detect payment method từ URL parameters với logic cải tiến
  const detectPaymentMethod = () => {
    // Ưu tiên VNPay nếu có vnp_ResponseCode hoặc vnp_TxnRef
    if (vnpayResponseCode || vnpayTransactionStatus || vnpTxnRef) {
      return 'vnpay';
    }
    // MoMo nếu có resultCode hoặc orderId từ MoMo
    if (momoResultCode || momoOrderId || momoRequestId) {
      return 'momo';
    }
    // Fallback kiểm tra txn_ref parameter (thường từ payment gateway)
    const txn = searchParams.get("txn_ref");
    if (txn) {
      if (txn.toLowerCase().includes("vnpay")) return "vnpay";
      if (txn.toLowerCase().includes("momo")) return "momo";
      return 'online';
    }
    return null;
  }

  const detectedPaymentMethod = detectPaymentMethod()

  // Fetch booking data
  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        setLoading(true)
        let data = null

        console.log("🔄 Starting fetch with:", {
          stateBookingData: !!stateBookingData,
          paymentId,
          bookingId,
          vnpayResponseCode,
          vnpayTransactionStatus,
          momoResultCode,
          momoMessage,
          detectedPaymentMethod,
          txnRefParam: searchParams.get("txn_ref")
        })

        // Check payment success với logic rõ ràng hơn
        if (vnpayResponseCode && vnpayResponseCode !== "00") {
          setError(`Thanh toán VNPay không thành công. Mã lỗi: ${vnpayResponseCode}`)
          setLoading(false)
          return
        }
        
        if (momoResultCode && momoResultCode !== "0") {
          setError(`Thanh toán MoMo không thành công. ${momoMessage || `Mã lỗi: ${momoResultCode}`}`)
          setLoading(false)
          return
        }

        if (stateBookingData) {
          // Use data from location state
          console.log("✅ Using state data")
          data = stateBookingData
        } else {
          // Thử các phương thức fetch theo thứ tự ưu tiên
          const fetchMethods = [
            // 1. Thử txn_ref param trước (từ code mẫu)
            { 
              id: searchParams.get("txn_ref"), 
              method: 'transaction', 
              label: 'txn_ref parameter' 
            },
            // 2. Thử paymentId
            { 
              id: paymentId, 
              method: 'transaction', 
              label: 'paymentId' 
            },
            // 3. Thử bookingId trực tiếp
            { 
              id: bookingId, 
              method: 'booking', 
              label: 'bookingId' 
            }
          ]

          for (const fetchMethod of fetchMethods) {
            if (!fetchMethod.id) continue
            
            try {
              console.log(`🔄 Fetching by ${fetchMethod.label}:`, fetchMethod.id)
              
              if (fetchMethod.method === 'transaction') {
                const response = await getBookingByTransactionId(fetchMethod.id)
                console.log(`📦 Transaction API response (${fetchMethod.label}):`, response)
                data = response.data || response
              } else {
                const response = await getBookingById(fetchMethod.id)
                console.log(`📦 Booking API response (${fetchMethod.label}):`, response)
                data = response.data || response
              }
              
              if (data) {
                console.log(`✅ Success with ${fetchMethod.label}`)
                break
              }
            } catch (error) {
              console.warn(`⚠️ ${fetchMethod.label} failed:`, error.message)
              continue
            }
          }
        }

        if (data) {
          console.log("✅ Data found:", data)
          
          // Enhanced data parsing với fallback logic
          const enhancedData = {
            ...data,
            car: data.car || data.vehicle || {},
            customerInfo: stateCustomerInfo || data.customer || data.user || data.customerInfo || {},
            priceBreakdown: statePriceBreakdown || data.priceBreakdown || {},
            withDriver: stateWithDriver !== undefined ? stateWithDriver : data.withDriver,
            deliveryRequested: stateDeliveryRequested !== undefined ? stateDeliveryRequested : data.deliveryRequested,
            
            // Enhanced payment amount parsing
            paymentAmount: (() => {
              if (stateAmount) return stateAmount
              if (data.amount) return data.amount
              if (data.depositAmount) return data.depositAmount
              // Từ priceBreakdown
              if (data.priceBreakdown?.deposit) return data.priceBreakdown.deposit
              if (statePriceBreakdown?.deposit) return statePriceBreakdown.deposit
              return 0
            })(),
            
            // Enhanced total amount parsing - theo logic của PaymentPage components
            totalAmount: (() => {
              console.log("🔍 [DEBUG] Enhanced parsing totalAmount from:", {
                'bookingInfo.totalAmount (stateTotalAmount)': stateTotalAmount,
                'priceBreakdown.total (statePriceBreakdown)': statePriceBreakdown?.total,
                'data.totalAmount': data.totalAmount,
                'data.priceBreakdown.total': data.priceBreakdown?.total,
                'data.amount': data.amount,
                'stateAmount': stateAmount
              })
              
              // Logic giống InitialPaymentSummary và PickupPaymentSummary:
              // 1. Ưu tiên bookingInfo.totalAmount (từ state)
              if (stateTotalAmount && stateTotalAmount > 0) {
                console.log("Using stateTotalAmount (bookingInfo.totalAmount):", stateTotalAmount)
                return Number(stateTotalAmount)
              }
              
              // 2. Fallback priceBreakdown.total (từ state)
              if (statePriceBreakdown?.total && statePriceBreakdown.total > 0) {
                console.log("Using statePriceBreakdown.total:", statePriceBreakdown.total)
                return Number(statePriceBreakdown.total)
              }
              
              // 3. Từ API data - bookingInfo.totalAmount
              if (data.totalAmount && data.totalAmount > 0) {
                console.log("Using data.totalAmount:", data.totalAmount)
                return Number(data.totalAmount)
              }
              
              // 4. Từ API data - priceBreakdown.total
              if (data.priceBreakdown?.total && data.priceBreakdown.total > 0) {
                console.log("Using data.priceBreakdown.total:", data.priceBreakdown.total)
                return Number(data.priceBreakdown.total)
              }
              
              // 5. Fallback khác
              if (data.totalCost && data.totalCost > 0) {
                console.log("Using data.totalCost:", data.totalCost)
                return Number(data.totalCost)
              }
              
              if (data.total && data.total > 0) {
                console.log("Using data.total:", data.total)
                return Number(data.total)
              }
              
              // 6. Last resort: payment amounts (có thể chỉ là deposit)
              if (stateAmount && stateAmount > 0) {
                console.log("Using stateAmount as last resort:", stateAmount)
                return Number(stateAmount)
              }
              
              if (data.amount && data.amount > 0) {
                console.log("Using data.amount as last resort:", data.amount)
                return Number(data.amount)
              }
              
              console.log("⚠️ No totalAmount found in enhanced parsing")
              return 0
            })(),
            
            // Enhanced payment details parsing
            paymentDetails: (() => {
              if (data.paymentDetails && Array.isArray(data.paymentDetails)) return data.paymentDetails
              if (data.payments && Array.isArray(data.payments)) return data.payments
              if (data.paymentHistory && Array.isArray(data.paymentHistory)) return data.paymentHistory
              return []
            })(),
            
            // Enhanced payment method parsing
            paymentMethod: (() => {
              if (data.paymentMethod) return data.paymentMethod
              // Từ payment details
              if (data.paymentDetails && Array.isArray(data.paymentDetails) && data.paymentDetails.length > 0) {
                const latestPayment = data.paymentDetails[data.paymentDetails.length - 1]
                return latestPayment.paymentMethod
              }
              if (data.payments && Array.isArray(data.payments) && data.payments.length > 0) {
                const latestPayment = data.payments[data.payments.length - 1]
                return latestPayment.paymentMethod
              }
              return null
            })(),
          }

          setBookingData(enhancedData)
          
          console.log("✅ Enhanced booking data loaded:", enhancedData)
          console.log("🔍 Payment details found:", enhancedData.paymentDetails)
          console.log("💰 Payment amounts:", {
            paymentAmount: enhancedData.paymentAmount,
            totalAmount: enhancedData.totalAmount,
            paymentMethod: enhancedData.paymentMethod
          })
          console.log("🏷️ Price breakdown:", enhancedData.priceBreakdown)
          console.log("📍 Location state data:", {
            stateAmount,
            stateTotalAmount,
            statePriceBreakdown,
            hasLocationState: !!location.state
          })
          console.log("Car info:", enhancedData.car)
          
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 5000)
        } else {
          console.error("❌ No data found")
          setError("Không tìm thấy thông tin đặt xe. Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ.")
        }
      } catch (err) {
        console.error("❌ Error fetching booking data:", err)
        console.error("Error details:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        })
        
        if (err.response?.status === 404) {
          setError("Không tìm thấy thông tin đặt xe với mã này.")
        } else if (err.response?.status === 401) {
          setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
        } else {
          setError("Có lỗi xảy ra khi tải thông tin đặt xe. Vui lòng thử lại sau.")
        }
      } finally {
        setLoading(false)
      }
    }

    if (paymentId || bookingId || stateBookingData || searchParams.get("txn_ref")) {
      fetchBookingData()
    } else {
      console.error("❌ No identifier found to fetch booking data")
      setError("Không có thông tin để tải dữ liệu đặt xe.")
      setLoading(false)
    }
  }, [bookingId, paymentId, stateBookingData, vnpayResponseCode, momoResultCode, searchParams])

  // Fetch car details separately if carId is available
  useEffect(() => {
    const fetchCarDetails = async () => {
      if (bookingData?.carId && (!bookingData.car || bookingData.car.model === 'Không xác định')) {
        try {
          console.log("Fetching car details for carId:", bookingData.carId)
          const carResponse = await getCarById(bookingData.carId)
          console.log("Car details response:", carResponse)
          console.log("Car image from API:", carResponse?.data?.image || carResponse?.image)
          setCarDetails(carResponse.data || carResponse)
        } catch (err) {
          console.error("Error fetching car details:", err)
        }
      }
    }

    fetchCarDetails()
  }, [bookingData?.carId])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <LoadingSpinner size="large" text="Đang tải thông tin..." subText="Vui lòng chờ trong giây lát" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50">
        <PageHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <FaExclamationTriangle className="text-4xl text-red-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Không tìm thấy thông tin</h1>
            <p className="text-xl text-gray-600 mb-8">{error}</p>
            <div className="bg-gray-100 rounded-xl p-4 mb-8 text-left text-sm">
              <h3 className="font-bold mb-2">Thông tin thanh toán:</h3>
              <div className="space-y-1">
                <p><strong>Payment ID:</strong> {paymentId || 'Không có'}</p>
                <p><strong>Booking ID:</strong> {bookingId || 'Không có'}</p>
                <p><strong>Transaction Ref:</strong> {searchParams.get("txn_ref") || 'Không có'}</p>
                <p><strong>Order Info Booking ID:</strong> {orderInfoBookingId || 'Không có'}</p>
                <p><strong>Phương thức thanh toán:</strong> {paymentInfo.paymentMethod ? (paymentInfo.paymentMethod === 'vnpay' ? 'VNPay' : paymentInfo.paymentMethod === 'momo' ? 'MoMo' : paymentInfo.paymentMethod === 'cash' ? 'Tiền mặt' : paymentInfo.paymentMethod) : 'Không xác định'}</p>
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <p className="font-semibold">Tổng tiền:</p>
                  <p>{paymentInfo.totalAmount.toLocaleString()} VND</p>
                  <p className="font-semibold mt-2">Đã thanh toán:</p>
                  <p>{paymentInfo.paidAmount.toLocaleString()} VND</p>
                  <p className="font-semibold mt-2">Còn lại:</p>
                  <p>{paymentInfo.remainingAmount.toLocaleString()} VND</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <Link
                to="/"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
              >
                <FaHome className="mr-3" />
                Về trang chủ
              </Link>
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all duration-300 mr-4"
                >
                  <FaReceipt className="mr-2" />
                  Thử lại
                </button>
                <Link
                  to="/profile?tab=bookings"
                  className="inline-flex items-center px-6 py-3 bg-blue-200 text-blue-700 font-semibold rounded-xl hover:bg-blue-300 transition-all duration-300"
                >
                  <FaSearch className="mr-2" />
                  Xem lịch sử đặt xe
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const {
    car = {},
    pickupDateTime,
    dropoffDateTime,
    pickupLocation,
    dropoffLocation,
    customerInfo = {},
    priceBreakdown = {},
    withDriver,
    deliveryRequested,
    paymentAmount,
    totalAmount,
    paymentMethod,
    paymentDetails = [],
  } = bookingData

  // Parse payment information từ booking data với enhanced fallback logic
  const getPaymentInfo = () => {
    // Ưu tiên lấy tổng tiền từ priceBreakdown
    const total = priceBreakdown?.total || totalAmount || 0;

    // Tính tổng đã thanh toán từ paymentDetails (chỉ lấy payment đã paid)
    let paid = 0;
    if (Array.isArray(paymentDetails) && paymentDetails.length > 0) {
      paid = paymentDetails
        .filter(p => p.statusName === 'paid')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    } else if (paymentAmount) {
      paid = Number(paymentAmount);
    }

    // Nếu là thanh toán online (VNPay/MoMo) và paid = 0, fallback paid = total
    let method = paymentMethod || detectedPaymentMethod;
    if ((method === 'vnpay' || method === 'momo') && paid === 0) {
      paid = total;
    }

    const remaining = Math.max(0, total - paid);

    return {
      paidAmount: paid,
      totalAmount: total,
      remainingAmount: remaining,
      paymentMethod: method
    };
  };

  const paymentInfo = getPaymentInfo()

  // Use carDetails if available, otherwise fallback to booking car data
  const carInfo = carDetails || car || {}
  
  // Get the main image or first image from images array
  const getCarImage = () => {
    if (carInfo.images && Array.isArray(carInfo.images) && carInfo.images.length > 0) {
      // Try to find main image first
      const mainImage = carInfo.images.find(img => img.isMain === true)
      if (mainImage && mainImage.imageUrl) {
        return mainImage.imageUrl
      }
      // Otherwise use first image
      if (carInfo.images[0] && carInfo.images[0].imageUrl) {
        return carInfo.images[0].imageUrl
      }
    }
    // Fallback to other image fields
    return carInfo.image || carInfo.imageUrl || carInfo.photo || null
  }

  const carImageUrl = getCarImage()
  
  // Debug car info
  console.log("Final carInfo used for display:", carInfo)
  console.log("Available image fields:", {
    image: carInfo.image,
    imageUrl: carInfo.imageUrl,
    photo: carInfo.photo,
    images: carInfo.images,
    allKeys: Object.keys(carInfo)
  })
  console.log("Selected car image URL:", carImageUrl)

  // Calculate rental duration
  const startDate = new Date(pickupDateTime)
  const endDate = new Date(dropoffDateTime)
  const rentalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))

  // Hàm lấy tổng tiền đồng bộ với PaymentPage
  const getTotalAmount = () => {
    if (priceBreakdown && priceBreakdown.total && priceBreakdown.total > 0) return priceBreakdown.total;
    if (typeof totalAmount !== 'undefined' && totalAmount > 0) return totalAmount;
    if (typeof actualPaidAmount !== 'undefined' && actualPaidAmount > 0) return actualPaidAmount;
    return 0;
  };

  // Hàm lấy dữ liệu tóm tắt thanh toán chuẩn hóa
  const getPaymentSummaryData = () => {
    return {
      priceBreakdown: statePriceBreakdown || bookingData.priceBreakdown || {},
      collateralAmount: stateCollateralAmount || bookingData.collateralAmount || 0,
      withDriver: typeof stateWithDriver !== 'undefined' ? stateWithDriver : bookingData.withDriver,
      deliveryRequested: typeof stateDeliveryRequested !== 'undefined' ? stateDeliveryRequested : bookingData.deliveryRequested,
      paymentMethod: paymentInfo.paymentMethod,
      isProcessing: false,
      bookingInfo: bookingData,
      disablePaymentButton: true,
    };
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <PageHeader />
        
        {/* Confetti Effect */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-3 h-3 animate-bounce ${
                  i % 4 === 0 ? 'bg-green-500' : 
                  i % 4 === 1 ? 'bg-blue-500' : 
                  i % 4 === 2 ? 'bg-yellow-500' : 'bg-purple-500'
                } rounded-full`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 3}s`,
                }}
              />
            ))}
          </div>
        )}

        <main className="container mx-auto px-4 py-12">
          {/* Success Header */}
          <div className="text-center mb-16">
            <div className="relative">
              <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                <FaCheckCircle className="text-6xl text-green-600 animate-bounce" />
              </div>
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-ping"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-blue-400 rounded-full animate-bounce"></div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Đặt xe thành công!
            </h1>
            <p className="text-2xl text-gray-700 mb-4">
              Cảm ơn bạn đã chọn <span className="font-bold text-blue-600">DriveLuxe</span>
            </p>
            <p className="text-lg text-gray-600">
              Thông tin xác nhận đã được gửi đến email của bạn
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-start">
            {/* Left Column - Booking Details */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Booking Information Card */}
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-100 h-fit">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mr-4">
                    <FaFileAlt className="text-2xl text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Thông tin đặt xe</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                      <FaClipboardList className="text-blue-600 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Mã đặt xe</p>
                        <p className="font-bold text-gray-900">#{bookingId}</p>
                      </div>
                    </div>
                    <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                      <FaCalendarAlt className="text-green-600 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Thời gian thuê</p>
                        <p className="font-bold text-gray-900">{rentalDays} ngày</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                      <FaReceipt className="text-yellow-600 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Mã thanh toán</p>
                        <p className="font-bold text-gray-900">#{paymentId || 'Đang cập nhật'}</p>
                      </div>
                    </div>
                    <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                      <FaThumbsUp className="text-purple-600 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Trạng thái</p>
                        <p className="font-bold text-green-600">Đã xác nhận</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Car Information Card */}
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-100 h-fit">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mr-4">
                    <FaCar className="text-2xl text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Thông tin xe</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {carInfo.model || carInfo.name || carInfo.carModel || 'Thông tin xe đang được cập nhật'}
                      </h3>
                      <p className="text-gray-600">
                        {carInfo.brandName || carInfo.brand?.brandName || carInfo.brand?.name || carInfo.brand || 'Thương hiệu'} 
                        {carInfo.year && ` - ${carInfo.year}`}
                        
                      </p>
                      {carInfo.describe && (
                        <p className="text-sm text-gray-500 mt-2">{carInfo.describe}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4">
                        <FaParking className="text-blue-600 mb-2" />
                        <p className="text-sm text-gray-600 mb-1">Biển số</p>
                        <p className="font-bold text-gray-900">
                          {carInfo.licensePlate || carInfo.plateNumber || carInfo.numberPlate || 'Chưa có thông tin'}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                        <FaUsers className="text-green-600 mb-2" />
                        <p className="text-sm text-gray-600 mb-1">Số ghế</p>
                        <p className="font-bold text-gray-900">
                          {carInfo.numOfSeats || carInfo.seats || carInfo.seatCount || carInfo.numberOfSeats || 
                           bookingData.seatNumber || 'Chưa xác định'}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4">
                        <FaCog className="text-yellow-600 mb-2" />
                        <p className="text-sm text-gray-600 mb-1">Màu sắc</p>
                        <p className="font-bold text-gray-900">
                          {carInfo.color || carInfo.carColor || 'Chưa có thông tin'}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4">
                        <FaGasPump className="text-red-600 mb-2" />
                        <p className="text-sm text-gray-600 mb-1">Nhiên liệu</p>
                        <p className="font-bold text-gray-900">
                          {carInfo.fuelTypeName || carInfo.fuelType?.fuelTypeName || carInfo.fuelType?.name || carInfo.fuel || 'Chưa xác định'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="relative group">
                      <div className="w-64 h-48 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center overflow-hidden">
                        {carImageUrl ? (
                          <img
                            src={carImageUrl}
                            alt={carInfo.model || carInfo.name || 'Car'}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              console.log("Image load error:", e.target.src)
                              e.target.style.display = 'none'
                              e.target.parentNode.innerHTML = '<div class="text-6xl text-gray-400 flex items-center justify-center h-full"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M39 39a56.06 56.06 0 0 0 0 79.2L67.64 146.8C75.75 126.6 93.8 112 115.2 112H410c22.34 0 40.89 15.28 48.48 36.15C459.79 159.86 472 179.71 472 200v192c0 22.09-17.91 40-40 40H80c-22.09 0-40-17.91-40-40V200c0-20.29 12.21-40.14 13.52-51.85C61.11 127.28 79.66 112 102 112h13.2c21.4 0 39.45 14.6 47.56 34.8L191.36 118.2a56.06 56.06 0 0 0 0-79.2zM256 328c37.49 0 72.07-14.54 96-40.97V328c0 53.02-42.98 96-96 96s-96-42.98-96-96v-40.97C184.07 313.46 218.65 328 256 328z"></path></svg></div>'
                            }}
                          />
                        ) : (
                          <FaCar className="text-6xl text-gray-400" />
                        )}
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <FaCheckCircle className="text-white text-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trip Details Card */}
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-100 h-fit">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mr-4">
                    <FaMapMarkerAlt className="text-2xl text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Chi tiết chuyến đi</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                          <FaCalendarAlt className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Thời gian nhận xe</p>
                          <p className="font-bold text-gray-900">
                            {new Date(pickupDateTime).toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-1">
                          <FaMapMarkerAlt className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Địa điểm nhận xe</p>
                          <p className="font-bold text-gray-900">{pickupLocation || 'Đang cập nhật'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                          <FaCalendarAlt className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Thời gian trả xe</p>
                          <p className="font-bold text-gray-900">
                            {new Date(dropoffDateTime).toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mr-3 mt-1">
                          <FaMapMarkerAlt className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Địa điểm trả xe</p>
                          <p className="font-bold text-gray-900">{dropoffLocation || 'Đang cập nhật'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Services */}
                  {(withDriver || deliveryRequested) && (
                    <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl">
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                        <FaGift className="text-yellow-600 mr-2" />
                        Dịch vụ bổ sung
                      </h3>
                      <div className="space-y-2">
                        {withDriver && (
                          <div className="flex items-center text-gray-700">
                            <FaUser className="text-blue-600 mr-2" />
                            <span>Thuê xe có tài xế</span>
                          </div>
                        )}
                        {deliveryRequested && (
                          <div className="flex items-center text-gray-700">
                            <FaCarSide className="text-green-600 mr-2" />
                            <span>Giao xe tận nơi</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Information Card */}
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-100 h-fit">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mr-4">
                    <FaUser className="text-2xl text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Thông tin khách hàng</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                    <FaUser className="text-blue-600 mr-3 text-xl" />
                    <div>
                      <p className="text-sm text-gray-600">Họ và tên</p>
                      <p className="font-bold text-gray-900">
                        {customerInfo.fullName || customerInfo.username || 'Đang cập nhật'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                    <FaPhone className="text-green-600 mr-3 text-xl" />
                    <div>
                      <p className="text-sm text-gray-600">Số điện thoại</p>
                      <p className="font-bold text-gray-900">{customerInfo.phone || 'Đang cập nhật'}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                    <FaEnvelope className="text-purple-600 mr-3 text-xl" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-bold text-gray-900">{customerInfo.email || 'Đang cập nhật'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Payment Summary & Actions */}
            <div className="space-y-8">
              
              {/* Next Steps Card - Di chuyển lên trên */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 border border-blue-100">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mr-4">
                    <FaInfoCircle className="text-2xl text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Bước tiếp theo</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Kiểm tra email xác nhận</p>
                      <p className="text-sm text-gray-600">Chúng tôi đã gửi thông tin chi tiết đến email của bạn</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Chuẩn bị giấy tờ</p>
                      <p className="text-sm text-gray-600">Mang theo CMND/CCCD và bằng lái xe khi nhận xe</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Liên hệ hỗ trợ</p>
                      <p className="text-sm text-gray-600">Gọi hotline 1900-xxxx nếu cần hỗ trợ</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Summary Card */}
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-100 h-fit">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mr-4">
                    <FaCreditCard className="text-2xl text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Tóm tắt thanh toán</h2>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-blue-50 p-6 mb-4">
                  <table className="w-full text-left text-gray-800">
                    <tbody>
                      <tr>
                        <td className="py-2 font-semibold">Tổng cộng</td>
                        <td className="py-2 text-right font-bold text-blue-700">
                          {paymentInfo.totalAmount ? paymentInfo.totalAmount.toLocaleString() + ' VND' : '0 VND'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2">Đã thanh toán</td>
                        <td className="py-2 text-right">
                          {paymentInfo.paidAmount ? paymentInfo.paidAmount.toLocaleString() + ' VND' : '0 VND'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2">Còn lại</td>
                        <td className="py-2 text-right">
                          {paymentInfo.remainingAmount ? paymentInfo.remainingAmount.toLocaleString() + ' VND' : '0 VND'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2">Phương thức</td>
                        <td className="py-2 text-right">
                          {(() => {
                            const method = paymentInfo.paymentMethod || detectedPaymentMethod
                            switch(method) {
                              case 'vnpay': return 'VNPay'
                              case 'momo': return 'MoMo'
                              case 'cash': return 'Tiền mặt'
                              case 'online': return 'Thanh toán online'
                              default: return method || 'Chưa xác định'
                            }
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Enhanced Payment Method Info */}
              {(paymentInfo.paymentMethod || detectedPaymentMethod) && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6 border border-blue-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaCreditCard className="text-blue-600 text-xl" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">Phương thức thanh toán</p>
                      <p className="text-xl font-bold text-gray-900">
                        {(() => {
                          const method = paymentInfo.paymentMethod || detectedPaymentMethod
                          switch(method) {
                            case 'vnpay': return 'VNPay'
                            case 'momo': return 'MoMo' 
                            case 'cash': return 'Tiền mặt'
                            case 'online': return 'Thanh toán online'
                            default: return method || 'Chưa xác định'
                          }
                        })()}
                      </p>
                      {/* Payment Gateway Status */}
                      {(vnpayResponseCode || momoResultCode) && (
                        <div className="mt-2">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                            vnpayResponseCode === "00" || momoResultCode === "0" 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {vnpayResponseCode === "00" ? (
                              <>
                                <FaCheckCircle />
                                VNPay: Thanh toán thành công
                              </>
                            ) : vnpayResponseCode ? (
                              <>
                                <FaTimesCircle />
                                VNPay: Lỗi {vnpayResponseCode}
                              </>
                            ) : momoResultCode === "0" ? (
                              <>
                                <FaCheckCircle />
                                MoMo: Thanh toán thành công
                              </>
                            ) : momoResultCode ? (
                              <>
                                <FaTimesCircle />
                                MoMo: Lỗi {momoResultCode}
                              </>
                            ) : (
                              <>
                                <FaInfoCircle />
                                Đang xử lý thanh toán...
                              </>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Payment Details Timeline */}
                      {(paymentInfo.depositPayment || paymentInfo.fullPayment) && (
                        <div className="mt-4 space-y-2">
                          {paymentInfo.depositPayment && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Cọc: {new Date(paymentInfo.depositPayment.paymentDate || paymentInfo.depositPayment.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                          )}
                          {paymentInfo.fullPayment && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span>Thanh toán đầy đủ: {new Date(paymentInfo.fullPayment.paymentDate || paymentInfo.fullPayment.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-4">
                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
                >
                  <FaPrint className="mr-3" />
                  In hóa đơn
                </button>
                
                <Link
                  to="/profile?tab=bookings"
                  className="w-full flex items-center justify-center px-6 py-4 bg-white border-2 border-blue-600 text-blue-600 font-semibold rounded-2xl hover:bg-blue-50 transition-all duration-300"
                >
                  <FaSearch className="mr-3" />
                  Xem lịch sử đặt xe
                </Link>
                
                <Link
                  to="/"
                  className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-2xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <FaHome className="mr-3" />
                  Về trang chủ
                </Link>
              </div>

              {/* Support Card */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-8 border border-green-100">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaHeadset className="text-3xl text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Cần hỗ trợ?</h3>
                  <p className="text-gray-600 mb-4">Đội ngũ hỗ trợ 24/7 sẵn sàng giúp bạn</p>
                  <div className="space-y-2">
                    <a
                      href="tel:1900-xxxx"
                      className="flex items-center justify-center text-green-600 font-semibold hover:text-green-700"
                    >
                      <FaPhone className="mr-2" />
                      1900-xxxx
                    </a>
                    <a
                      href="mailto:support@driveluxe.com"
                      className="flex items-center justify-center text-green-600 font-semibold hover:text-green-700"
                    >
                      <FaEnvelope className="mr-2" />
                      support@driveluxe.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Rating Reminder */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-3xl p-8 text-center border border-yellow-100">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaStar className="text-3xl text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Hãy chia sẻ trải nghiệm của bạn!</h3>
              <p className="text-gray-600 mb-6">
                Đánh giá của bạn giúp chúng tôi cải thiện dịch vụ và hỗ trợ khách hàng khác đưa ra lựa chọn tốt hơn
              </p>
              <div className="flex justify-center space-x-2 mb-6">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className="text-3xl text-yellow-400 hover:text-yellow-500 cursor-pointer transition-colors" />
                ))}
              </div>
              <p className="text-sm text-gray-500">
                Chúng tôi sẽ gửi lời nhắc đánh giá sau khi bạn hoàn thành chuyến đi
              </p>
            </div>
          </div>
        </main>
        {/* Footer */}
        <footer className="relative bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white pt-20 pb-10 overflow-hidden mt-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(14,165,233,0.1),transparent_50%)]"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 via-pink-500 via-orange-500 to-yellow-500"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white">
                  <FaCarSide />
                </div>
                <span className="font-bold text-3xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  DriveLuxe
                </span>
              </Link>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Cảm ơn bạn đã tin tưởng và lựa chọn DriveLuxe cho chuyến đi của mình. 
                Chúng tôi cam kết mang đến trải nghiệm tuyệt vời nhất!
              </p>
              <div className="flex justify-center space-x-8 text-gray-400">
                <a href="#" className="hover:text-blue-400 transition-colors">Điều khoản dịch vụ</a>
                <a href="#" className="hover:text-green-400 transition-colors">Chính sách bảo mật</a>
                <a href="#" className="hover:text-pink-400 transition-colors">Liên hệ</a>
              </div>
            </div>
            {/* Divider - subtle line */}
            <div className="w-full h-px bg-slate-700/40 my-8"></div>
            <div className="flex flex-col lg:flex-row justify-between items-center pt-0">
              <div className="mb-4 lg:mb-0">
                <p className="text-gray-400 text-sm flex items-center">
                  <span>© {new Date().getFullYear()} DriveLuxe. All rights reserved.</span>
                  <span className="mx-2 text-red-400">❤️</span>
                  <span>Made with love in Vietnam</span>
                </p>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full opacity-20 animate-ping"></div>
            <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-purple-400 rounded-full opacity-30 animate-pulse"></div>
            <div className="absolute bottom-1/4 left-2/3 w-1.5 h-1.5 bg-pink-400 rounded-full opacity-25 animate-bounce"></div>
          </div>
        </footer>
      </div>
    </>
  )
}

export default BookingSuccessPage