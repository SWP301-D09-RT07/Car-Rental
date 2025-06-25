import axios from 'axios';
import axiosRetry from 'axios-retry';

// Cấu hình base URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Tạo instance Axios
const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000, // 10 giây timeout
});

// Cấu hình retry
axiosRetry(api, {
    retries: 3,
    retryDelay: (retryCount) => retryCount * 1000,
    retryCondition: (error) => error.response?.status === 429 || !error.response,
});

// Cache dùng Map
const cache = new Map();

// Invalidate cache
const invalidateCache = (key) => {
    cache.delete(key);
};

// Kiểm tra token hết hạn
const isTokenExpired = () => {
    const expiresAt = localStorage.getItem('expiresAt');
    return !expiresAt || new Date().getTime() > parseInt(expiresAt, 10);
};

// Interceptor thêm token
api.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem('token');
        const expiresAt = localStorage.getItem('expiresAt');
        
        console.log('🔍 API Request:', {
            url: config.url,
            method: config.method,
            hasToken: !!token,
            tokenExpired: isTokenExpired(),
            expiresAt: expiresAt ? new Date(parseInt(expiresAt)).toISOString() : 'N/A',
            currentTime: new Date().toISOString()
        });
        
        if (token && !isTokenExpired()) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('✅ Token added to request');
        } else if (token) {
            console.warn('⚠️ Token expired, clearing localStorage');
            localStorage.removeItem('token');
            localStorage.removeItem('expiresAt');
            localStorage.removeItem('role');
            localStorage.removeItem('username');
            localStorage.removeItem('userEmail');
            
            // Chỉ reject cho các endpoint cần authentication
            const protectedEndpoints = ['/api/users/', '/api/bookings/', '/api/favorites/'];
            const isProtectedEndpoint = protectedEndpoints.some(endpoint => config.url.includes(endpoint));
            
            if (isProtectedEndpoint) {
                return Promise.reject(new Error('Token hết hạn'));
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor xử lý lỗi
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn('⚠️ 401 Unauthorized response received');
            // Don't automatically clear token or redirect - let components handle it
            // Only clear if it's not a cars request (for public access)
            if (!error.config.url.includes('/cars')) {
                console.warn('⚠️ Clearing token due to 401 on protected endpoint');
            }        } else if (error.response?.status === 400) {
            const message = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.response?.data?.errors?.join(', ') || 
                          'Dữ liệu không hợp lệ';
            return Promise.reject(new Error(message));
        }
        return Promise.reject(error);
    }
);

// Xử lý Google login callback
export const handleGoogleLoginCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const expiresAt = urlParams.get('expiresAt');
    const role = urlParams.get('role');
    const error = urlParams.get('error');

    if (error) {
        throw new Error(decodeURIComponent(error) || 'Đăng nhập Google thất bại');
    }

    if (token && expiresAt) {
        localStorage.setItem('token', token);
        localStorage.setItem('expiresAt', expiresAt);
        localStorage.setItem('role', role || 'customer');
        window.location.href = '/';
        return { token, expiresAt, role };
    }
    throw new Error('Đăng nhập Google thất bại');
};

