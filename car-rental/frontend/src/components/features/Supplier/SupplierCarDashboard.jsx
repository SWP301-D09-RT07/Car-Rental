import React, { useState, useEffect, useContext } from "react";
import {
  FaCar, FaClipboardList, FaChartBar, FaComments, FaPlus, FaSync, FaUser, FaHome,
  FaDollarSign, FaCalendarAlt, FaUsers, FaEye, FaCheckCircle,
  FaClock, FaExclamationTriangle, FaStar, FaFire, FaArrowUp, FaArrowDown,
  FaBell, FaFilter, FaDownload
} from "react-icons/fa";
import SupplierCarList from "./SupplierCarList";
import SupplierCarForm from "./SupplierCarForm";
import SupplierOrderManagement from "./SupplierOrderManagement";
import SupplierReport from "./SupplierReport";
import SupplierProfile from "./SupplierProfile";
import ChatWindow from '../../Chat/ChatWindow';
import { AuthContext } from '@/store/AuthContext';
import { getSupplierDashboardSummary, getSupplierCars, getSupplierOrders, getSupplierMonthlyStats } from '@/services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import SupplierSidebar from "./SupplierSidebar";
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '@/components/ui/Loading/LoadingSpinner.jsx';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const SupplierCarDashboard = () => {
  const [selected, setSelected] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState({
    totalCars: 0,
    totalBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    newCustomers: 0,
    availableCars: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    maintenanceCars: 0,
    rentedCars: 0
  });
  const [carStats, setCarStats] = useState([]);
  const [revenueData, setRevenueData] = useState({});
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [popularCars, setPopularCars] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carsData, setCarsData] = useState([]);
  const [mostPopularCar, setMostPopularCar] = useState(null);
  const [ordersData, setOrdersData] = useState([]); // Thêm state lưu ordersData
  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);

  // Lấy profile từ API để lấy userId
  useEffect(() => {
    (async () => {
      try {
        const data = await (await import('@/services/api')).getProfile();
        setProfile(data);
        console.log('[SupplierCarDashboard] profile:', data);
      } catch (err) {
        console.error('Lỗi lấy profile:', err);
      }
    })();
  }, []);

  const navigate = useNavigate();
  
  // Chat data
  const demoUserId = "user1";
  const supplierId = user?.username || "supplier1";
  const supplierRole = user?.role || "supplier";

  console.log('[SupplierCarDashboard] user:', user);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch summary data
        const summaryData = await getSupplierDashboardSummary();
        
        // Fetch cars data for detailed stats
        const carsDataFetched = await getSupplierCars();
        setCarsData(carsDataFetched || []);
        
        // Fetch orders data for detailed stats
        const ordersData = await getSupplierOrders();
        setOrdersData(ordersData || []); // Lưu lại ordersData để dùng cho tính toán xe phổ biến nhất
        
        // Fetch monthly stats for revenue chart
        const monthlyStatsData = await getSupplierMonthlyStats();
        setMonthlyStats(monthlyStatsData);
        
        // Lọc danh sách xe đã duyệt (không lấy xe có status 'pending' hoặc 'pending_approval')
        const filteredCars = Array.isArray(carsDataFetched) ? carsDataFetched.filter(car => {
          const st = (car.statusName || car.status?.statusName || '').toLowerCase();
          return st !== 'pending' && st !== 'pending_approval';
        }) : [];

        // Calculate detailed stats from filtered cars data
        const availableCars = filteredCars?.filter(car => 
          car.status?.statusName?.toLowerCase() === 'available' || 
          car.statusName?.toLowerCase() === 'available'
        ).length || 0;
        
        const maintenanceCars = filteredCars?.filter(car => 
          car.status?.statusName?.toLowerCase() === 'maintenance' || 
          car.statusName?.toLowerCase() === 'maintenance'
        ).length || 0;

        // --- CẬP NHẬT LOGIC XE ĐANG THUÊ ---
        // Đếm số carId duy nhất từ các booking có status 'in progress'
        const inProgressBookings = ordersData?.filter(order => {
          const st = (order.status?.statusName || order.statusName || '').toLowerCase();
          return st === 'in_progress' || st === 'in progress';
        }) || [];
        const uniqueRentedCarIds = new Set(inProgressBookings.map(order => order.car?.carId || order.carId).filter(Boolean));
        const rentedCars = uniqueRentedCarIds.size;
        // --- END ---
        
        // Calculate detailed stats from orders data
        const pendingOrders = ordersData?.filter(order => 
          (order.status?.statusName || order.statusName)?.toLowerCase() === 'pending'
        ).length || 0;
        
        const confirmedOrders = ordersData?.filter(order => 
          (order.status?.statusName || order.statusName)?.toLowerCase() === 'confirmed'
        ).length || 0;

        // Calculate car statistics for charts
        const carBrandStats = {};
        const carStatusStats = {};
        filteredCars?.forEach(car => {
          const brand = car.brand || 'Khác';
          const status = car.status?.statusName || car.statusName || 'Không xác định';
          
          carBrandStats[brand] = (carBrandStats[brand] || 0) + 1;
          carStatusStats[status] = (carStatusStats[status] || 0) + 1;
        });

        // Calculate popular cars based on booking count (CHỈ TÍNH BOOKING ĐÃ PAYOUT)
        const paidOrders = ordersData?.filter(order => {
          if (order.payoutStatus) {
            return order.payoutStatus === 'completed';
          }
          if (order.paymentDetails && Array.isArray(order.paymentDetails)) {
            return order.paymentDetails.some(
              p => p.paymentType === 'payout' && p.paymentStatus === 'paid'
            );
          }
          return false;
        }) || [];

        const carBookingCount = {};
        paidOrders.forEach(order => {
          const carModel = order.vehicle?.model || order.model || 'Xe không xác định';
          if (carModel !== 'Xe không xác định') {
            carBookingCount[carModel] = (carBookingCount[carModel] || 0) + 1;
          }
        });

        const popularCarsArray = Object.entries(carBookingCount)
          .map(([model, count]) => ({ model, bookings: count }))
          .sort((a, b) => b.bookings - a.bookings)
          .slice(0, 5);

        // Calculate revenue data for last 6 months (from backend)
        if (monthlyStatsData && monthlyStatsData.months && monthlyStatsData.revenueByMonth) {
          setRevenueData({
            labels: monthlyStatsData.months,
            datasets: [{
              label: 'Doanh thu (VNĐ)',
              data: monthlyStatsData.revenueByMonth,
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderWidth: 3,
              tension: 0.4,
              fill: true,
              pointBackgroundColor: 'rgb(59, 130, 246)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 6
            }]
          });
        }

        // Generate recent activities
        const activities = [
          { type: 'booking', message: 'Đơn đặt xe mới từ khách hàng Nguyễn Văn A', time: '5 phút trước', icon: FaClipboardList, color: 'text-blue-600' },
          { type: 'payment', message: 'Nhận được thanh toán 2.500.000 VNĐ', time: '15 phút trước', icon: FaDollarSign, color: 'text-green-600' },
          { type: 'car', message: 'Xe Toyota Camry đã được trả về', time: '1 giờ trước', icon: FaCar, color: 'text-purple-600' },
          { type: 'maintenance', message: 'Xe Honda Civic cần bảo trì', time: '2 giờ trước', icon: FaExclamationTriangle, color: 'text-orange-600' },
          { type: 'review', message: 'Nhận được đánh giá 5 sao từ khách hàng', time: '3 giờ trước', icon: FaStar, color: 'text-yellow-600' },
        ];

        // Map backend response to frontend state
        setDashboardData({
          totalCars: filteredCars.length,
          totalBookings: summaryData?.totalBookings || ordersData?.length || 0,
          totalRevenue: summaryData?.totalRevenue || 0,
          monthlyRevenue: summaryData?.monthlyRevenue || 0,
          newCustomers: summaryData?.newCustomers || 12,
          availableCars: availableCars,
          pendingOrders: summaryData?.pendingBookings || pendingOrders,
          confirmedOrders: summaryData?.activeBookings || confirmedOrders,
          maintenanceCars: maintenanceCars,
          rentedCars: rentedCars // Đã cập nhật logic
        });

        setCarStats([
          { name: 'Thương hiệu', data: carBrandStats },
          { name: 'Trạng thái', data: carStatusStats }
        ]);

        setPopularCars(popularCarsArray);
        setRecentActivities(activities);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Không thể tải dữ liệu tổng quan';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (selected === "dashboard") {
      fetchDashboardData();
      
      // Auto-refresh every 60 seconds
      const interval = setInterval(fetchDashboardData, 60000);
      return () => clearInterval(interval);
    }
  }, [selected]);

  // Tính toán xe phổ biến nhất của supplier
  useEffect(() => {
    if (!ordersData || !carsData) return;
    // Đếm số lượt đặt cho từng carId
    const carBookingCount = {};
    ordersData.forEach(order => {
      const carId = order.car?.carId || order.carId;
      if (carId) {
        carBookingCount[carId] = (carBookingCount[carId] || 0) + 1;
      }
    });
    // Tìm carId có số booking nhiều nhất
    let maxCarId = null;
    let maxCount = 0;
    Object.entries(carBookingCount).forEach(([carId, count]) => {
      if (count > maxCount) {
        maxCarId = carId;
        maxCount = count;
      }
    });
    // Lấy thông tin xe từ carsData
    const mostPopular = carsData.find(car => (car.carId || car.id) == maxCarId);
    setMostPopularCar(mostPopular ? { ...mostPopular, bookingCount: maxCount } : null);
  }, [ordersData, carsData]);

  // Refresh dashboard data
  const handleRefresh = async () => {
    if (selected === "dashboard") {
      setLoading(true);
      // Trigger refresh
      const event = new Date();
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
      window.location.reload(); // Simple refresh - you can make this more sophisticated
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Helper: Lấy số xe mới tháng này và tháng trước
  const getNewCarsByMonth = (carsData, monthOffset = 0) => {
    const now = new Date();
    const month = now.getMonth() - monthOffset;
    const year = now.getFullYear();
    return carsData?.filter(car => {
      if (!car.createdAt) return false;
      const created = new Date(car.createdAt);
      return created.getMonth() === month && created.getFullYear() === year;
    }).length || 0;
  };

  // Helper: Tính phần trăm tăng/giảm
  const getPercentChange = (arr) => {
    if (!arr || arr.length < 2) return 0;
    const last = arr[arr.length - 1] || 0;
    const prev = arr[arr.length - 2] || 0;
    if (prev === 0) return last > 0 ? 100 : 0;
    return ((last - prev) / prev) * 100;
  };

  const renderContent = () => {
    // Lấy dữ liệu cần thiết từ state
    // carsData được lấy từ getSupplierCars, monthlyStats từ getSupplierMonthlyStats
    // Nếu chưa có thì fallback về [] hoặc {}
    // Khi tính tổng số xe, loại bỏ xe có statusName là 'pending' hoặc 'pending_approval'
    const cars = Array.isArray(carsData) ? carsData.filter(car => {
      const st = (car.statusName || car.status?.statusName || '').toLowerCase();
      return st !== 'pending' && st !== 'pending_approval';
    }) : [];
    const stats = monthlyStats || {};

    // Lọc danh sách xe đã duyệt (không lấy xe có status 'pending' hoặc 'pending_approval')
    const filteredCars = Array.isArray(carsData) ? carsData.filter(car => {
      const st = (car.statusName || car.status?.statusName || '').toLowerCase();
      return st !== 'pending' && st !== 'pending_approval';
    }) : [];

    // Sử dụng filteredCars thay cho carsData ở tất cả các chỗ thống kê tổng số xe, availableCars, maintenanceCars, rentedCars, v.v.
    // Ví dụ:
    // const availableCars = filteredCars.filter(car => ... ).length;
    // ...
    // setDashboardData({
    //   totalCars: filteredCars.length,
    //   ...
    // })
    // ... existing code ...
    // Tính số xe mới tháng này và tháng trước
    const newCarsThisMonth = getNewCarsByMonth(cars, 0);
    const newCarsLastMonth = getNewCarsByMonth(cars, 1);
    // Tính phần trăm tăng/giảm đơn đặt, doanh thu, khách hàng mới
    const bookingPercent = getPercentChange(stats.bookingsByMonth);
    const revenuePercent = getPercentChange(stats.revenueByMonth);
    const newCustomersPercent = getPercentChange(stats.bookingsByMonth); // Nếu có mảng newCustomersByMonth thì dùng, tạm thời dùng bookingsByMonth

    switch (selected) {
      case "dashboard":
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >     
            {/* Enhanced Header with Modern Glass Design */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden">
              {/* Animated Background Elements */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent backdrop-blur-3xl"></div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-yellow-400/20 to-pink-500/20 rounded-full blur-2xl -translate-y-10 translate-x-10 animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-cyan-400/20 to-blue-500/20 rounded-full blur-2xl translate-y-10 -translate-x-10 animate-pulse" style={{animationDelay: '1s'}}></div>
              <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-gradient-to-r from-green-400/15 to-blue-500/15 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{animationDelay: '2s'}}></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between">
              <div className="flex items-center">
                    <motion.div 
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="bg-white/25 p-4 rounded-2xl mr-6 backdrop-blur-sm border border-white/30 shadow-lg"
                    >
                      <FaHome className="text-4xl drop-shadow-lg" />
                    </motion.div>
                    <div>
                      <motion.h1 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-5xl font-heading font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent drop-shadow-lg"
                      >
                        Dashboard Chủ Xe
                      </motion.h1>
                      <motion.p 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-blue-100 text-lg font-medium drop-shadow-sm"
                      >
                        Chào mừng trở lại, <span className="text-yellow-200 font-bold">{user?.username || 'Chủ xe'}</span>! 🚗✨
                      </motion.p>
                      <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center mt-3 text-blue-200"
                      >
                        <div className="bg-white/20 p-2 rounded-lg mr-3 backdrop-blur-sm">
                          <FaCalendarAlt className="text-sm" />
                        </div>
                        <span className="text-sm font-medium">{new Date().toLocaleDateString('vi-VN', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </motion.div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-white/20 backdrop-blur-md text-white px-4 py-3 rounded-xl hover:bg-white/30 flex items-center transition-all border border-white/30 shadow-lg group"
                    >
                      <FaBell className="mr-2 group-hover:animate-bounce" />
                      <span className="bg-gradient-to-r from-red-500 to-pink-500 text-xs rounded-full px-2 py-1 ml-1 animate-pulse shadow-lg">3</span>
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRefresh}
                      disabled={loading}
                      className="bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-xl hover:bg-white/30 flex items-center transition-all disabled:opacity-50 border border-white/30 shadow-lg"
                    >
                      <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                      <span className="font-medium">Làm mới</span>
                    </motion.button>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 }}
                      className="bg-white/20 backdrop-blur-md px-4 py-3 rounded-xl border border-white/30 shadow-lg"
                    >
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                        <span>Hoạt động</span>
                      </div>
                    </motion.div>
                </div>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <LoadingSpinner size="large" color="blue" />
              </div>
            ) : (
              <>
                {/* Enhanced Main Stats with Modern Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    whileHover={{ y: -8, shadow: "0 25px 50px -12px rgba(59, 130, 246, 0.4)" }}
                    className="group bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-5 translate-x-5"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                      <div>
                          <p className="text-blue-100 text-sm font-medium">Tổng số xe</p>
                          <p className="text-4xl font-bold mb-2 font-heading">{dashboardData.totalCars}</p>
                          <div className="flex items-center text-blue-200 text-xs">
                            <FaArrowUp className="mr-1 animate-bounce" />
                            <span>{newCarsThisMonth > 0 ? `+${newCarsThisMonth} xe mới tháng này` : 'Không có xe mới'}</span>
                          </div>
                        </div>
                        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform">
                          <FaCar className="text-3xl drop-shadow-lg" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ y: -8, shadow: "0 25px 50px -12px rgba(34, 197, 94, 0.4)" }}
                    className="group bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-5 translate-x-5"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm font-medium">Tổng đơn đặt</p>
                          <p className="text-4xl font-bold mb-2 font-heading">{dashboardData.totalBookings}</p>
                          <div className="flex items-center text-green-200 text-xs">
                            <FaArrowUp className="mr-1 animate-pulse" />
                            <span>{bookingPercent >= 0 ? `+${bookingPercent.toFixed(0)}%` : `${bookingPercent.toFixed(0)}%`} so với tháng trước</span>
                          </div>
                        </div>
                        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform">
                          <FaClipboardList className="text-3xl drop-shadow-lg" />
                      </div>
                    </div>
                  </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ y: -8, shadow: "0 25px 50px -12px rgba(168, 85, 247, 0.4)" }}
                    className="group bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-5 translate-x-5"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                      <div>
                          <p className="text-purple-100 text-sm font-medium">Tổng doanh thu</p>
                          <p className="text-4xl font-bold mb-2 font-heading">{(dashboardData.totalRevenue / 1000000).toFixed(1)}M</p>
                          <div className="flex items-center text-purple-200 text-xs">
                            <FaArrowUp className="mr-1 animate-bounce" />
                            <span>{revenuePercent >= 0 ? `+${revenuePercent.toFixed(0)}%` : `${revenuePercent.toFixed(0)}%`} so với tháng trước</span>
                          </div>
                        </div>
                        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform">
                          <FaDollarSign className="text-3xl drop-shadow-lg" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ y: -8, shadow: "0 25px 50px -12px rgba(249, 115, 22, 0.4)" }}
                    className="group bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-5 translate-x-5"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                      <div>
                          <p className="text-orange-100 text-sm font-medium">Xe sẵn sàng</p>
                          <p className="text-4xl font-bold mb-2 font-heading">{dashboardData.availableCars}</p>
                          <div className="flex items-center text-orange-200 text-xs">
                            <FaCheckCircle className="mr-1 animate-pulse" />
                            <span>Sẵn sàng cho thuê</span>
                          </div>
                        </div>
                        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform">
                          <FaCheckCircle className="text-3xl drop-shadow-lg" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Enhanced Secondary Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.02, y: -3 }}
                    className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500 text-sm font-medium">Đơn chờ duyệt</p>
                          <p className="text-3xl font-bold text-yellow-600 font-heading">{dashboardData.pendingOrders}</p>
                          <div className="flex items-center text-yellow-500 text-xs mt-1">
                            <FaClock className="mr-1" />
                            <span>Cần xử lý</span>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-3 rounded-xl group-hover:scale-110 transition-transform">
                          <FaClock className="text-yellow-600 text-2xl" />
                      </div>
                    </div>
                  </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.02, y: -3 }}
                    className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                      <div>
                          <p className="text-gray-500 text-sm font-medium">Xe đang thuê</p>
                          <p className="text-3xl font-bold text-blue-600 font-heading">{dashboardData.rentedCars}</p>
                          <div className="flex items-center text-blue-500 text-xs mt-1">
                            <FaCar className="mr-1" />
                            <span>Đang hoạt động</span>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded-xl group-hover:scale-110 transition-transform">
                          <FaCar className="text-blue-600 text-2xl" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    whileHover={{ scale: 1.02, y: -3 }}
                    className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500 text-sm font-medium">Xe bảo trì</p>
                          <p className="text-3xl font-bold text-red-600 font-heading">{dashboardData.maintenanceCars}</p>
                          <div className="flex items-center text-red-500 text-xs mt-1">
                            <FaExclamationTriangle className="mr-1" />
                            <span>Cần bảo trì</span>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-red-100 to-red-200 p-3 rounded-xl group-hover:scale-110 transition-transform">
                          <FaExclamationTriangle className="text-red-600 text-2xl" />
                      </div>
                    </div>
                  </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    whileHover={{ scale: 1.02, y: -3 }}
                    className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                      <div>
                          <p className="text-gray-500 text-sm font-medium">Khách hàng mới</p>
                          <p className="text-3xl font-bold text-green-600 font-heading">{dashboardData.newCustomers}</p>
                          <div className="flex items-center text-green-500 text-xs mt-1">
                            <FaUsers className="mr-1" />
                            <span>{newCustomersPercent >= 0 ? `+${newCustomersPercent.toFixed(0)}%` : `${newCustomersPercent.toFixed(0)}%`} tháng này</span>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-100 to-green-200 p-3 rounded-xl group-hover:scale-110 transition-transform">
                          <FaUsers className="text-green-600 text-2xl" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Enhanced Charts and Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Revenue Chart - Enhanced with modern design */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 }}
                    className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800 font-heading">📈 Biểu đồ doanh thu</h3>
                          <p className="text-gray-500">6 tháng gần đây</p>
                          <div className="flex items-center mt-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                            <span className="text-sm text-gray-600">Xu hướng tăng trưởng tích cực</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-3 rounded-xl">
                            <FaChartBar className="text-blue-600 text-xl" />
                          </div>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-gradient-to-r from-gray-100 to-gray-200 p-3 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all shadow-sm"
                      >
                            <FaDownload className="text-gray-600" />
                          </motion.button>
                        </div>
                      </div>
                      {revenueData.labels && (
                        <div className="h-80 bg-gradient-to-t from-gray-50/50 to-transparent rounded-xl p-4">
                          <Line 
                            data={revenueData} 
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  display: false
                                },
                                tooltip: {
                                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                  titleColor: 'white',
                                  bodyColor: 'white',
                                  cornerRadius: 12,
                                  displayColors: false,
                                  titleFont: {
                                    size: 14,
                                    weight: 'bold'
                                  },
                                  bodyFont: {
                                    size: 13
                                  },
                                  padding: 12
                                }
                              },
                              interaction: {
                                intersect: false,
                                mode: 'index'
                              },
                              scales: {
                                x: {
                                  grid: {
                                    display: false
                                  },
                                  border: {
                                    display: false
                                  },
                                  ticks: {
                                    font: {
                                      size: 12,
                                      weight: '500'
                                    },
                                    color: '#64748b'
                                  }
                                },
                                y: {
                                  beginAtZero: true,
                                  border: {
                                    display: false
                                  },
                                  grid: {
                                    color: '#e2e8f0',
                                    borderDash: [5, 5]
                                  },
                                  ticks: {
                                    font: {
                                      size: 12,
                                      weight: '500'
                                    },
                                    color: '#64748b',
                                    callback: function(value) {
                                      return (value / 1000000).toFixed(1) + 'M VNĐ';
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                  
                  {/* Car Status Chart - Enhanced */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 }}
                    className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 font-heading">🚗 Trạng thái xe</h3>
                          <p className="text-gray-500 text-sm">Phân bố hiện tại</p>
                        </div>
                        <div className="bg-gradient-to-r from-purple-100 to-purple-200 p-3 rounded-xl">
                          <FaCar className="text-purple-600 text-xl" />
                        </div>
                      </div>
                      {carStats.length > 0 && carStats[1]?.data && Object.keys(carStats[1].data).length > 0 ? (
                        <div className="h-64 flex items-center justify-center">
                          <Doughnut 
                            data={{
                              labels: Object.keys(carStats[1].data),
                              datasets: [{
                                data: Object.values(carStats[1].data),
                                backgroundColor: [
                                  'rgba(34, 197, 94, 0.8)',
                                  'rgba(59, 130, 246, 0.8)',
                                  'rgba(249, 115, 22, 0.8)',
                                  'rgba(168, 85, 247, 0.8)',
                                  'rgba(236, 72, 153, 0.8)'
                                ],
                                borderWidth: 3,
                                borderColor: '#ffffff',
                                hoverBackgroundColor: [
                                  'rgba(34, 197, 94, 1)',
                                  'rgba(59, 130, 246, 1)',
                                  'rgba(249, 115, 22, 1)',
                                  'rgba(168, 85, 247, 1)',
                                  'rgba(236, 72, 153, 1)'
                                ],
                                hoverBorderWidth: 4,
                                hoverOffset: 8
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'bottom',
                                  labels: {
                                    padding: 20,
                                    usePointStyle: true,
                                    pointStyle: 'circle',
                                    font: {
                                      size: 12,
                                      weight: '500'
                                    },
                                    color: '#475569'
                                  }
                                },
                                tooltip: {
                                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                  titleColor: 'white',
                                  bodyColor: 'white',
                                  cornerRadius: 12,
                                  padding: 12
                                }
                              },
                              cutout: '65%',
                              animation: {
                                animateRotate: true,
                                animateScale: true
                              }
                            }}
                          />
                      </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                          <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            <FaCar className="text-2xl text-gray-400" />
                          </div>
                          <p className="font-medium">Chưa có dữ liệu trạng thái xe</p>
                          <p className="text-sm text-gray-400 mt-1">Thêm xe để xem thống kê</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Enhanced Popular Cars and Recent Activities */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Popular Cars Section - Chỉ hiển thị xe phổ biến nhất */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                    className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 font-heading">🔥 Xe được đặt nhiều nhất</h3>
                          <p className="text-gray-500 text-sm">Xe phổ biến nhất của bạn</p>
                        </div>
                        <div className="bg-gradient-to-r from-red-100 to-orange-200 p-3 rounded-xl">
                          <FaFire className="text-red-600 text-xl" />
                        </div>
                      </div>
                      {mostPopularCar ? (
                        <div className="flex flex-col items-center justify-center text-center">
                          <img
                            src={
                              mostPopularCar.images && mostPopularCar.images.length > 0 && mostPopularCar.images[0].imageUrl
                                ? mostPopularCar.images[0].imageUrl
                                : mostPopularCar.imageUrls && mostPopularCar.imageUrls.length > 0
                                  ? mostPopularCar.imageUrls[0]
                                  : '/images/default-car.jpg'
                            }
                            alt={mostPopularCar.model}
                            className="w-64 h-40 object-cover rounded-2xl shadow-lg mb-4 border border-orange-100"
                          />
                          <h4 className="font-semibold text-gray-800 font-heading text-2xl mb-2">{mostPopularCar.model}</h4>
                          <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold mb-2">{mostPopularCar.brand}</span>
                          <p className="text-gray-600 mb-1">Số lượt thuê: <span className="font-bold text-emerald-600 text-lg">{mostPopularCar.bookingCount || mostPopularCar.totalBookings || 'N/A'}</span></p>
                          <p className="text-gray-500 text-base">Giá: {mostPopularCar.dailyRate ? mostPopularCar.dailyRate.toLocaleString('vi-VN') + ' VNĐ/ngày' : 'N/A'}</p>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            <FaCar className="text-2xl text-gray-400" />
                          </div>
                          <p className="font-medium">Chưa có dữ liệu xe được đặt</p>
                          <p className="text-sm text-gray-400 mt-1">Khi có đơn đặt, dữ liệu sẽ hiển thị ở đây</p>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Thay thế Recent Activities bằng biểu đồ khách hàng mới */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 font-heading">👥 Thống kê khách hàng mới theo tháng</h3>
                          <p className="text-gray-500 text-sm">Số lượng khách hàng mới từng tháng</p>
                        </div>
                        <div className="bg-gradient-to-r from-green-100 to-blue-200 p-3 rounded-xl">
                          <FaUsers className="text-green-600 text-xl" />
                        </div>
                      </div>
                      {/* Biểu đồ khách hàng mới theo tháng */}
                      {monthlyStats && monthlyStats.months && (
                        <div className="h-64 bg-gradient-to-t from-gray-50/50 to-transparent rounded-xl p-4">
                          <Line 
                            data={{
                              labels: monthlyStats.months,
                              datasets: [
                                {
                                  label: 'Khách hàng mới',
                                  // Nếu backend có newCustomersByMonth thì dùng, nếu không tạm dùng bookingsByMonth làm mẫu
                                  data: monthlyStats.newCustomersByMonth || monthlyStats.bookingsByMonth || [],
                                  borderColor: 'rgb(34,197,94)',
                                  backgroundColor: 'rgba(34,197,94,0.1)',
                                  borderWidth: 3,
                                  tension: 0.4,
                                  fill: true,
                                  pointBackgroundColor: 'rgb(34,197,94)',
                                  pointBorderColor: '#fff',
                                  pointBorderWidth: 2,
                                  pointRadius: 6
                                }
                              ]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { display: false },
                                tooltip: {
                                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                  titleColor: 'white',
                                  bodyColor: 'white',
                                  cornerRadius: 12,
                                  padding: 12
                                }
                              },
                              interaction: { intersect: false, mode: 'index' },
                              scales: {
                                x: {
                                  grid: { display: false },
                                  border: { display: false },
                                  ticks: { font: { size: 12, weight: '500' }, color: '#64748b' }
                                },
                                y: {
                                  beginAtZero: true,
                                  border: { display: false },
                                  grid: { color: '#e2e8f0', borderDash: [5, 5] },
                                  ticks: {
                                    font: { size: 12, weight: '500' },
                                    color: '#64748b',
                                    // Chỉ hiển thị số nguyên
                                    stepSize: 1,
                                    callback: function(value) {
                                      // Chỉ hiển thị số nguyên, bỏ qua số thập phân
                                      if (Number.isInteger(value)) {
                                        return value + ' KH mới';
                                      }
                                      return null;
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              </>
            )}
          </motion.div>
        );
      case "add-car":
        return <SupplierCarForm onSuccess={() => setSelected("car-status")} />;
      case "car-status":
        return <SupplierCarList />;
      case "orders":
        return <SupplierOrderManagement />;
      case "report":
        return <SupplierReport />;
      case "profile":
        return <SupplierProfile />;
      case "chat": {
        // Compose currentUser object for ChatWindow
        const currentUser = {
          id: profile?.userId || user?.userId || user?.id || user?.supplierId,
          username: profile?.fullName || profile?.username || user?.userDetail?.fullName || user?.username,
          role: user?.role || 'supplier',
        };
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="flex items-center mb-6">
              <div className="bg-teal-100 p-3 rounded-full mr-4">
                <FaComments className="text-teal-600 text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Chat/hỗ trợ khách hàng</h2>
                <p className="text-gray-600">Trò chuyện và hỗ trợ khách hàng</p>
              </div>
            </div>
            <ChatWindow currentUser={currentUser} />
          </motion.div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 min-h-screen">
      {/* Sidebar */}
      <SupplierSidebar 
        user={user} 
        selected={selected} 
        setSelected={setSelected} 
        onLogout={handleLogout} 
      />

      {/* Main Content */}
      <main className="ml-64 p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
          {renderContent()}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default SupplierCarDashboard;
