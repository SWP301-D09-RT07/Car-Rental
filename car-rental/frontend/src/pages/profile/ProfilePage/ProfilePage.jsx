import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/store/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    getProfile,
    getUserBookingHistory,
    updateProfile,
    changePassword,
    getFavoriteCars,
    removeFavorite,
    sendEmailVerification,
    cancelBooking,
    getBookingDetails,
    post, confirmDelivery, confirmReturn,
    createPaymentForPickup
} from '@/services/api';
import {
    FaStar,
    FaStarHalf,
    FaRegStar, // Thêm imports này
} from "react-icons/fa"
import { toast } from 'react-toastify';
import './ProfilePage.scss';

const StarRating = ({
    rating = 0,
    size = "small",
    interactive = false,
    onRatingChange = null,
    className = ""
}) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStar = 5 - fullStars - (hasHalfStar ? 1 : 0);

    const starSizes = {
        small: "text-sm",
        medium: "text-lg",
        large: "text-xl",
        xlarge: "text-2xl"
    };

    const handleStarClick = (starValue) => {
        if (interactive && onRatingChange) {
            onRatingChange(starValue);
        }
    };

    // Full stars
    for (let i = 0; i < fullStars; i++) {
        stars.push(
            <button
                key={`full-${i}`}
                type="button"
                disabled={!interactive}
                onClick={() => handleStarClick(i + 1)}
                className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} 
                   transition-all duration-200 ${interactive ? 'p-1 rounded' : ''}`}
            >
                <FaStar className={`text-yellow-400 ${starSizes[size]}`} />
            </button>
        );
    }

    // Half star
    if (hasHalfStar && !interactive) {
        stars.push(
            <FaStarHalf key="half" className={`text-yellow-400 ${starSizes[size]}`} />
        );
    }

    // Empty stars
    for (let i = 0; i < emptyStar; i++) {
        const starIndex = fullStars + (hasHalfStar ? 1 : 0) + i;
        stars.push(
            <button
                key={`empty-${i}`}
                type="button"
                disabled={!interactive}
                onClick={() => handleStarClick(starIndex + 1)}
                className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} 
                   transition-all duration-200 ${interactive ? 'p-1 rounded' : ''}`}
            >
                <FaRegStar className={`text-gray-300 ${starSizes[size]} ${interactive ? 'hover:text-yellow-400' : ''}`} />
            </button>
        );
    }

    return (
        <div className={`flex items-center ${className}`}>
            {stars}
        </div>
    );
};

