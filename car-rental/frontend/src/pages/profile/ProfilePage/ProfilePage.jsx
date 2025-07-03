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
    getBookingDetails
} from '@/services/api';
import { toast } from 'react-toastify';
import './ProfilePage.scss';

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
    const [bookingDetails, setBookingDetails] = useState(null);
    
    console.log('🔍 ProfilePage render - authUser:', authUser, 'user:', user, 'loading:', loading);
   
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
            setSelectedBooking(booking);
            console.log('🔄 Viewing booking details for:', booking.bookingId);
            
            const response = await getBookingDetails(booking.bookingId);
            if (response.success) {
                setBookingDetails(response.data);
                setShowBookingModal(true);
            } else {
                throw new Error(response.error || 'Không thể tải chi tiết đặt xe');
            }
        } catch (error) {
            console.error('❌ Get booking details error:', error);
            
            // Xử lý lỗi cụ thể
            if (error.message.includes('hết hạn') || error.message.includes('unauthorized')) {
                toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                logout();
                navigate('/login');
            } else if (error.message.includes('không có quyền')) {
                toast.error('Bạn không có quyền xem chi tiết đặt xe này.');
            } else {
                toast.error(error.message || 'Không thể tải chi tiết đặt xe');
            }
            
            // Reset modal state
            setSelectedBooking(null);
            setBookingDetails(null);
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

    // Render booking history
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
                {bookings.map((booking, index) => (
                    <div key={booking.bookingId || index} className="booking-card-compact">
                        {/* Header - Không click được */}
                        <div className="booking-compact-header">
                            <div className="booking-main-info">
                                <div className="booking-id-status">
                                    <h4>#{booking.bookingId}</h4>
                                    <div className={`status-badge ${booking.statusName?.toLowerCase().replace(' ', '-')}`}>
                                        {booking.statusName || 'N/A'}
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
                                    <div className="price-summary">
                                        <i className="fas fa-money-bill-wave"></i>
                                        <span className="price">
                                            {booking.depositAmount 
                                                ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.depositAmount)
                                                : 'N/A'
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons - Luôn hiển thị */}
                        <div className="booking-actions-row">
                            <button 
                                className="btn-action details"
                                onClick={() => handleViewBookingDetails(booking)}
                                title="Xem chi tiết"
                            >
                                <i className="fas fa-eye"></i>
                                <span>Chi tiết</span>
                            </button>
                            
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
                            {booking.statusName === 'failed' && (
                                <button
                                    className="btn-action pay-again"
                                    onClick={() => {
                                        // Chuyển sang trang thanh toán lại, truyền bookingId/paymentId
                                        navigate('/payment', {
                                            state: {
                                                bookingId: booking.bookingId,
                                                paymentId: booking.paymentId,
                                                fromHistory: true
                                            }
                                        });
                                    }}
                                    title="Thanh toán lại"
                                >
                                    <i className="fas fa-redo"></i>
                                    <span>Thanh toán lại</span>
                                </button>
                            )}
                            {booking.statusName === 'completed' && (
                                <button 
                                    className="btn-action review"
                                    onClick={() => {/* TODO: Implement review */}}
                                    title="Đánh giá"
                                >
                                    <i className="fas fa-star"></i>
                                    <span>Đánh giá</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
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
                                        <h2>Thông tin tài khoản</h2>
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
                                <div className="content-header">
                                    <div>
                                        <h2>Lịch sử đặt xe</h2>
                                        <p className="subtitle">Theo dõi tất cả các chuyến đi của bạn</p>
                                    </div>
                                </div>
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
                                <div className="booking-id-badge">#{selectedBooking.bookingId}</div>
                            </div>
                            <button 
                                className="close-btn"
                                onClick={() => setShowBookingModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="modal-content">
                            <div className="booking-detail-grid">
                                {/* Thông tin xe */}
                                <div className="detail-section">
                                    <div className="section-header">
                                        <i className="fas fa-car"></i>
                                        <h4>Thông tin xe</h4>
                                    </div>
                                    <div className="detail-items">
                                        <div className="detail-item">
                                            <label>Mẫu xe:</label>
                                            <span>{selectedBooking.carModel}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Biển số:</label>
                                            <span className="highlight">{selectedBooking.carLicensePlate}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Tài xế:</label>
                                            <span>{selectedBooking.driverName || 'Tự lái'}</span>
                                        </div>
                                        {/* ✅ THÊM SỐ GHẾ */}
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
                                        {/* ✅ THÊM THÔNG TIN GIA HẠNG */}
                                        {selectedBooking.extensionDays > 0 && (
                                            <div className="detail-item">
                                                <label>Gia hạn:</label>
                                                <span className="extension-info">
                                                    {selectedBooking.extensionDays} ngày
                                                    {selectedBooking.extensionStatusName && (
                                                        <span className={`extension-status ${selectedBooking.extensionStatusName.toLowerCase()}`}>
                                                            ({selectedBooking.extensionStatusName})
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Thông tin thanh toán */}
                                <div className="detail-section">
                                    <div className="section-header">
                                        <i className="fas fa-credit-card"></i>
                                        <h4>Thông tin thanh toán</h4>
                                    </div>
                                    <div className="detail-items">
                                        <div className="detail-item">
                                            <label>Tiền cọc:</label>
                                            <span className="price highlight">
                                                {selectedBooking.depositAmount 
                                                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedBooking.depositAmount)
                                                    : 'Chưa thanh toán'
                                                }
                                            </span>
                                        </div>
                                        
                                        <div className="detail-item">
                                            <label>Trạng thái:</label>
                                            <span className={`status-badge ${selectedBooking.statusName?.toLowerCase().replace(' ', '-')}`}>
                                                {selectedBooking.statusName || 'Không xác định'}
                                            </span>
                                        </div>

                                        {/* ✅ LUÔN HIỂN THỊ KHUYẾN MÃI */}
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

                                        {/* ✅ HIỂN THỊ MÔ TẢ NẾU CÓ PROMO */}
                                        {selectedBooking.promoCode && (
                                            <div className="detail-item">
                                                <label>Mô tả khuyến mãi:</label>
                                                <span className="promo-desc">
                                                    {selectedBooking.promoDescription || 'Không có mô tả chi tiết'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* ✅ SECTION GIA HẠNN - LUÔN HIỂN THỊ TRONG CHUYẾN ĐI */}
                                <div className="detail-section">
                                    <div className="section-header">
                                        <i className="fas fa-route"></i>
                                        <h4>Thông tin chuyến đi</h4>
                                    </div>
                                    <div className="detail-items">
                                        {/* ... other trip details ... */}
                                        
                                        {/* ✅ LUÔN HIỂN THỊ GIA HẠNN */}
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
                            </div>
                        </div>
                        
                        <div className="modal-actions">
                            <button 
                                className="btn secondary" 
                                onClick={() => setShowBookingModal(false)}
                            >
                                <i className="fas fa-times"></i>
                                Đóng
                            </button>
                            {(selectedBooking.statusName === 'confirmed' || selectedBooking.statusName === 'pending') && (
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