"use client"

<<<<<<< HEAD
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
} from "react-icons/fa"
import { getBookedDates, getProfile } from "@/services/api"
import { useAuth } from "@/hooks/useAuth"

const BookingModal = ({ isOpen, onClose, car, onSubmitBooking }) => {
  const { isAuthenticated, user } = useAuth()
  const [userProfile, setUserProfile] = useState(null)
  const [userAddress, setUserAddress] = useState("")
=======
import { useState, useEffect, useRef } from "react"
import { 
  FaTimes, 
  FaCar, 
  FaCalendarAlt, 
  FaClock, 
  FaMapMarkerAlt,
  FaExclamationTriangle,
  FaArrowRight,
  FaCheckCircle
} from 'react-icons/fa'
import { toast } from "react-toastify"
import { getBookedDates } from "@/services/api"

const BookingModal = ({ isOpen, onClose, car, onSubmitBooking }) => {
>>>>>>> supplier
  const [form, setForm] = useState({
    pickupDate: "",
    pickupTime: "",
    dropoffDate: "",
    dropoffTime: "",
    pickupLocation: "",
    dropoffLocation: "",
    termsAgreed: false,
  })
<<<<<<< HEAD
  const [formErrors, setFormErrors] = useState({})
=======
  const [error, setError] = useState("")
>>>>>>> supplier
  const [showDatePicker, setShowDatePicker] = useState(null)
  const [showTimePicker, setShowTimePicker] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [bookedDates, setBookedDates] = useState([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
<<<<<<< HEAD
=======
  const [shouldShowDatePickerAbove, setShouldShowDatePickerAbove] = useState({ pickup: false, dropoff: false });
  const pickupDateBtnRef = useRef(null);
  const dropoffDateBtnRef = useRef(null);
>>>>>>> supplier

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
<<<<<<< HEAD
      setFormErrors({})
      fetchBookedDates()

      if (isAuthenticated) {
        loadUserProfile()
      }
    }
  }, [car, isOpen, isAuthenticated])

=======
      setError("")
      // Load booked dates when modal opens
      fetchBookedDates()
    }
  }, [car, isOpen])

  // Auto-close pickers when clicking outside
  useEffect(() => {
    // Temporarily disable click outside to debug
    /*
    const handleClickOutside = (event) => {
      // Temporarily disable click outside to debug
      console.log('Click detected:', event.target)
      
      // Don't close if clicking inside the modal or picker
      if (event.target.closest('.modal-content') || event.target.closest('.date-picker') || event.target.closest('.time-picker')) {
        console.log('Click inside modal/picker - not closing')
        return
      }
      
      if (showDatePicker || showTimePicker) {
        console.log('Closing picker')
        setShowDatePicker(null)
        setShowTimePicker(null)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
    */
  }, [showDatePicker, showTimePicker])

  // Fetch booked dates from backend using API service
>>>>>>> supplier
  const fetchBookedDates = async () => {
    if (!car?.id && !car?.carId) return

    try {
      setLoading(true)
<<<<<<< HEAD
      const data = await getBookedDates(car.id || car.carId)
      setBookedDates(data.bookedDates || [])
    } catch (err) {
      console.error("Error fetching booked dates:", err)
      // Mock data fallback
      const today = new Date()
      const mockBookedDates = []

=======
      // Use the API service method
      const data = await getBookedDates(car.id || car.carId)
      setBookedDates(data.bookedDates || [])
      console.log('Loaded booked dates from API:', data.bookedDates)
    } catch (err) {
      console.error("Error fetching booked dates:", err)
      // Use mock data if API fails
      const today = new Date()
      const mockBookedDates = []
      
      // Add some mock booked dates (next 3 days)
>>>>>>> supplier
      for (let i = 1; i <= 3; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`
        mockBookedDates.push(dateString)
      }
<<<<<<< HEAD

=======
      
      // Add some random dates in the next 2 weeks
      for (let i = 5; i <= 14; i += 2) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`
        mockBookedDates.push(dateString)
      }
      
>>>>>>> supplier
      setBookedDates(mockBookedDates)
    } finally {
      setLoading(false)
    }
  }

<<<<<<< HEAD
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

  if (!isOpen || !car) return null

=======
  if (!isOpen || !car) return null

  // Generate time slots
>>>>>>> supplier
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

<<<<<<< HEAD
=======
  // Generate calendar days with booked dates handling