// Quản lý xác thực
export const login = async (username, password) => {
    if (!username || !password) throw new Error('Vui lòng cung cấp tên đăng nhập và mật khẩu');
    try {
        const response = await api.post('/api/auth/login', { username, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('expiresAt', response.data.expiresAt);
            localStorage.setItem('role', response.data.role || 'customer');
        }
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Đăng nhập thất bại');
    }
};

export const register = async (userData) => {
    if (!userData.email || !userData.password) throw new Error('Vui lòng cung cấp email và mật khẩu');
    try {
        const response = await api.post('/api/auth/register', userData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Đăng ký thất bại');
    }
};

export const checkEmail = async (email) => {
    if (!email) throw new Error('Vui lòng cung cấp email');
    try {
        const response = await api.post('/api/auth/check-email', { email });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Kiểm tra email thất bại');
    }
};

export const resetPassword = async (email, newPassword) => {
    if (!email || !newPassword) throw new Error('Vui lòng cung cấp email và mật khẩu mới');
    try {
        const response = await api.post('/api/auth/reset-password', { email, newPassword });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Đặt lại mật khẩu thất bại');
    }
};

// Sửa changePassword function trong api.js
export const changePassword = async (currentPassword, newPassword) => {
    if (!currentPassword || !newPassword) throw new Error('Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới');

    const payload = { currentPassword, newPassword };
    console.log('🔐 Change password payload:', payload);

    try {
        const response = await api.post('/api/users/change-password', payload);
        console.log('✅ Change password success:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Change password error:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        // Handle different error formats from backend
        const errorMessage = error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            'Đổi mật khẩu thất bại';
        throw new Error(errorMessage);
    }
};

export const loginWithGoogle = async () => {
    try {
        window.location.href = `${BASE_URL}/oauth2/authorization/google`;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Đăng nhập Google thất bại');
    }
};

export const logout = async () => {
    try {
        const response = await api.post('/api/auth/logout');
        localStorage.removeItem('token');
        localStorage.removeItem('expiresAt');
        localStorage.removeItem('role');
        return response.data;
    } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('expiresAt');
        localStorage.removeItem('role');
        throw new Error(error.response?.data?.message || 'Đăng xuất thất bại');
    }
};

// Quản lý người dùng
export const getProfile = async () => {
    try {
        console.log('🔄 Fetching user profile...');
        const response = await api.get('/api/users/profile');
        console.log('✅ Profile fetched successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Profile fetch error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers,
            message: error.message
        });
        
        // Provide more specific error messages based on status code
        if (error.response?.status === 401) {
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (error.response?.status === 403) {
            throw new Error('Bạn không có quyền truy cập thông tin này.');
        } else if (error.response?.status === 404) {
            throw new Error('Không tìm thấy thông tin người dùng.');
        } else if (error.response?.status === 500) {
            throw new Error('Lỗi hệ thống. Vui lòng thử lại sau.');
        } else {
            throw new Error(error.response?.data?.message || 'Lấy thông tin người dùng thất bại');
        }
    }
};

export const updateProfile = async (userData) => {
    if (!userData) throw new Error('Vui lòng cung cấp dữ liệu cập nhật');
    
    try {
        const response = await api.put('/api/users/profile', userData);
        return response.data;
    } catch (error) {
        console.error('Update profile error:', error);
        // Handle different error formats from backend
        const errorMessage = error.response?.data?.error || 
                            error.response?.data?.message || 
                            error.message || 
                            'Cập nhật hồ sơ thất bại';
        throw new Error(errorMessage);
    }
};

export const toggleNotifications = async (userId, enable) => {
    if (!userId) throw new Error('Vui lòng cung cấp ID người dùng');
    try {
        const response = await api.patch(`/api/users/${userId}/notifications`, { emailNotifications: enable });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Cập nhật cài đặt thông báo thất bại');
    }
};

// Quản lý yêu thích
export const getFavorites = async () => {
    const cacheKey = 'favorites';
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    try {
        const response = await api.get('/api/favorites');
        cache.set(cacheKey, response.data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách yêu thích thất bại');
    }
};

export const addFavorite = async (carId) => {
    if (!carId) throw new Error('Vui lòng cung cấp ID xe');
    try {
        const response = await api.post('/api/favorites', { carId });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Thêm vào yêu thích thất bại');
    }
};

export const removeFavorite = async (favoriteId) => {
    if (!favoriteId) throw new Error('Vui lòng cung cấp ID yêu thích');
    try {
        const response = await api.delete(`/api/favorites/${favoriteId}`);
        invalidateCache('favorites');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Xóa khỏi yêu thích thất bại');
    }
};

// Quản lý xe
export const getCars = async (filters = {}) => {
    try {
        const response = await api.get('/api/cars', { params: filters });
        return response.data;
    } catch (error) {
        if (error.message.includes('CORS')) return [];
        throw new Error(error.response?.data?.message || 'Lấy danh sách xe thất bại');
    }
};

export const searchCars = async (filters = {}, page = 0, size = 10) => {
    try {
        const response = await api.get('/api/cars/search', { 
            params: { 
                ...filters, 
                page, 
                size,
                sort: 'createdAt,desc'
            } 
        });
        return response.data;
    } catch (error) {
        if (error.message.includes('CORS')) return { content: [] };
        throw new Error(error.response?.data?.message || 'Tìm kiếm xe thất bại');
    }
};

export const getCarById = async (carId) => {
    if (!carId) throw new Error('Vui lòng cung cấp ID xe');
    try {
        const response = await api.get(`/api/cars/${carId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lấy thông tin xe thất bại');
    }
};

export const getCarBrands = async () => {
    const cacheKey = 'carBrands';
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    try {
        const response = await api.get('/api/car-brands');
        cache.set(cacheKey, response.data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách thương hiệu xe thất bại');
    }
};

export const getCarFeatures = async (carId) => {
    if (!carId) throw new Error('Vui lòng cung cấp ID xe');
    try {
        const response = await api.get(`/api/cars/${carId}/features`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lấy tính năng xe thất bại');
    }
};

export const getCarSpecifications = async (carId) => {
    if (!carId) throw new Error('Vui lòng cung cấp ID xe');
    try {
        const response = await api.get(`/api/cars/${carId}/specifications`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lấy thông số kỹ thuật xe thất bại');
    }
};

export const getAdditionalServices = async (carId) => {
    if (!carId) throw new Error('Vui lòng cung cấp ID xe');
    try {
        const response = await api.get('/api/service-types', { params: { carId } });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lấy dịch vụ bổ sung thất bại');
    }
};

// Quản lý địa điểm
export const getRegions = async () => {
    const cacheKey = 'regions';
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    try {
        const response = await api.get('/api/regions');
        cache.set(cacheKey, response.data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách địa điểm thất bại');
    }
};

// Quản lý đặt xe
export const createBooking = async (bookingData) => {
    if (!bookingData.carId || !bookingData.pickupDateTime || !bookingData.dropoffDate) {
        throw new Error('Vui lòng cung cấp đầy đủ thông tin đặt xe');
    }
    try {
        const response = await api.post('/api/bookings', bookingData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Tạo đặt xe thất bại');
    }
};

export const confirmBooking = async (bookingData) => {
    if (!bookingData.carId || !bookingData.pickupLocation || !bookingData.dropoffLocation || !bookingData.pickupDateTime || !bookingData.dropoffDate)
        throw new Error('Vui lòng cung cấp đầy đủ thông tin xác nhận');
    try {
        const response = await api.post('/api/bookings/confirm', bookingData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Xác nhận đặt xe thất bại');
    }
};

export const getBookingFinancials = async (bookingId) => {
    if (!bookingId) throw new Error('Vui lòng cung cấp ID đặt xe');
    try {
        const response = await api.get(`/api/bookings/${bookingId}/financials`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lấy thông tin tài chính thất bại');
    }
};

export const updateBooking = async (bookingId, bookingData) => {
    if (!bookingId) throw new Error('Vui lòng cung cấp ID đặt xe');
    try {
        const response = await api.put(`/api/bookings/${bookingId}`, bookingData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Cập nhật đặt xe thất bại');
    }
};

export const cancelBooking = async (bookingId) => {
    try {
        console.log('🔄 Cancelling booking ID:', bookingId);
        const response = await api.put(`/api/bookings/${bookingId}/cancel`);
        console.log('✅ Booking cancelled successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Cancel booking error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url
        });
        
        if (error.response?.status === 401) {
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (error.response?.status === 403) {
            throw new Error('Bạn không có quyền hủy đặt xe này.');
        } else if (error.response?.status === 404) {
            throw new Error('Không tìm thấy thông tin đặt xe.');
        } else if (error.response?.status === 400) {
            throw new Error(error.response?.data?.error || 'Không thể hủy đặt xe với trạng thái hiện tại.');
        } else if (error.response?.status === 500) {
            throw new Error(error.response?.data?.error || 'Lỗi hệ thống khi hủy đặt xe.');
        } else {
            throw new Error(error.response?.data?.error || 'Lỗi khi hủy đặt xe');
        }
    }
};

// Quản lý khuyến mãi
export const applyPromotion = async (promoCode) => {
    if (!promoCode) throw new Error('Vui lòng cung cấp mã khuyến mãi');
    try {
        const response = await api.post('/api/promotions/apply', { promoCode });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Áp dụng mã khuyến mãi thất bại');
    }
};

export const getActivePromotions = async () => {
    const cacheKey = 'activePromotions';
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    try {
        const response = await api.get('/api/promotions/active');
        cache.set(cacheKey, response.data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách mã khuyến mãi thất bại');
    }
};

// Quản lý thanh toán
export const initiatePayment = async (paymentData) => {
    if (!paymentData.bookingId || !paymentData.amount) throw new Error('Vui lòng cung cấp ID đặt xe và số tiền');
    try {
        const response = await api.post('/api/payments/create', paymentData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Khởi tạo thanh toán thất bại');
    }
};

// Quản lý báo cáo hư hỏng
export const uploadDamageReport = async (file, description, carId) => {
    if (!file) throw new Error('Vui lòng cung cấp file để upload');
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('description', description || '');
        if (carId) formData.append('carId', carId);
        const response = await api.post('/api/images/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Upload báo cáo hư hỏng thất bại');
    }
};

// Quản lý đánh giá
export const getRatingsByCarId = async (carId) => {
    if (!carId) throw new Error('Vui lòng cung cấp ID xe');
    try {
        const response = await api.get('/api/ratings', { params: { carId } });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lấy đánh giá xe thất bại');
    }
};

export const getRatingSummaryByCarId = async (carId) => {
    if (!carId) throw new Error('Vui lòng cung cấp ID xe');
    try {
        const response = await api.get('/api/ratings/summary', { params: { carId } });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lấy tổng quan đánh giá xe thất bại');
    }
};

export const createRating = async (ratingData) => {
    if (!ratingData.carId || !ratingData.rating) throw new Error('Vui lòng cung cấp ID xe và đánh giá');
    try {
        const response = await api.post('/api/ratings', ratingData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Tạo đánh giá thất bại');
    }
};

export const postReview = async (url, data) => {
    try {
        const response = await api.post(url, data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Gửi đánh giá thất bại');
    }
};

// Quản lý lịch sử thuê xe
export const getRentalHistory = async (carId) => {
    if (!carId) throw new Error('Vui lòng cung cấp ID xe');
    try {
        const response = await api.get('/api/bookings', { 
            params: { 
                carId,
                status: 'completed',
                sort: 'createdAt,desc'
            } 
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lấy lịch sử thuê xe thất bại');
    }
};

// Lấy lịch sử đặt xe theo user
export const getBookingsByUserId = async (userId) => {
    if (!userId) throw new Error('Vui lòng cung cấp ID người dùng');
    try {
        const response = await api.get(`/api/bookings/user/${userId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lấy lịch sử đặt xe thất bại');
    }
};

// Hàm POST tổng quát
export const post = async (url, data) => {
    try {
        const response = await api.post(url, data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Gửi yêu cầu thất bại');
    }
};

// Car APIs
export const getSimilarCars = async (carId, page = 0, size = 4) => {
    if (!carId) throw new Error('Vui lòng cung cấp ID xe');
    try {
        const response = await api.get(`/api/cars/${carId}/similar`, { 
            params: { page, size } 
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách xe tương tự thất bại');
    }
};

export const getSimilarCarsAdvanced = async (carId, page = 0, size = 4) => {
    if (!carId) throw new Error('Vui lòng cung cấp ID xe');
    try {
        const response = await api.get(`/api/cars/${carId}/similar-advanced`, { 
            params: { page, size } 
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách xe tương tự nâng cao thất bại');
    }
};

// Test authentication endpoint
export const testAuth = async () => {
    try {
        console.log('🧪 Testing authentication...');
        const response = await api.get('/api/users/profile');
        console.log('✅ Auth test successful:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Auth test failed:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers
        });
        throw error;
    }
};


export const getUserBookingHistory = async () => {
    try {
        console.log('🔄 Fetching user booking history...');
        const response = await api.get('/api/users/profile/bookings');
        console.log('✅ Booking history fetched successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Booking history fetch error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error || 'Lỗi khi tải lịch sử đặt xe');
    }
};

// Send email verification
export const sendEmailVerification = async () => {
    try {
        console.log('🔄 Sending email verification...');
        const response = await api.post('/api/users/send-email-verification');
        console.log('✅ Email verification sent:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Send email verification error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error || 'Lỗi khi gửi email xác thực');
    }
};

// Verify email
export const verifyEmail = async (token) => {
    try {
        console.log('🔄 Verifying email...');
        const response = await api.post('/api/users/verify-email', { token });
        console.log('✅ Email verified successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Verify email error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error || 'Lỗi khi xác thực email');
    }
};
export const getFavoriteCars = async () => {
    try {
        console.log('🔄 Fetching favorite cars...');
        const response = await api.get('/api/users/favorites');
        console.log('✅ Favorite cars fetched:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Fetch favorites error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error || 'Lỗi khi tải xe yêu thích');
    }
};

// Get booking details
export const getBookingDetails = async (bookingId) => {
    try {
        console.log('🔄 Fetching booking details for ID:', bookingId);
        console.log('🔍 Current token:', localStorage.getItem('token') ? 'Present' : 'Missing');
        console.log('🔍 Current role:', localStorage.getItem('role'));
        
        const response = await api.get(`/api/bookings/${bookingId}`);
        console.log('✅ Booking details fetched:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Fetch booking details error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url,
            headers: error.config?.headers
        });
        
        // Xử lý các loại lỗi cụ thể
        if (error.response?.status === 401) {
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (error.response?.status === 403) {
            const errorData = error.response?.data;
            if (errorData?.code === 'ACCESS_DENIED') {
                throw new Error(errorData.error || 'Bạn không có quyền xem chi tiết đặt xe này.');
            }
            throw new Error('Bạn không có quyền truy cập.');
        } else if (error.response?.status === 404) {
            throw new Error('Không tìm thấy thông tin đặt xe.');
        } else if (error.response?.status === 500) {
            const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Lỗi hệ thống';
            throw new Error(errorMsg);
        } else {
            throw new Error(error.response?.data?.error || 'Lỗi khi tải chi tiết đặt xe');
        }
    }
};


export default api;