import axios from 'axios';
import axiosRetry from 'axios-retry';
import { getToken } from "@/utils/auth"

// Cấu hình base URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Tạo instance Axios
const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000, // 30 giây timeout
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
        console.log('[API Request]', config.method?.toUpperCase(), config.url, config.data);
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        console.log("Final headers:", config.headers);
        console.log("=== END REQUEST INTERCEPTOR ===");
        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

// Interceptor xử lý lỗi
api.interceptors.response.use(
    (response) => {
        console.log('[API Response]', response.status, response.config.url, response.data);
        return response;
    },
    (error) => {
        console.error('[API Response Error]', error.response?.status, error.config?.url, error.message);
        console.log('[API Response Error] Current auth state:');
        console.log('[API Response Error] - Token:', localStorage.getItem('token') ? 'Có' : 'Không có');
        console.log('[API Response Error] - Username:', localStorage.getItem('username'));
        console.log('[API Response Error] - Role:', localStorage.getItem('role'));
        console.log('[API Response Error] - ExpiresAt:', localStorage.getItem('expiresAt'));
        
        if (error.response?.status === 401) {

            console.log('[API Response Error] 401 error detected, but not clearing tokens immediately');
            console.log('[API Response Error] Let the calling code handle the 401 error');
            // Không xóa token ngay lập tức, để code gọi API xử lý
            // localStorage.removeItem('token');
            // localStorage.removeItem('expiresAt');
            // localStorage.removeItem('role');
            // window.location.href = '/login?error=unauthorized';
        }
        return Promise.reject(error);
    }
);

// Interceptor xử lý lỗi
// api.interceptors.response.use(
//     (response) => response,
//     (error) => {
//         if (error.response?.status === 401) {
//             if (!error.config.url.includes('/cars')) {
//                 localStorage.removeItem('token');
//                 localStorage.removeItem('expiresAt');
//                 localStorage.removeItem('role');
//                 window.location.href = '/login?error=unauthorized';
//             }
//         } else if (error.response?.status === 400) {
//             const message = error.response?.data?.message || error.response?.data?.errors?.join(', ') || 'Dữ liệu không hợp lệ';
//             return Promise.reject(new Error(message));
//         } else if (error.response?.status === 500) {
//             // Ném lỗi để component xử lý, không chuyển hướng
//             const message = error.response?.data?.message || 'Lỗi server, vui lòng thử lại sau';
//             return Promise.reject(new Error(message));
//         }
//         return Promise.reject(error);
//     }
// );

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
        console.log('[API] Attempting login for username:', username);
        const response = await api.post('/api/auth/login', { username, password });
        console.log('[API] Login response received:', {
            hasToken: !!response.data.token,
            tokenLength: response.data.token ? response.data.token.length : 0,
            hasExpiresAt: !!response.data.expiresAt,
            expiresAt: response.data.expiresAt,
            hasRole: !!response.data.role,
            role: response.data.role,
            hasUsername: !!response.data.username,
            username: response.data.username
        });
        
        // Không lưu vào localStorage ở đây, để AuthContext xử lý
        return response.data;
    } catch (error) {
        console.error('[API] Login error:', error);
        throw new Error(error.response?.data?.message || 'Đăng nhập thất bại');
    }
};