>>>>>>> supplier
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
<<<<<<< HEAD
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
=======
    // Clear error when user starts typing
    if (error) setError("")
  }

  // Enhanced date selection with validation
  const handleDateSelect = (dateString, field) => {
    console.log('handleDateSelect called:', dateString, field)
    
    // Check if the selected date is booked
    if (bookedDates.includes(dateString)) {
      setError("Ngày này đã được đặt. Vui lòng chọn ngày khác.")
      return
    }
    
    // Validate dropoff date must be after pickup date
    if (field === "dropoffDate" && form.pickupDate) {
      if (dateString <= form.pickupDate) {
        setError("Ngày trả xe phải sau ngày nhận xe")
        return
      }
      
      // Check if any date in the range is booked
      const pickupDate = new Date(form.pickupDate)
      const dropoffDate = new Date(dateString)
      const currentDate = new Date(pickupDate)
      
      while (currentDate <= dropoffDate) {
        const checkDateString = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, "0")}-${currentDate.getDate().toString().padStart(2, "0")}`
        if (bookedDates.includes(checkDateString)) {
          setError("Khoảng thời gian này có ngày đã được đặt. Vui lòng chọn khoảng thời gian khác.")
          return
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }
    
    // Validate pickup date must be before dropoff date
    if (field === "pickupDate" && form.dropoffDate) {
      if (dateString >= form.dropoffDate) {
        setError("Ngày nhận xe phải trước ngày trả xe")
        return
      }
      
      // Check if any date in the range is booked
      const pickupDate = new Date(dateString)
      const dropoffDate = new Date(form.dropoffDate)
      const currentDate = new Date(pickupDate)
      
      while (currentDate <= dropoffDate) {
        const checkDateString = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, "0")}-${currentDate.getDate().toString().padStart(2, "0")}`
        if (bookedDates.includes(checkDateString)) {
          setError("Khoảng thời gian này có ngày đã được đặt. Vui lòng chọn khoảng thời gian khác.")
          return
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }
>>>>>>> supplier
    }

    setForm((prev) => ({ ...prev, [field]: dateString }))
    setShowDatePicker(null)
<<<<<<< HEAD
    setFormErrors({ ...formErrors, [field]: "" })
  }

  const handleTimeSelect = (time, field) => {
    if (field === "pickupTime") {
=======
    setError("") // Clear any previous errors
  }

  // Enhanced time selection with validation
  const handleTimeSelect = (time, field) => {
    if (field === "pickupTime") {
      // Auto-set dropoff time to same time if not already set
>>>>>>> supplier
      setForm((prev) => ({
        ...prev,
        [field]: time,
        dropoffTime: prev.dropoffTime || time,
      }))
    } else {
<<<<<<< HEAD
      if (form.pickupDate === form.dropoffDate && form.pickupTime) {
        if (time <= form.pickupTime) {
          setFormErrors({ ...formErrors, [field]: "Giờ trả xe phải sau giờ nhận xe" })
=======
      // Validate dropoff time must be after pickup time if same date
      if (form.pickupDate === form.dropoffDate && form.pickupTime) {
        if (time <= form.pickupTime) {
          setError("Giờ trả xe phải sau giờ nhận xe")
>>>>>>> supplier
          return
        }
      }
      setForm((prev) => ({ ...prev, [field]: time }))
    }
    setShowTimePicker(null)
<<<<<<< HEAD
    setFormErrors({ ...formErrors, [field]: "" })
=======
    setError("") // Clear any previous errors
  }

  const handleTermsLabelClick = () => {
    setForm((prev) => ({ ...prev, termsAgreed: !prev.termsAgreed }))
    if (error) setError("")
>>>>>>> supplier
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

<<<<<<< HEAD
  const handleSubmit = async (e) => {
    e.preventDefault()

    setFormErrors({})

=======
  // Enhanced form submission with loading state
  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log("Submit booking", form)
    
    // Clear previous errors
    setError("")
    
    // Validation
>>>>>>> supplier
    if (
      !form.pickupDate ||
      !form.pickupTime ||
      !form.dropoffDate ||
      !form.dropoffTime ||
      !form.pickupLocation ||
      !form.dropoffLocation
    ) {
<<<<<<< HEAD
      setFormErrors({ ...formErrors, form: "Vui lòng điền đầy đủ thông tin." })
      return
    }

    if (!form.termsAgreed) {
      setFormErrors({ ...formErrors, termsAgreed: "Bạn cần đồng ý với điều khoản." })
      return
    }

=======
      setError("Vui lòng điền đầy đủ thông tin.")
      return
    }
    
    if (!form.termsAgreed) {
      setError("Bạn cần đồng ý với điều khoản.")
      return
    }

    // Enhanced date/time validation
>>>>>>> supplier
    const pickupDateTime = new Date(`${form.pickupDate}T${form.pickupTime}:00`)
    const dropoffDateTime = new Date(`${form.dropoffDate}T${form.dropoffTime}:00`)
    const now = new Date()

    if (pickupDateTime <= now) {
<<<<<<< HEAD
      setFormErrors({ ...formErrors, pickupDate: "Thời gian nhận xe phải sau thời gian hiện tại." })
=======
      setError("Thời gian nhận xe phải sau thời gian hiện tại.")
>>>>>>> supplier
      return
    }

    if (dropoffDateTime <= pickupDateTime) {
<<<<<<< HEAD
      setFormErrors({ ...formErrors, dropoffDate: "Thời gian trả xe phải sau thời gian nhận xe." })
=======
      setError("Thời gian trả xe phải sau thời gian nhận xe.")
>>>>>>> supplier
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
<<<<<<< HEAD

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
=======
      
      await onSubmitBooking(bookingData)
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi đặt xe. Vui lòng thử lại.")
>>>>>>> supplier
    } finally {
      setIsSubmitting(false)
    }
  }

<<<<<<< HEAD
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
=======
  // Helper to decide if date picker should show above
  const handleOpenDatePicker = (type, e) => {
    let btnRef = type === "pickup" ? pickupDateBtnRef : dropoffDateBtnRef;
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 350) {
        setShouldShowDatePickerAbove((prev) => ({ ...prev, [type]: true }));
      } else {
        setShouldShowDatePickerAbove((prev) => ({ ...prev, [type]: false }));
      }
    }
    setShowDatePicker(showDatePicker === type ? null : type);
  };

  const timeSlots = generateTimeSlots()
  const calendarDays = generateCalendarDays()
  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
>>>>>>> supplier
  ]

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="flex items-center justify-center min-h-screen p-4">
          {/* Modal */}
