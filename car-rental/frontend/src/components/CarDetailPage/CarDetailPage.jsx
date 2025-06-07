import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCarById, getRatingsByCarId, createBooking } from '../../services/api';
import styles from './CarDetailPage.module.scss';

const CarDetailPage = () => {
    const { carId } = useParams();
    const navigate = useNavigate();
    const [car, setCar] = useState(null);
    const [ratings, setRatings] = useState([]);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [bookingData, setBookingData] = useState({
        startDate: '',
        endDate: '',
        pickupLocation: '',
        dropoffLocation: '',
        delivery: false,
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCarData = async () => {
            setLoading(true);
            try {
                const carData = await getCarById(carId);
                const ratingsData = await getRatingsByCarId(carId);
                setCar(carData);
                setRatings(ratingsData);
            } catch (err) {
                setError(err.message || 'Không thể tải thông tin xe');
            } finally {
                setLoading(false);
            }
        };
        fetchCarData();
    }, [carId]);

    const handleSubmitReview = async () => {
        if (!rating || !comment) {
            setError('Vui lòng chọn sao và viết bình luận.');
            return;
        }
        try {
            await createBooking.post('/ratings', { carId, rating, comment });
            setRating(0);
            setComment('');
            const ratingsData = await getRatingsByCarId(carId);
            setRatings(ratingsData);
            setError(null);
        } catch (err) {
            setError(err.message || 'Không thể gửi đánh giá');
        }
    };

    const handleBookingChange = (e) => {
        const { name, value, type, checked } = e.target;
        setBookingData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmitBooking = async () => {
        if (!bookingData.startDate || !bookingData.endDate || !bookingData.pickupLocation || !bookingData.dropoffLocation) {
            setError('Vui lòng điền đầy đủ thông tin đặt xe.');
            return;
        }
        try {
            await createBooking({
                carId,
                ...bookingData,
                pickupDateTime: bookingData.startDate,
            });
            navigate('/booking-confirmation', { state: { bookingData } });
            setError(null);
        } catch (err) {
            setError(err.message || 'Không thể đặt xe');
        }
    };

    if (loading) return <div className={styles.loading}>Đang tải...</div>;
    if (!car) return <div className={styles.error}>Xe không tồn tại</div>;

    return (
        <div className={styles.carDetailPage}>
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
                {error && <p className={styles.error}>{error}</p>}
                <h1 className={styles.carTitle}>{car.model} ({car.brandName})</h1>
                <div className={styles.carDetails}>
                    <p>Hãng: {car.brandName}</p>
                    <p>Năm sản xuất: {car.year}</p>
                    <p>Giá thuê/ngày: {car.dailyRate?.toLocaleString()} VND</p>
                    <p>Tiện nghi: {(car.features || '').split(', ').join(', ') || 'Không có'}</p>
                    <p>Địa điểm: {car.regionId}</p>
                </div>
                <div className={styles.imageGallery}>
                    {(car.images || []).map((img, index) => (
                        <img
                            key={index}
                            src={img || 'https://via.placeholder.com/300'}
                            alt={`Xe ${index + 1}`}
                            className={styles.carImage}
                        />
                    ))}
                </div>
                <div className={styles.reviews}>
                    <h2 className={styles.sectionTitle}>Đánh giá</h2>
                    <p>Điểm trung bình: {car.averageRating || 'Chưa có'}</p>
                    <div className={styles.reviewList}>
                        {ratings.map((r, index) => (
                            <div key={index} className={styles.review}>
                                <p>Điểm: {r.rating}</p>
                                <p>{r.comment || 'Không có bình luận'}</p>
                            </div>
                        ))}
                    </div>
                    <div className={styles.reviewForm}>
                        <select
                            value={rating}
                            onChange={(e) => setRating(Number(e.target.value))}
                            className={styles.select}
                        >
                            <option value="0">Chọn sao</option>
                            {[1, 2, 3, 4, 5].map(star => (
                                <option key={star} value={star}>{star} sao</option>
                            ))}
                        </select>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Viết bình luận..."
                            className={styles.textarea}
                        />
                        <button
                            onClick={handleSubmitReview}
                            className={styles.submitReviewBtn}
                            disabled={!rating || !comment}
                        >
                            Gửi
                        </button>
                    </div>
                </div>
                <div className={styles.bookingForm}>
                    <h2 className={styles.sectionTitle}>Đặt xe</h2>
                    <input
                        type="date"
                        name="startDate"
                        value={bookingData.startDate}
                        onChange={handleBookingChange}
                        className={styles.input}
                    />
                    <input
                        type="date"
                        name="endDate"
                        value={bookingData.endDate}
                        onChange={handleBookingChange}
                        className={styles.input}
                    />
                    <select
                        name="pickupLocation"
                        value={bookingData.pickupLocation}
                        onChange={handleBookingChange}
                        className={styles.select}
                    >
                        <option value="">Địa điểm nhận</option>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="TP.HCM">TP.HCM</option>
                    </select>
                    <select
                        name="dropoffLocation"
                        value={bookingData.dropoffLocation}
                        onChange={handleBookingChange}
                        className={styles.select}
                    >
                        <option value="">Địa điểm trả</option>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="TP.HCM">TP.HCM</option>
                    </select>
                    <label className={styles.checkbox}>
                        <input
                            type="checkbox"
                            name="delivery"
                            checked={bookingData.delivery}
                            onChange={handleBookingChange}
                        />
                        Giao xe tận nơi
                    </label>
                    <div className={styles.priceSummary}>
                        <p>Giá cơ bản: {car.dailyRate?.toLocaleString()} VND/ngày</p>
                        <p>Tổng tiền: {car.dailyRate?.toLocaleString()} VND</p>
                    </div>
                    <button
                        onClick={handleSubmitBooking}
                        className={styles.bookNowBtn}
                        disabled={!bookingData.startDate || !bookingData.endDate || !bookingData.pickupLocation || !bookingData.dropoffLocation}
                    >
                        Đặt ngay
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

export default CarDetailPage;