const ProfilePage = () => {
    const { user: authUser, updateUser, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState('account');
    const [bookings, setBookings] = useState([]);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [favorites, setFavorites] = useState([]);
    const [favoritesLoading, setFavoritesLoading] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    // Form states
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        countryCode: '+84',
        preferredLanguage: 'vi',
        userDetail: {
            fullName: '',
            address: '',
            taxcode: ''
        }
    });


    // Password change states
    // const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Thêm states cho modal chi tiết booking
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    // const [bookingDetails, setBookingDetails] = useState(null);
    // Thêm state cho review modal
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewBooking, setReviewBooking] = useState(null);
    const [reviewData, setReviewData] = useState({
        rating: 0,
        comment: '',
        isAnonymous: false
    });
    console.log('🔍 ProfilePage render - authUser:', authUser, 'user:', user, 'loading:', loading);


    const canCustomerConfirmReturn = (booking) => {
        return booking.statusName === 'in progress' &&
            !booking.customerReturnConfirm;
    };
    // ✅ THÊM: Helper để check cần thanh toán tiền nhận xe
    const needsPickupPayment = (booking) => {
        return booking.statusName === 'confirmed' &&
            booking.paymentStatus === 'paid' &&
            booking.hasDeposit && // Đã có deposit
            !booking.hasFullPayment; // Chưa có full payment
    };
    // ✅ THÊM: Helper để check chờ nhận xe
    const waitingForPickup = (booking) => {
        return booking.statusName === 'confirmed' &&
            booking.paymentStatus === 'paid' &&
            booking.hasFullPayment && // Đã có full payment
            !booking.supplierDeliveryConfirm; // Supplier chưa giao xe
    };
    const canCustomerConfirmDelivery = (booking) => {
        return booking.statusName === 'confirmed' &&
            booking.paymentStatus === 'paid' &&
            booking.hasFullPayment && // Đã có full payment
            booking.supplierDeliveryConfirm && // Supplier đã xác nhận giao xe
            !booking.customerReceiveConfirm; // Customer chưa nhận xe
    };
    // ✅ THÊM: Handle thanh toán tiền nhận xe
    const handlePickupPayment = async (booking) => {
        try {
            console.log('🔄 Processing pickup payment for booking:', booking.bookingId);

            // Calculate remaining amount (total - deposit)
            const remainingAmount = booking.totalAmount - booking.paymentAmount;

            if (remainingAmount <= 0) {
                toast.error('Không có số tiền cần thanh toán');
                return;
            }

            console.log('💰 Payment calculation:', {
                totalAmount: booking.totalAmount,
                paidAmount: booking.paymentAmount,
                remainingAmount: remainingAmount
            });

            // ✅ SỬA: Cấu trúc priceBreakdown đúng theo PaymentPage yêu cầu
            const priceBreakdown = {
                // ✅ Các field bắt buộc theo PaymentPage
                total: booking.totalAmount || remainingAmount, // Tổng tiền gốc
                deposit: remainingAmount, // Số tiền cần thanh toán ngay (thực chất là tiền còn lại)
                serviceFee: Math.round(remainingAmount * 0.05), // 5% phí dịch vụ
                tax: Math.round(remainingAmount * 0.1), // 10% thuế

                // ✅ Các field bổ sung
                basePrice: remainingAmount,
                extraFee: 0,
                discount: 0,
                remainingAmount: 0, // Không còn số tiền nào sau khi thanh toán này

                // ✅ Thông tin payment type
                paymentType: 'full_payment',
                isPickupPayment: true // Flag để PaymentPage biết đây là thanh toán nhận xe
            };

            console.log('📋 Price breakdown for pickup payment:', priceBreakdown);

            // ✅ Bookingdata cho PaymentPage
            const bookingData = {
                carModel: booking.carModel,
                carLicensePlate: booking.carLicensePlate,
                pickupDateTime: booking.startDate,
                dropoffDateTime: booking.endDate,
                pickupLocation: booking.pickupLocation,
                dropoffLocation: booking.dropoffLocation,

                // ✅ Thêm thông tin cần thiết cho UI
                car: {
                    model: booking.carModel,
                    licensePlate: booking.carLicensePlate,
                    seatNumber: booking.seatNumber
                }
            };

            // ✅ Navigate to payment page với đầy đủ thông tin
            navigate('/payment', {
                state: {
                    bookingId: booking.bookingId,
                    priceBreakdown: priceBreakdown,
                    bookingData: bookingData,

                    // ✅ Thông tin customer cho PaymentPage
                    customerInfo: {
                        fullName: user?.userDetail?.fullName || user?.username,
                        email: user?.email,
                        phone: user?.phone,
                        pickupAddress: booking.pickupLocation,
                        dropoffAddress: booking.dropoffLocation
                    },

                    // ✅ Flags
                    withDriver: booking.driverName ? true : false,
                    deliveryRequested: false, // Không giao xe tận nơi cho pickup payment

                    // ✅ Payment metadata
                    paymentType: 'full_payment',
                    isPickupPayment: true,
                    originalBooking: booking // Lưu thông tin booking gốc để tham khảo
                }
            });

        } catch (error) {
            console.error('❌ Pickup payment error:', error);
            toast.error(error.message || 'Không thể thực hiện thanh toán');
        }
    };

    const fetchProfile = async () => {
        try {
            console.log('🔄 Fetching profile...');
            const response = await getProfile();
            console.log('✅ Profile response:', response);

            // Check cả 2 trường hợp response format
            const userData = response.success ? response.data : response;

            if (userData && userData.userId) {
                console.log('✅ Setting user state:', userData);
                setUser(userData);

                // Set form data for editing
                setFormData({
                    username: userData.username || '',
                    email: userData.email || '',
                    phone: userData.phone || '',
                    countryCode: userData.countryCode || '+84',
                    preferredLanguage: userData.preferredLanguage || 'vi',
                    userDetail: {
                        fullName: userData.userDetail?.fullName || '',
                        address: userData.userDetail?.address || '',
                        taxcode: userData.userDetail?.taxcode || ''
                    }
                });

                return userData;
            } else {
                console.error('❌ Profile response invalid:', response);
                toast.error('Không thể tải thông tin người dùng');
                return null;
            }
        } catch (error) {
            console.error('❌ Error fetching profile:', error);
            toast.error('Không thể tải thông tin người dùng');
            return null;
        }
    };

    const fetchBookings = async () => {
        try {
            setBookingLoading(true);
            const response = await getUserBookingHistory();
            console.log('✅ Booking response:', response);

            if (response.success) {
                // ✅ Debug payment info cho từng booking
                response.data.forEach((booking, index) => {
                    console.log(`📋 Booking ${index + 1}:`, {
                        bookingId: booking.bookingId,
                        paymentStatus: booking.paymentStatus,
                        paymentType: booking.paymentType,
                        paymentAmount: booking.paymentAmount,
                        paymentDate: booking.paymentDate
                    });
                });

                setBookings(response.data);
                console.log('✅ Bookings loaded:', response.data);
            }
        } catch (error) {
            console.error('❌ Error fetching bookings:', error);
            console.warn('Booking fetch failed, continuing...');
            setBookings([]);
        } finally {
            setBookingLoading(false);
        }
    };

    const fetchFavorites = async () => {
        try {
            setFavoritesLoading(true);
            const response = await getFavoriteCars();
            if (response.success) {
                setFavorites(response.data);
            }
        } catch (error) {
            console.error('❌ Error fetching favorites:', error);
            setFavorites([]);
        } finally {
            setFavoritesLoading(false);
        }
    };

    // Handle form changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('userDetail.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                userDetail: {
                    ...prev.userDetail,
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Handle profile update
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            setUpdating(true);
            console.log('🔄 Updating profile with data:', formData);

            const response = await updateProfile(formData);
            if (response.success) {
                toast.success('Cập nhật thông tin thành công!');
                setEditMode(false);
                await fetchProfile(); // Refresh data
            } else {
                toast.error(response.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('❌ Update profile error:', error);
            toast.error(error.message || 'Không thể cập nhật thông tin');
        } finally {
            setUpdating(false);
        }
    };

    // Handle password change
    const handleChangePassword = async (e) => {
        e.preventDefault();

        // Security validation
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            toast.error('Mật khẩu mới phải có ít nhất 8 ký tự');
            return;
        }

        if (passwordData.newPassword === passwordData.currentPassword) {
            toast.error('Mật khẩu mới phải khác mật khẩu hiện tại');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }

        try {
            setUpdating(true);
            await changePassword(passwordData.currentPassword, passwordData.newPassword);
            setIsChangingPassword(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            toast.success('Đổi mật khẩu thành công');
        } catch (error) {
            if (error.message.includes('401') || error.message.includes('unauthorized')) {
                toast.error('Phiên đăng nhập đã hết hạn');
                logout();
                navigate('/login');
            } else {
                toast.error(error.message || 'Đổi mật khẩu thất bại');
            }
        } finally {
            setUpdating(false);
        }
    };

    // Handle remove favorite
    const handleRemoveFavorite = async (carId) => {
        try {
            const response = await removeFavorite(carId);
            if (response.success) {
                toast.success('Đã xóa khỏi danh sách yêu thích');
                setFavorites(prev => prev.filter(car => car.carId !== carId));
            }
        } catch (error) {
            console.error('❌ Remove favorite error:', error);
            toast.error('Không thể xóa khỏi danh sách yêu thích');
        }
    };

    // Handle email verification
    const handleSendEmailVerification = async () => {
        try {
            const response = await sendEmailVerification();
            if (response.success) {
                toast.success('Email xác thực đã được gửi! Vui lòng kiểm tra hộp thư.');
            }
        } catch (error) {
            console.error('❌ Send email verification error:', error);
            toast.error(error.message || 'Không thể gửi email xác thực');
        }
    };


    // Handle cancel booking
    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy đặt xe này?')) {
            return;
        }

        try {
            console.log('🔄 Attempting to cancel booking:', bookingId);
            const response = await cancelBooking(bookingId);

            if (response.success) {
                toast.success('Hủy đặt xe thành công!');
                // Refresh bookings to get updated status
                await fetchBookings();
            } else {
                throw new Error(response.error || 'Không thể hủy đặt xe');
            }
        } catch (error) {
            console.error('❌ Cancel booking error:', error);

            // Handle specific error cases
            if (error.message.includes('hết hạn') || error.message.includes('unauthorized')) {
                toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                logout();
                navigate('/login');
            } else if (error.message.includes('không có quyền')) {
                toast.error('Bạn không có quyền hủy đặt xe này.');
            } else if (error.message.includes('trạng thái')) {
                toast.error('Không thể hủy đặt xe với trạng thái hiện tại.');
            } else {
                toast.error(error.message || 'Không thể hủy đặt xe');
            }
        }
    };

    // Handle view booking details
    const handleViewBookingDetails = async (booking) => {
        try {
            // ✅ Set booking ngay để show modal với loading
            setSelectedBooking(booking);
            setShowBookingModal(true);

            console.log('🔄 Viewing booking details for:', booking.bookingId);

            const response = await getBookingDetails(booking.bookingId);
            if (response.success) {
                console.log('📋 API booking details:', response.data);

                // ✅ UPDATE selectedBooking với data đầy đủ
                setSelectedBooking(prev => ({
                    ...prev, // Giữ data cũ
                    ...response.data, // Override với data mới
                    // Đảm bảo các field quan trọng
                    carModel: response.data.carModel || prev.carModel,
                    carLicensePlate: response.data.carLicensePlate || prev.carLicensePlate,
                    paymentDetails: response.data.paymentDetails || []
                }));

            } else {
                throw new Error(response.error || 'Không thể tải chi tiết đặt xe');
            }
        } catch (error) {
            console.error('❌ Get booking details error:', error);
            toast.error(error.message || 'Không thể tải chi tiết đặt xe');

            // ✅ Reset nếu lỗi
            setSelectedBooking(null);
            setShowBookingModal(false);
        }
    };
    const handleShowReviewModal = (booking) => {
        setReviewBooking(booking);
        setShowReviewModal(true);
    };

    // Sửa handleSubmitReview function
    const handleSubmitReview = async () => {
        if (!reviewData.rating || !reviewData.comment.trim()) {
            toast.error("Vui lòng chọn số sao và nhập bình luận");
            return;
        }

        if (!user || !user.userId) {
            toast.error("Không thể xác định thông tin người dùng");
            return;
        }

        try {
            const reviewPayload = {
                bookingId: reviewBooking.bookingId,
                carId: reviewBooking.carId,
                customerId: user.userId, // Sử dụng userId thay vì id
                ratingScore: reviewData.rating,
                comment: reviewData.comment.trim(),
                isAnonymous: reviewData.isAnonymous,
                ratingDate: new Date().toISOString()
            };

            console.log('Submitting review:', reviewPayload); // Debug log

            const response = await post('/api/ratings', reviewPayload);

            if (response.success || response) {
                toast.success("Đánh giá đã được gửi thành công!");

                // Reset và đóng modal
                setShowReviewModal(false);
                setReviewData({ rating: 0, comment: '', isAnonymous: false });
                setReviewBooking(null);

                // Refresh booking list để cập nhật hasRated
                await fetchBookings();
            } else {
                throw new Error(response.error || "Không thể gửi đánh giá");
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            toast.error(error.message || "Không thể gửi đánh giá");
        }
    };

    // ✅ Handle customer confirm delivery
    const handleConfirmDelivery = async (bookingId) => {
        if (!window.confirm('Bạn xác nhận đã nhận xe?')) return;

        try {
            console.log('🔄 Confirming delivery for booking:', bookingId);
            const response = await confirmDelivery(bookingId);

            if (response.success || response.data) {
                toast.success('Xác nhận nhận xe thành công!');
                await fetchBookings(); // Refresh danh sách
            } else {
                throw new Error(response.error || 'Không thể xác nhận nhận xe');
            }
        } catch (error) {
            console.error('❌ Confirm delivery error:', error);
            toast.error(error.message || 'Không thể xác nhận nhận xe');
        }
    };

    // ✅ Handle customer confirm return
    const handleConfirmReturn = async (bookingId) => {
        if (!window.confirm('Bạn xác nhận đã trả xe?')) return;

        try {
            console.log('🔄 Confirming return for booking:', bookingId);
            const response = await confirmReturn(bookingId);

            if (response.success || response.data) {
                toast.success('Xác nhận trả xe thành công!');
                await fetchBookings(); // Refresh danh sách
            } else {
                throw new Error(response.error || 'Không thể xác nhận trả xe');
            }
        } catch (error) {
            console.error('❌ Confirm return error:', error);
            toast.error(error.message || 'Không thể xác nhận trả xe');
        }
    };

    // ✅ Get status badge class và text
    const getStatusInfo = (booking) => {
        const status = booking.statusName?.toLowerCase();

        switch (status) {
            case 'pending':
                return { class: 'pending', text: 'Chờ duyệt', color: '#ffa500' };
            case 'confirmed':
                return { class: 'confirmed', text: 'Đã duyệt', color: '#4caf50' };
            case 'rejected':
                return { class: 'rejected', text: 'Từ chối', color: '#f44336' };
            case 'in_progress':
                return { class: 'in progress', text: 'Đang diễn ra', color: '#2196f3' };
            case 'completed':
                return { class: 'completed', text: 'Hoàn thành', color: '#4caf50' };
            case 'cancelled':
                return { class: 'cancelled', text: 'Đã hủy', color: '#9e9e9e' };
            default:
                return { class: 'unknown', text: status || 'N/A', color: '#9e9e9e' };
        }
    };

    // Load data on mount
    useEffect(() => {
        console.log('🔄 useEffect triggered - authUser:', authUser);

        if (authUser && authUser.username) {
            const loadData = async () => {
                setLoading(true);

                const profileData = await fetchProfile();
                console.log('🔍 Profile fetch result:', profileData);

                if (profileData) {
                    fetchBookings();
                    fetchFavorites();
                    setLoading(false);
                } else {
                    console.error('❌ Profile fetch failed, stopping...');
                    setLoading(false);
                }
            };

            loadData();
        } else {
            console.log('❌ No authUser, setting loading false');
            setLoading(false);
        }
    }, [authUser?.username]);

    // Show loading state
    if (loading) {
        return (
            <div className="profile-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <h2>Đang tải thông tin...</h2>
                    <p>Vui lòng đợi trong giây lát</p>
                </div>
            </div>
        );
    }

    // Show error state if no user after loading
    if (!user && !loading) {
        return (
            <div className="profile-page">
                <div className="error-container">
                    <i className="fas fa-exclamation-triangle"></i>
                    <h2>Không thể tải thông tin người dùng</h2>
                    <p>Có lỗi xảy ra khi tải thông tin tài khoản của bạn</p>
                    <div className="error-actions">
                        <button
                            onClick={() => {
                                setLoading(true);
                                fetchProfile().then(data => {
                                    setLoading(false);
                                    if (!data) {
                                        toast.error('Vẫn không thể tải thông tin');
                                    }
                                });
                            }}
                            className="btn primary"
                        >
                            <i className="fas fa-redo"></i>
                            Thử lại
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="btn secondary"
                        >
                            <i className="fas fa-home"></i>
                            Về trang chủ
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate verification percentage
    const calculateVerificationPercentage = () => {
        let completed = 0;
        const total = 5;

        if (user.username) completed++;
        if (user.email) completed++;
        if (user.phone) completed++;
        if (user.userDetail?.fullName) completed++;
        if (user.userDetail?.address) completed++;

        return Math.round((completed / total) * 100);
    };

    // Render verification status
    const renderVerificationStatus = () => {
        const percentage = calculateVerificationPercentage();

        return (
            <div className="verification-status-card">
                <div className="card-header">
                    <h3>Trạng thái xác thực</h3>
                    <div className="completion-rate">{percentage}% hoàn thành</div>
                </div>

                <div className="verification-items">
                    <div className={`verification-item ${user.email ? 'verified' : 'unverified'}`}>
                        <div className="item-content">
                            <i className="fas fa-envelope"></i>
                            <div>
                                <span className="item-title">Email</span>
                                <span className="item-subtitle">{user.email || 'Chưa cập nhật'}</span>
                            </div>
                        </div>
                        {user.email && !user.emailVerified && (
                            <button
                                className="verify-btn"
                                onClick={handleSendEmailVerification}
                            >
                                Xác thực
                            </button>
                        )}
                        {user.emailVerified && (
                            <div className="verified-badge">
                                <i className="fas fa-check-circle"></i>
                                Đã xác thực
                            </div>
                        )}
                    </div>

                    <div className={`verification-item ${user.phone ? 'verified' : 'unverified'}`}>
                        <div className="item-content">
                            <i className="fas fa-phone"></i>
                            <div>
                                <span className="item-title">Số điện thoại</span>
                                <span className="item-subtitle">{user.phone || 'Chưa cập nhật'}</span>
                            </div>
                        </div>
                        {user.phone && !user.phoneVerified && (
                            <button className="verify-btn">Xác thực</button>
                        )}
                        {user.phoneVerified && (
                            <div className="verified-badge">
                                <i className="fas fa-check-circle"></i>
                                Đã xác thực
                            </div>
                        )}
                    </div>

                    <div className={`verification-item ${user.userDetail?.fullName ? 'verified' : 'unverified'}`}>
                        <div className="item-content">
                            <i className="fas fa-user"></i>
                            <div>
                                <span className="item-title">Họ tên</span>
                                <span className="item-subtitle">{user.userDetail?.fullName || 'Chưa cập nhật'}</span>
                            </div>
                        </div>
                        {!user.userDetail?.fullName && (
                            <button
                                className="verify-btn"
                                onClick={() => setEditMode(true)}
                            >
                                Cập nhật
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };


    // ✅ SỬA: Render booking history với logic mới
    const renderBookingHistory = () => {
        if (bookingLoading) {
            return (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Đang tải lịch sử đặt xe...</p>
                </div>
            );
        }

        if (!bookings || bookings.length === 0) {
            return (
                <div className="empty-state">
                    <i className="fas fa-car"></i>
                    <h3>Chưa có lịch sử đặt xe</h3>
                    <p>Bạn chưa có bất kỳ chuyến đi nào. Hãy đặt xe ngay để bắt đầu hành trình!</p>
                    <button className="btn primary" onClick={handleNavigateToCars}>
                        <i className="fas fa-plus"></i>
                        Đặt xe ngay
                    </button>
                </div>
            );
        }

        return (
            <div className="bookings-list compact">
                {bookings.map((booking, index) => {
                    const statusInfo = getStatusInfo(booking);

                    return (
                        <div key={booking.bookingId || index} className="booking-card-compact">
                            {/* Header */}
                            <div className="booking-compact-header">
                                <div className="booking-main-info">
                                    <div className="booking-id-status">
                                        <h4>#{booking.bookingId}</h4>
                                        <div
                                            className={`status-badge ${statusInfo.class}`}
                                            style={{ backgroundColor: statusInfo.color }}
                                        >
                                            {statusInfo.text}
                                        </div>
                                    </div>

                                    <div className="booking-summary">
                                        <div className="car-summary">
                                            <i className="fas fa-car"></i>
                                            <span>{booking.carModel || 'N/A'} - {booking.carLicensePlate || 'N/A'}</span>
                                        </div>
                                        <div className="date-summary">
                                            <i className="fas fa-calendar"></i>
                                            <span>
                                                {booking.startDate && booking.endDate
                                                    ? `${new Date(booking.startDate).toLocaleDateString('vi-VN')} - ${new Date(booking.endDate).toLocaleDateString('vi-VN')}`
                                                    : 'N/A'
                                                }
                                            </span>
                                        </div>
                                        {/* ✅ Hiển thị payment info với logic mới */}
                                        <div className="payment-summary">
                                            <i className="fas fa-money-bill-wave"></i>
                                            <div className="payment-info">
                                                <span className={`payment-status ${booking.paymentStatus}`}>
                                                    {booking.paymentStatus === 'paid' ? 'Đã thanh toán' :
                                                        booking.paymentStatus === 'pending' ? 'Chờ thanh toán' : 'Thất bại'}
                                                </span>

                                                {/* ✅ Hiển thị thông tin thanh toán chi tiết */}
                                                {booking.paymentAmount && (
                                                    <div className="payment-breakdown">
                                                        <span className="payment-amount">
                                                            {new Intl.NumberFormat('vi-VN', {
                                                                style: 'currency',
                                                                currency: 'VND'
                                                            }).format(booking.paymentAmount)}
                                                        </span>

                                                        {booking.paymentType && (
                                                            <span className="payment-type-badge">
                                                                {booking.paymentType === 'deposit' ? 'Cọc' :
                                                                    booking.paymentType === 'full_payment' ? 'Toàn bộ' : 'Hoàn tiền'}
                                                            </span>
                                                        )}

                                                        {/* ✅ Hiển thị số tiền còn lại nếu chỉ có deposit */}
                                                        {booking.paymentType === 'deposit' && booking.totalAmount && (
                                                            <span className="remaining-amount">
                                                                Còn lại: {new Intl.NumberFormat('vi-VN', {
                                                                    style: 'currency',
                                                                    currency: 'VND'
                                                                }).format(booking.totalAmount - booking.paymentAmount)}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ✅ Status Flow Display */}
                            {booking.statusName === 'confirmed' && (
                                <div className="booking-flow-status">
                                    <div className="flow-step">
                                        <div className={`step-indicator ${booking.hasFullPayment ? 'completed' : 'current'}`}>
                                            <i className="fas fa-credit-card"></i>
                                        </div>
                                        <span className="step-label">
                                            {booking.hasFullPayment ? 'Đã thanh toán đầy đủ' : 'Cần thanh toán tiền nhận xe'}
                                        </span>
                                    </div>

                                    {booking.hasFullPayment && (
                                        <div className="flow-step">
                                            <div className={`step-indicator ${booking.supplierDeliveryConfirm ? 'completed' : 'current'}`}>
                                                <i className="fas fa-truck"></i>
                                            </div>
                                            <span className="step-label">
                                                {booking.supplierDeliveryConfirm ? 'Supplier đã giao xe' : 'Chờ supplier giao xe'}
                                            </span>
                                        </div>
                                    )}

                                    {booking.hasFullPayment && booking.supplierDeliveryConfirm && (
                                        <div className="flow-step">
                                            <div className={`step-indicator ${booking.customerReceiveConfirm ? 'completed' : 'current'}`}>
                                                <i className="fas fa-handshake"></i>
                                            </div>
                                            <span className="step-label">
                                                {booking.customerReceiveConfirm ? 'Đã nhận xe' : 'Chờ xác nhận nhận xe'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ✅ In Progress Flow */}
                            {booking.statusName === 'in_progress' && (
                                <div className="booking-flow-status">
                                    <div className="flow-step">
                                        <div className="step-indicator completed">
                                            <i className="fas fa-car"></i>
                                        </div>
                                        <span className="step-label">Đang sử dụng xe</span>
                                    </div>

                                    <div className="flow-step">
                                        <div className={`step-indicator ${booking.customerReturnConfirm ? 'completed' : 'current'}`}>
                                            <i className="fas fa-car-side"></i>
                                        </div>
                                        <span className="step-label">
                                            {booking.customerReturnConfirm ? 'Đã trả xe' : 'Chờ trả xe'}
                                        </span>
                                    </div>

                                    {booking.customerReturnConfirm && (
                                        <div className="flow-step">
                                            <div className={`step-indicator ${booking.supplierReturnConfirm ? 'completed' : 'current'}`}>
                                                <i className="fas fa-check-circle"></i>
                                            </div>
                                            <span className="step-label">
                                                {booking.supplierReturnConfirm ? 'Supplier đã xác nhận' : 'Chờ supplier xác nhận'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ✅ Action Buttons với logic mới */}
                            <div className="booking-actions-row">
                                <button
                                    className="btn-action details"
                                    onClick={() => handleViewBookingDetails(booking)}
                                    title="Xem chi tiết"
                                >
                                    <i className="fas fa-eye"></i>
                                    <span>Chi tiết</span>
                                </button>

                                {/* ✅ NÚT THANH TOÁN TIỀN NHẬN XE */}
                                {needsPickupPayment(booking) && (
                                    <button
                                        className="btn-action pickup-payment"
                                        onClick={() => handlePickupPayment(booking)}
                                        title="Thanh toán tiền nhận xe"
                                    >
                                        <i className="fas fa-credit-card"></i>
                                        <span>Thanh toán nhận xe</span>
                                    </button>
                                )}

                                {/* ✅ NÚT CHỜ NHẬN XE */}
                                {waitingForPickup(booking) && (
                                    <button
                                        className="btn-action waiting-pickup"
                                        disabled
                                        title="Đang chờ supplier giao xe"
                                    >
                                        <i className="fas fa-clock"></i>
                                        <span>Chờ giao xe</span>
                                    </button>
                                )}

                                {/* ✅ NÚT XÁC NHẬN NHẬN XE */}
                                {canCustomerConfirmDelivery(booking) && (
                                    <button
                                        className="btn-action confirm-delivery"
                                        onClick={() => handleConfirmDelivery(booking.bookingId)}
                                        title="Xác nhận đã nhận xe"
                                    >
                                        <i className="fas fa-handshake"></i>
                                        <span>Đã nhận xe</span>
                                    </button>
                                )}

                                {/* ✅ NÚT XÁC NHẬN TRẢ XE */}
                                {canCustomerConfirmReturn(booking) && (
                                    <button
                                        className="btn-action confirm-return"
                                        onClick={() => handleConfirmReturn(booking.bookingId)}
                                        title="Xác nhận đã trả xe"
                                    >
                                        <i className="fas fa-car-side"></i>
                                        <span>Đã trả xe</span>
                                    </button>
                                )}

                                {/* ✅ NÚT HỦY ĐẶT XE */}
                                {(booking.statusName === 'confirmed' || booking.statusName === 'pending') && (
                                    <button
                                        className="btn-action cancel"
                                        onClick={() => handleCancelBooking(booking.bookingId)}
                                        title="Hủy đặt xe"
                                    >
                                        <i className="fas fa-ban"></i>
                                        <span>Hủy</span>
                                    </button>
                                )}

                                {/* ✅ NÚT ĐÁNH GIÁ */}
                                {booking.statusName === 'completed' && !booking.hasRated && (
                                    <button
                                        className="btn-action review"
                                        onClick={() => handleShowReviewModal(booking)}
                                        title="Đánh giá xe"
                                    >
                                        <i className="fas fa-star"></i>
                                        <span>Đánh giá</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Render favorites
    const renderFavorites = () => {
        if (favoritesLoading) {
            return (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Đang tải xe yêu thích...</p>
                </div>
            );
        }

        if (!favorites || favorites.length === 0) {
            return (
                <div className="empty-state">
                    <i className="fas fa-heart"></i>
                    <h3>Chưa có xe yêu thích</h3>
                    <p>Bạn chưa thêm xe nào vào danh sách yêu thích</p>
                    <button className="btn primary" onClick={handleNavigateToCars}>
                        <i className="fas fa-search"></i>
                        Tìm xe
                    </button>
                </div>
            );
        }

        return (
            <div className="favorites-grid">
                {favorites.map((car, index) => (
                    <div key={car.carId || index} className="favorite-card">
                        <div className="favorite-content">
                            <h4>{car.model}</h4>
                            <p>{car.licensePlate}</p>
                            <p>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(car.dailyRate)}/ngày</p>
                            <button
                                className="btn primary small"
                                onClick={() => navigate(`/cars/${car.carId}`)}
                            >
                                Xem chi tiết
                            </button>
                        </div>
                        <button
                            className="remove-favorite"
                            onClick={() => handleRemoveFavorite(car.carId)}
                        >
                            <i className="fas fa-heart-broken"></i>
                        </button>
                    </div>
                ))}
            </div>
        );
    };

    // Navigate to cars page
    const handleNavigateToCars = () => {
        navigate('/cars');
    };

    // Navigate to booking page
    const handleNavigateToBooking = () => {
        navigate('/booking');
    };

    return (
        <div className="profile-page">
            {/* Header Section */}
            <div className="profile-header">
                <div className="header-background"></div>
                <div className="container">
                    <div className="header-content">
                        <div className="user-avatar-section">
                            <div className="user-avatar">
                                <img
                                    src={user.userDetail?.avatar || `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
            <rect width="120" height="120" fill="#667eea"/>
            <text x="50%" y="50%" text-anchor="middle" dy="0.35em" font-family="Arial, sans-serif" font-size="48" fill="white">
                ${user.username?.charAt(0).toUpperCase() || 'U'}
            </text>
        </svg>
    `)}`}
                                    alt="Avatar"
                                    onError={(e) => {
                                        // Fallback to a simple colored div with initial
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = `
            <div style="
                width: 120px; 
                height: 120px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                color: white; 
                font-size: 48px; 
                font-weight: bold;
            ">
                ${user.username?.charAt(0).toUpperCase() || 'U'}
            </div>
        `;
                                    }}
                                />
                                <div className="avatar-upload" title="Đổi ảnh đại diện">
                                    <i className="fas fa-camera"></i>
                                </div>
                            </div>

                            <div className="verification-badge">
                                <div className="verification-circle">
                                    <svg className="progress-ring" width="60" height="60">
                                        <circle
                                            className="progress-ring-circle"
                                            stroke="#e5e7eb"
                                            strokeWidth="4"
                                            fill="transparent"
                                            r="26"
                                            cx="30"
                                            cy="30"
                                        />
                                        <circle
                                            className="progress-ring-circle"
                                            strokeDasharray={`${calculateVerificationPercentage() * 1.63} 163`}
                                            strokeWidth="4"
                                            fill="transparent"
                                            r="26"
                                            cx="30"
                                            cy="30"
                                        />
                                    </svg>
                                    <div className="percentage">{calculateVerificationPercentage()}%</div>
                                </div>
                                <div className="verification-text">Đã xác thực</div>
                            </div>
                        </div>

                        <div className="user-info">
                            <h1 className="user-name">{user.userDetail?.fullName || user.username}</h1>
                            <p className="user-email">{user.email}</p>

                            <div className="user-badges">
                                <div className="badge trusted">
                                    <i className="fas fa-shield-alt"></i>
                                    <span>Đáng tin cậy</span>
                                </div>
                                {user.roleId === 3 && (
                                    <div className="badge premium">
                                        <i className="fas fa-crown"></i>
                                        <span>Khách hàng</span>
                                    </div>
                                )}
                            </div>

                            <div className="user-stats">
                                <div className="stat-item">
                                    <span className="stat-number">{bookings.length}</span>
                                    <span className="stat-label">
                                        <i className="fas fa-car"></i>
                                        Chuyến đi
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">{favorites.length}</span>
                                    <span className="stat-label">
                                        <i className="fas fa-heart"></i>
                                        Yêu thích
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">{calculateVerificationPercentage()}%</span>
                                    <span className="stat-label">
                                        <i className="fas fa-check-circle"></i>
                                        Hoàn thành
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="header-actions">
                            <button className="book-car-btn" onClick={handleNavigateToCars}>
                                <div className="btn-glow"></div>
                                <span>
                                    <i className="fas fa-plus"></i>
                                    Đặt xe mới
                                </span>
                            </button>
                            <button className="btn invite-btn">
                                <i className="fas fa-user-plus"></i>
                                Mời bạn bè
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="profile-nav">
                <div className="container">
                    <div className="nav-tabs">
                        <button
                            className={`nav-tab ${activeTab === 'account' ? 'active' : ''}`}
                            onClick={() => setActiveTab('account')}
                        >
                            <i className="fas fa-user"></i>
                            <span>Thông tin tài khoản</span>
                        </button>
                        <button
                            className={`nav-tab ${activeTab === 'bookings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('bookings')}
                        >
                            <i className="fas fa-history"></i>
                            <span>Lịch sử đặt xe</span>
                            {bookings.length > 0 && (
                                <div className="notification-dot">{bookings.length}</div>
                            )}
                        </button>
                        <button
                            className={`nav-tab ${activeTab === 'favorites' ? 'active' : ''}`}
                            onClick={() => setActiveTab('favorites')}
                        >
                            <i className="fas fa-heart"></i>
                            <span>Xe yêu thích</span>
                            {favorites.length > 0 && (
                                <div className="notification-dot">{favorites.length}</div>
                            )}
                        </button>
                        <button
                            className={`nav-tab ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            <i className="fas fa-shield-alt"></i>
                            <span>Bảo mật</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="profile-content">
                <div className="container">
                    <div className="tab-content">
                        {activeTab === 'account' && (
                            <>
                                <div className="content-header">
                                    <div>
                                        <p className="subtitle">Quản lý thông tin cá nhân và cài đặt tài khoản</p>
                                    </div>
                                    <button
                                        className="btn edit-btn"
                                        onClick={() => setEditMode(!editMode)}
                                    >
                                        <i className={`fas fa-${editMode ? 'times' : 'edit'}`}></i>
                                        {editMode ? 'Hủy' : 'Chỉnh sửa'}
                                    </button>
                                </div>

                                {renderVerificationStatus()}

                                {editMode ? (
                                    <form onSubmit={handleUpdateProfile} className="form-grid">
                                        <div className="form-card">
                                            <h3>Thông tin cơ bản</h3>
                                            <div className="form-rows">
                                                <div className="form-group">
                                                    <label data-required="true">Tên đăng nhập</label>
                                                    <input
                                                        type="text"
                                                        name="username"
                                                        value={formData.username}
                                                        onChange={handleInputChange}
                                                        disabled
                                                    />
                                                    <div className="input-hint">Tên đăng nhập không thể thay đổi</div>
                                                </div>

                                                <div className="form-group">
                                                    <label data-required="true">Email</label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label data-required="true">Số điện thoại</label>
                                                    <div className="phone-input-group">
                                                        <select
                                                            className="country-select"
                                                            name="countryCode"
                                                            value={formData.countryCode}
                                                            onChange={handleInputChange}
                                                        >
                                                            <option value="+84">+84 (VN)</option>
                                                            <option value="+1">+1 (US)</option>
                                                            <option value="+86">+86 (CN)</option>
                                                        </select>
                                                        <input
                                                            type="tel"
                                                            name="phone"
                                                            value={formData.phone}
                                                            onChange={handleInputChange}
                                                            placeholder="Nhập số điện thoại"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label>Ngôn ngữ ưa thích</label>
                                                    <select
                                                        name="preferredLanguage"
                                                        value={formData.preferredLanguage}
                                                        onChange={handleInputChange}
                                                    >
                                                        <option value="vi">Tiếng Việt</option>
                                                        <option value="en">English</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-card">
                                            <h3>Thông tin chi tiết</h3>
                                            <div className="form-rows">
                                                <div className="form-group">
                                                    <label data-required="true">Họ và tên</label>
                                                    <input
                                                        type="text"
                                                        name="userDetail.fullName"
                                                        value={formData.userDetail.fullName}
                                                        onChange={handleInputChange}
                                                        placeholder="Nhập họ và tên đầy đủ"
                                                        required
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label data-required="true">Địa chỉ</label>
                                                    <textarea
                                                        name="userDetail.address"
                                                        value={formData.userDetail.address}
                                                        onChange={handleInputChange}
                                                        placeholder="Nhập địa chỉ đầy đủ"
                                                        rows="3"
                                                        required
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label>Mã số thuế (nếu có)</label>
                                                    <input
                                                        type="text"
                                                        name="userDetail.taxcode"
                                                        value={formData.userDetail.taxcode}
                                                        onChange={handleInputChange}
                                                        placeholder="Nhập mã số thuế"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-actions">
                                            <button type="button" className="btn secondary" onClick={() => setEditMode(false)}>
                                                <i className="fas fa-times"></i>
                                                Hủy
                                            </button>
                                            <button type="submit" className="btn save-btn" disabled={updating}>
                                                <i className="fas fa-save"></i>
                                                {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="info-grid">
                                        <div className="info-card">
                                            <h3>Thông tin cơ bản</h3>
                                            <div className="info-rows">
                                                <div className="info-row">
                                                    <label>Tên đăng nhập:</label>
                                                    <span>{user.username}</span>
                                                </div>
                                                <div className="info-row">
                                                    <label>Email:</label>
                                                    <span>{user.email}</span>
                                                </div>
                                                <div className="info-row">
                                                    <label>Số điện thoại:</label>
                                                    <span>{user.phone}</span>
                                                </div>
                                                <div className="info-row">
                                                    <label>Ngôn ngữ:</label>
                                                    <span>{user.preferredLanguage === 'vi' ? 'Tiếng Việt' : 'English'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="info-card">
                                            <h3>Thông tin chi tiết</h3>
                                            <div className="info-rows">
                                                <div className="info-row">
                                                    <label>Họ và tên:</label>
                                                    <span>{user.userDetail?.fullName || 'Chưa cập nhật'}</span>
                                                </div>
                                                <div className="info-row">
                                                    <label>Địa chỉ:</label>
                                                    <span>{user.userDetail?.address || 'Chưa cập nhật'}</span>
                                                </div>
                                                <div className="info-row">
                                                    <label>Mã số thuế:</label>
                                                    <span>{user.userDetail?.taxcode || 'Chưa có'}</span>
                                                </div>
                                                <div className="info-row">
                                                    <label>Ngày tạo tài khoản:</label>
                                                    <span>
                                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="info-row">
                                                    <label>Đăng nhập cuối:</label>
                                                    <span>
                                                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('vi-VN') : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'bookings' && (
                            <>

                                {renderBookingHistory()}
                            </>
                        )}

                        {activeTab === 'favorites' && (
                            <>
                                <div className="content-header">
                                    <div>
                                        <h2>Xe yêu thích</h2>
                                        <p className="subtitle">Những chiếc xe bạn đã lưu để thuê sau</p>
                                    </div>
                                </div>
                                {renderFavorites()}
                            </>
                        )}

                        {activeTab === 'security' && (
                            <>
                                <div className="content-header">
                                    <div>
                                        <h2>Bảo mật & Riêng tư</h2>
                                        <p className="subtitle">Quản lý mật khẩu và cài đặt bảo mật</p>
                                    </div>
                                </div>

                                <div className="security-grid">
                                    <div className="security-card">
                                        <div className="security-header">
                                            <h3>Mật khẩu</h3>
                                            <div className="status active">Đã thiết lập</div>
                                        </div>
                                        <p>Thay đổi mật khẩu thường xuyên để bảo vệ tài khoản</p>
                                        <button
                                            className="btn primary"
                                            // onClick={() => setShowPasswordModal(true)}
                                            onClick={() => setIsChangingPassword(true)}
                                        >
                                            <i className="fas fa-key"></i>
                                            Đổi mật khẩu
                                        </button>
                                    </div>

                                    <div className="security-card">
                                        <div className="security-header">
                                            <h3>Xác thực 2 lớp</h3>
                                            <div className="status">Chưa bật</div>
                                        </div>
                                        <p>Tăng cường bảo mật với xác thực 2 lớp</p>
                                        <button className="btn secondary">
                                            <i className="fas fa-shield-alt"></i>
                                            Thiết lập
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Password Change Modal */}
            {isChangingPassword && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Đổi mật khẩu</h3>
                            <button
                                className="close-btn"
                                onClick={() => {
                                    setIsChangingPassword(false);
                                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleChangePassword} className="modal-form">
                            <div className="form-group">
                                <label>Mật khẩu hiện tại</label>
                                <input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData(prev => ({
                                        ...prev, currentPassword: e.target.value
                                    }))}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Mật khẩu mới</label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData(prev => ({
                                        ...prev, newPassword: e.target.value
                                    }))}
                                    required
                                    minLength="8"
                                />
                                <small>Mật khẩu phải có ít nhất 8 ký tự</small>
                            </div>
                            <div className="form-group">
                                <label>Xác nhận mật khẩu mới</label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData(prev => ({
                                        ...prev, confirmPassword: e.target.value
                                    }))}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn primary" disabled={updating}>
                                    {updating ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i>
                                            Đang đổi...
                                        </>
                                    ) : (
                                        'Đổi mật khẩu'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="btn secondary"
                                    onClick={() => {
                                        setIsChangingPassword(false);
                                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                    }}
                                >
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Booking Details Modal */}
            {showBookingModal && selectedBooking && (
                <div className="modal-overlay">
                    <div className="modal large booking-details-modal">
                        <div className="modal-header">
                            <div className="modal-title-section">
                                <h3>Chi tiết đặt xe</h3>
                                <div className="booking-id-badge">
                                    #{selectedBooking.bookingId}
                                </div>
                            </div>
                            <button
                                className="close-btn"
                                onClick={() => {
                                    setShowBookingModal(false);
                                    setSelectedBooking(null);
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-content">
                            <div className="booking-detail-grid">
                                {/* ✅ Kiểm tra xem có đang load details không */}
                                {!selectedBooking.paymentDetails ? (
                                    <div className="loading-details">
                                        <div className="spinner"></div>
                                        <p>Đang tải chi tiết...</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Thông tin xe */}
                                        <div className="detail-section">
                                            <div className="section-header">
                                                <i className="fas fa-car"></i>
                                                <h4>Thông tin xe</h4>
                                            </div>
                                            <div className="detail-items">
                                                <div className="detail-item">
                                                    <label>Mẫu xe:</label>
                                                    <span>{selectedBooking.carModel || 'N/A'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label>Biển số:</label>
                                                    <span className="highlight">{selectedBooking.carLicensePlate || 'N/A'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label>Tài xế:</label>
                                                    <span>{selectedBooking.driverName || 'Tự lái'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label>Số ghế:</label>
                                                    <span>{selectedBooking.seatNumber || 'N/A'} chỗ</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Thông tin chuyến đi */}
                                        <div className="detail-section">
                                            <div className="section-header">
                                                <i className="fas fa-route"></i>
                                                <h4>Thông tin chuyến đi</h4>
                                            </div>
                                            <div className="detail-items">
                                                <div className="detail-item">
                                                    <label>Thời gian:</label>
                                                    <span className="date-range">
                                                        {selectedBooking.startDate && selectedBooking.endDate
                                                            ? `${new Date(selectedBooking.startDate).toLocaleDateString('vi-VN')} - ${new Date(selectedBooking.endDate).toLocaleDateString('vi-VN')}`
                                                            : 'N/A'
                                                        }
                                                    </span>
                                                </div>
                                                <div className="detail-item">
                                                    <label>Điểm đón:</label>
                                                    <span>{selectedBooking.pickupLocation}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label>Điểm trả:</label>
                                                    <span>{selectedBooking.dropoffLocation}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label>Khu vực:</label>
                                                    <span>{selectedBooking.regionName}</span>
                                                </div>

                                                {/* ✅ SỬA: Thời gian confirm - Sử dụng selectedBooking */}
                                                {selectedBooking.deliveryConfirmTime && (
                                                    <div className="detail-item">
                                                        <label>Thời gian giao xe:</label>
                                                        <span>{new Date(selectedBooking.deliveryConfirmTime).toLocaleString('vi-VN')}</span>
                                                    </div>
                                                )}

                                                {selectedBooking.returnConfirmTime && (
                                                    <div className="detail-item">
                                                        <label>Thời gian trả xe:</label>
                                                        <span>{new Date(selectedBooking.returnConfirmTime).toLocaleString('vi-VN')}</span>
                                                    </div>
                                                )}

                                                {/* ✅ SỬA: Khuyến mãi - Sử dụng selectedBooking */}
                                                <div className="detail-item">
                                                    <label>Khuyến mãi:</label>
                                                    {selectedBooking.promoCode ? (
                                                        <span className="promo-info">
                                                            <span className="promo-code">{selectedBooking.promoCode}</span>
                                                            {selectedBooking.discountPercentage && (
                                                                <span className="discount">
                                                                    (-{selectedBooking.discountPercentage}%)
                                                                </span>
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="no-data">Không sử dụng</span>
                                                    )}
                                                </div>

                                                {/* ✅ SỬA: Mô tả khuyến mãi - Sử dụng selectedBooking */}
                                                {selectedBooking.promoCode && (
                                                    <div className="detail-item">
                                                        <label>Mô tả khuyến mãi:</label>
                                                        <span className="promo-desc">
                                                            {selectedBooking.promoDescription || 'Không có mô tả chi tiết'}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* ✅ SỬA: Gia hạn - Sử dụng selectedBooking */}
                                                <div className="detail-item">
                                                    <label>Gia hạn:</label>
                                                    {selectedBooking.extensionDays > 0 ? (
                                                        <span className="extension-info">
                                                            {selectedBooking.extensionDays} ngày
                                                            {selectedBooking.extensionStatusName && (
                                                                <span className={`extension-status ${selectedBooking.extensionStatusName.toLowerCase()}`}>
                                                                    ({selectedBooking.extensionStatusName})
                                                                </span>
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="no-data">Không có gia hạn</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Thông tin thanh toán */}
                                        <div className="detail-section">
                                            <div className="section-header">
                                                <i className="fas fa-credit-card"></i>
                                                <h4>Thông tin thanh toán</h4>
                                            </div>
                                            <div className="detail-items">
                                                {/* ✅ Debug payment details */}
                                                {console.log('🔍 Checking payment details:', {
                                                    hasPaymentDetails: !!selectedBooking.paymentDetails,
                                                    paymentDetailsLength: selectedBooking.paymentDetails?.length || 0,
                                                    paymentDetails: selectedBooking.paymentDetails
                                                })}

                                                {selectedBooking.paymentDetails && selectedBooking.paymentDetails.length > 0 ? (
                                                    <>
                                                        <div className="payment-records">
                                                            <h5>Lịch sử thanh toán:</h5>
                                                            {selectedBooking.paymentDetails.map((payment, index) => (
                                                                <div key={payment.paymentId || index} className="payment-record">
                                                                    <div className="payment-record-header">
                                                                        <span className="payment-type-label">
                                                                            {payment.paymentType === 'deposit' ? '💰 Tiền cọc' :
                                                                                payment.paymentType === 'full_payment' ? '💳 Thanh toán đầy đủ' :
                                                                                    '🔄 Hoàn tiền'}
                                                                        </span>
                                                                        <span className={`payment-status-badge ${payment.statusName?.toLowerCase()}`}>
                                                                            {payment.statusName === 'paid' ? 'Đã thanh toán' :
                                                                                payment.statusName === 'pending' ? 'Chờ xử lý' : 'Thất bại'}
                                                                        </span>
                                                                    </div>

                                                                    <div className="payment-record-details">
                                                                        <div className="payment-amount-display">
                                                                            {new Intl.NumberFormat('vi-VN', {
                                                                                style: 'currency',
                                                                                currency: 'VND'
                                                                            }).format(payment.amount)}
                                                                        </div>

                                                                        <div className="payment-meta">
                                                                            <div className="payment-method">
                                                                                <i className="fas fa-credit-card"></i>
                                                                                {payment.paymentMethod?.toUpperCase() || 'N/A'}
                                                                            </div>
                                                                            <div className="payment-date">
                                                                                <i className="fas fa-calendar"></i>
                                                                                {payment.paymentDate ?
                                                                                    new Date(payment.paymentDate).toLocaleString('vi-VN') : 'N/A'}
                                                                            </div>
                                                                        </div>

                                                                        {payment.transactionId && (
                                                                            <div className="transaction-id">
                                                                                <span>Mã GD:</span>
                                                                                <code>{payment.transactionId}</code>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Tổng kết thanh toán */}
                                                        {selectedBooking.paymentDetails.length > 1 && (
                                                            <div className="payment-summary-section">
                                                                <div className="summary-item total-paid">
                                                                    <div className="summary-label">
                                                                        <i className="fas fa-calculator"></i>
                                                                        <strong>Tổng đã thanh toán:</strong>
                                                                    </div>
                                                                    <div className="summary-amount total">
                                                                        <strong>
                                                                            {new Intl.NumberFormat('vi-VN', {
                                                                                style: 'currency',
                                                                                currency: 'VND'
                                                                            }).format(
                                                                                selectedBooking.paymentDetails
                                                                                    .filter(p => p.paymentType === 'deposit' || p.paymentType === 'full_payment')
                                                                                    .reduce((sum, payment) => sum + payment.amount, 0)
                                                                            )}
                                                                        </strong>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="no-payment-info">
                                                        <i className="fas fa-info-circle"></i>
                                                        <span>Chưa có thông tin thanh toán</span>
                                                       
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn secondary"
                                onClick={() => {
                                    setShowBookingModal(false);
                                    setSelectedBooking(null);
                                }}
                            >
                                <i className="fas fa-times"></i>
                                Đóng
                            </button>
                            {(selectedBooking?.statusName === 'confirmed' || selectedBooking?.statusName === 'pending') && (
                                <button
                                    className="btn danger"
                                    onClick={() => {
                                        setShowBookingModal(false);
                                        handleCancelBooking(selectedBooking.bookingId);
                                    }}
                                >
                                    <i className="fas fa-ban"></i>
                                    Hủy đặt xe
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;