import {useEffect, useState} from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import {getCarById, post} from '../../services/api';
import styles from './BookingConfirmationPage.module.scss';

const BookingConfirmationPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { bookingData } = location.state || {};
    const [car, setCar] = useState(null);
    const [promoCode, setPromoCode] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [error, setError] = useState(null);
    const [priceBreakdown, setPriceBreakdown] = useState({
        basePrice: 0,
        extraFee: 0,
        tax: 0,
        discount: 0,
        total: 0,
        deposit: 0,
    });

    useEffect(() => {
        if (!bookingData) {
            setError('Không có thông tin đặt xe');
            return;
        }
        const fetchCar = async () => {
            try {
                const carData = await getCarById(bookingData.carId);
                setCar(carData);
                calculatePrice(carData.daily_rate);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchCar();
    }, [bookingData]);

    const calculatePrice = (dailyRate) => {
        if (!bookingData) return;
        const start = new Date(bookingData.startDate);
        const end = new Date(bookingData.endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;
        const basePrice = dailyRate * days;
        const extraFee = bookingData.delivery ? 100000 : 0; // Add other fees (e.g., overtime, driver) if applicable
        const taxRate = 0.1; // 10% VAT
        const tax = basePrice * taxRate;
        const total = basePrice + extraFee + tax;
        const deposit = total * 0.3; // 30% deposit
        setPriceBreakdown({
            basePrice,
            extraFee,
            tax,
            discount: 0, // Updated via promo code
            total,
            deposit,
        });
    };

    const handleApplyPromo = async () => {
        try {
            const response = await post('/api/promotions/apply', { promoCode });
            const discountPercentage = response.discount_percentage || 0;
            const discount = priceBreakdown.basePrice * (discountPercentage / 100);
            setPriceBreakdown(prev => ({
                ...prev,
                discount,
                total: prev.basePrice + prev.extraFee + prev.tax - discount,
                deposit: (prev.basePrice + prev.extraFee + prev.tax - discount) * 0.3,
            }));
        } catch (err) {
            setError('Mã giảm giá không hợp lệ');
        }
    };

    const handleConfirm = async () => {
        if (!agreeTerms) {
            setError('Vui lòng đồng ý với điều khoản');
            return;
        }
        try {
            const response = await post('/api/bookings/confirm', {
                carId: bookingData.carId,
                startDate: bookingData.startDate,
                endDate: bookingData.endDate,
                pickupLocation: bookingData.pickupLocation,
                dropoffLocation: bookingData.dropoffLocation,
                promoCode,
                agreeTerms,
            });
            navigate('/payments', { state: { bookingId: response.bookingId, priceBreakdown } });
        } catch (err) {
            setError(err.message);
        }
    };

    if (!bookingData || !car) return <div className={styles.loading}>Đang tải...</div>;

    return (
        <div className={styles.bookingConfirmationPage}>
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
                <h1 className={styles.pageTitle}>Xác nhận đặt xe</h1>

                <div className={styles.summary}>
                    <h2 className={styles.sectionTitle}>Tóm tắt đặt xe</h2>
                    <div className={styles.carInfo}>
                        <img
                            src={car.image || 'https://via.placeholder.com/300'}
                            alt={car.model}
                            className={styles.carImage}
                        />
                        <div>
                            <h3 className={styles.carName}>{car.model}</h3>
                            <p>Nhận xe: {new Date(bookingData.startDate).toLocaleString()}</p>
                            <p>Trả xe: {new Date(bookingData.endDate).toLocaleString()}</p>
                            <p>Địa điểm nhận: {bookingData.pickupLocation}</p>
                            <p>Địa điểm trả: {bookingData.dropoffLocation}</p>
                        </div>
                    </div>
                </div>

                <div className={styles.priceBreakdown}>
                    <h2 className={styles.sectionTitle}>Chi tiết giá</h2>
                    <p>Giá cơ bản: {priceBreakdown.basePrice.toLocaleString()} VND</p>
                    <p>Phụ phí: {priceBreakdown.extraFee.toLocaleString()} VND</p>
                    <p>Thuế VAT (10%): {priceBreakdown.tax.toLocaleString()} VND</p>
                    <p>Giảm giá: {priceBreakdown.discount.toLocaleString()} VND</p>
                    <p><strong>Tổng tiền: {priceBreakdown.total.toLocaleString()} VND</strong></p>
                    <p><strong>Cọc (30%): {priceBreakdown.deposit.toLocaleString()} VND</strong></p>
                </div>

                <div className={styles.confirmForm}>
                    <h2 className={styles.sectionTitle}>Xác nhận</h2>
                    <div className={styles.promoInput}>
                        <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            placeholder="Nhập mã giảm giá"
                            className={styles.input}
                        />
                        <button onClick={handleApplyPromo} className={styles.applyPromoBtn}>
                            Áp dụng
                        </button>
                    </div>
                    <label className={styles.checkbox}>
                        <input
                            type="checkbox"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                        />
                        Tôi đồng ý với <a href="/terms" className={styles.termsLink}>điều khoản dịch vụ</a>
                    </label>
                    <button onClick={handleConfirm} className={styles.confirmBtn}>
                        Tiếp tục thanh toán
                    </button>
                </div>
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

export default BookingConfirmationPage;