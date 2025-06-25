import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { post } from '../../../../../src/services/api';
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

    useEffect(() => {
        if (!bookingId || !priceBreakdown) {
            setError('Không có thông tin đặt xe');
        }
    }, [bookingId, priceBreakdown]);

    const handleCardChange = (e) => {
        const { name, value } = e.target;
        setCardDetails(prev => ({ ...prev, [name]: value }));
    };

    const handlePayment = async () => {
        if (!paymentMethod) {
            setError('Vui lòng chọn phương thức thanh toán');
            return;
        }
        if (paymentMethod === 'card' && (!cardDetails.cardNumber || !cardDetails.cardHolder || !cardDetails.expiryDate || !cardDetails.cvv)) {
            setError('Vui lòng nhập đầy đủ thông tin thẻ');
            return;
        }
        try {
            const paymentData = {
                bookingId,
                paymentMethod,
                ...(paymentMethod === 'card' && { cardDetails }),
            };
            const response = await post('/api/payments', paymentData);
            if (response.redirectUrl) {
                window.location.href = response.redirectUrl; // Redirect to Momo/VNPay
            } else {
                setPaymentStatus('success');
                setPaymentId(response.id);
                // TODO: Trigger SendGrid email via backend
            }
        } catch (err) {
            setPaymentStatus('failed');
            setError(err.message || 'Thanh toán thất bại');
        }
    };

    const handleRetry = () => {
        setPaymentStatus(null);
        setError(null);
    };

    if (!bookingId || !priceBreakdown) return <div className={styles.loading}>Đang tải...</div>;

    return (
        <div className={styles.paymentPage}>
            <header className={styles.header}>
                <div className={styles.logo}>RentCar</div>
                <nav>
                    <Link to="/" className={styles.navLink}>Trang chủ</Link>
                    <Link to="/search" className={styles.navLink}>Tìm kiếm</Link>
                    <Link to="/login" className={styles.navLink}>Đăng nhập</Link>
                    <Link to="/register" className={styles.navLink}>Đăng ký</Link>
                    <Link to="/favorites" className={styles.navLink}>Yêu thích</Link>
                </nav>
            </header>

            <div className={styles.content}>
                {error && <p className={styles.error}>Lỗi: {error}</p>}
                <h1 className={styles.pageTitle}>Thanh toán</h1>

                {paymentStatus === 'success' ? (
                    <div className={styles.result}>
                        <h2 className={styles.sectionTitle}>Thanh toán thành công</h2>
                        <p>Mã giao dịch: {paymentId}</p>
                        <p>Xác nhận đã được gửi qua email.</p>
                        <Link to="/" className={styles.backBtn}>Về trang chủ</Link>
                    </div>
                ) : paymentStatus === 'failed' ? (
                    <div className={styles.result}>
                        <h2 className={styles.sectionTitle}>Thanh toán thất bại</h2>
                        <p>{error}</p>
                        <button onClick={handleRetry} className={styles.retryBtn}>Thử lại</button>
                    </div>
                ) : (
                    <>
                        <div className={styles.orderSummary}>
                            <h2 className={styles.sectionTitle}>Tóm tắt đơn hàng</h2>
                            <p>Tổng tiền: {priceBreakdown.total.toLocaleString()} VND</p>
                            <p>Cọc (30%): {priceBreakdown.deposit.toLocaleString()} VND</p>
                        </div>

                        <div className={styles.paymentMethods}>
                            <h2 className={styles.sectionTitle}>Phương thức thanh toán</h2>
                            <label className={styles.radio}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="momo"
                                    checked={paymentMethod === 'momo'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                />
                                Momo
                            </label>
                            <label className={styles.radio}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="vnpay"
                                    checked={paymentMethod === 'vnpay'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                />
                                VNPay
                            </label>
                            <label className={styles.radio}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="zalopay"
                                    checked={paymentMethod === 'zalopay'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                />
                                ZaloPay
                            </label>
                            <label className={styles.radio}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="card"
                                    checked={paymentMethod === 'card'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                />
                                Thẻ ngân hàng
                            </label>

                            {paymentMethod === 'card' && (
                                <div className={styles.cardForm}>
                                    <input
                                        type="text"
                                        name="cardNumber"
                                        value={cardDetails.cardNumber}
                                        onChange={handleCardChange}
                                        placeholder="Số thẻ"
                                        className={styles.input}
                                    />
                                    <input
                                        type="text"
                                        name="cardHolder"
                                        value={cardDetails.cardHolder}
                                        onChange={handleCardChange}
                                        placeholder="Tên chủ thẻ"
                                        className={styles.input}
                                    />
                                    <input
                                        type="text"
                                        name="expiryDate"
                                        value={cardDetails.expiryDate}
                                        onChange={handleCardChange}
                                        placeholder="Ngày hết hạn (MM/YY)"
                                        className={styles.input}
                                    />
                                    <input
                                        type="text"
                                        name="cvv"
                                        value={cardDetails.cvv}
                                        onChange={handleCardChange}
                                        placeholder="CVV"
                                        className={styles.input}
                                    />
                                </div>
                            )}
                        </div>

                        <button onClick={handlePayment} className={styles.payBtn}>
                            Thanh toán
                        </button>
                    </>
                )}
            </div>

            <footer className={styles.footer}>
                <p className={styles.footerLinks}>
                    <a href="#" className={styles.footerLink}>Facebook</a> |
                    <a href="#" className={styles.footerLink}>Twitter</a> |
                    <a href="#" className={styles.footerLink}>Instagram</a>
                </p>
                <p>Liên hệ: contact@rentcar.com | Hotline: 1900 1234</p>
                <p>Chính sách bảo mật | Điều khoản dịch vụ</p>
            </footer>
        </div>
    );
};

export default PaymentPage;