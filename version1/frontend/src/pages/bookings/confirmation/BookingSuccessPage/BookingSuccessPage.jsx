"use client"

import { useEffect, useState } from "react"
import { useLocation, useNavigate, Link, useSearchParams } from "react-router-dom"
import { getBookingByTransactionId, getBookingById } from "@/services/api"

const BookingSuccessPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { priceBreakdown, withDriver, deliveryRequested, customerInfo } =
    location.state || {}
  const [bookingDetails, setBookingDetails] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showConfetti, setShowConfetti] = useState(true)

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const paymentStatus = params.get('payment_status');
        const txnRef = params.get('txn_ref');
        const bookingIdFromUrl = params.get('booking_id');
        console.log('[BookingSuccessPage] Mounted. payment_status:', paymentStatus, 'txn_ref:', txnRef, 'booking_id:', bookingIdFromUrl);
        const fetchBookingDetails = async () => {
            try {
                setIsLoading(true)
                setError(null)

        const transactionId = searchParams.get('txn_ref');
        let bookingDataFromApi = null;
        let bookingId = null;

        if (transactionId) {
          try {
            console.log(`Fetching booking details for transaction ID: ${transactionId}`)
            bookingDataFromApi = await getBookingByTransactionId(transactionId)
            console.log("Booking details fetched successfully:", bookingDataFromApi)
            bookingId = bookingDataFromApi.bookingId
          } catch (apiError) {
            console.error('API Error fetching booking details by transaction ID:', apiError)
            setError('Không tìm thấy thông tin đặt xe. Mã giao dịch có thể không hợp lệ.')
            setIsLoading(false)
            return
          }
        } else if (bookingIdFromUrl) {
          try {
            console.log(`Fetching booking details for booking ID: ${bookingIdFromUrl}`)
            bookingDataFromApi = await getBookingById(bookingIdFromUrl)
            console.log("Booking details fetched by bookingId:", bookingDataFromApi)
            bookingId = bookingIdFromUrl
          } catch (apiError) {
            console.error('API Error fetching booking details by bookingId:', apiError)
            setError('Không tìm thấy thông tin đặt xe. Mã đặt xe có thể không hợp lệ.')
            setIsLoading(false)
            return
          }
        }

        if (bookingDataFromApi) {
          const pickupDate = new Date(bookingDataFromApi.pickupDateTime).toLocaleString("vi-VN", {
            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
          })
          const dropoffDate = new Date(bookingDataFromApi.dropoffDateTime).toLocaleString("vi-VN", {
            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
          })

          setBookingDetails({
            bookingId: bookingDataFromApi.bookingId,
            paymentId: transactionId || bookingDataFromApi.paymentId || 'N/A',
            amount: bookingDataFromApi.depositAmount || bookingDataFromApi.amount || 0,
            carModel: bookingDataFromApi.car?.model || 'Không xác định',
            pickupLocation: bookingDataFromApi.pickupLocation,
            dropoffLocation: bookingDataFromApi.dropoffLocation,
            pickupDate,
            dropoffDate,
            customerName: bookingDataFromApi.customer?.fullName || bookingDataFromApi.customer?.username || 'Không xác định',
            customerEmail: bookingDataFromApi.customer?.email || 'Không xác định',
            customerPhone: bookingDataFromApi.customer?.phone || 'Không xác định',
            totalAmount: bookingDataFromApi.totalAmount || bookingDataFromApi.priceBreakdown?.total || 0,
            depositAmount: bookingDataFromApi.depositAmount || bookingDataFromApi.priceBreakdown?.deposit || 0,
            withDriver: bookingDataFromApi.withDriver,
            deliveryRequested: bookingDataFromApi.deliveryRequested,
          })
        } else if (location.state) {
          // Fallback to location.state for cash payments or other flows
          const { bookingId, paymentId, amount, bookingData } = location.state

          const pickupDate = new Date(bookingData?.pickupDateTime || new Date()).toLocaleString("vi-VN", {
            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
          })

          const dropoffDate = new Date(bookingData?.dropoffDateTime || new Date()).toLocaleString("vi-VN", {
            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
          })

                setBookingDetails({
            bookingId: bookingId || 'N/A',
            paymentId: paymentId || 'N/A',
                    amount: amount || (priceBreakdown?.deposit || 0),
            carModel: bookingData?.car?.model || 'Không xác định',
            pickupLocation: bookingData?.pickupLocation || customerInfo?.pickupAddress || 'Không xác định',
            dropoffLocation: bookingData?.dropoffLocation || customerInfo?.dropoffAddress || 'Không xác định',
                    pickupDate: pickupDate,
                    dropoffDate: dropoffDate,
            customerName: customerInfo?.fullName || bookingData?.user?.fullName || bookingData?.user?.username || 'Không xác định',
            customerEmail: customerInfo?.email || bookingData?.user?.email || 'Không xác định',
            customerPhone: customerInfo?.phone || bookingData?.user?.phone || 'Không xác định',
                    totalAmount: priceBreakdown?.total || 0,
                    depositAmount: priceBreakdown?.deposit || 0,
            withDriver: withDriver || bookingData?.withDriver || false,
            deliveryRequested: deliveryRequested || bookingData?.deliveryRequested || false,
          })
        } else {
            setError('Không thể tải thông tin đặt xe. Vui lòng kiểm tra lại email của bạn hoặc liên hệ hỗ trợ.')
        }
            } catch (err) {
        console.error('Error in fetchBookingDetails:', err)
        setError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.')
            } finally {
        setIsLoading(false)
      }
    }

    fetchBookingDetails()

    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [location.state, navigate, searchParams])

  const downloadBookingConfirmation = () => {
    // Create a simple text file with booking details
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Đang tải thông tin đặt xe...</p>
        </div>
            </div>
    )
    }

    if (error) {
        return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-error-warning-line text-2xl text-red-500"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Lỗi tải thông tin</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
          >
            <i className="ri-home-line"></i>
            Về trang chủ
          </Link>
                </div>
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
                    
      {/* Header */}
      <header className="relative z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white">
              <i className="ri-car-line"></i>
                        </div>
            RentCar
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">
              Trang chủ
            </Link>
            <Link to="/search" className="text-gray-600 hover:text-blue-600 transition-colors">
              Tìm kiếm
            </Link>
            <Link to="/favorites" className="text-gray-600 hover:text-blue-600 transition-colors">
              Yêu thích
            </Link>
          </nav>
                        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-20 max-w-6xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <i className="ri-check-line text-4xl text-white"></i>
                        </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            Đặt xe thành công!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Cảm ơn bạn đã sử dụng dịch vụ của RentCar. Chúng tôi đã gửi email xác nhận đến địa chỉ email của bạn.
          </p>
                    </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Summary */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-200/50">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <i className="ri-file-list-3-line text-blue-600"></i>
                Thông tin đặt xe
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
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

            {/* Car & Trip Details */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-200/50">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <i className="ri-car-line text-blue-600"></i>
                Chi tiết chuyến đi
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <i className="ri-car-line text-blue-600"></i>
                  </div>
                                <div>
                    <div className="text-sm text-gray-600">Xe</div>
                    <div className="font-semibold text-gray-900">{bookingDetails.carModel}</div>
                                </div>
                            </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <i className="ri-map-pin-line text-green-600"></i>
                            </div>
                                <div>
                      <div className="text-sm text-gray-600">Nhận xe</div>
                      <div className="font-semibold text-gray-900">{bookingDetails.pickupLocation}</div>
                      <div className="text-sm text-gray-500">{bookingDetails.pickupDate}</div>
                                </div>
                            </div>

                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <i className="ri-map-pin-line text-red-600"></i>
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
                          <i className="ri-check-line"></i>
                          <span>Thuê tài xế</span>
                        </div>
                                    )}
                                    {bookingDetails.deliveryRequested && (
                        <div className="flex items-center gap-2 text-green-600">
                          <i className="ri-check-line"></i>
                          <span>Giao xe tận nơi</span>
                            </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-200/50">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <i className="ri-user-line text-blue-600"></i>
                Thông tin khách hàng
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <i className="ri-user-line text-gray-600"></i>
                  <div>
                    <div className="text-sm text-gray-600">Tên</div>
                    <div className="font-semibold">{bookingDetails.customerName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <i className="ri-mail-line text-gray-600"></i>
                  <div>
                    <div className="text-sm text-gray-600">Email</div>
                    <div className="font-semibold">{bookingDetails.customerEmail}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <i className="ri-phone-line text-gray-600"></i>
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
            {/* Next Steps */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-200/50">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <i className="ri-roadmap-line text-blue-600"></i>
                Bước tiếp theo
              </h3>
              <div className="space-y-4">
                {[
                  { icon: "ri-mail-check-line", text: "Kiểm tra email xác nhận", color: "text-green-600" },
                  { icon: "ri-file-list-line", text: "Chuẩn bị giấy tờ (CMND, GPLX)", color: "text-blue-600" },
                  { icon: "ri-phone-line", text: "Liên hệ nếu có thay đổi", color: "text-purple-600" },
                  { icon: "ri-time-line", text: "Đến đúng giờ nhận xe", color: "text-orange-600" },
                ].map((step, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center ${step.color}`}>
                      <i className={step.icon}></i>
                    </div>
                    <span className="text-gray-700">{step.text}</span>
                  </div>
                ))}
              </div>
                    </div>

            {/* Contact Support */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <i className="ri-customer-service-2-line"></i>
                Hỗ trợ 24/7
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <i className="ri-phone-line"></i>
                                <span>Hotline: 1900 1234</span>
                            </div>
                <div className="flex items-center gap-3">
                  <i className="ri-mail-line"></i>
                  <span>support@rentcar.com</span>
                            </div>
                        </div>
                    </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={downloadBookingConfirmation}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <i className="ri-download-line"></i>
                Tải xác nhận đặt xe
              </button>
              <Link
                to="/"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <i className="ri-home-line"></i>
                            Về trang chủ
                        </Link>
              <Link
                to="/search"
                className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:border-blue-500 hover:text-blue-600 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <i className="ri-search-line"></i>
                            Đặt xe khác
                        </Link>
                    </div>
                </div>
            </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 bg-white/80 backdrop-blur-md border-t border-gray-200/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-600">© 2025 RentCar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default BookingSuccessPage
