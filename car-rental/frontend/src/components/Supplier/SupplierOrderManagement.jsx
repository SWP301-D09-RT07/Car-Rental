import React, { useEffect, useState } from "react";
import { getSupplierOrders } from "@/services/api";

const SupplierOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSupplierOrders().then(data => {
      setOrders(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div>Đang tải đơn đặt xe...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-5xl mx-auto mt-10">
      <h2 className="text-2xl font-bold text-blue-700 mb-6">Quản lý đơn đặt xe</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-blue-50">
            <th className="py-2 px-4">Mã đơn</th>
            <th className="py-2 px-4">Xe</th>
            <th className="py-2 px-4">Khách hàng</th>
            <th className="py-2 px-4">Thời gian</th>
            <th className="py-2 px-4">Trạng thái</th>
            <th className="py-2 px-4">Tổng tiền</th>
            <th className="py-2 px-4">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.bookingId} className="border-t">
              <td className="py-2 px-4">{order.bookingId}</td>
              <td className="py-2 px-4">{order.car?.model}</td>
              <td className="py-2 px-4">{order.customer?.name || order.customerName}</td>
              <td className="py-2 px-4">
                {new Date(order.pickupDateTime).toLocaleString()} -<br />
                {new Date(order.dropoffDate).toLocaleString()}
              </td>
              <td className="py-2 px-4">{order.status?.statusName || order.statusName}</td>
              <td className="py-2 px-4">{order.totalFare?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>
              <td className="py-2 px-4">
                <button className="bg-blue-600 text-white px-3 py-1 rounded mr-2">Xác nhận</button>
                <button className="bg-red-500 text-white px-3 py-1 rounded">Từ chối</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SupplierOrderManagement;