<<<<<<< HEAD
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
                    <span>⭐ 4.8 (120 đánh giá)</span>
                    <span>🚗 {car.numOfSeats || 4} chỗ</span>
=======
          <div className="modal-content bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-auto relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="relative p-6 pb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-t-3xl"></div>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 z-10"
                aria-label="Đóng modal"
              >
                <FaTimes className="text-xl text-gray-600" />
              </button>

              <div className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <FaCar className="text-xl text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Đặt xe ngay</h2>
                    <p className="text-sm text-gray-600">{car.model || car.name}</p>
>>>>>>> supplier
                  </div>
                </div>
              </div>
            </div>

<<<<<<< HEAD
            {/* Loading indicator */}
            {loading && (
              <div className="px-6 pb-2">
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-lg p-3">
                  <FaSpinner className="animate-spin" />
=======
            {/* Loading indicator for booked dates */}
            {loading && (
              <div className="px-6 pb-2">
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
>>>>>>> supplier
                  <span>Đang tải lịch đặt xe...</span>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
<<<<<<< HEAD
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
=======
              {/* Pickup Date & Time */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  <FaCalendarAlt className="inline mr-2 text-blue-600" />
                  Thời gian nhận xe
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Date Picker */}
                  <div className="relative">
                    <button
                      type="button"
                      ref={pickupDateBtnRef}
                      onClick={(e) => { e.stopPropagation(); handleOpenDatePicker("pickup", e); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleOpenDatePicker("pickup", e)}
                      className="w-full p-4 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-blue-300 rounded-xl transition-all duration-200 text-left"
                      aria-label="Chọn ngày nhận xe"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Ngày nhận</div>
                          <div className="text-sm font-medium text-gray-900">{formatDate(form.pickupDate)}</div>
                        </div>
                        <FaCalendarAlt className="text-gray-400" />
                      </div>
                    </button>

                    {/* Custom Date Picker */}
                    {showDatePicker === "pickup" && (
                      <div className={`date-picker absolute left-0 ${shouldShowDatePickerAbove.pickup ? 'bottom-full mb-2' : 'top-full mt-2'} bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-[9999] w-80`}>
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Tháng trước"
                          >
                            <FaArrowRight className="rotate-180 text-sm" />
                          </button>
                          <h3 className="font-semibold text-gray-900">
                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                          </h3>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Tháng sau"
                          >
                            <FaArrowRight className="text-sm" />
                          </button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                            <div
                              key={day}
                              className="h-8 flex items-center justify-center text-xs font-medium text-gray-500"
                            >
                              {day}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {calendarDays.map((day, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={(e) => {
                                console.log('Date selected:', day.dateString)
                                e.stopPropagation()
                                !(day.isPast || day.isBooked) && handleDateSelect(day.dateString, "pickupDate")
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
                                form.pickupDate === day.dateString
                                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold"
                                  : ""
                              } ${day.isBooked && !day.isPast ? "bg-red-100 text-red-500 border border-red-300" : ""}`}
                              aria-label={`${day.day} ${day.isBooked ? '(Đã đặt)' : ''}`}
                              title={day.isBooked ? `Ngày ${day.dateString} đã được đặt` : `Chọn ngày ${day.dateString}`}
                            >
                              {day.day}
                              {/* Booked indicator */}
                              {day.isBooked && !day.isPast && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                </div>
                              )}
                              {/* Strikethrough for booked dates */}
                              {day.isBooked && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-6 h-0.5 bg-red-400 rotate-45"></div>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Legend */}
                        <div className="mt-3 flex items-center justify-center gap-4 text-xs">
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
                        
                        {/* Booked dates info */}
                        {(() => {
                          const currentMonthBookedDates = bookedDates.filter(dateString => {
                            const [year, month] = dateString.split('-').map(Number)
                            return year === currentMonth.getFullYear() && month === currentMonth.getMonth() + 1
                          })
                          return currentMonthBookedDates.length > 0 && (
                            <div className="mt-2 p-2 bg-red-50 rounded-lg">
                              <p className="text-xs text-red-600 text-center">
                                ⚠️ {currentMonthBookedDates.length} ngày đã được đặt trong tháng {currentMonth.getMonth() + 1}
                              </p>
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Time Picker */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowTimePicker(showTimePicker === "pickup" ? null : "pickup")
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && setShowTimePicker(showTimePicker === "pickup" ? null : "pickup")}
                      className="w-full p-4 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-blue-300 rounded-xl transition-all duration-200 text-left"
                      aria-label="Chọn giờ nhận xe"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Giờ nhận</div>
                          <div className="text-sm font-medium text-gray-900">{formatTime(form.pickupTime)}</div>
                        </div>
                        <FaClock className="text-gray-400" />
                      </div>
                    </button>

                    {/* Custom Time Picker */}
                    {showTimePicker === "pickup" && (
                      <div className="time-picker absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50 w-64">
                        <h3 className="font-semibold text-gray-900 mb-3">Chọn giờ nhận xe</h3>
                        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                          {timeSlots.map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTimeSelect(time, "pickupTime")
                              }}
                              className={`p-2 text-sm rounded-lg transition-all duration-200 ${
                                form.pickupTime === time
                                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold"
                                  : "bg-gray-50 hover:bg-blue-50 text-gray-900"
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pickup Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Địa điểm nhận xe
                </label>
                <input
                  type="text"
                  name="pickupLocation"
                  value={form.pickupLocation}
                  onChange={handleChange}
                  placeholder="Nhập địa điểm nhận xe"
                  className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl mb-2"
                  required
                />
              </div>

              {/* Dropoff Date & Time */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  <FaCalendarAlt className="inline mr-2 text-purple-600" />
                  Thời gian trả xe
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Date Picker */}
                  <div className="relative">
                    <button
                      type="button"
                      ref={dropoffDateBtnRef}
                      onClick={(e) => { e.stopPropagation(); handleOpenDatePicker("dropoff", e); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleOpenDatePicker("dropoff", e)}
                      className="w-full p-4 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-purple-300 rounded-xl transition-all duration-200 text-left"
                      aria-label="Chọn ngày trả xe"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Ngày trả</div>
                          <div className="text-sm font-medium text-gray-900">{formatDate(form.dropoffDate)}</div>
                        </div>
                        <FaCalendarAlt className="text-gray-400" />
                      </div>
                    </button>

                    {/* Custom Date Picker */}
                    {showDatePicker === "dropoff" && (
                      <div className={`date-picker absolute left-0 ${shouldShowDatePickerAbove.dropoff ? 'bottom-full mb-2' : 'top-full mt-2'} bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-[9999] w-80`}>
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Tháng trước"
                          >
                            <FaArrowRight className="rotate-180 text-sm" />
                          </button>
                          <h3 className="font-semibold text-gray-900">
                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                          </h3>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Tháng sau"
                          >
                            <FaArrowRight className="text-sm" />
                          </button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                            <div
                              key={day}
                              className="h-8 flex items-center justify-center text-xs font-medium text-gray-500"
                            >
                              {day}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {calendarDays.map((day, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={(e) => {
                                console.log('Date selected:', day.dateString)
                                e.stopPropagation()
                                !(day.isPast || day.isBooked) && handleDateSelect(day.dateString, "dropoffDate")
                              }}
                              disabled={day.isPast || day.isBooked}
                              className={`h-10 flex items-center justify-center text-sm rounded-lg transition-all duration-200 relative ${
                                day.isPast || day.isBooked
                                  ? "text-gray-300 cursor-not-allowed"
                                  : day.isToday
                                    ? "bg-purple-100 text-purple-600 font-semibold border-2 border-purple-300"
                                    : day.isCurrentMonth
                                      ? "text-gray-900 hover:bg-purple-50"
                                      : "text-gray-400 hover:bg-gray-50"
                              } ${
                                form.dropoffDate === day.dateString
                                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold"
                                  : ""
                              } ${day.isBooked && !day.isPast ? "bg-red-100 text-red-500 border border-red-300" : ""}`}
                              aria-label={`${day.day} ${day.isBooked ? '(Đã đặt)' : ''}`}
                              title={day.isBooked ? `Ngày ${day.dateString} đã được đặt` : `Chọn ngày ${day.dateString}`}
                            >
                              {day.day}
                              {/* Booked indicator */}
                              {day.isBooked && !day.isPast && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                </div>
                              )}
                              {/* Strikethrough for booked dates */}
                              {day.isBooked && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-6 h-0.5 bg-red-400 rotate-45"></div>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Legend */}
                        <div className="mt-3 flex items-center justify-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-100 rounded border"></div>
                            <span className="text-gray-600">Đã đặt</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-purple-100 rounded border"></div>
                            <span className="text-gray-600">Hôm nay</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-gray-100 rounded border"></div>
                            <span className="text-gray-600">Có thể đặt</span>
                          </div>
                        </div>
                        
                        {/* Booked dates info */}
                        {(() => {
                          const currentMonthBookedDates = bookedDates.filter(dateString => {
                            const [year, month] = dateString.split('-').map(Number)
                            return year === currentMonth.getFullYear() && month === currentMonth.getMonth() + 1
                          })
                          return currentMonthBookedDates.length > 0 && (
                            <div className="mt-2 p-2 bg-red-50 rounded-lg">
                              <p className="text-xs text-red-600 text-center">
                                ⚠️ {currentMonthBookedDates.length} ngày đã được đặt trong tháng {currentMonth.getMonth() + 1}
                              </p>
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Time Picker */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowTimePicker(showTimePicker === "dropoff" ? null : "dropoff")
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && setShowTimePicker(showTimePicker === "dropoff" ? null : "dropoff")}
                      className="w-full p-4 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-purple-300 rounded-xl transition-all duration-200 text-left"
                      aria-label="Chọn giờ trả xe"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Giờ trả</div>
                          <div className="text-sm font-medium text-gray-900">{formatTime(form.dropoffTime)}</div>
                        </div>
                        <FaClock className="text-gray-400" />
                      </div>
                    </button>

                    {/* Custom Time Picker */}
                    {showTimePicker === "dropoff" && (
                      <div className="time-picker absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50 w-64">
                        <h3 className="font-semibold text-gray-900 mb-3">Chọn giờ trả xe</h3>
                        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                          {timeSlots.map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTimeSelect(time, "dropoffTime")
                              }}
                              className={`p-2 text-sm rounded-lg transition-all duration-200 ${
                                form.dropoffTime === time
                                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold"
                                  : "bg-gray-50 hover:bg-purple-50 text-gray-900"
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dropoff Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Địa điểm trả xe
                </label>
                <input
                  type="text"
                  name="dropoffLocation"
                  value={form.dropoffLocation}
                  onChange={handleChange}
                  placeholder="Nhập địa điểm trả xe"
                  className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl mb-2"
                  required
                />
              </div>

              {/* Terms */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  <input
                    type="checkbox"
                    checked={form.termsAgreed}
                    onChange={handleTermsLabelClick}
                    className="mr-2"
                  />
                  Tôi đồng ý với điều khoản
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl transition-all duration-200 hover:from-blue-700 hover:to-purple-700"
              >
                {isSubmitting ? "Đang đặt xe..." : "Đặt xe"}
              </button>
            </form>
>>>>>>> supplier
          </div>
        </div>
      </div>
    </>
  )
}

export default BookingModal