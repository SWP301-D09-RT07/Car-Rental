import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUsers, FaCar, FaClipboardList, FaDollarSign, FaClock, FaChartBar } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const AdminHome = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCars: 0,
        totalBookings: 0,
        totalRevenue: 0,
        pendingApprovals: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/dashboard-stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            } else {
                toast.error('Không thể tải thống kê dashboard');
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            toast.error('Lỗi khi tải thống kê dashboard');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Admin</h1>
                <p className="text-gray-600">Quản lý hệ thống thuê xe tự lái</p>
            </div>

            {/* Thống kê tổng quan */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                            <FaUsers className="w-6 h-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Tổng người dùng</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-600">
                            <FaCar className="w-6 h-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Tổng xe</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalCars}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                            <FaClipboardList className="w-6 h-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Tổng đơn thuê</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                            <FaDollarSign className="w-6 h-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                            <FaClock className="w-6 h-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Xe chờ duyệt</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Các chức năng chính */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link to="/admin/car-approvals" className="block">
                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-orange-500">
                        <div className="flex items-center mb-4">
                            <FaClock className="w-8 h-8 text-orange-500" />
                            <h3 className="text-xl font-semibold text-gray-800 ml-3">Duyệt xe</h3>
                        </div>
                        <p className="text-gray-600 mb-4">Quản lý và duyệt xe mới từ các supplier</p>
                        <div className="flex items-center text-orange-600">
                            <span className="text-sm font-medium">{stats.pendingApprovals} xe chờ duyệt</span>
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </Link>

                <Link to="/admin/users" className="block">
                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500">
                        <div className="flex items-center mb-4">
                            <FaUsers className="w-8 h-8 text-blue-500" />
                            <h3 className="text-xl font-semibold text-gray-800 ml-3">Quản lý người dùng</h3>
                        </div>
                        <p className="text-gray-600 mb-4">Xem và quản lý tất cả người dùng trong hệ thống</p>
                        <div className="flex items-center text-blue-600">
                            <span className="text-sm font-medium">Xem chi tiết</span>
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </Link>

                <Link to="/admin/reports" className="block">
                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-purple-500">
                        <div className="flex items-center mb-4">
                            <FaChartBar className="w-8 h-8 text-purple-500" />
                            <h3 className="text-xl font-semibold text-gray-800 ml-3">Báo cáo</h3>
                        </div>
                        <p className="text-gray-600 mb-4">Xem báo cáo chi tiết về hoạt động hệ thống</p>
                        <div className="flex items-center text-purple-600">
                            <span className="text-sm font-medium">Xem báo cáo</span>
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default AdminHome;