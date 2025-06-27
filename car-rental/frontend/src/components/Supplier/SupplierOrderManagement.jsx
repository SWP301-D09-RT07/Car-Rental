import React, { useEffect, useState } from "react";
import { getSupplierOrders } from "@/services/api";
import { toast } from "react-toastify";
import { FaClipboardList, FaCheck, FaTimes, FaEye, FaFilter } from "react-icons/fa";

const SupplierOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSupplierOrders();
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching supplier orders:', err);
      setError(err.message || 'Không thể tải danh sách đơn đặt xe');
      toast.error('Không thể tải danh sách đơn đặt xe');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'xác nhận':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'chờ xác nhận':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'đã hủy':
        return 'bg-red-100 text-red-800';
      case 'completed':
      case 'hoàn thành':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      // TODO: Implement confirm order API call
      toast.success('Đã xác nhận đơn đặt xe');
      fetchOrders(); // Refresh data
    } catch (err) {
      toast.error('Không thể xác nhận đơn đặt xe');
    }
  };

  const handleRejectOrder = async (orderId) => {
    try {
      // TODO: Implement reject order API call
      toast.success('Đã từ chối đơn đặt xe');
      fetchOrders(); // Refresh data
    } catch (err) {
      toast.error('Không thể từ chối đơn đặt xe');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true;
    return (order.status?.statusName || order.statusName)?.toLowerCase() === filterStatus.toLowerCase();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách đơn đặt xe...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <FaClipboardList className="text-red-500 text-3xl mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Lỗi tải dữ liệu</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchOrders} 
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <FaClipboardList className="text-blue-600 text-2xl" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Quản lý đơn đặt xe</h2>
            <p className="text-gray-600">Xem và xử lý các đơn đặt xe từ khách hàng</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6 flex items-center space-x-4">
        <div className="flex items-center">
          <FaFilter className="text-gray-500 mr-2" />
          <span className="text-gray-700 font-medium">Lọc theo trạng thái:</span>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Tất cả</option>
          <option value="pending">Chờ xác nhận</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="completed">Hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <FaClipboardList className="text-gray-400 text-6xl mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {filterStatus === 'all' ? 'Chưa có đơn đặt xe nào' : 'Không có đơn đặt xe nào'}
          </h3>
          <p className="text-gray-500">
            {filterStatus === 'all' 
              ? 'Bạn chưa nhận được đơn đặt xe nào từ khách hàng' 
              : `Không có đơn đặt xe nào ở trạng thái "${filterStatus}"`
            }
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-lg">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="py-4 px-6 text-left">Mã đơn</th>
                <th className="py-4 px-6 text-left">Xe</th>
                <th className="py-4 px-6 text-left">Khách hàng</th>
                <th className="py-4 px-6 text-left">Thời gian</th>
                <th className="py-4 px-6 text-left">Trạng thái</th>
                <th className="py-4 px-6 text-left">Tổng tiền</th>
                <th className="py-4 px-6 text-left">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, index) => (
                <tr key={order.bookingId} className={`border-t ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
                  <td className="py-4 px-6">
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      #{order.bookingId}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-semibold text-gray-800">{order.car?.model || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{order.car?.brand?.brandName || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-gray-800">{order.customer?.name || order.customerName || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{order.customer?.email || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm">
                      <div className="font-medium text-gray-800">Nhận xe:</div>
                      <div className="text-gray-600">
                        {new Date(order.pickupDateTime).toLocaleString('vi-VN')}
                      </div>
                      <div className="font-medium text-gray-800 mt-1">Trả xe:</div>
                      <div className="text-gray-600">
                        {new Date(order.dropoffDateTime || order.dropoffDate).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status?.statusName || order.statusName)}`}>
                      {order.status?.statusName || order.statusName || 'N/A'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-semibold text-green-600">
                      {(order.totalFare || 0).toLocaleString('vi-VN', { 
                        style: 'currency', 
                        currency: 'VND',
                        minimumFractionDigits: 0
                      })}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex space-x-2">
                      <button 
                        className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Xem chi tiết"
                      >
                        <FaEye className="text-sm" />
                      </button>
                      
                      {(order.status?.statusName || order.statusName)?.toLowerCase() === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleConfirmOrder(order.bookingId)}
                            className="bg-green-100 text-green-600 p-2 rounded-lg hover:bg-green-200 transition-colors"
                            title="Xác nhận"
                          >
                            <FaCheck className="text-sm" />
                          </button>
                          <button 
                            onClick={() => handleRejectOrder(order.bookingId)}
                            className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors"
                            title="Từ chối"
                          >
                            <FaTimes className="text-sm" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {orders.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
            <div className="text-sm text-blue-600">Tổng đơn</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {orders.filter(order => (order.status?.statusName || order.statusName)?.toLowerCase() === 'pending').length}
            </div>
            <div className="text-sm text-yellow-600">Chờ xác nhận</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {orders.filter(order => (order.status?.statusName || order.statusName)?.toLowerCase() === 'confirmed').length}
            </div>
            <div className="text-sm text-green-600">Đã xác nhận</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {orders.filter(order => (order.status?.statusName || order.statusName)?.toLowerCase() === 'completed').length}
            </div>
            <div className="text-sm text-blue-600">Hoàn thành</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {orders.filter(order => (order.status?.statusName || order.statusName)?.toLowerCase() === 'cancelled').length}
            </div>
            <div className="text-sm text-red-600">Đã hủy</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierOrderManagement;