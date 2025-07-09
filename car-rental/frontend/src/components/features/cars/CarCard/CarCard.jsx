import React, { useState } from 'react';
<<<<<<< HEAD
import { FaStar, FaHeart, FaCar, FaUsers, FaCog, FaGasPump, FaCalendarAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
=======
import { useNavigate } from 'react-router-dom';
import { FaCar, FaUsers, FaCog, FaGasPump, FaStar, FaCalendarAlt, FaMapMarkerAlt, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
>>>>>>> supplier
import FavoriteButton from '@/components/ui/FavoriteButton/FavoriteButton';

// Booking Modal Component
const BookingModal = ({ isOpen, onClose, car, onSubmit }) => {
    const [bookingData, setBookingData] = useState({
        pickupDate: '',
        pickupTime: '',
        dropoffDate: '',
        dropoffTime: '',
        pickupLocation: '',
        dropoffLocation: '',
        termsAgreed: false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setBookingData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!bookingData.termsAgreed) {
            toast.error('Vui lòng đồng ý với điều khoản');
            return;
        }
        onSubmit(bookingData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Đặt xe {car.name}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FaTimes size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Thời gian nhận xe
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center border-2 border-gray-200 rounded-xl p-3">
                                <FaCalendarAlt className="text-gray-400 mr-3" />
                                <input
                                    type="date"
                                    name="pickupDate"
                                    value={bookingData.pickupDate}
                                    onChange={handleChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full border-none focus:outline-none"
                                    required
                                />
                            </div>
                            <div className="flex items-center border-2 border-gray-200 rounded-xl p-3">
                                <input
                                    type="time"
                                    name="pickupTime"
                                    value={bookingData.pickupTime}
                                    onChange={handleChange}
                                    className="w-full border-none focus:outline-none"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Thời gian trả xe
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center border-2 border-gray-200 rounded-xl p-3">
                                <FaCalendarAlt className="text-gray-400 mr-3" />
                                <input
                                    type="date"
                                    name="dropoffDate"
                                    value={bookingData.dropoffDate}
                                    onChange={handleChange}
                                    min={bookingData.pickupDate || new Date().toISOString().split('T')[0]}
                                    className="w-full border-none focus:outline-none"
                                    required
                                />
                            </div>
                            <div className="flex items-center border-2 border-gray-200 rounded-xl p-3">
                                <input
                                    type="time"
                                    name="dropoffTime"
                                    value={bookingData.dropoffTime}
                                    onChange={handleChange}
                                    className="w-full border-none focus:outline-none"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Địa điểm nhận xe
                        </label>
                        <div className="flex items-center border-2 border-gray-200 rounded-xl p-3">
                            <FaMapMarkerAlt className="text-gray-400 mr-3" />
                            <input
                                type="text"
                                name="pickupLocation"
                                value={bookingData.pickupLocation}
                                onChange={handleChange}
                                placeholder="Nhập địa điểm nhận xe"
                                className="w-full border-none focus:outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Địa điểm trả xe
                        </label>
                        <div className="flex items-center border-2 border-gray-200 rounded-xl p-3">
                            <FaMapMarkerAlt className="text-gray-400 mr-3" />
                            <input
                                type="text"
                                name="dropoffLocation"
                                value={bookingData.dropoffLocation}
                                onChange={handleChange}
                                placeholder="Nhập địa điểm trả xe"
                                className="w-full border-none focus:outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="termsAgreed"
                            checked={bookingData.termsAgreed}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                            Tôi đồng ý với <a href="/terms" className="text-blue-600 hover:underline">điều khoản</a> và <a href="/privacy" className="text-blue-600 hover:underline">chính sách</a>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                    >
                        Tiếp tục
                    </button>
                </form>
            </div>
        </div>
    );
};

<<<<<<< HEAD
const CarCard = ({ car, type = "default", isLoading = false, onBookNow }) => {
    const navigate = useNavigate();
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    // Render star rating
    const renderStars = (rating) => {
        if (!rating || rating === 0) return null;

        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        // Full stars
        for (let i = 0; i < fullStars; i++) {
            stars.push(<FaStar key={`full-${i}`} className="text-yellow-400" />);
        }

        // Half star
        if (hasHalfStar) {
            stars.push(<FaStar key="half" className="text-yellow-300" />);
        }

        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<FaStar key={`empty-${i}`} className="text-gray-300" />);
        }

        return (
            <div className="flex items-center space-x-1 bg-yellow-50 px-3 py-2 rounded-lg">
                <div className="flex text-sm space-x-0.5">
                    {stars}
                </div>
                <span className="text-sm font-bold text-gray-700 ml-2">{rating.toFixed(1)}</span>
            </div>
        );
    };

    const toggleFavorite = () => {
        setIsFavorite(!isFavorite);
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
                <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 border border-gray-100">
            <div className="relative h-64 overflow-hidden cursor-pointer">
                {!imageLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"></div>
                )}
                <img
                    src={
                        car.images?.find((img) => img.isMain)?.imageUrl ||
                        car.images?.[0]?.imageUrl ||
                        "https://via.placeholder.com/400x250?text=Car+Image"
                    }
                    alt={`${car.brandName} ${car.model}`}
                    className={`w-full h-full object-cover object-center transition-all duration-700 group-hover:scale-110 ${imageLoaded ? "opacity-100" : "opacity-0"
                        }`}
                    loading="lazy"
                    onLoad={() => setImageLoaded(true)}
                    onClick={() => navigate(`/cars/${car.carId}`)}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>

                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                    <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        ✅ Có sẵn
                    </span>
                </div>

                {/* Action Buttons */}
                <div className="absolute top-4 right-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite();
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm ${isFavorite
                                ? "bg-red-500 text-white"
                                : "bg-white/90 text-gray-600 hover:text-red-500"
                            }`}
                    >
                        <FaHeart className="text-sm" />
                    </button>
=======
const CarCard = ({ car, type = "featured", isLoading: cardLoading, onBookNow }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const navigate = useNavigate();

    return (
        <div
            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 border border-blue-100 hover:border-blue-300"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative h-64 overflow-hidden cursor-pointer" onClick={() => navigate(`/cars/${car.carId}`)}>
                {!imageLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-sky-300 animate-pulse"></div>
                )}
                <img
                    src={
                        car.images && car.images.length > 0
                            ? car.images.find((img) => img.isMain)?.imageUrl || car.images[0].imageUrl
                            : "https://via.placeholder.com/400x250?text=Car+Image"
                    }
                    alt={car.model}
                    className={`w-full h-full object-cover object-center transition-all duration-700 ${
                        isHovered ? "scale-110" : "scale-100"
                    } ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                    loading="lazy"
                    onLoad={() => setImageLoaded(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                <div className="absolute top-4 left-4 flex flex-col space-y-2">
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm ${
                            type === "featured"
                                ? "bg-gradient-to-r from-blue-500 to-sky-500 text-white"
                                : "bg-gradient-to-r from-sky-500 to-cyan-500 text-white"
                        }`}
                    >
                        {type === "featured" ? "🔥 Nổi bật" : "⭐ Phổ biến"}
                    </span>
                    <span className="bg-white/90 backdrop-blur-sm text-blue-600 px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        📞 Hỗ trợ 24/7
                    </span>
                </div>
                <div className="absolute top-4 right-4">
                    <FavoriteButton carId={car.carId} />
>>>>>>> supplier
                </div>
            </div>

            <div className="p-6">
                <div className="flex items-start justify-between mb-3">
<<<<<<< HEAD
                    <div className="flex-1">
                        <h3
                            className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors cursor-pointer line-clamp-1"
                            onClick={() => navigate(`/cars/${car.carId}`)}
                        >
                            {car.model} {car.year}
                        </h3>
                        <p className="text-gray-500 text-sm">{car.brandName}</p>
                    </div>

                    {/* Hiển thị rating nếu có */}
                    <div className="flex-shrink-0">
                        {car.averageRating && car.averageRating > 0 ? (
                            renderStars(car.averageRating)
                        ) : (
                            <div className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                                Chưa có đánh giá
                            </div>
                        )}
=======
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => navigate(`/cars/${car.carId}`)}>
                            {car.model}
                        </h3>
                        <p className="text-gray-500 text-sm">{car.brand || "Luxury Car"}</p>
                    </div>
                    <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-lg">
                        <FaStar className="text-yellow-400 text-sm" />
                        <span className="text-sm font-semibold text-gray-700">4.8</span>
>>>>>>> supplier
                    </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <div>
<<<<<<< HEAD
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {(car.dailyRate / 1000).toFixed(0)}K
                        </span>
                        <span className="text-gray-500 text-sm ml-1">/ngày</span>
                    </div>
                    {car.discount && (
                        <div className="text-right">
                            <span className="text-sm text-gray-500 line-through">
                                {Math.round(car.dailyRate / (1 - car.discount / 100))}K
                            </span>
                            <span className="text-xs text-green-600 font-semibold ml-1">-{car.discount}%</span>
=======
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
                            {car.discountedPrice || car.dailyRate}K
                        </span>
                        <span className="text-gray-500 text-sm ml-1">/ngày</span>
                    </div>
                    {car.dailyRate && car.discountedPrice && (
                        <div className="text-right">
                            <span className="text-sm text-gray-500 line-through">{car.dailyRate}K</span>
                            <span className="text-xs text-green-600 font-semibold ml-1">-15%</span>
>>>>>>> supplier
                        </div>
                    )}
                </div>

<<<<<<< HEAD
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="flex items-center justify-center bg-gray-50 rounded-lg py-2 px-1">
                        <FaUsers className="text-blue-500 mr-1 text-sm" />
                        <span className="text-xs font-medium text-gray-700">{car.numOfSeats || 5} chỗ</span>
                    </div>
                    <div className="flex items-center justify-center bg-gray-50 rounded-lg py-2 px-1">
                        <FaCog className="text-green-500 mr-1 text-sm" />
                        <span className="text-xs font-medium text-gray-700">{car.transmission || "Tự động"}</span>
                    </div>
                    <div className="flex items-center justify-center bg-gray-50 rounded-lg py-2 px-1">
                        <FaGasPump className="text-orange-500 mr-1 text-sm" />
                        <span className="text-xs font-medium text-gray-700">{car.fuelTypeName || "Xăng"}</span>
                    </div>
                    <div className="flex items-center justify-center bg-gray-50 rounded-lg py-2 px-1">
                        <FaCalendarAlt className="text-purple-500 mr-1 text-sm" />
                        <span className="text-xs font-medium text-gray-700">{car.year}</span>
                    </div>
                </div>

                <div className="flex space-x-2">
                    <button
                        onClick={() => onBookNow && onBookNow(car)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 flex justify-center items-center shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <FaCar className="mr-2" />
                        Đặt ngay
                    </button>
                </div>
=======
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="flex items-center justify-center bg-blue-50 rounded-lg py-2 px-1">
                        <FaUsers className="text-blue-500 mr-1 text-sm" />
                        <span className="text-xs font-medium text-gray-700">{car.numOfSeats || car.seats || 5} chỗ</span>
                    </div>
                    <div className="flex items-center justify-center bg-sky-50 rounded-lg py-2 px-1">
                        <FaCog className="text-sky-500 mr-1 text-sm" />
                        <span className="text-xs font-medium text-gray-700">{car.transmission || "Tự động"}</span>
                    </div>
                    <div className="flex items-center justify-center bg-cyan-50 rounded-lg py-2 px-1">
                        <FaGasPump className="text-cyan-500 mr-1 text-sm" />
                        <span className="text-xs font-medium text-gray-700">{car.fuelTypeName || car.fuelType || "Xăng"}</span>
                    </div>
                </div>

                <button
                    onClick={() => onBookNow(car)}
                    className="w-full bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 hover:from-blue-700 hover:via-sky-700 hover:to-cyan-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 flex justify-center items-center shadow-lg hover:shadow-xl transform hover:scale-105"
                    disabled={cardLoading}
                    aria-label={`Đặt xe ${car.model}`}
                >
                    {cardLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <FaCar className="mr-2" />
                            Đặt ngay
                        </>
                    )}
                </button>
>>>>>>> supplier
            </div>
        </div>
    );
};

<<<<<<< HEAD
export default CarCard;
=======
export default CarCard; 
>>>>>>> supplier
