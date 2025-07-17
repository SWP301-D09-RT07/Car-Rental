import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { getSupplierDashboardSummary, getSupplierRecentBookings, getSupplierMonthlyStats } from "@/services/api";
import { toast } from "react-toastify";
import { FaChartBar, FaCar, FaClipboardList, FaUsers, FaMoneyBillWave, FaCalendarAlt } from "react-icons/fa";

const SupplierReport = () => {
  const [summary, setSummary] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [summaryData, recentData, monthlyData] = await Promise.all([
          getSupplierDashboardSummary(),
          getSupplierRecentBookings(),
          getSupplierMonthlyStats()
        ]);
        
        setSummary(summaryData);
        setRecentBookings(recentData || []);
        setMonthlyStats(monthlyData);
      } catch (err) {
        console.error('Error fetching supplier report data:', err);
        setError(err.message || 'Không thể tải dữ liệu báo cáo');
        toast.error('Không thể tải dữ liệu báo cáo');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải báo cáo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <FaChartBar className="text-red-500 text-3xl mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Lỗi tải dữ liệu</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!summary && !monthlyStats) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <FaChartBar className="text-gray-400 text-3xl mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Chưa có dữ liệu</h3>
        <p className="text-gray-500">Báo cáo sẽ hiển thị khi có dữ liệu hoạt động</p>
      </div>
    );
  }

  const barData = {
    labels: monthlyStats?.months || [],
    datasets: [
      {
        label: "Doanh thu (VND)",
        data: monthlyStats?.revenueByMonth || [],
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1
      }
    ]
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Doanh thu theo tháng'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              minimumFractionDigits: 0
            }).format(value);
          }
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-6xl mx-auto">
      <div className="flex items-center mb-8">
        <FaChartBar className="text-blue-600 text-3xl mr-4" />
        <h2 className="text-3xl font-bold text-gray-800">Báo cáo tổng quan & doanh thu</h2>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
            <div className="flex items-center">
              <FaCar className="text-2xl mr-3" />
              <div>
                <p className="text-blue-100 text-sm">Tổng số xe</p>
                <p className="text-2xl font-bold">{summary.totalCars || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
            <div className="flex items-center">
              <FaClipboardList className="text-2xl mr-3" />
              <div>
                <p className="text-green-100 text-sm">Tổng booking</p>
                <p className="text-2xl font-bold">{summary.totalBookings || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
            <div className="flex items-center">
              <FaMoneyBillWave className="text-2xl mr-3" />
              <div>
                <p className="text-purple-100 text-sm">Tổng doanh thu</p>
                <p className="text-2xl font-bold">
                  {(summary.totalRevenue || 0).toLocaleString('vi-VN', { 
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
              <FaUsers className="text-2xl mr-3" />
              <div>
                <p className="text-orange-100 text-sm">Khách hàng mới</p>
                <p className="text-2xl font-bold">{summary.newCustomers || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {monthlyStats && monthlyStats.months && monthlyStats.months.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Biểu đồ doanh thu theo tháng</h3>
          <div className="bg-gray-50 p-6 rounded-xl">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      {recentBookings && recentBookings.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Booking gần đây</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-lg">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="py-3 px-4 text-left">Mã đơn</th>
                  <th className="py-3 px-4 text-left">Xe</th>
                  <th className="py-3 px-4 text-left">Khách hàng</th>
                  <th className="py-3 px-4 text-left">Thời gian</th>
                  <th className="py-3 px-4 text-left">Trạng thái</th>
                  <th className="py-3 px-4 text-left">Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((order, index) => (
                  <tr key={order.bookingId || index} className={`border-t ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="py-3 px-4 font-medium">{order.bookingId}</td>
                    <td className="py-3 px-4">{order.car?.model || 'N/A'}</td>
                    <td className="py-3 px-4">{order.customer?.name || order.customerName || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm">
                      <div>Nhận: {new Date(order.pickupDateTime).toLocaleString('vi-VN')}</div>
                      <div>Trả: {new Date(order.dropoffDateTime || order.dropoffDate).toLocaleString('vi-VN')}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (order.status?.statusName || order.statusName) === 'Confirmed' ? 'bg-green-100 text-green-800' :
                        (order.status?.statusName || order.statusName) === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status?.statusName || order.statusName || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {(order.totalFare || 0).toLocaleString('vi-VN', { 
                        style: 'currency', 
                        currency: 'VND',
                        minimumFractionDigits: 0
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly Details */}
      {monthlyStats && monthlyStats.months && monthlyStats.months.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Chi tiết từng tháng</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-lg">
              <thead className="bg-gray-600 text-white">
                <tr>
                  <th className="py-3 px-4 text-left">Tháng</th>
                  <th className="py-3 px-4 text-left">Doanh thu</th>
                  <th className="py-3 px-4 text-left">Lượt booking</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStats.months.map((month, idx) => (
                  <tr key={month} className={`border-t ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="py-3 px-4 font-medium">{month}</td>
                    <td className="py-3 px-4 font-semibold">
                      {(monthlyStats.revenueByMonth[idx] || 0).toLocaleString('vi-VN', { 
                        style: 'currency', 
                        currency: 'VND',
                        minimumFractionDigits: 0
                      })}
                    </td>
                    <td className="py-3 px-4">{monthlyStats.bookingsByMonth[idx] || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierReport;
