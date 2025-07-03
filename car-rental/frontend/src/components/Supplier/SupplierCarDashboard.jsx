import React, { useState, useEffect } from "react";
import {
  FaCar, FaClipboardList, FaChartBar, FaComments, FaPlus, FaSync, FaUser, FaHome
} from "react-icons/fa";
import SupplierCarList from "./SupplierCarList";
import SupplierCarForm from "./SupplierCarForm";
import SupplierOrderManagement from "./SupplierOrderManagement";
import SupplierReport from "./SupplierReport";
import SupplierProfile from "./SupplierProfile";
import ChatBox from '../Common/ChatBox';
import { useContext } from 'react';
import { AuthContext } from '../../store/AuthContext';
import { getSupplierDashboardSummary, getSupplierCars, getSupplierOrders } from '../../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const menuItems = [
  { key: "dashboard", label: "Tổng quan", icon: <FaHome />, color: "blue" },
  { key: "add-car", label: "Đăng tin cho thuê xe", icon: <FaPlus />, color: "green" },
  { key: "car-status", label: "Quản lý xe", icon: <FaCar />, color: "purple" },
  { key: "orders", label: "Quản lý đơn đặt xe", icon: <FaClipboardList />, color: "orange" },
  { key: "report", label: "Báo cáo & thống kê", icon: <FaChartBar />, color: "indigo" },
  { key: "profile", label: "Hồ sơ cá nhân", icon: <FaUser />, color: "pink" },
  { key: "chat", label: "Chat/hỗ trợ khách hàng", icon: <FaComments />, color: "teal" },
];

