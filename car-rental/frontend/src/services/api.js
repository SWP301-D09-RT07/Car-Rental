import axios from 'axios';
import axiosRetry from 'axios-retry';
import { getToken } from "@/utils/auth"
import { getItem } from "@/utils/auth";

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
    const expiresAt = getItem('expiresAt');
    return !expiresAt || new Date().getTime() > parseInt(expiresAt, 10);
};

// Interceptor thêm token
api.interceptors.request.use(
    async (config) => {
        console.log('[API Request]', config.method?.toUpperCase(), config.url, config.data);
        const token = getItem('token');
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
        console.log('[API Response Error] - Token:', getItem('token') ? 'Có' : 'Không có');
        console.log('[API Response Error] - Username:', getItem('username'));
        console.log('[API Response Error] - Role:', getItem('role'));
        console.log('[API Response Error] - ExpiresAt:', getItem('expiresAt'));
        
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
        return response.data;
    } catch (error) {
        console.error('[API] Login error:', error);
        throw error;
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
    console.log("Current token:", getItem('token'));
    
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
export const addFavorite = async (carId, supplierId) => {
    if (!carId) throw new Error('Vui lòng cung cấp ID xe');
    if (!supplierId) throw new Error('Vui lòng cung cấp ID chủ xe');
    try {
        const response = await api.post('/api/favorites', { carId, supplierId });
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
        const params = {
            ...restFilters, 
            page,
            size,
            sort: 'createdAt,desc',
        };

        // Thêm date filters nếu có
        if (filters.pickupDateTime) {
            params.pickupDateTime = filters.pickupDateTime;
        }
        if (filters.dropoffDateTime) {
            params.dropoffDateTime = filters.dropoffDateTime;
        }

        const response = await api.get('/api/cars/search', { params });
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
        const userId = getItem('userId');
        if (userId) {
            const userBookings = await getBookingsByUserId(userId);
            const activeBookings = userBookings.filter(b => 
                b.status !== 'CANCELLED' && b.status !== 'COMPLETED'
            );
            if (activeBookings.length >= 10) {
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
        const token = getItem('token');
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
        
        // ✅ SỬA: Gọi endpoint UserController thay vì BookingController
        const response = await api.get('/api/users/profile/bookings');
        
        console.log('✅ Booking history fetched successfully:', response.data);
        
        // ✅ Debug payment info
        if (response.data.success && response.data.data) {
            console.log(`📊 Total bookings: ${response.data.total}`);
            response.data.data.forEach((booking, index) => {
                console.log(`📋 Booking ${index + 1}:`, {
                    bookingId: booking.bookingId,
                    carModel: booking.carModel,
                    statusName: booking.statusName,
                    paymentStatus: booking.paymentStatus,
                    paymentType: booking.paymentType,
                    paymentAmount: booking.paymentAmount,
                    paymentDate: booking.paymentDate
                });
            });
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ Booking history fetch error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url,
            message: error.message
        });
        
        if (error.response?.status === 401) {
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (error.response?.status === 403) {
            throw new Error('Bạn không có quyền truy cập.');
        } else if (error.response?.status === 404) {
            throw new Error('Không tìm thấy thông tin người dùng.');
        } else {
            throw new Error(error.response?.data?.error || 'Lỗi khi tải lịch sử đặt xe');
        }
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

// Get booking details
export const getBookingDetails = async (bookingId) => {
    try {
        console.log('🔄 Fetching booking details for ID:', bookingId);
        console.log('🔍 Current token:', getItem('token') ? 'Present' : 'Missing');
        console.log('🔍 Current role:', getItem('role'));
        
        const response = await api.get(`/api/bookings/${bookingId}`);
        console.log('✅ Booking details fetched:', response.data);
        if (response.data.success && response.data.data) {
            const booking = response.data.data;
            console.log('💰 Booking details payment info:', {
                bookingId: booking.bookingId,
                paymentStatus: booking.paymentStatus,
                paymentType: booking.paymentType,
                paymentAmount: booking.paymentAmount,
                paymentDate: booking.paymentDate
            });
        }
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
    
    // Thêm date filters nếu có
    if (filters.pickupDateTime) {
        params.pickupDateTime = filters.pickupDateTime;
    }
    if (filters.dropoffDateTime) {
        params.dropoffDateTime = filters.dropoffDateTime;
    }
    
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

/**
 * Lấy danh sách xe available theo thời gian
 * @param {Object} filters - Bộ lọc bao gồm pickupDateTime, dropoffDateTime
 * @param {number} page - Trang hiện tại
 * @param {number} size - Số lượng xe mỗi trang
 * @returns {Promise} Danh sách xe available
 */
export const getAvailableCars = async (filters = {}, page = 0, size = 10) => {
    try {
        const params = {
            page,
            size,
            ...filters
        };

        // Đảm bảo có pickupDateTime và dropoffDateTime
        if (!params.pickupDateTime || !params.dropoffDateTime) {
            // Nếu không có, sử dụng thời gian mặc định (hiện tại + 1 ngày)
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            params.pickupDateTime = params.pickupDateTime || now.toISOString();
            params.dropoffDateTime = params.dropoffDateTime || tomorrow.toISOString();
        }

        const response = await api.get('/api/cars/available', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching available cars:', error);
        if (error.message.includes('CORS')) return { content: [], totalElements: 0, totalPages: 1 };
        throw new Error(error.response?.data?.message || 'Lấy danh sách xe available thất bại');
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
        console.log('[API] Current token:', getItem('token') ? 'Có' : 'Không có');
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

// Lấy danh sách xe của supplier
export const getSupplierCars = async () => {
    const res = await api.get('/api/supplier/cars');
    return res.data;
};

// Thêm xe mới cho supplier
export const addSupplierCar = async (carData, images = []) => {
    const formData = new FormData();
    formData.append('carData', JSON.stringify(carData));
    images.forEach(img => formData.append('images', img));
    const token = getItem('token');
    const res = await api.post('/api/supplier/cars', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            ...(token && { Authorization: `Bearer ${token}` })
        }
    });
    return res.data;
};

// Xóa xe của supplier
export const deleteSupplierCar = async (carId) => {
    if (!carId) throw new Error('Vui lòng cung cấp ID xe');
    const token = getToken?.() || getItem('token');
    const res = await api.delete(`/api/supplier/cars/${carId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return res.data;
};

// Cập nhật xe của supplier
export const updateSupplierCar = async (carId, carData) => {
    if (!carId) throw new Error('Vui lòng cung cấp ID xe');
    const token = getToken?.() || getItem('token');
    const res = await api.put(`/api/supplier/cars/${carId}`, carData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return res.data;
};

// Lấy danh sách booking của supplier (đúng endpoint backend)
export const getSupplierOrders = async () => {
    const res = await api.get('/api/supplier/bookings');
    return res.data;
};

// Dashboard APIs
export const getSupplierDashboardSummary = async () => {
    const res = await api.get('/api/supplier/dashboard/summary');
    return res.data;
};

export const getSupplierRecentBookings = async () => {
    const res = await api.get('/api/supplier/dashboard/recent-bookings');
    return res.data;
};

export const getSupplierMonthlyStats = async () => {
    const token = getToken?.() || getItem('token');
    const res = await api.get('/api/supplier/dashboard/monthly-stats', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return res.data;
  };

export const getNextBookingId = async () => {
    try {
        const response = await api.get('/api/bookings/next-id');
        return response.data.nextBookingId;
    } catch (error) {
        console.error('Error fetching next booking ID:', error);
        throw new Error(error.response?.data?.message || 'Không thể lấy booking ID tiếp theo');
    }
};

export const getUserById = async (userId) => {
    if (!userId) throw new Error('Vui lòng cung cấp ID người dùng');
    try {
      const response = await api.get(`/api/users/public/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lấy thông tin người dùng thất bại');
    }
  };

/**
 * Gửi form đăng ký chủ xe (có upload file) lên backend
 * @param {Object} data - { fullName, idNumber, address, phoneNumber, email, carDocuments, businessLicense, driverLicense }
 * @returns {Promise<any>}
 */
export const createOwnerRegistrationRequest = async (data) => {
    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('idNumber', data.idNumber);
    formData.append('address', data.address);
    formData.append('phoneNumber', data.phoneNumber);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('carDocuments', data.carDocuments);
    formData.append('businessLicense', data.businessLicense);
    formData.append('driverLicense', data.driverLicense);
    try {
        const response = await api.post(
            `/api/registration-requests`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Gửi yêu cầu đăng ký chủ xe thất bại');
    }
};

//Rating apis

// ...existing code...

// Rating APIs
export const getAllRatings = async () => {
    const cacheKey = 'all-ratings';
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }
    
    try {
        const response = await api.get('/api/ratings');
        cache.set(cacheKey, response.data);
        setTimeout(() => cache.delete(cacheKey), 60000); // Cache 1 phút
        return response.data;
    } catch (error) {
        console.error('Error fetching all ratings:', error);
        throw new Error(error.response?.data?.message || 'Không thể tải danh sách đánh giá');
    }
};

export const getRatingsByCarId = async (carId) => {
    const cacheKey = `ratings-car-${carId}`;
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }
    
    try {
        const response = await api.get(`/api/ratings?carId=${carId}`);
        cache.set(cacheKey, response.data);
        setTimeout(() => cache.delete(cacheKey), 30000); // Cache 30 giây
        return response.data;
    } catch (error) {
        console.error(`Error fetching ratings for car ${carId}:`, error);
        throw new Error(error.response?.data?.message || 'Không thể tải đánh giá của xe');
    }
};

export const createRating = async (ratingData) => {
    try {
        const response = await api.post('/api/ratings', ratingData);
        
        // Invalidate cache
        invalidateCache('all-ratings');
        invalidateCache(`ratings-car-${ratingData.carId}`);
        
        return response.data;
    } catch (error) {
        console.error('Error creating rating:', error);
        throw new Error(error.response?.data?.message || 'Không thể tạo đánh giá');
    }
};

export const updateRating = async (ratingId, ratingData) => {
    try {
        const response = await api.put(`/api/ratings/${ratingId}`, ratingData);
        // Invalidate cache
        invalidateCache('all-ratings');
        if (ratingData.carId) invalidateCache(`ratings-car-${ratingData.carId}`);
        return response.data;
    } catch (error) {
        console.error('Error updating rating:', error);
        throw new Error(error.response?.data?.message || 'Không thể sửa đánh giá');
    }
};

export const getRatingSummaryByCarId = async (carId) => {
    try {
        const response = await api.get(`/api/ratings/summary?carId=${carId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching rating summary for car ${carId}:`, error);
        throw new Error(error.response?.data?.message || 'Không thể tải thống kê đánh giá');
    }
};

// ✅ API cho customer confirm
export const confirmDelivery = async (bookingId) => {
    try {
        console.log('🔄 Confirming delivery for booking:', bookingId);
        const response = await api.put(`/api/bookings/${bookingId}/confirm-delivery`);
        console.log('✅ Delivery confirmed:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Confirm delivery error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error || 'Không thể xác nhận nhận xe');
    }
};

export const confirmReturn = async (bookingId) => {
    try {
        console.log('🔄 Confirming return for booking:', bookingId);
        const response = await api.put(`/api/bookings/${bookingId}/confirm-return`);
        console.log('✅ Return confirmed:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Confirm return error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error || 'Không thể xác nhận trả xe');
    }
};

// ✅ API cho thanh toán tiền nhận xe
export const createPaymentForPickup = async (bookingId, paymentData) => {
    try {
        console.log('🔄 Creating pickup payment for booking:', bookingId);
        const response = await api.post(`/api/payments/pickup/${bookingId}`, paymentData);
        console.log('✅ Pickup payment created:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Create pickup payment error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error || 'Không thể tạo thanh toán nhận xe');
    }
};

/**
 * Supplier xác nhận nhận lại xe (kết thúc chuyến, chuẩn bị hoàn cọc)
 */
export const supplierConfirmReturn = async (bookingId) => {
    try {
        const response = await api.put(`/api/bookings/${bookingId}/supplier-confirm-return`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || error.response?.data?.message || 'Không thể xác nhận nhận lại xe');
    }
};

/**
 * Supplier thực hiện hoàn tiền cọc cho khách
 */
export const refundDeposit = async (bookingId) => {
    try {
        const response = await api.post(`/api/payments/refund`, { bookingId });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || error.response?.data?.message || 'Không thể hoàn tiền cọc');
    }
};

/**
 * Lấy tất cả payment (admin)
 */
export const getAllPayments = async () => {
    try {
        const response = await api.get('/api/payments');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách payment thất bại');
    }
};

/**
 * Admin thực hiện payout cho supplier
 */
export const payoutSupplier = async (bookingId) => {
    try {
        const response = await api.post('/api/payments/payout', { bookingId });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Chuyển tiền cho supplier thất bại');
    }
};

export const supplierConfirmBooking = async (bookingId) => {
    try {
        const response = await api.put(`/api/supplier/bookings/${bookingId}/confirm`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể xác nhận đơn đặt xe');
    }
};

export const supplierRejectBooking = async (bookingId) => {
    try {
        const response = await api.put(`/api/supplier/bookings/${bookingId}/reject`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể từ chối đơn đặt xe');
    }
};

/**
 * Supplier xác nhận đã nhận đủ tiền (full_payment)
 */
export const supplierConfirmFullPayment = async (bookingId) => {
    try {
        const response = await api.put(`/api/supplier/bookings/${bookingId}/confirm-full-payment`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể xác nhận đã nhận đủ tiền');
    }
};

/**
 * Lấy số tiền payout cho supplier của 1 booking (chỉ cho admin)
 * @param {number} bookingId
 * @returns {Promise<{payoutAmount: number, currency: string, priceBreakdown: object}>}
 */
export const getPayoutAmount = async (bookingId) => {
  if (!bookingId) throw new Error('Thiếu bookingId');
  try {
    const response = await api.get(`/api/bookings/${bookingId}/payout-amount`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data || error.message || 'Không lấy được payout amount');
  }
};

export const getRatingsByBookingId = async (bookingId) => {
    if (!bookingId) throw new Error('Vui lòng cung cấp bookingId');
    try {
        const response = await api.get(`/api/ratings?bookingId=${bookingId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể lấy đánh giá theo booking');
    }
};

export default api;

// Lấy danh sách xe chờ duyệt (admin)
export const getPendingCars = async () => {
  const token = getToken?.() || getItem('token');
  const res = await api.get('/api/cars/admin/pending-cars', {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.data;
};

// Duyệt xe (admin)
export const approveCar = async (carId) => {
  const token = getToken?.() || getItem('token');
  const res = await api.post(`/api/cars/admin/approve-car/${carId}`, {}, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.data;
};

// Từ chối xe (admin)
export const rejectCar = async (carId) => {
  const token = getToken?.() || getItem('token');
  const res = await api.post(`/api/cars/admin/reject-car/${carId}`, {}, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.data;
};

/**
 * Supplier chuẩn bị xe (chuyển trạng thái sang ready_for_pickup)
 */
export const supplierPrepareCar = async (bookingId) => {
    try {
        const response = await api.put(`/api/supplier/bookings/${bookingId}/prepare`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể chuyển sang trạng thái chờ nhận xe');
    }
};

/**
 * Supplier xác nhận đã giao xe (chuyển supplierDeliveryConfirm = true)
 */
export const supplierConfirmDelivery = async (bookingId) => {
    try {
        const response = await api.put(`/api/supplier/bookings/${bookingId}/supplier-delivery-confirm`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể xác nhận giao xe');
    }
};

/**
 * Cash Payment Management APIs
 */

// Lấy danh sách cash payments cần xác nhận
export const getPendingCashPayments = async () => {
    try {
        const response = await api.get('/api/cash-payments/pending');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể lấy danh sách thanh toán tiền mặt');
    }
};

// Xác nhận đã nhận tiền mặt
export const confirmCashReceived = async (paymentId, confirmationData) => {
    try {
        const response = await api.post(`/api/cash-payments/${paymentId}/confirm`, confirmationData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể xác nhận nhận tiền mặt');
    }
};

// Lấy danh sách platform fees chưa thanh toán
export const getPendingPlatformFees = async () => {
    try {
        const response = await api.get('/api/cash-payments/platform-fees/pending');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể lấy danh sách phí platform');
    }
};

// Lấy tổng số tiền platform fee chưa thanh toán
export const getTotalPendingPlatformFees = async () => {
    try {
        const response = await api.get('/api/cash-payments/platform-fees/pending/total');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể lấy tổng phí platform');
    }
};

// Thanh toán platform fee
export const payPlatformFee = async (confirmationId) => {
    try {
        const response = await api.post(`/api/cash-payments/confirmations/${confirmationId}/pay-platform-fee`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể thanh toán phí platform');
    }
};

// Admin: Lấy danh sách platform fees quá hạn
export const getOverduePlatformFees = async () => {
    try {
        const response = await api.get('/api/cash-payments/platform-fees/overdue');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể lấy danh sách phí quá hạn');
    }
};