export const register = async (userData) => {
    if (!userData.email || !userData.password) throw new Error('Vui lòng cung cấp email và mật khẩu');
    try {
        const response = await api.post('/api/auth/register', userData);
        return response.data;
    } catch (error) {
        console.error('[API] Register error:', error.response?.data);
        throw new Error(error.response?.data?.error || error.response?.data?.message || 'Đăng ký thất bại');
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
        localStorage.removeItem('username');
        return response.data;
    } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('expiresAt');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
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

// Quản lý người dùng (Admin)
export const getUsers = async (page, size, role, status) => {
    try {
        const response = await api.get('/api/users', {
            params: {
                page,
                size,
                role: role || 'all',
                status: status || 'all',
            },
        });
        return response.data; // Trả về Page<UserDTO> với content, totalPages, v.v.
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách người dùng thất bại');
    }
};

export const toggleUserStatus = async (userId, reason = null) => {
    console.log("=== BẮT ĐẦU TOGGLE USER STATUS (FRONTEND) ===");
    console.log("User ID:", userId);
    console.log("Reason:", reason);
    console.log("Current token:", localStorage.getItem('token'));
    
    try {
        const requestBody = {
            reason: reason
        };
        
        console.log("Request body:", requestBody);
        console.log("API URL:", `/api/users/${userId}/toggle-status`);
        
        const response = await api.put(`/api/users/${userId}/toggle-status`, requestBody, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        console.log("Response status:", response.status);
        console.log("Response data:", response.data);
        console.log("=== KẾT THÚC TOGGLE USER STATUS (FRONTEND) - THÀNH CÔNG ===");
        return response.data; // Trả về UserDTO đã cập nhật
    } catch (error) {
        console.error("=== LỖI TOGGLE USER STATUS (FRONTEND) ===");
        console.error("User ID:", userId);
        console.error("Reason:", reason);
        console.error("Error object:", error);
        console.error("Error response:", error.response);
        console.error("Error status:", error.response?.status);
        console.error("Error data:", error.response?.data);
        console.error("Error message:", error.message);
        console.error("=== KẾT THÚC LỖI TOGGLE USER STATUS (FRONTEND) ===");
        throw new Error(error.response?.data?.message || 'Chuyển đổi trạng thái người dùng thất bại');
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
    // XÓA dropoffLocation khỏi filters nếu có
    const { dropoffLocation, ...restFilters } = filters;
    try {
        const response = await api.get('/api/cars/search', { 
            params: { 
                ...restFilters, 
                page,
                size,
                sort: 'createdAt,desc',
            },
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


export const getBookedDates = async (carId) => {
    try {
        const response = await api.get(`/api/cars/${carId}/booked-dates`);
        return response.data;
    } catch (error) {
        console.error('Error fetching booked dates:', error);
        throw new Error(error.response?.data?.message || 'Lấy lịch đặt xe thất bại');
    }
};

export function getToken() {
    return localStorage.getItem('token');
}


export const getCarBrands = async () => {
    const cacheKey = 'carBrands';
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    try {
        const token = getToken();
        const response = await api.get('/api/car-brands', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
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
        const token = getToken();
        const response = await api.get('/api/regions', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        cache.set(cacheKey, response.data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách địa điểm thất bại');
    }
};

// Quản lý đặt xe
export const createBooking = async (bookingData) => {
    try {
        // Validate booking data
        if (!bookingData.carId) throw new Error('Vui lòng chọn xe');
        if (!bookingData.pickupDateTime) throw new Error('Vui lòng chọn thời gian nhận xe');
        if (!bookingData.dropoffDateTime) throw new Error('Vui lòng chọn thời gian trả xe');
        if (!bookingData.pickupLocation) throw new Error('Vui lòng nhập địa điểm nhận xe');
        if (!bookingData.dropoffLocation) throw new Error('Vui lòng nhập địa điểm trả xe');

        // Validate dates
        const pickupDate = new Date(bookingData.pickupDateTime);
        const dropoffDate = new Date(bookingData.dropoffDateTime);
        const now = new Date();

        if (pickupDate < now) {
            throw new Error('Thời gian nhận xe không được trong quá khứ');
        }

        if (dropoffDate <= pickupDate) {
            throw new Error('Thời gian trả xe phải sau thời gian nhận xe');
        }

        // Calculate rental duration in hours
        const durationInHours = (dropoffDate - pickupDate) / (1000 * 60 * 60);
        if (durationInHours < 4) {
            throw new Error('Thời gian thuê tối thiểu là 4 giờ');
        }
        if (durationInHours > 720) { // 30 days
            throw new Error('Thời gian thuê tối đa là 30 ngày');
        }

        // Check if user has reached booking limit
        const userId = localStorage.getItem('userId');
        if (userId) {
            const userBookings = await getBookingsByUserId(userId);
            const activeBookings = userBookings.filter(b => 
                b.status !== 'CANCELLED' && b.status !== 'COMPLETED'
            );
            if (activeBookings.length >= 3) {
                throw new Error('Bạn đã đạt giới hạn số lần đặt xe (tối đa 3 lần)');
            }
        }

        const response = await api.post('/api/bookings', bookingData);
        return response.data;
    } catch (error) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

export const confirmBooking = async (bookingData) => {
    try {
        // Validate confirmation data
        if (!bookingData.bookingId) throw new Error('Không tìm thấy thông tin đặt xe');
        if (!bookingData.contactInfo) throw new Error('Vui lòng cung cấp thông tin liên hệ');
        if (!bookingData.paymentMethod) throw new Error('Vui lòng chọn phương thức thanh toán');

        // Validate contact info
        const { fullName, phone, email, address } = bookingData.contactInfo;
        if (!fullName) throw new Error('Vui lòng nhập họ và tên');
        if (!phone) throw new Error('Vui lòng nhập số điện thoại');
        if (!email) throw new Error('Vui lòng nhập email');
        if (!address) throw new Error('Vui lòng nhập địa chỉ');

        // Validate phone number format
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
            throw new Error('Số điện thoại không hợp lệ');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Email không hợp lệ');
        }

        // Check if booking is still available
        const booking = await getBookingById(bookingData.bookingId);
        if (booking.status !== 'PENDING') {
            throw new Error('Đặt xe này không còn khả dụng');
        }

        // Check if car is still available for the selected time
        const carBookings = await getBookingsByCarId(booking.carId);
        const isCarAvailable = carBookings.every(b => 
            b.bookingId === bookingData.bookingId || 
            b.status === 'CANCELLED' || 
            b.status === 'COMPLETED' ||
            new Date(b.dropoffDateTime) <= new Date(booking.pickupDateTime) ||
            new Date(b.pickupDateTime) >= new Date(booking.dropoffDateTime)
        );

        if (!isCarAvailable) {
            throw new Error('Xe không còn khả dụng trong khoảng thời gian này');
        }

        const response = await api.post('/api/bookings/confirm', bookingData);
        return response.data;
    } catch (error) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
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

export const getPriceBreakdown = async (bookingId) => {
    if (!bookingId) throw new Error('Vui lòng cung cấp ID đặt xe');
    try {
        const response = await api.get(`/api/bookings/${bookingId}/price-breakdown`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lấy thông tin giá thất bại');
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
    try {
        const response = await post('/api/payments', paymentData);
        return response;
    } catch (error) {
        console.error('Payment initiation failed:', error);
        throw error;
    }
};

export const processPayment = async (paymentData) => {
    try {
        const response = await post('/api/payments/process', paymentData);
        return response;
    } catch (error) {
        console.error('Payment processing failed:', error);
        throw error;
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
                sort: 'createdAt,desc',
            },
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
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
        
        const response = await api.post(url, data, { headers });
        return response.data;
    } catch (error) {
        console.log('[API Post] Error occurred:', error.response?.status, error.response?.data);
        if (error.response?.status === 401) {
            console.log('[API Post] 401 error detected, but not clearing tokens immediately');
            console.log('[API Post] Let the calling code handle the 401 error');
            // Không xóa token ngay lập tức, để code gọi API xử lý
            // localStorage.removeItem('token');
            // localStorage.removeItem('expiresAt');
            // localStorage.removeItem('role');
            // window.location.href = '/login?error=unauthorized';
        }
        throw error;
    }
};

// Car APIs
export const getSimilarCars = async (carId, page = 0, size = 4) => {
    if (!carId) throw new Error('Vui lòng cung cấp ID xe');
    try {
        const response = await api.get(`/api/cars/${carId}/similar`, {
            params: { page, size },
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
            params: { page, size },
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

export const filterCars = (filters, page = 0, size = 9, sortBy = "") => {
    const params = { ...filters, page, size };
    if (sortBy) params.sortBy = sortBy;
    return api.get("/api/cars/filter", { params });
};

export const findCars = async (searchQuery, page = 0, size = 9) => {
    try {
        const token = getToken();
        const response = await api.get('/api/cars/search/keyword', {
            params: {
                searchQuery,
                page,
                size
            },
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        return response.data;
    } catch (error) {
        console.error('Error searching cars:', error);
        throw new Error(error.response?.data?.message || 'Tìm kiếm xe thất bại');
    }
};

export const getBookingById = async (bookingId) => {
    if (!bookingId) throw new Error('Vui lòng cung cấp ID đặt xe');
    try {
        const response = await api.get(`/api/bookings/${bookingId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lấy thông tin đặt xe thất bại');
    }
};

export const getBookingByTransactionId = async (transactionId) => {
    if (!transactionId) throw new Error('Vui lòng cung cấp ID giao dịch');
    try {
        const response = await api.get(`/api/bookings/by-payment/${transactionId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lấy thông tin đặt xe qua ID giao dịch thất bại');
    }
};

export const ensureBookingFinancials = async (bookingId) => {
    if (!bookingId) throw new Error('Vui lòng cung cấp ID đặt xe');
    try {
        console.log('[API] Calling ensureBookingFinancials for bookingId:', bookingId);
        console.log('[API] Current token:', localStorage.getItem('token') ? 'Có' : 'Không có');
        const response = await api.post(`/api/bookings/${bookingId}/ensure-financials`);
        console.log('[API] ensureBookingFinancials response:', response.data);
        return response.data;
    } catch (error) {
        console.error('[API] ensureBookingFinancials error:', error.response?.status, error.response?.data);
        throw new Error(error.response?.data?.message || 'Đảm bảo thông tin tài chính thất bại');
    }
}
export const getReportsData = async () => {
    try {
        const response = await api.get('/api/reports/overview');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lấy dữ liệu báo cáo thất bại');
    }
};

export const getMonthlyUserRegistrations = async () => {
    try {
        const response = await api.get('/api/reports/user-registrations');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lấy thống kê đăng ký người dùng thất bại');
    }
}
// Lấy booking gần đây nhất cho dashboard admin
export const getRecentBookings = async (size = 5) => {
    const token = getToken();
    const response = await api.get(`/api/admin/bookings/recent?size=${size}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    return response.data;
};

// Lấy khách hàng mới đăng ký theo tháng/năm cho dashboard admin
export const getNewUsersByMonth = async (month, year) => {
    const token = getToken();
    const response = await api.get(`/api/users/new-by-month?month=${month}&year=${year}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    return response.data;
};

// Lấy user có booking gần đây nhất cho dashboard admin
export const getRecentBookingUsers = async (size = 5) => {
    const token = getToken();
    const response = await api.get(`/api/users/recent-userbooking?size=${size}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    return response.data;
};

export default api;