const contentDemo = {
  "dashboard": {
    title: "Tổng quan",
    desc: "Xem tổng quan hoạt động và thống kê nhanh"
  },
  "add-car": {
    title: "Đăng tin cho thuê xe",
    desc: "Tạo mới thông tin xe cho thuê, thêm hình ảnh, mô tả, giá cả..."
  },
  "car-status": {
    title: "Quản lý xe",
    desc: "Xem danh sách xe, cập nhật trạng thái xe: có sẵn, đang thuê, bảo trì..."
  },
  "orders": {
    title: "Quản lý đơn đặt xe",
    desc: "Xem, xác nhận, từ chối hoặc cập nhật trạng thái các đơn đặt xe."
  },
  "report": {
    title: "Báo cáo & thống kê",
    desc: "Xem báo cáo lượt đặt xe, doanh thu, phản hồi khách hàng..."
  },
  "profile": {
    title: "Hồ sơ cá nhân",
    desc: "Quản lý thông tin cá nhân và cài đặt tài khoản"
  },
  "chat": {
    title: "Chat/hỗ trợ khách hàng",
    desc: "Trò chuyện, hỗ trợ khách hàng nhanh chóng, tiện lợi."
  }
};

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
    confirmedOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Giả lập receiverId là một user cố định, sau này có thể chọn user cụ thể
  const demoUserId = "user1";
  const supplierId = user?.username || "supplier1";
  const supplierRole = user?.role || "supplier";

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch summary data
        const summaryData = await getSupplierDashboardSummary();
        
        // Fetch cars data for detailed stats
        const carsData = await getSupplierCars();
        
        // Fetch orders data for detailed stats
        const ordersData = await getSupplierOrders();
        
        // Calculate detailed stats from cars data
        const availableCars = carsData?.filter(car => 
          car.status?.statusName?.toLowerCase() === 'available' || 
          car.statusName?.toLowerCase() === 'available'
        ).length || 0;
        
        // Calculate detailed stats from orders data
        const pendingOrders = ordersData?.filter(order => 
          (order.status?.statusName || order.statusName)?.toLowerCase() === 'pending'
        ).length || 0;
        
        const confirmedOrders = ordersData?.filter(order => 
          (order.status?.statusName || order.statusName)?.toLowerCase() === 'confirmed'
        ).length || 0;

        // Map backend response to frontend state
        setDashboardData({
          totalCars: summaryData?.totalVehicles || carsData?.length || 0,
          totalBookings: summaryData?.totalBookings || ordersData?.length || 0,
          totalRevenue: summaryData?.totalRevenue || 0,
          monthlyRevenue: summaryData?.monthlyRevenue || 0,
          newCustomers: summaryData?.newCustomers || 0, // Backend doesn't provide this yet
          availableCars: summaryData?.availableVehicles || availableCars,
          pendingOrders: summaryData?.pendingBookings || pendingOrders,
          confirmedOrders: summaryData?.activeBookings || confirmedOrders
        });
        
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
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [selected]);

  // Refresh dashboard data
  const handleRefresh = () => {
    if (selected === "dashboard") {
      setSelected("dashboard"); // This will trigger useEffect
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const renderContent = () => {
    switch (selected) {
      case "dashboard":
        return (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <FaHome className="text-blue-600 text-2xl" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">Tổng quan</h2>
                  <p className="text-gray-600">Chào mừng bạn trở lại, {user?.username || 'Chủ xe'}</p>
                </div>
              </div>
              <button 
                onClick={handleRefresh}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <FaSync className="mr-2" />
                Làm mới
              </button>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
              </div>
            ) : (
              <>
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                    <div className="flex items-center">
                      <FaCar className="text-2xl mr-3" />
                      <div>
                        <p className="text-blue-100 text-sm">Tổng số xe</p>
                        <p className="text-2xl font-bold">{dashboardData.totalCars}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
                    <div className="flex items-center">
                      <FaClipboardList className="text-2xl mr-3" />
                      <div>
                        <p className="text-green-100 text-sm">Đơn đặt xe</p>
                        <p className="text-2xl font-bold">{dashboardData.totalBookings}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                    <div className="flex items-center">
                      <FaChartBar className="text-2xl mr-3" />
                      <div>
                        <p className="text-purple-100 text-sm">Doanh thu tháng</p>
                        <p className="text-2xl font-bold">
                          {(dashboardData.monthlyRevenue || 0).toLocaleString('vi-VN', { 
                            style: 'currency', 
                            currency: 'VND',
                            minimumFractionDigits: 0
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6 rounded-xl">
                    <div className="flex items-center">
                      <FaChartBar className="text-2xl mr-3" />
                      <div>
                        <p className="text-indigo-100 text-sm">Tổng doanh thu</p>
                        <p className="text-2xl font-bold">
                          {(dashboardData.totalRevenue || 0).toLocaleString('vi-VN', { 
                            style: 'currency', 
                            currency: 'VND',
                            minimumFractionDigits: 0
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl">
                    <div className="flex items-center">
                      <FaComments className="text-2xl mr-3" />
                      <div>
                        <p className="text-orange-100 text-sm">Khách hàng mới</p>
                        <p className="text-2xl font-bold">{dashboardData.newCustomers}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Hành động nhanh</h3>
                    <div className="space-y-3">
                      <button 
                        onClick={() => setSelected("add-car")}
                        className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                      >
                        <FaPlus className="mr-2" />
                        Đăng xe mới
                      </button>
                      <button 
                        onClick={() => setSelected("orders")}
                        className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 flex items-center justify-center"
                      >
                        <FaClipboardList className="mr-2" />
                        Xem đơn đặt xe
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Thống kê gần đây</h3>
                    {dashboardData.totalCars === 0 ? (
                      <div className="text-center py-4">
                        <FaCar className="text-4xl text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Chưa có xe nào được đăng</p>
                        <button 
                          onClick={() => setSelected("add-car")}
                          className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Đăng xe đầu tiên →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Xe có sẵn:</span>
                          <span className="font-medium text-green-600">{dashboardData.availableCars}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Xe đang thuê:</span>
                          <span className="font-medium text-blue-600">{dashboardData.totalCars - dashboardData.availableCars}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Đơn chờ xác nhận:</span>
                          <span className="font-medium text-yellow-600">{dashboardData.pendingOrders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Đơn đã xác nhận:</span>
                          <span className="font-medium text-blue-600">{dashboardData.confirmedOrders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tổng đơn hàng:</span>
                          <span className="font-medium text-purple-600">{dashboardData.totalBookings}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
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
      case "chat":
        return (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center mb-6">
              <div className="bg-teal-100 p-3 rounded-full mr-4">
                <FaComments className="text-teal-600 text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Chat/hỗ trợ khách hàng</h2>
                <p className="text-gray-600">Trò chuyện và hỗ trợ khách hàng</p>
              </div>
            </div>
            <ChatBox
              username={supplierId}
              role={supplierRole}
              senderId={supplierId}
              senderRole={supplierRole}
              receiverId={demoUserId}
              receiverRole="user"
            />
          </div>
        );
      default:
        return null;
    }
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: "hover:bg-blue-50 text-blue-700",
      green: "hover:bg-green-50 text-green-700", 
      purple: "hover:bg-purple-50 text-purple-700",
      orange: "hover:bg-orange-50 text-orange-700",
      indigo: "hover:bg-indigo-50 text-indigo-700",
      pink: "hover:bg-pink-50 text-pink-700",
      teal: "hover:bg-teal-50 text-teal-700"
    };
    return colorMap[color] || "hover:bg-gray-50 text-gray-700";
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <FaCar className="text-blue-600 text-xl" />
            </div>
            <div>
              <div className="font-bold text-lg text-gray-800">Supplier Dashboard</div>
              <div className="text-sm text-gray-600">Chào mừng {user?.username || 'Chủ xe'}</div>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.key}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                  selected === item.key 
                    ? `bg-${item.color}-100 text-${item.color}-700 font-semibold border-l-4 border-${item.color}-500` 
                    : `text-gray-700 ${getColorClasses(item.color)}`
                }`}
                onClick={() => setSelected(item.key)}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
          {/* Đăng xuất */}
          <div className="mt-8">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-left rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-semibold border-l-4 border-red-500 transition-all duration-200"
            >
              <FaUser className="mr-3 text-lg" />
              <span className="font-medium">Đăng xuất</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default SupplierCarDashboard;