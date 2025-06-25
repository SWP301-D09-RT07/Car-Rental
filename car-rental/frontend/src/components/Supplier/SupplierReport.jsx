import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { getSupplierDashboardSummary, getSupplierRecentBookings, getSupplierMonthlyStats } from "@/services/api";

const SupplierReport = () => {
  const [summary, setSummary] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getSupplierDashboardSummary(),
      getSupplierRecentBookings(),
      getSupplierMonthlyStats()
    ]).then(([summaryData, recentData, monthlyData]) => {
      setSummary(summaryData);
      setRecentBookings(recentData);
      setMonthlyStats(monthlyData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div>Đang tải báo cáo...</div>;
  if (!summary || !monthlyStats) return <div>Không có dữ liệu báo cáo.</div>;

  const barData = {
    labels: monthlyStats.months,
    datasets: [
      {
        label: "Doanh thu (VND)",
        data: monthlyStats.revenueByMonth,
        backgroundColor: "#3b82f6"
      }
    ]
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto mt-10">
      <h2 className="text-2xl font-bold text-blue-700 mb-6">Báo cáo tổng quan & doanh thu</h2>
      <div className="mb-6 grid grid-cols-2 gap-6">
        <div className="font-semibold text-lg">Tổng số xe: <span className="text-blue-600">{summary.totalCars}</span></div>
        <div className="font-semibold text-lg">Tổng booking: <span className="text-blue-600">{summary.totalBookings}</span></div>
        <div className="font-semibold text-lg">Tổng doanh thu: <span className="text-green-600">{summary.totalRevenue?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</span></div>
        <div className="font-semibold text-lg">Khách hàng mới: <span className="text-blue-600">{summary.newCustomers}</span></div>
      </div>
      <div className="mb-8">
        <Bar data={barData} />
      </div>
      <div className="mb-8">
        <h3 className="font-semibold mb-2">Booking gần đây:</h3>
        <table className="w-full border">
          <thead>
            <tr className="bg-blue-50">
              <th className="py-2 px-4">Mã đơn</th>
              <th className="py-2 px-4">Xe</th>
              <th className="py-2 px-4">Khách hàng</th>
              <th className="py-2 px-4">Thời gian</th>
              <th className="py-2 px-4">Trạng thái</th>
              <th className="py-2 px-4">Tổng tiền</th>
            </tr>
          </thead>
          <tbody>
            {recentBookings.map(order => (
              <tr key={order.bookingId} className="border-t">
                <td className="py-2 px-4">{order.bookingId}</td>
                <td className="py-2 px-4">{order.car?.model}</td>
                <td className="py-2 px-4">{order.customer?.name || order.customerName}</td>
                <td className="py-2 px-4">{new Date(order.pickupDateTime).toLocaleString()} - {new Date(order.dropoffDate).toLocaleString()}</td>
                <td className="py-2 px-4">{order.status?.statusName || order.statusName}</td>
                <td className="py-2 px-4">{order.totalFare?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Chi tiết từng tháng:</h3>
        <table className="w-full border">
          <thead>
            <tr className="bg-blue-50">
              <th className="py-2 px-4">Tháng</th>
              <th className="py-2 px-4">Doanh thu</th>
              <th className="py-2 px-4">Lượt booking</th>
            </tr>
          </thead>
          <tbody>
            {monthlyStats.months.map((month, idx) => (
              <tr key={month} className="border-t">
                <td className="py-2 px-4">{month}</td>
                <td className="py-2 px-4">{monthlyStats.revenueByMonth[idx]?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>
                <td className="py-2 px-4">{monthlyStats.bookingsByMonth[idx]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierReport;
