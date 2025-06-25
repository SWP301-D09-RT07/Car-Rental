import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { post} from '../../../../services/api';
import styles from './PaymentPage.module.scss';

const PaymentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { bookingId, priceBreakdown } = location.state || {};
    const [paymentMethod, setPaymentMethod] = useState('');
    const [cardDetails, setCardDetails] = useState({
        cardNumber: '',
        cardHolder: '',
        expiryDate: '',
        cvv: '',
    });
    const [error, setError] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [paymentId, setPaymentId] = useState(null);
    const [loading, setLoading] = useState(false); // ✅ Added loading state

    useEffect(() => {
        if (!bookingId || !priceBreakdown) {
            setError('Không có thông tin đặt xe');
        }
    }, [bookingId, priceBreakdown]);

    const handleCardChange = (e) => {
        const { name, value } = e.target;
        
        // ✅ Added input validation
        let formattedValue = value;
        
        if (name === 'cardNumber') {
            // Format card number with spaces
            formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
            if (formattedValue.length > 19) return; // Max 16 digits + 3 spaces
        } else if (name === 'expiryDate') {
            // Format MM/YY
            formattedValue = value.replace(/\D/g, '');
            if (formattedValue.length >= 2) {
                formattedValue = formattedValue.substring(0, 2) + '/' + formattedValue.substring(2, 4);
            }
            if (formattedValue.length > 5) return;
        } else if (name === 'cvv') {
            // Only numbers, max 3 digits
            formattedValue = value.replace(/\D/g, '').substring(0, 3);
        }
        
        setCardDetails(prev => ({ ...prev, [name]: formattedValue }));
    };

    // ✅ Enhanced validation
    const validateCardDetails = () => {
        if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length < 16) {
            return 'Số thẻ không hợp lệ';
        }
        if (!cardDetails.cardHolder.trim()) {
            return 'Vui lòng nhập tên chủ thẻ';
        }
        if (!cardDetails.expiryDate || !/^\d{2}\/\d{2}$/.test(cardDetails.expiryDate)) {
            return 'Ngày hết hạn không hợp lệ (MM/YY)';
        }
        if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
            return 'CVV không hợp lệ';
        }
        return null;
    };

    const handlePayment = async () => {
        setError(null);
        setLoading(true);
        
        try {
            // ✅ Enhanced validation
            if (!paymentMethod) {
                throw new Error('Vui lòng chọn phương thức thanh toán');
            }
            
            if (paymentMethod === 'card') {
                const cardError = validateCardDetails();
                if (cardError) {
                    throw new Error(cardError);
                }
            }
            
            const paymentData = {
                bookingId,
                paymentMethod,
                amount: priceBreakdown.deposit, // ✅ Specific amount
                ...(paymentMethod === 'card' && { 
                    cardDetails: {
                        ...cardDetails,
                        cardNumber: cardDetails.cardNumber.replace(/\s/g, '') // Remove spaces
                    }
                }),
            };
            
            console.log('🔄 Processing payment:', paymentData);
            const response = await post('/api/payments', paymentData);
            
            // ✅ Proper response handling
            if (response.success) {
                if (response.data?.redirectUrl) {
                    console.log('🔄 Redirecting to payment gateway:', response.data.redirectUrl);
                    window.location.href = response.data.redirectUrl;
                } else {
                    console.log('✅ Payment successful:', response.data);
                    setPaymentStatus('success');
                    setPaymentId(response.data?.paymentId || response.data?.id || 'N/A');
                }
            } else {
                throw new Error(response.error || 'Thanh toán thất bại');
            }
            
        } catch (err) {
            console.error('❌ Payment error:', err);
            setPaymentStatus('failed');
            setError(err.message || 'Thanh toán thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        setPaymentStatus(null);
        setError(null);
        setPaymentId(null);
    };

    // ✅ Enhanced loading state
    if (!bookingId || !priceBreakdown) {
        return (
            <div className={styles.paymentPage}>
                <div className={styles.loading}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Đang tải thông tin đặt xe...</p>
                    <Link to="/booking" className={styles.backBtn}>
                        Quay lại đặt xe
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.paymentPage}>
            <header className={styles.header}>
                <div className={styles.logo}>RentCar</div>
                <nav>
                    <Link to="/" className={styles.navLink}>Trang chủ</Link>
                    <Link to="/cars" className={styles.navLink}>Tìm kiếm</Link>
                    <Link to="/login" className={styles.navLink}>Đăng nhập</Link>
                    <Link to="/register" className={styles.navLink}>Đăng ký</Link>
                    <Link to="/profile" className={styles.navLink}>Hồ sơ</Link>
                </nav>
            </header>

            <div className={styles.content}>
                {error && (
                    <div className={styles.errorAlert}>
                        <i className="fas fa-exclamation-triangle"></i>
                        <span>Lỗi: {error}</span>
                    </div>
                )}
                
                <h1 className={styles.pageTitle}>Thanh toán</h1>

                {paymentStatus === 'success' ? (
                    <div className={styles.result}>
                        <div className={styles.successIcon}>
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <h2 className={styles.sectionTitle}>Thanh toán thành công!</h2>
                        <div className={styles.successDetails}>
                            <p><strong>Mã giao dịch:</strong> {paymentId}</p>
                            <p><strong>Mã đặt xe:</strong> {bookingId}</p>
                            <p><strong>Số tiền:</strong> {priceBreakdown.deposit.toLocaleString()} VND</p>
                        </div>
                        <p className={styles.emailNote}>
                            <i className="fas fa-envelope"></i>
                            Xác nhận đặt xe đã được gửi qua email.
                        </p>
                        <div className={styles.resultActions}>
                            <Link to="/profile?tab=bookings" className={styles.profileBtn}>
                                Xem lịch sử đặt xe
                            </Link>
                            <Link to="/" className={styles.backBtn}>
                                Về trang chủ
                            </Link>
                        </div>
                    </div>
                ) : paymentStatus === 'failed' ? (
                    <div className={styles.result}>
                        <div className={styles.errorIcon}>
                            <i className="fas fa-times-circle"></i>
                        </div>
                        <h2 className={styles.sectionTitle}>Thanh toán thất bại</h2>
                        <p className={styles.errorMessage}>{error}</p>
                        <div className={styles.resultActions}>
                            <button onClick={handleRetry} className={styles.retryBtn}>
                                <i className="fas fa-redo"></i>
                                Thử lại
                            </button>
                            <Link to="/booking" className={styles.backBtn}>
                                Quay lại đặt xe
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={styles.orderSummary}>
                            <h2 className={styles.sectionTitle}>
                                <i className="fas fa-receipt"></i>
                                Tóm tắt đơn hàng
                            </h2>
                            <div className={styles.summaryDetails}>
                                <div className={styles.summaryRow}>
                                    <span>Mã đặt xe:</span>
                                    <span><strong>#{bookingId}</strong></span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Tổng tiền:</span>
                                    <span>{priceBreakdown.total?.toLocaleString() || '0'} VND</span>
                                </div>
                                <div className={styles.summaryRow + ' ' + styles.highlight}>
                                    <span><strong>Cần thanh toán (30%):</strong></span>
                                    <span><strong>{priceBreakdown.deposit?.toLocaleString() || '0'} VND</strong></span>
                                </div>
                                <div className={styles.note}>
                                    <i className="fas fa-info-circle"></i>
                                    Phần còn lại sẽ được thanh toán khi nhận xe
                                </div>
                            </div>
                        </div>

                        <div className={styles.paymentMethods}>
                            <h2 className={styles.sectionTitle}>
                                <i className="fas fa-credit-card"></i>
                                Phương thức thanh toán
                            </h2>
                            
                            <div className={styles.methodGrid}>
                                <label className={`${styles.methodCard} ${paymentMethod === 'momo' ? styles.selected : ''}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="momo"
                                        checked={paymentMethod === 'momo'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <div className={styles.methodContent}>
                                        <img src="/images/momo-logo.png" alt="Momo" className={styles.methodLogo} />
                                        <span>Ví MoMo</span>
                                    </div>
                                </label>
                                
                                <label className={`${styles.methodCard} ${paymentMethod === 'vnpay' ? styles.selected : ''}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="vnpay"
                                        checked={paymentMethod === 'vnpay'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <div className={styles.methodContent}>
                                        <img src="/images/vnpay-logo.png" alt="VNPay" className={styles.methodLogo} />
                                        <span>VNPay</span>
                                    </div>
                                </label>
                                
                                <label className={`${styles.methodCard} ${paymentMethod === 'zalopay' ? styles.selected : ''}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="zalopay"
                                        checked={paymentMethod === 'zalopay'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <div className={styles.methodContent}>
                                        <img src="/images/zalopay-logo.png" alt="ZaloPay" className={styles.methodLogo} />
                                        <span>ZaloPay</span>
                                    </div>
                                </label>
                                
                                <label className={`${styles.methodCard} ${paymentMethod === 'card' ? styles.selected : ''}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="card"
                                        checked={paymentMethod === 'card'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <div className={styles.methodContent}>
                                        <i className="fas fa-credit-card"></i>
                                        <span>Thẻ ngân hàng</span>
                                    </div>
                                </label>
                            </div>

                            {paymentMethod === 'card' && (
                                <div className={styles.cardForm}>
                                    <h3>Thông tin thẻ</h3>
                                    <div className={styles.formGrid}>
                                        <div className={styles.formGroup}>
                                            <label>Số thẻ *</label>
                                            <input
                                                type="text"
                                                name="cardNumber"
                                                value={cardDetails.cardNumber}
                                                onChange={handleCardChange}
                                                placeholder="1234 5678 9012 3456"
                                                className={styles.input}
                                                maxLength="19"
                                            />
                                        </div>
                                        
                                        <div className={styles.formGroup}>
                                            <label>Tên chủ thẻ *</label>
                                            <input
                                                type="text"
                                                name="cardHolder"
                                                value={cardDetails.cardHolder}
                                                onChange={handleCardChange}
                                                placeholder="NGUYEN VAN A"
                                                className={styles.input}
                                                style={{ textTransform: 'uppercase' }}
                                            />
                                        </div>
                                        
                                        <div className={styles.formGroup}>
                                            <label>Ngày hết hạn *</label>
                                            <input
                                                type="text"
                                                name="expiryDate"
                                                value={cardDetails.expiryDate}
                                                onChange={handleCardChange}
                                                placeholder="MM/YY"
                                                className={styles.input}
                                                maxLength="5"
                                            />
                                        </div>
                                        
                                        <div className={styles.formGroup}>
                                            <label>CVV *</label>
                                            <input
                                                type="text"
                                                name="cvv"
                                                value={cardDetails.cvv}
                                                onChange={handleCardChange}
                                                placeholder="123"
                                                className={styles.input}
                                                maxLength="3"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className={styles.securityNote}>
                                        <i className="fas fa-shield-alt"></i>
                                        Thông tin thẻ của bạn được bảo mật và mã hóa
                                    </div>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={handlePayment} 
                            className={`${styles.payBtn} ${loading ? styles.loading : ''}`}
                            disabled={loading || !paymentMethod}
                        >
                            {loading ? (
                                <>
                                    <div className={styles.spinner}></div>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-lock"></i>
                                    Thanh toán {priceBreakdown.deposit?.toLocaleString()} VND
                                </>
                            )}
                        </button>
                        
                        <div className={styles.paymentSecurity}>
                            <div className={styles.securityBadges}>
                                <span><i className="fas fa-shield-alt"></i> Bảo mật SSL</span>
                                <span><i className="fas fa-lock"></i> Mã hóa 256-bit</span>
                                <span><i className="fas fa-check-circle"></i> Xác thực 3D Secure</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <div className={styles.footerSection}>
                        <h4>Liên hệ</h4>
                        <p>Email: contact@rentcar.com</p>
                        <p>Hotline: 1900 1234</p>
                    </div>
                    <div className={styles.footerSection}>
                        <h4>Theo dõi chúng tôi</h4>
                        <div className={styles.socialLinks}>
                            <a href="#" className={styles.socialLink}>
                                <i className="fab fa-facebook"></i>
                            </a>
                            <a href="#" className={styles.socialLink}>
                                <i className="fab fa-twitter"></i>
                            </a>
                            <a href="#" className={styles.socialLink}>
                                <i className="fab fa-instagram"></i>
                            </a>
                        </div>
                    </div>
                    <div className={styles.footerSection}>
                        <h4>Chính sách</h4>
                        <a href="#" className={styles.footerLink}>Chính sách bảo mật</a>
                        <a href="#" className={styles.footerLink}>Điều khoản dịch vụ</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PaymentPage;