"use client"

import { useState, useEffect } from "react"
import {
  FaTimes,
  FaCar,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaArrowRight,
  FaCheckCircle,
  FaUser,
  FaSpinner,
  FaStar,
} from "react-icons/fa"
import { getBookedDates, getProfile, getRatingsByCarId } from "@/services/api"
import { useAuth } from "@/hooks/useAuth"

const BookingModal = ({ isOpen, onClose, car, onSubmitBooking }) => {
  console.log('[BookingModal] render - isOpen:', isOpen, '| car:', car, '| onClose:', typeof onClose, '| onSubmitBooking:', typeof onSubmitBooking);
  if (!isOpen) {
    console.warn('[BookingModal] Không render vì isOpen =', isOpen);
    return null;
  }
  if (!car) {
    console.warn('[BookingModal] Không render vì thiếu car:', car);
    return null;
  }
  const { isAuthenticated, user } = useAuth()
  const [userProfile, setUserProfile] = useState(null)
  const [userAddress, setUserAddress] = useState("")
  const [form, setForm] = useState({
    pickupDate: "",
    pickupTime: "",
    dropoffDate: "",
    dropoffTime: "",
    pickupLocation: "",
    dropoffLocation: "",
    termsAgreed: false,
  })
  const [formErrors, setFormErrors] = useState({})

  const [showDatePicker, setShowDatePicker] = useState(null)
  const [showTimePicker, setShowTimePicker] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [bookedDates, setBookedDates] = useState([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [carRatings, setCarRatings] = useState({ averageRating: null, ratingCount: 0 })
  const [loadingRatings, setLoadingRatings] = useState(false)

  useEffect(() => {
    if (car && isOpen) {
      setForm({
        pickupDate: "",
        pickupTime: "",
        dropoffDate: "",
        dropoffTime: "",
        pickupLocation: "",
        dropoffLocation: "",
        termsAgreed: false,
      })
      setFormErrors({})
      fetchBookedDates()
      fetchCarRatings()

      if (isAuthenticated) {
        loadUserProfile()
      }
    }
  }, [car, isOpen, isAuthenticated])
  const fetchCarRatings = async () => {
    if (!car?.id && !car?.carId) return

    try {
      setLoadingRatings(true)
      const ratings = await getRatingsByCarId(car.id || car.carId)
      if (ratings && ratings.length > 0) {
        // Tính điểm trung bình
        const totalScore = ratings.reduce((sum, rating) => sum + (rating.ratingScore || 0), 0)
        const averageRating = totalScore / ratings.length
        
        setCarRatings({
          averageRating: Math.round(averageRating * 10) / 10, // Làm tròn 1 chữ số thập phân
          ratingCount: ratings.length
        })
      } else {
        setCarRatings({ averageRating: null, ratingCount: 0 })
      }
    } catch (err) {
      console.error("Error fetching car ratings:", err)
      // Fallback sử dụng dữ liệu từ car object nếu có
      setCarRatings({
        averageRating: car?.averageRating || null,
        ratingCount: 0
      })
    } finally {
      setLoadingRatings(false)
    }
  }

  const fetchBookedDates = async () => {
    if (!car?.id && !car?.carId) return

    try {
      setLoading(true)
      const data = await getBookedDates(car.id || car.carId)
      setBookedDates(data.bookedDates || [])
    } catch (err) {
      console.error("Error fetching booked dates:", err)
      // Mock data fallback
      const today = new Date()
      const mockBookedDates = []


 
      for (let i = 1; i <= 3; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`
        mockBookedDates.push(dateString)
      }
      setBookedDates(mockBookedDates)
    } finally {
      setLoading(false)
    }
  }

  const loadUserProfile = async () => {
    try {
      const profile = await getProfile()
      if (profile && profile.userDetail?.address) {
        setUserProfile(profile)
        setUserAddress(profile.userDetail.address)
      }
    } catch (error) {
      if (user) {
        setUserProfile({ username: user.username, role: user.role })
      }
    }
  }

  const renderStars = (rating) => {
    if (!rating || rating === 0) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaStar key="half" className="text-yellow-300" />);
    }
    
    return (
      <div className="flex items-center space-x-1">
        <div className="flex text-sm">
          {stars}
        </div>
        <span className="text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (!isOpen || !car) return null

  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        slots.push(timeString)
      }
    }
    return slots
  }


  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const today = new Date()
    const todayString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)

      const isCurrentMonth = date.getMonth() === month
      const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`
      const isPast = dateString < todayString
      const isToday = dateString === todayString
      const isBooked = bookedDates.includes(dateString)

      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth,
        isPast,
        isToday,
        isBooked,
        dateString,
      })
    }

    return days
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
    if (formErrors[name]) setFormErrors({ ...formErrors, [name]: "" })
  }

  const handleDateSelect = (dateString, field) => {
    if (bookedDates.includes(dateString)) {
      setFormErrors({ ...formErrors, [field]: "Ngày này đã được đặt. Vui lòng chọn ngày khác." })
      return
    }

    if (field === "dropoffDate" && form.pickupDate) {
      if (dateString <= form.pickupDate) {
        setFormErrors({ ...formErrors, [field]: "Ngày trả xe phải sau ngày nhận xe" })
        return
      }
    }

    if (field === "pickupDate" && form.dropoffDate) {
      if (dateString >= form.dropoffDate) {
        setFormErrors({ ...formErrors, [field]: "Ngày nhận xe phải trước ngày trả xe" })
        return
      }
    }

    setForm((prev) => ({ ...prev, [field]: dateString }))
    setShowDatePicker(null)
    setFormErrors({ ...formErrors, [field]: "" })
  }

  const handleTimeSelect = (time, field) => {
    if (field === "pickupTime") {

      setForm((prev) => ({
        ...prev,
        [field]: time,
        dropoffTime: prev.dropoffTime || time,
      }))
    } else {
      if (form.pickupDate === form.dropoffDate && form.pickupTime) {
        if (time <= form.pickupTime) {
          setFormErrors({ ...formErrors, [field]: "Giờ trả xe phải sau giờ nhận xe" })
          return
        }
      }
      setForm((prev) => ({ ...prev, [field]: time }))
    }
    setShowTimePicker(null)
    setFormErrors({ ...formErrors, [field]: "" })
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Chọn ngày"

    const [year, month, day] = dateString.split("-").map(Number)
    const date = new Date(year, month - 1, day)

    const weekdays = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"]
    const weekday = weekdays[date.getDay()]

    return `${weekday}, ${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`
  }

  const formatTime = (timeString) => {
    if (!timeString) return "Chọn giờ"
    return timeString
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setFormErrors({})


    if (
      !form.pickupDate ||
      !form.pickupTime ||
      !form.dropoffDate ||
      !form.dropoffTime ||
      !form.pickupLocation ||
      !form.dropoffLocation
    ) {

      setFormErrors({ ...formErrors, form: "Vui lòng điền đầy đủ thông tin." })
      return
    }

    if (!form.termsAgreed) {
      setFormErrors({ ...formErrors, termsAgreed: "Bạn cần đồng ý với điều khoản." })
      return
    }

    const pickupDateTime = new Date(`${form.pickupDate}T${form.pickupTime}:00`)
    const dropoffDateTime = new Date(`${form.dropoffDate}T${form.dropoffTime}:00`)
    const now = new Date()

    if (pickupDateTime <= now) {
      setFormErrors({ ...formErrors, pickupDate: "Thời gian nhận xe phải sau thời gian hiện tại." })
      return
    }

    if (dropoffDateTime <= pickupDateTime) {

      setFormErrors({ ...formErrors, dropoffDate: "Thời gian trả xe phải sau thời gian nhận xe." })
      return
    }

    try {
      setIsSubmitting(true)
      const bookingData = {
        carId: car.carId || car.id,
        pickupLocation: form.pickupLocation,
        dropoffLocation: form.dropoffLocation,
        pickupDateTime: `${form.pickupDate}T${form.pickupTime}:00`,
        dropoffDateTime: `${form.dropoffDate}T${form.dropoffTime}:00`,
      }

      try {
        localStorage.setItem(
          "lastBookingData",
          JSON.stringify({
            pickupLocation: form.pickupLocation,
            dropoffLocation: form.dropoffLocation,
            pickupDateTime: bookingData.pickupDateTime,
            dropoffDateTime: bookingData.dropoffDateTime,
            carId: bookingData.carId,
          }),
        )
      } catch (error) {
        console.error("Error saving booking data to localStorage:", error)
      }

      await onSubmitBooking(bookingData)
    } catch (err) {
      setFormErrors({ ...formErrors, form: err.message || "Có lỗi xảy ra khi đặt xe. Vui lòng thử lại." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const timeSlots = generateTimeSlots()
  const calendarDays = generateCalendarDays()
  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ]

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="flex items-center justify-center min-h-screen p-4">
          {/* Modal */}
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-auto relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">
            {/* Enhanced Header */}
            <div className="relative p-6 pb-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-3xl">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-colors duration-200 z-10 shadow-sm"
                aria-label="Đóng modal"
              >
                <FaTimes className="text-lg text-gray-600" />
              </button>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FaCar className="text-2xl text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Đặt xe ngay</h2>
                  <p className="text-gray-600">{car.model || car.name}</p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    {loadingRatings ? (
                      <div className="flex items-center gap-1">
                        <FaSpinner className="animate-spin text-xs" />
                        <span>Đang tải đánh giá...</span>
                      </div>
                    ) : carRatings.averageRating ? (
                      <div className="flex items-center gap-1">
                        {renderStars(carRatings.averageRating)}
                        <span>({carRatings.ratingCount} đánh giá)</span>
                      </div>
                    ) : (
                      <span>
                        {carRatings.ratingCount > 0 
                          ? `${carRatings.ratingCount} đánh giá chưa có điểm`
                          : "Chưa có đánh giá"
                        }
                      </span>
                    )}
                    <span>🚗 {car.numOfSeats || 4} chỗ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading indicator */}
            {loading && (
              <div className="px-6 pb-2">
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-lg p-3">
                  <FaSpinner className="animate-spin" />
                  <span>Đang tải lịch đặt xe...</span>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
              {/* Date & Time Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pickup */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FaCalendarAlt className="text-blue-600" />
                    Thời gian nhận xe
                  </h3>

                  {/* Date picker button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDatePicker(showDatePicker === "pickup" ? null : "pickup")
                    }}
                    className="w-full p-4 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-blue-300 rounded-xl transition-all duration-200 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Ngày nhận</div>
                        <div className="text-sm font-medium text-gray-900">{formatDate(form.pickupDate)}</div>
                      </div>
                      <FaCalendarAlt className="text-gray-400" />
                    </div>
                  </button>

                  {/* Time picker button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowTimePicker(showTimePicker === "pickup" ? null : "pickup")
                    }}
                    className="w-full p-4 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-blue-300 rounded-xl transition-all duration-200 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Giờ nhận</div>
                        <div className="text-sm font-medium text-gray-900">{formatTime(form.pickupTime)}</div>
                      </div>
                      <FaClock className="text-gray-400" />
                    </div>
                  </button>
                </div>

                {/* Dropoff */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FaCalendarAlt className="text-purple-600" />
                    Thời gian trả xe
                  </h3>

                  {/* Date picker button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDatePicker(showDatePicker === "dropoff" ? null : "dropoff")
                    }}
                    className="w-full p-4 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-purple-300 rounded-xl transition-all duration-200 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Ngày trả</div>
                        <div className="text-sm font-medium text-gray-900">{formatDate(form.dropoffDate)}</div>
                      </div>
                      <FaCalendarAlt className="text-gray-400" />
                    </div>
                  </button>

                  {/* Time picker button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowTimePicker(showTimePicker === "dropoff" ? null : "dropoff")
                    }}
                    className="w-full p-4 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-purple-300 rounded-xl transition-all duration-200 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Giờ trả</div>
                        <div className="text-sm font-medium text-gray-900">{formatTime(form.dropoffTime)}</div>
                      </div>
                      <FaClock className="text-gray-400" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Location inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    <FaMapMarkerAlt className="inline mr-2 text-blue-600" />
                    Địa điểm nhận xe
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="pickupLocation"
                      value={form.pickupLocation}
                      onChange={handleChange}
                      placeholder="Nhập địa điểm nhận xe"
                      className={`w-full p-4 bg-gray-50 border-2 rounded-xl pr-12 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 ${
                        formErrors.pickupLocation ? "border-red-400" : "border-gray-200"
                      }`}
                      required
                    />
                    {userAddress && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, pickupLocation: userAddress }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Sử dụng địa chỉ của tôi"
                      >
                        <FaUser className="text-sm" />
                      </button>
                    )}
                  </div>
                  {formErrors.pickupLocation && (
                    <div className="text-xs text-red-600 mt-1">{formErrors.pickupLocation}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    <FaMapMarkerAlt className="inline mr-2 text-purple-600" />
                    Địa điểm trả xe
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="dropoffLocation"
                      value={form.dropoffLocation}
                      onChange={handleChange}
                      placeholder="Nhập địa điểm trả xe"
                      className={`w-full p-4 bg-gray-50 border-2 rounded-xl pr-12 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 ${
                        formErrors.dropoffLocation ? "border-red-400" : "border-gray-200"
                      }`}
                      required
                    />
                    {userAddress && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, dropoffLocation: userAddress }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-purple-600 hover:text-purple-800 transition-colors"
                        title="Sử dụng địa chỉ của tôi"
                      >
                        <FaUser className="text-sm" />
                      </button>
                    )}
                  </div>
                  {formErrors.dropoffLocation && (
                    <div className="text-xs text-red-600 mt-1">{formErrors.dropoffLocation}</div>
                  )}
                </div>
              </div>

              {/* Terms */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.termsAgreed}
                    onChange={handleChange}
                    name="termsAgreed"
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 mr-3"
                  />
                  <span className="text-sm text-gray-700">
                    Tôi đã đọc và đồng ý với các{" "}
                    <a href="/terms" className="text-blue-600 hover:text-blue-800 underline font-medium">
                      điều khoản và điều kiện
                    </a>{" "}
                    của dịch vụ
                  </span>
                </label>
                {formErrors.termsAgreed && <div className="text-xs text-red-600 mt-2">{formErrors.termsAgreed}</div>}
              </div>

              {/* Submit Button */}
              {formErrors.form && (
                <div className="text-sm text-red-600 text-center bg-red-50 rounded-lg p-3">{formErrors.form}</div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl transition-all duration-200 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Đang đặt xe...
                  </>
                ) : (
                  <>
                    <FaCheckCircle />
                    Đặt xe ngay
                  </>
                )}
              </button>
            </form>

            {/* Date Picker Modal */}
            {showDatePicker && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                      Chọn ngày {showDatePicker === "pickup" ? "nhận" : "trả"} xe
                    </h3>
                    <button
                      onClick={() => setShowDatePicker(null)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
                    >
                      <FaArrowRight className="rotate-180 text-sm" />
                    </button>
                    <h4 className="font-semibold text-gray-900">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
                    >
                      <FaArrowRight className="text-sm" />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                      <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          if (!(day.isPast || day.isBooked)) {
                            handleDateSelect(day.dateString, showDatePicker === "pickup" ? "pickupDate" : "dropoffDate")
                          }
                        }}
                        disabled={day.isPast || day.isBooked}
                        className={`h-10 flex items-center justify-center text-sm rounded-lg transition-all duration-200 relative ${
                          day.isPast || day.isBooked
                            ? "text-gray-300 cursor-not-allowed"
                            : day.isToday
                              ? "bg-blue-100 text-blue-600 font-semibold border-2 border-blue-300"
                              : day.isCurrentMonth
                                ? "text-gray-900 hover:bg-blue-50"
                                : "text-gray-400 hover:bg-gray-50"
                        } ${
                          (showDatePicker === "pickup" ? form.pickupDate : form.dropoffDate) === day.dateString
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold"
                            : ""
                        } ${day.isBooked && !day.isPast ? "bg-red-100 text-red-500 border border-red-300" : ""}`}
                      >
                        {day.day}
                        {day.isBooked && !day.isPast && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-100 rounded border"></div>
                      <span className="text-gray-600">Đã đặt</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-100 rounded border"></div>
                      <span className="text-gray-600">Hôm nay</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-gray-100 rounded border"></div>
                      <span className="text-gray-600">Có thể đặt</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Time Picker Modal */}
            {showTimePicker && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                      Chọn giờ {showTimePicker === "pickup" ? "nhận" : "trả"} xe
                    </h3>
                    <button
                      onClick={() => setShowTimePicker(null)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() =>
                          handleTimeSelect(time, showTimePicker === "pickup" ? "pickupTime" : "dropoffTime")
                        }
                        className={`p-3 text-sm rounded-lg transition-all duration-200 ${
                          (showTimePicker === "pickup" ? form.pickupTime : form.dropoffTime) === time
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold"
                            : "bg-gray-50 hover:bg-blue-50 text-gray-900"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default BookingModal