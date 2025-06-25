
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
    const [user, setUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
    const navigate = useNavigate();

    // Lấy role từ localStorage
    const role = localStorage.getItem('role');

    useEffect(() => {
        if (role === 'CUSTOMER') {
            fetchProfile();
            fetchBookings();
        }
        if (role && role !== 'CUSTOMER') {
            if (role === 'SUPPLIER') {
                navigate('/supplier/dashboard', { replace: true });
            } else if (role === 'ADMIN') {
                navigate('/admin', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        }
    }, [role, navigate]);

    const fetchProfile = async () => {
        try {
            const data = await getProfile();
            setUser(data);
            setFormData({
                name: data.userDetail?.name || '',
                phone: data.phone || '',
                address: data.userDetail?.address || '',
            });
        } catch (error) {
            toast.error(error.message);
        }
    };

    const fetchBookings = async () => {
        try {
            const userId = localStorage.getItem('userId');
            const bookingsData = await getBookingsByUserId(userId);
            const bookingsWithFinancials = await Promise.all(
                bookingsData.map(async (booking) => {
                    const financials = await getBookingFinancials(booking.bookingId);
                    return { ...booking, financials };
                })
            );
            setBookings(bookingsWithFinancials);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const userId = user.userId;
            const updatedData = {
                username: formData.username,
                email: user.email,
                phone: formData.phone,
                roleId: user.roleId,
                statusId: user.statusId,
                countryCode: user.countryCode,
                preferredLanguage: user.preferredLanguage,
                userDetail: {
                    fullName: formData.fullName,
                    address: formData.address,
                    taxcode: formData.taxcode
                }
            };
            await updateProfile(userId, updatedData);
            setUser({ ...user, ...updatedData });
            setIsEditing(false);
            toast.success('Cập nhật hồ sơ thành công');
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        try {
            await changePassword(passwordData.currentPassword, passwordData.newPassword);
            setIsChangingPassword(false);
            setPasswordData({ currentPassword: '', newPassword: '' });
            toast.success('Đổi mật khẩu thành công');
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleViewBookingDetails = (bookingId) => {
        navigate(`/booking/${bookingId}`);
    };

    if (!user) return <div className="loading">Đang tải...</div>;

    return (
        <div className="profile-page">
            <h1 className="title">Trang Cá Nhân</h1>

            {/* UserInfo */}
            <div className="card">
                <h2 className="card-title">Thông Tin Tài Khoản</h2>
                <div className="user-info">

                    <div className="info">
                        <p><strong>Họ Tên:</strong> {user.userDetail?.name || 'Chưa cập nhật'}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Số Điện Thoại:</strong> {user.phone || 'Chưa cập nhật'}</p>
                        <p><strong>Địa Chỉ:</strong> {user.userDetail?.address || 'Chưa cập nhật'}</p>
                    </div>
                </div>
                <div className="button-group">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="btn primary"
                    >
                        Cập Nhật Hồ Sơ
                    </button>
                    <button
                        onClick={() => setIsChangingPassword(true)}
                        className="btn secondary"
                    >
                        Đổi Mật Khẩu
                    </button>
                </div>

                {isEditing && (
                    <form onSubmit={handleUpdateProfile} className="form">
                        <div className="form-group">
                            <label>Họ Tên</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Số Điện Thoại</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Địa Chỉ</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                        <div className="button-group">
                            <button type="submit" className="btn primary">
                                Lưu
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="btn cancel"
                            >
                                Hủy
                            </button>
                        </div>
                    </form>
                )}

                {isChangingPassword && (
                    <form onSubmit={handleChangePassword} className="form">
                        <div className="form-group">
                            <label>Mật Khẩu Hiện Tại</label>
                            <input
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Mật Khẩu Mới</label>
                            <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="button-group">
                            <button type="submit" className="btn secondary">
                                Lưu
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsChangingPassword(false)}
                                className="btn cancel"
                            >
                                Hủy
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* BookingHistory */}
            <div className="card booking-history">
                <h2 className="card-title">Lịch Sử Thuê Xe</h2>
                {bookings.length === 0 ? (
                    <p className="empty">Chưa có lịch sử thuê xe.</p>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                            <tr>
                                <th>Xe</th>
                                <th>Thời Gian</th>
                                <th>Trạng Thái</th>
                                <th>Tổng Tiền</th>
                                <th>Hành Động</th>
                            </tr>
                            </thead>
                            <tbody>
                            {bookings.map((booking) => (
                                <tr key={booking.bookingId}>
                                    <td>{booking.car?.model || 'N/A'}</td>
                                    <td>
                                        {new Date(booking.pickupDateTime).toLocaleString()} - {new Date(booking.dropoffDate).toLocaleString()}
                                    </td>
                                    <td>{booking.status?.statusName || 'N/A'}</td>
                                    <td>{booking.financials?.totalFare.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>
                                    <td>
                                        <button
                                            onClick={() => handleViewBookingDetails(booking.bookingId)}
                                            className="btn"
                                        >
                                            Xem Chi Tiết
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;