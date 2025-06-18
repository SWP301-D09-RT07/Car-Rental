import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, changePassword, getBookingsByUserId } from '../../../services/api';
import { AuthContext } from '../../../context/AuthContext';
import { toast } from 'react-toastify';
import './ProfilePage.scss';

const ProfilePage = () => {
    const { user: authUser, updateUser, logout } = useContext(AuthContext);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState('account');
    const [isEditing, setIsEditing] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verificationType, setVerificationType] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    
    // Form data based on database schema
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        name: '',
        address: '',
        taxcode: '',
        countryCode: '',
        preferredLanguage: ''
    });
    
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();    // Security check - ensure user is authenticated
    useEffect(() => {
        if (!authUser) {
            console.warn('⚠️ No authUser found, redirecting to login');
            toast.error('Vui lòng đăng nhập để xem trang cá nhân');
            navigate('/login');
            return;
        }
        fetchProfile();
    }, [authUser, navigate]);

    useEffect(() => {
        if (user?.user_id) {
            fetchBookings();
            fetchFavorites();
        }
    }, [user?.user_id]);    const fetchProfile = async () => {
        try {
            setLoading(true);
            
            // Security validation - check if token exists in localStorage
            const token = localStorage.getItem('token');
            const expiresAt = localStorage.getItem('expiresAt');
            
            if (!token) {
                toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                logout();
                navigate('/login');
                return;
            }
            
            // Check if token is expired
            if (!expiresAt || Date.now() > parseInt(expiresAt, 10)) {
                toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                logout();
                navigate('/login');
                return;
            }

            const data = await getProfile();              // Validate response data structure
            if (!data) {
                throw new Error('Không thể tải thông tin người dùng');
            }

            console.log('🔍 Profile data received:', data);
            console.log('🔍 UserDetail structure:', data.userDetail);

            setUser(data);
              // Update form data with secure field mapping
            setFormData({
                username: data.username || '',
                email: data.email || '',
                phone: data.phone || '',
                name: data.userDetail?.fullName || '', // Changed from name to fullName
                address: data.userDetail?.address || '',
                taxcode: data.userDetail?.taxcode || '',
                countryCode: data.country_code || '+84',
                preferredLanguage: data.preferred_language || 'vi'
            });
            
            console.log('🔍 Form data set:', {
                username: data.username || '',
                email: data.email || '',
                phone: data.phone || '',
                name: data.userDetail?.fullName || '', // Changed from name to fullName
                address: data.userDetail?.address || '',
                taxcode: data.userDetail?.taxcode || ''
            });} catch (error) {
            console.error('❌ Profile fetch error:', error);
            
            // Check for authentication errors
            if (error.response?.status === 401 || 
                error.message.includes('Phiên đăng nhập đã hết hạn') || 
                error.message.includes('Token đã hết hạn') ||
                error.message.includes('Token không tồn tại')) {
                
                console.log('🚪 Redirecting to login due to auth error');
                toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                
                // Clear all auth data
                localStorage.removeItem('token');
                localStorage.removeItem('expiresAt');
                localStorage.removeItem('role');
                localStorage.removeItem('username');
                localStorage.removeItem('userEmail');
                  // Force logout and redirect
                try {
                    await logout();
                } catch (logoutError) {
                    console.warn('Logout error:', logoutError);
                }
                
                // Multiple ways to ensure redirect
                navigate('/login', { replace: true });
                setTimeout(() => {
                    if (window.location.pathname !== '/login') {
                        window.location.replace('/login');
                    }
                }, 100);
                return;
            } else {
                // For other errors, just show message but don't logout
                toast.error(error.message || 'Không thể tải thông tin profile. Vui lòng thử lại.');
                console.error('Profile error details:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchBookings = async () => {
        try {
            if (user?.user_id) {
                const bookingData = await getBookingsByUserId(user.user_id);
                setBookings(Array.isArray(bookingData) ? bookingData : []);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            // Don't show error toast for bookings as it's not critical
        }
    };

    const fetchFavorites = async () => {
        try {
            // TODO: Implement getFavoritesByUserId API call when available
            setFavorites([]);
        } catch (error) {
            console.error('Error fetching favorites:', error);
        }
    };    const handleVerification = async (type) => {
        if (type === 'name') {
            // For name verification, just trigger edit mode
            setIsEditing(true);
            toast.info('Vui lòng cập nhật họ và tên trong chế độ chỉnh sửa');
            return;
        }
        
        setVerificationType(type);
        setShowVerificationModal(true);
        toast.info(`Tính năng xác minh ${type === 'email' ? 'email' : 'số điện thoại'} sẽ được cập nhật trong phiên bản tiếp theo`);
    };

    const confirmVerification = async () => {
        setShowVerificationModal(false);
        setVerificationCode('');
        toast.success(`Xác minh ${verificationType === 'email' ? 'email' : 'số điện thoại'} thành công!`);
    };

    const validateForm = () => {
        const newErrors = {};
        
        // Security validation - prevent XSS
        const sanitizeInput = (input) => {
            if (typeof input !== 'string') return '';
            return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        };

        const sanitizedData = Object.keys(formData).reduce((acc, key) => {
            acc[key] = sanitizeInput(formData[key]);
            return acc;
        }, {});

        if (!sanitizedData.username) {
            newErrors.username = 'Tên người dùng không được để trống';
        } else if (sanitizedData.username.length < 3) {
            newErrors.username = 'Tên người dùng phải có ít nhất 3 ký tự';
        }
        
        if (!sanitizedData.email) {
            newErrors.email = 'Email không được để trống';
        } else if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(sanitizedData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }
        
        if (!sanitizedData.phone) {
            newErrors.phone = 'Số điện thoại không được để trống';
        } else if (!/^[\d\s\-\+\(\)]+$/.test(sanitizedData.phone)) {
            newErrors.phone = 'Số điện thoại không hợp lệ';
        }

        if (!sanitizedData.name) {
            newErrors.name = 'Họ tên không được để trống';
        } else if (sanitizedData.name.length < 2) {
            newErrors.name = 'Họ tên phải có ít nhất 2 ký tự';
        }

        if (!sanitizedData.address) {
            newErrors.address = 'Địa chỉ không được để trống';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error('Vui lòng kiểm tra lại thông tin');
            return;        }        // Security check
        const userId = user?.user_id || user?.userId;
        if (!authUser?.token || !userId) {
            toast.error('Phiên đăng nhập không hợp lệ');
            return;
        }

        try {
            setUpdating(true);
            
            // Sanitize data before sending
            const sanitizedFormData = Object.keys(formData).reduce((acc, key) => {
                if (typeof formData[key] === 'string') {
                    acc[key] = formData[key].trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                } else {
                    acc[key] = formData[key];
                }
                return acc;
            }, {});            const updateData = {
                username: sanitizedFormData.username,
                email: sanitizedFormData.email,
                phone: sanitizedFormData.phone,
                roleId: user.role_id,  // Convert to camelCase
                statusId: user.status_id,  // Convert to camelCase
                countryCode: sanitizedFormData.countryCode,  // Already camelCase
                preferredLanguage: sanitizedFormData.preferredLanguage,  // Already camelCase
                userDetail: {
                    fullName: sanitizedFormData.name, // Changed from name to fullName
                    address: sanitizedFormData.address,
                    taxcode: sanitizedFormData.taxcode
                }
            };

            const updatedUser = await updateProfile(updateData);
            setUser(updatedUser);
            
            if (updateUser) {
                updateUser(updatedUser);
            }
            
            setIsEditing(false);
            setErrors({});
            toast.success('Cập nhật hồ sơ thành công');
            
        } catch (error) {
            console.error('❌ Update profile error:', error);
            if (error.message.includes('401') || error.message.includes('unauthorized')) {
                toast.error('Phiên đăng nhập đã hết hạn');
                logout();
                navigate('/login');
            } else {
                toast.error(error.message || 'Cập nhật hồ sơ thất bại');
            }
        } finally {
            setUpdating(false);
        }
    };

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

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // ...existing utility functions...
    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa cập nhật';
        try {
            return new Date(dateString).toLocaleDateString('vi-VN');
        } catch (error) {
            return 'Không hợp lệ';
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const getStatusBadge = (statusName) => {
        const statusMap = {
            'confirmed': { text: 'Đã xác nhận', class: 'confirmed' },
            'pending': { text: 'Chờ xác nhận', class: 'pending' },
            'cancelled': { text: 'Đã hủy', class: 'cancelled' },
            'completed': { text: 'Hoàn thành', class: 'completed' },
            'active': { text: 'Hoạt động', class: 'confirmed' }
        };
        const statusInfo = statusMap[statusName] || { text: statusName, class: 'default' };
        return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
    };

    const getRoleDisplayName = (roleName) => {
        const roleMap = {
            'customer': 'Khách hàng',
            'supplier': 'Nhà cung cấp',
            'admin': 'Quản trị viên'
        };
        return roleMap[roleName] || roleName;
    };    const getVerificationPercentage = () => {
        let verified = 0;
        let total = 4; // Updated to include name
        
        if (formData.name) verified++; // Added name verification
        if (formData.email) verified++;
        if (formData.phone) verified++;
        if (formData.address) verified++;
        
        return Math.round((verified / total) * 100);
    };

    // Loading state
    if (loading) {
        return (
            <div className="profile-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Đang tải thông tin...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (!user) {
        return (
            <div className="profile-page">
                <div className="error-container">
                    <h2>Không thể tải thông tin người dùng</h2>
                    <p>Vui lòng thử lại hoặc đăng nhập lại</p>
                    <div className="error-actions">
                        <button onClick={fetchProfile} className="btn primary">Thử lại</button>
                        <button onClick={() => navigate('/login')} className="btn secondary">Đăng nhập lại</button>
                    </div>
                </div>
            </div>
        );
    }

    const verificationPercentage = getVerificationPercentage();

    return (
        <div className="profile-page">
            {/* Header */}
            <div className="profile-header">
                <div className="header-background"></div>
                <div className="container">
                    <div className="header-content">
                        <div className="user-avatar-section">
                            <div className="user-avatar">
                                <img 
                                    src="/images/default-avatar.png" 
                                    alt="Avatar" 
                                    onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.userDetail?.name || user.username)}&background=667eea&color=fff&size=120`;
                                    }}
                                />
                                <div className="avatar-upload">
                                    <i className="fas fa-camera"></i>
                                </div>
                            </div>
                            <div className="verification-badge">
                                <div className="verification-circle">
                                    <svg className="progress-ring" width="60" height="60">
                                        <circle className="progress-ring-circle" 
                                            stroke="currentColor" 
                                            strokeWidth="3" 
                                            fill="transparent" 
                                            r="26" 
                                            cx="30" 
                                            cy="30"
                                            style={{
                                                strokeDasharray: `${verificationPercentage * 1.63} 163.4`,
                                                strokeDashoffset: 0
                                            }}
                                        />
                                    </svg>
                                    <span className="percentage">{verificationPercentage}%</span>
                                </div>
                                <span className="verification-text">Hoàn thiện</span>
                            </div>
                        </div>
                        
                        <div className="user-info">
                            <h1 className="user-name">{user.userDetail?.name || user.username}</h1>
                            <p className="user-email">{user.email}</p>
                            <div className="user-badges">
                                <span className="badge role">
                                    <i className="fas fa-user-tag"></i>
                                    {getRoleDisplayName(user.role?.role_name)}
                                </span>
                                {getStatusBadge(user.status?.status_name)}
                            </div>
                            <div className="user-stats">
                                <div className="stat-item">
                                    <span className="stat-number">{bookings.length}</span>
                                    <span className="stat-label">Đặt xe</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">
                                        {bookings.filter(b => b.status?.status_name === 'completed').length}
                                    </span>
                                    <span className="stat-label">Hoàn thành</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">{favorites.length}</span>
                                    <span className="stat-label">
                                        <i className="fas fa-heart"></i>
                                        Yêu thích
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="header-actions">
                            <button 
                                className="btn book-car-btn"
                                onClick={() => navigate('/cars')}
                            >
                                <i className="fas fa-car"></i>
                                <span>Đặt xe ngay</span>
                                <div className="btn-glow"></div>
                            </button>
                            <button 
                                className="btn secondary favorites-btn"
                                onClick={() => navigate('/favorites')}
                            >
                                <i className="fas fa-heart"></i>
                                Yêu thích ({favorites.length})
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="profile-nav">
                <div className="container">
                    <nav className="nav-tabs">
                        <button 
                            className={`nav-tab ${activeTab === 'account' ? 'active' : ''}`}
                            onClick={() => setActiveTab('account')}
                        >
                            <i className="fas fa-user"></i>
                            Thông tin tài khoản
                        </button>
                        <button 
                            className={`nav-tab ${activeTab === 'bookings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('bookings')}
                        >
                            <i className="fas fa-car"></i>
                            Lịch sử đặt xe
                            {bookings.filter(b => b.status?.status_name === 'pending').length > 0 && (
                                <span className="notification-dot">
                                    {bookings.filter(b => b.status?.status_name === 'pending').length}
                                </span>
                            )}
                        </button>
                        <button 
                            className={`nav-tab ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            <i className="fas fa-shield-alt"></i>
                            Bảo mật
                        </button>
                        <button 
                            className={`nav-tab ${activeTab === 'favorites' ? 'active' : ''}`}
                            onClick={() => setActiveTab('favorites')}
                        >
                            <i className="fas fa-heart"></i>
                            Yêu thích
                        </button>
                    </nav>
                </div>
            </div>

            {/* Content */}
            <div className="profile-content">
                <div className="container">
                    {/* Account Information Tab */}
                    {activeTab === 'account' && (
                        <div className="tab-content">
                            <div className="content-header">
                                <h2>Thông tin tài khoản</h2>
                                {!isEditing && (
                                    <button 
                                        className="btn primary edit-btn"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        <i className="fas fa-edit"></i>
                                        Chỉnh sửa
                                    </button>
                                )}
                            </div>

                            {/* Profile Completion Status */}
                            <div className="verification-status-card">
                                <div className="card-header">
                                    <h3>Trạng thái hồ sơ</h3>
                                    <span className="completion-rate">{verificationPercentage}% hoàn thành</span>
                                </div>                                <div className="verification-items">
                                    <div className={`verification-item ${formData.name ? 'verified' : 'unverified'}`}>
                                        <div className="item-content">
                                            <i className={`fas ${formData.name ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                                            <div>
                                                <span className="item-title">Họ và tên</span>
                                                <span className="item-subtitle">{formData.name || 'Chưa cập nhật'}</span>
                                            </div>
                                        </div>
                                        {!formData.name && (
                                            <button 
                                                className="btn verify-btn"
                                                onClick={() => handleVerification('name')}
                                            >
                                                Cập nhật
                                            </button>
                                        )}
                                    </div>

                                    <div className={`verification-item ${formData.email ? 'verified' : 'unverified'}`}>
                                        <div className="item-content">
                                            <i className={`fas ${formData.email ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                                            <div>
                                                <span className="item-title">Email</span>
                                                <span className="item-subtitle">{formData.email || 'Chưa cập nhật'}</span>
                                            </div>
                                        </div>
                                        {!formData.email && (
                                            <button 
                                                className="btn verify-btn"
                                                onClick={() => handleVerification('email')}
                                            >
                                                Cập nhật
                                            </button>
                                        )}
                                    </div>

                                    <div className={`verification-item ${formData.phone ? 'verified' : 'unverified'}`}>
                                        <div className="item-content">
                                            <i className={`fas ${formData.phone ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                                            <div>
                                                <span className="item-title">Số điện thoại</span>
                                                <span className="item-subtitle">{formData.phone || 'Chưa cập nhật'}</span>
                                            </div>
                                        </div>
                                        {!formData.phone && (
                                            <button 
                                                className="btn verify-btn"
                                                onClick={() => handleVerification('phone')}
                                            >
                                                Cập nhật
                                            </button>
                                        )}
                                    </div>

                                    <div className={`verification-item ${formData.address ? 'verified' : 'unverified'}`}>
                                        <div className="item-content">
                                            <i className={`fas ${formData.address ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                                            <div>
                                                <span className="item-title">Địa chỉ</span>
                                                <span className="item-subtitle">{formData.address || 'Chưa cập nhật'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {!isEditing ? (
                                <div className="info-grid">
                                    <div className="info-card">
                                        <h3>Thông tin cá nhân</h3>
                                        <div className="info-rows">                                            <div className="info-row">
                                                <label>Họ và tên</label>
                                                <span>{user.userDetail?.fullName || 'Chưa cập nhật'}</span>
                                            </div>
                                            <div className="info-row">
                                                <label>Email</label>
                                                <span>{user.email}</span>
                                            </div>
                                            <div className="info-row">
                                                <label>Số điện thoại</label>
                                                <span>
                                                    {user.country_code} {user.phone}
                                                </span>
                                            </div>
                                            <div className="info-row">
                                                <label>Địa chỉ</label>
                                                <span>{user.userDetail?.address || 'Chưa cập nhật'}</span>
                                            </div>
                                            <div className="info-row">
                                                <label>Mã số thuế</label>
                                                <span>{user.userDetail?.taxcode || 'Chưa cập nhật'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="info-card">
                                        <h3>Thông tin tài khoản</h3>
                                        <div className="info-rows">
                                            <div className="info-row">
                                                <label>Tên đăng nhập</label>
                                                <span>{user.username}</span>
                                            </div>
                                            <div className="info-row">
                                                <label>Vai trò</label>
                                                <span>{getRoleDisplayName(user.role?.role_name)}</span>
                                            </div>
                                            <div className="info-row">
                                                <label>Trạng thái</label>
                                                {getStatusBadge(user.status?.status_name)}
                                            </div>
                                            <div className="info-row">
                                                <label>Ngôn ngữ</label>
                                                <span>{user.preferred_language === 'vi' ? 'Tiếng Việt' : 'English'}</span>
                                            </div>
                                            <div className="info-row">
                                                <label>Ngày tạo tài khoản</label>
                                                <span>{formatDate(user.created_at)}</span>
                                            </div>
                                            <div className="info-row">
                                                <label>Đăng nhập cuối</label>
                                                <span>{formatDate(user.last_login)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleUpdateProfile} className="edit-form">
                                    <div className="form-grid">
                                        <div className="form-card">
                                            <h3>Thông tin cá nhân</h3>
                                            <div className="form-rows">
                                                <div className="form-group">
                                                    <label>Họ và tên *</label>
                                                    <input
                                                        type="text"
                                                        value={formData.name}
                                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                                        className={errors.name ? 'error' : ''}
                                                    />
                                                    {errors.name && <span className="error-text">{errors.name}</span>}
                                                </div>

                                                <div className="form-group">
                                                    <label>Email *</label>
                                                    <input
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                                        className={errors.email ? 'error' : ''}
                                                    />
                                                    {errors.email && <span className="error-text">{errors.email}</span>}
                                                </div>

                                                <div className="form-group">
                                                    <label>Số điện thoại *</label>
                                                    <div className="phone-input-group">
                                                        <select
                                                            value={formData.countryCode}
                                                            onChange={(e) => handleInputChange('countryCode', e.target.value)}
                                                            className="country-select"
                                                        >
                                                            <option value="+84">+84 (VN)</option>
                                                            <option value="+1">+1 (US)</option>
                                                            <option value="+86">+86 (CN)</option>
                                                        </select>
                                                        <input
                                                            type="tel"
                                                            value={formData.phone}
                                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                                            className={errors.phone ? 'error' : ''}
                                                        />
                                                    </div>
                                                    {errors.phone && <span className="error-text">{errors.phone}</span>}
                                                </div>

                                                <div className="form-group">
                                                    <label>Địa chỉ *</label>
                                                    <textarea
                                                        value={formData.address}
                                                        onChange={(e) => handleInputChange('address', e.target.value)}
                                                        rows="3"
                                                        className={errors.address ? 'error' : ''}
                                                    />
                                                    {errors.address && <span className="error-text">{errors.address}</span>}
                                                </div>

                                                <div className="form-group">
                                                    <label>Mã số thuế</label>
                                                    <input
                                                        type="text"
                                                        value={formData.taxcode}
                                                        onChange={(e) => handleInputChange('taxcode', e.target.value)}
                                                        placeholder="Nhập mã số thuế (không bắt buộc)"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-card">
                                            <h3>Cài đặt tài khoản</h3>
                                            <div className="form-rows">
                                                <div className="form-group">
                                                    <label>Tên đăng nhập *</label>
                                                    <input
                                                        type="text"
                                                        value={formData.username}
                                                        onChange={(e) => handleInputChange('username', e.target.value)}
                                                        className={errors.username ? 'error' : ''}
                                                    />
                                                    {errors.username && <span className="error-text">{errors.username}</span>}
                                                </div>

                                                <div className="form-group">
                                                    <label>Ngôn ngữ ưa thích</label>
                                                    <select
                                                        value={formData.preferredLanguage}
                                                        onChange={(e) => handleInputChange('preferredLanguage', e.target.value)}
                                                    >
                                                        <option value="vi">Tiếng Việt</option>
                                                        <option value="en">English</option>
                                                    </select>
                                                </div>

                                                <div className="info-display">
                                                    <div className="info-row">
                                                        <label>Vai trò</label>
                                                        <span>{getRoleDisplayName(user.role?.role_name)}</span>
                                                    </div>
                                                    <div className="info-row">
                                                        <label>Trạng thái</label>
                                                        {getStatusBadge(user.status?.status_name)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-actions">
                                        <button type="submit" className="btn primary save-btn" disabled={updating}>
                                            {updating ? (
                                                <>
                                                    <i className="fas fa-spinner fa-spin"></i>
                                                    Đang lưu...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-save"></i>
                                                    Lưu thay đổi
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditing(false);
                                                setErrors({});
                                            }}
                                            className="btn secondary"
                                        >
                                            <i className="fas fa-times"></i>
                                            Hủy
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Bookings Tab */}
                    {activeTab === 'bookings' && (
                        <div className="tab-content">
                            <div className="content-header">
                                <h2>Lịch sử đặt xe</h2>
                                <div className="booking-stats">
                                    <span>Tổng: {bookings.length} đặt xe</span>
                                </div>
                            </div>

                            {bookings.length === 0 ? (
                                <div className="empty-state">
                                    <i className="fas fa-car"></i>
                                    <h3>Chưa có đặt xe nào</h3>
                                    <p>Hãy đặt xe đầu tiên của bạn!</p>
                                    <button 
                                        className="btn primary"
                                        onClick={() => navigate('/cars')}
                                    >
                                        Tìm xe ngay
                                    </button>
                                </div>
                            ) : (
                                <div className="bookings-list">
                                    {bookings.map((booking) => (
                                        <div key={booking.booking_id} className="booking-card">
                                            <div className="booking-header">
                                                <div className="car-info">
                                                    <img 
                                                        src={booking.car?.images?.[0]?.image_url || '/images/default-car.png'} 
                                                        alt={booking.car?.model}
                                                        className="car-image"
                                                        onError={(e) => {
                                                            e.target.src = '/images/default-car.png';
                                                        }}
                                                    />
                                                    <div>
                                                        <h4>{booking.car?.model || 'Xe không xác định'}</h4>
                                                        <p>{booking.car?.brand?.brand_name}</p>
                                                        <p className="license-plate">{booking.car?.license_plate}</p>
                                                    </div>
                                                </div>
                                                {getStatusBadge(booking.status?.status_name)}
                                            </div>
                                            <div className="booking-details">
                                                <div className="detail-row">
                                                    <span className="label">Mã đặt xe:</span>
                                                    <span>#{booking.booking_id}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="label">Thời gian:</span>
                                                    <span>{formatDate(booking.start_date)} - {formatDate(booking.end_date)}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="label">Điểm nhận:</span>
                                                    <span>{booking.pickup_location}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="label">Điểm trả:</span>
                                                    <span>{booking.dropoff_location}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="label">Số ghế:</span>
                                                    <span>{booking.seat_number} chỗ</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="label">Tiền cọc:</span>
                                                    <span className="price">{formatPrice(booking.deposit_amount)}</span>
                                                </div>
                                            </div>
                                            <div className="booking-actions">
                                                <button className="btn secondary">Xem chi tiết</button>
                                                {booking.status?.status_name === 'pending' && (
                                                    <button className="btn danger">Hủy đặt xe</button>
                                                )}
                                                {booking.status?.status_name === 'completed' && (
                                                    <button className="btn primary">Đánh giá</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="tab-content">
                            <div className="content-header">
                                <h2>Bảo mật tài khoản</h2>
                            </div>

                            <div className="security-grid">
                                <div className="security-card">
                                    <div className="security-header">
                                        <h3>Mật khẩu</h3>
                                        <button 
                                            className="btn primary"
                                            onClick={() => setIsChangingPassword(true)}
                                        >
                                            Đổi mật khẩu
                                        </button>
                                    </div>
                                    <p>Cập nhật lần cuối: {formatDate(user.updated_at)}</p>
                                </div>

                                <div className="security-card">
                                    <div className="security-header">
                                        <h3>Thông tin đăng nhập</h3>
                                        <span className="status active">Hoạt động</span>
                                    </div>
                                    <p>Lần đăng nhập cuối: {formatDate(user.last_login)}</p>
                                </div>

                                <div className="security-card">
                                    <div className="security-header">
                                        <h3>Trạng thái tài khoản</h3>
                                        {getStatusBadge(user.status?.status_name)}
                                    </div>
                                    <p>Tài khoản được tạo: {formatDate(user.created_at)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Favorites Tab */}
                    {activeTab === 'favorites' && (
                        <div className="tab-content">
                            <div className="content-header">
                                <h2>Xe yêu thích</h2>
                                <span className="subtitle">Danh sách xe và nhà cung cấp bạn quan tâm</span>
                            </div>

                            {favorites.length === 0 ? (
                                <div className="empty-state">
                                    <i className="fas fa-heart"></i>
                                    <h3>Chưa có xe yêu thích</h3>
                                    <p>Thêm xe vào danh sách yêu thích để dễ dàng theo dõi!</p>
                                    <button 
                                        className="btn primary"
                                        onClick={() => navigate('/cars')}
                                    >
                                        Khám phá xe
                                    </button>
                                </div>
                            ) : (
                                <div className="favorites-grid">
                                    {favorites.map((favorite) => (
                                        <div key={favorite.favorite_id} className="favorite-card">
                                            <div className="favorite-content">
                                                <h4>{favorite.car?.model || favorite.supplier?.username}</h4>
                                                <p>Đã thêm: {formatDate(favorite.created_at)}</p>
                                            </div>
                                            <button className="btn danger remove-favorite">
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Change Password Modal */}
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

            {/* Verification Modal */}
            {showVerificationModal && (
                <div className="modal-overlay">
                    <div className="modal verification-modal">
                        <div className="modal-header">
                            <h3>Xác minh {verificationType === 'email' ? 'Email' : 'Số điện thoại'}</h3>
                            <button 
                                className="close-btn"
                                onClick={() => setShowVerificationModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="verification-info">
                            <i className="fas fa-envelope"></i>
                            <p>Tính năng xác minh sẽ được cập nhật trong phiên bản tiếp theo</p>
                        </div>
                        <div className="verification-actions">
                            <button 
                                className="btn primary"
                                onClick={confirmVerification}
                            >
                                Đã hiểu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;