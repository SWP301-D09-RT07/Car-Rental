import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../../context/AuthContext';
import { login, register } from '../../services/api';
import '../../styles/Auth.css';
import GoogleLogo from '/images/google-logo.jpg';

const LoginRegister = () => {
  const { login: setAuthData } = useContext(AuthContext);
  const [isRegisterActive, setRegisterActive] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Login form
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useForm();

  // Register form
  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors, isSubmitting: isRegisterSubmitting },
    watch,
  } = useForm();

  const password = watch('password');

  // Handle Google callback and URL errors
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const urlError = urlParams.get('error');
    const token = urlParams.get('token');
    const expiresAt = urlParams.get('expiresAt');
    const role = urlParams.get('role');
    const redirectTo = urlParams.get('redirectTo'); // <-- thêm dòng này

    if (urlError) {
      setError(decodeURIComponent(urlError) || 'Đăng nhập Google thất bại');
      setIsGoogleLoading(false);
    } else if (token && expiresAt && role) {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      if (decodedToken.exp * 1000 < Date.now()) {
        setError('Token đã hết hạn');
      } else {
        setAuthData(token, { expiresAt: parseInt(expiresAt), role });

        if (role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate(redirectTo || '/', { replace: true }); // <-- dùng redirectTo nếu có
        }
      }
    }
  }, [location, setAuthData, navigate]);


  const togglePanel = () => {
    setRegisterActive(!isRegisterActive);
    setError('');
  };

  const onLoginSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      const response = await login(data.username, data.password);
      setAuthData(response.token, {
        expiresAt: response.expiresAt,
        role: response.role || 'customer',
      });

      const urlParams = new URLSearchParams(location.search);
      const redirectTo = urlParams.get('redirectTo');

      if (response.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(redirectTo || '/', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin.');
    } finally {
      setLoading(false);
    }
  };


  const onRegisterSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      const userData = {
        username: data.username,
        email: data.email,
        password: data.password,
        phone: data.phone,
        roleId: data.userType === 'renter' ? 1 : 2,
        statusId: 1,
        countryCode: '+84',
        userDetail: {
          name: data.username, // Default name
          address: 'Unknown', // Default address
        },
      };
      await register(userData);
      setError('Đăng ký thành công! Vui lòng đăng nhập.');
      setRegisterActive(false);
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/oauth2/authorization/google`, { method: 'GET', redirect: 'manual' });
      if (response.type === 'opaqueredirect') {
        window.location.href = response.url;
      } else {
        throw new Error('Không thể khởi tạo đăng nhập Google');
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập Google thất bại');
      setIsGoogleLoading(false);
    }
  };

  return (
      <div className="auth-wrapper">
        {loading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
            </div>
        )}
        <div className={`auth-container ${isRegisterActive ? 'register-panel-active' : ''}`}>
          <div className="form-container login-container">
            <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="auth-form">
              <div className="brand-logo">
                <h1 className="brand-title">CarRental</h1>
                <p className="brand-subtitle">Dịch vụ cho thuê xe cao cấp</p>
              </div>

              <h2 className="form-title">Chào mừng trở lại</h2>
              <p className="form-subtitle">Đăng nhập để tiếp tục hành trình của bạn</p>

              <div className="input-group">
                <input
                    {...loginRegister('username', { required: 'Tên người dùng hoặc Email là bắt buộc' })}
                    type="text"
                    placeholder="Tên người dùng hoặc Email"
                    className="form-input"
                />
                {loginErrors.username && <span className="error-message">{loginErrors.username.message}</span>}
              </div>

              <div className="input-group">
                <input
                    {...loginRegister('password', {
                      required: 'Mật khẩu là bắt buộc',
                      minLength: { value: 8, message: 'Mật khẩu phải dài ít nhất 8 ký tự' },
                    })}
                    type="password"
                    placeholder="Mật khẩu"
                    className="form-input"
                />
                {loginErrors.password && <span className="error-message">{loginErrors.password.message}</span>}
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  Ghi nhớ tôi
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Quên mật khẩu?
                </Link>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
                  type="submit"
                  className="submit-btn primary-btn"
                  disabled={loading || isLoginSubmitting}
              >
                {loading || isLoginSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>

              <div className="divider">
                <span>hoặc tiếp tục với</span>
              </div>

              <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className={`google-btn ${isGoogleLoading ? 'loading' : ''}`}
                  disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                    <>
                      <div className="spinner-small"></div>
                      Đang kết nối với Google...
                    </>
                ) : (
                    <>
                      <img src={GoogleLogo} alt="Google" className="google-icon" />
                      Google
                    </>
                )}
              </button>

              <div className="auth-switch mobile-only">
                <p>
                  Chưa có tài khoản?
                  <button type="button" onClick={togglePanel} className="switch-btn">
                    Đăng ký
                  </button>
                </p>
              </div>

              <Link to="/" className="home-link">
                ← Quay lại trang chủ
              </Link>
            </form>
          </div>

          <div className="form-container register-container">
            <form onSubmit={handleRegisterSubmit(onRegisterSubmit)} className="auth-form">
              <div className="brand-logo">
                <h1 className="brand-title">CarRental</h1>
                <p className="brand-subtitle">Tham gia dịch vụ cao cấp của chúng tôi</p>
              </div>

              <h2 className="form-title">Tạo tài khoản</h2>
              <p className="form-subtitle">Bắt đầu hành trình của bạn ngay hôm nay</p>

              <div className="input-group">
                <input
                    {...registerRegister('username', { required: 'Tên người dùng là bắt buộc' })}
                    type="text"
                    placeholder="Tên người dùng *"
                    className="form-input"
                />
                {registerErrors.username && <span className="error-message">{registerErrors.username.message}</span>}
              </div>

              <div className="input-group">
                <input
                    {...registerRegister('email', {
                      required: 'Email là bắt buộc',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Vui lòng nhập địa chỉ email hợp lệ',
                      },
                    })}
                    type="email"
                    placeholder="Địa chỉ Email *"
                    className="form-input"
                />
                {registerErrors.email && <span className="error-message">{registerErrors.email.message}</span>}
              </div>

              <div className="input-group">
                <input
                    {...registerRegister('phone', {
                      required: 'Số điện thoại là bắt buộc',
                      pattern: {
                        value: /^\+?[1-9]\d{1,14}$/,
                        message: 'Vui lòng nhập số điện thoại hợp lệ (ví dụ: +84123456789)',
                      },
                      validate: async (value) => {
                        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/auth/check-phone?phone=${value}`);
                        const data = await response.json();
                        return data.available || 'Số điện thoại đã được sử dụng';
                      },
                    })}
                    type="text"
                    placeholder="Số điện thoại *"
                    className="form-input"
                />
                {registerErrors.phone && <span className="error-message">{registerErrors.phone.message}</span>}
              </div>

              <div className="input-group">
                <input
                    {...registerRegister('password', {
                      required: 'Mật khẩu là bắt buộc',
                      minLength: { value: 8, message: 'Mật khẩu phải dài ít nhất 8 ký tự' },
                    })}
                    type="password"
                    placeholder="Mật khẩu *"
                    className="form-input"
                />
                {registerErrors.password && <span className="error-message">{registerErrors.password.message}</span>}
              </div>

              <div className="input-group">
                <input
                    {...registerRegister('confirmPassword', {
                      required: 'Xác nhận mật khẩu là bắt buộc',
                      validate: (value) => value === password || 'Mật khẩu và xác nhận mật khẩu không khớp',
                    })}
                    type="password"
                    placeholder="Xác nhận mật khẩu *"
                    className="form-input"
                />
                {registerErrors.confirmPassword && <span className="error-message">{registerErrors.confirmPassword.message}</span>}
              </div>

              <div className="user-type-group">
                <p className="user-type-label">Tôi muốn:</p>
                <div className="user-type-options">
                  <label className="user-type-option">
                    <input
                        {...registerRegister('userType', { required: 'Vui lòng chọn loại người dùng' })}
                        type="radio"
                        value="renter"
                        defaultChecked
                    />
                    <span className="option-text">Thuê xe</span>
                    <span className="option-desc">Tìm và thuê xe</span>
                  </label>
                  <label className="user-type-option">
                    <input
                        {...registerRegister('userType')}
                        type="radio"
                        value="provider"
                    />
                    <span className="option-text">Cung cấp xe</span>
                    <span className="option-desc">Đăng xe của tôi cho thuê</span>
                  </label>
                </div>
                {registerErrors.userType && <span className="error-message">{registerErrors.userType.message}</span>}
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
                  type="submit"
                  className="submit-btn primary-btn"
                  disabled={loading || isRegisterSubmitting}
              >
                {loading || isRegisterSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
              </button>

              <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className={`google-btn ${isGoogleLoading ? 'loading' : ''}`}
                  disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                    <>
                      <div className="spinner-small"></div>
                      Đang kết nối với Google...
                    </>
                ) : (
                    <>
                      <img src={GoogleLogo} alt="Google" className="google-icon" />
                      Google
                    </>
                )}
              </button>

              <div className="auth-switch mobile-only">
                <p>
                  Đã có tài khoản?
                  <button type="button" onClick={togglePanel} className="switch-btn">
                    Đăng nhập
                  </button>
                </p>
              </div>

              <Link to="/" className="home-link">
                ← Quay lại trang chủ
              </Link>
            </form>
          </div>

          <div className="overlay-container">
            <div className="overlay">
              <div className="video-background">
                <iframe
                    src="https://www.youtube.com/embed/fkrgncE0Gdo?autoplay=1&mute=1&loop=1&playlist=fkrgncE0Gdo&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1"
                    frameBorder="0"
                    allow="autoplay; encrypted-media; playsinline"
                    allowFullScreen
                    title="Video cho thuê xe sang trọng"
                />
              </div>

              <div className="overlay-panel overlay-left">
                <div className="banner-content">
                  <h1 className="banner-title">Xin chào!</h1>
                  <div className="desktop-signin-prompt">
                    <p className="signin-text">Đã có tài khoản?</p>
                    <p className="signin-description">Đăng nhập để truy cập các đặt chỗ của bạn</p>
                  </div>
                  <div className="banner-features">
                    <div className="feature-item">
                      <span className="feature-icon">🚗</span>
                      <span>Xe sang trọng cao cấp</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">🌟</span>
                      <span>Dịch vụ 5 sao</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">💰</span>
                      <span>Giá tốt nhất</span>
                    </div>
                  </div>
                  <button className="banner-btn" onClick={() => setRegisterActive(false)}>
                    Đăng nhập
                  </button>
                </div>
              </div>

              <div className="overlay-panel overlay-right">
                <div className="banner-content">
                  <h1 className="banner-title">Bắt đầu hành trình!</h1>
                  <div className="desktop-signup-prompt">
                    <p className="signup-text">Chưa có tài khoản?</p>
                    <p className="signup-description">Đăng ký ngay để nhận ưu đãi độc quyền</p>
                  </div>
                  <div className="banner-features">
                    <div className="feature-item">
                      <span className="feature-icon">⚡</span>
                      <span>Đặt chỗ tức thì</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">🔒</span>
                      <span>Thanh toán an toàn</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">🏆</span>
                      <span>Được đánh giá cao</span>
                    </div>
                  </div>
                  <button className="banner-btn" onClick={() => setRegisterActive(true)}>
                    Đăng ký
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default LoginRegister;