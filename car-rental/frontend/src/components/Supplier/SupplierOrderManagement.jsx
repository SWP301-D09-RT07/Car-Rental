import React, { useEffect, useState } from "react";
import { getSupplierOrders, supplierConfirmReturn, refundDeposit, supplierConfirmBooking, supplierRejectBooking, supplierConfirmFullPayment, getBookingDetails } from "@/services/api";
import { toast } from "react-toastify";
import { FaClipboardList, FaCheck, FaTimes, FaEye, FaFilter, FaSyncAlt, FaCheckCircle, FaTimesCircle, FaFileExport, FaSearch, FaMoneyCheckAlt } from "react-icons/fa";
import Papa from 'papaparse';

const SupplierOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSupplierOrders();
      console.log('[SupplierOrderManagement] API response:', data);
      if (Array.isArray(data)) {
        data.forEach((order, idx) => {
          console.log(`Order #${order.bookingId}:`, order);
        });
      }
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
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      await supplierConfirmBooking(orderId);
      toast.success('Đã xác nhận đơn đặt xe');
      fetchOrders(); // Refresh data
    } catch (err) {
      toast.error(err.message || 'Không thể xác nhận đơn đặt xe');
    }
  };

  const handleRejectOrder = async (orderId) => {
    try {
      await supplierRejectBooking(orderId);
      toast.success('Đã từ chối đơn đặt xe');
      fetchOrders(); // Refresh data
    } catch (err) {
      toast.error(err.message || 'Không thể từ chối đơn đặt xe');
    }
  };

  const handleSupplierConfirmReturn = async (bookingId) => {
    try {
      await supplierConfirmReturn(bookingId);
      toast.success('Đã xác nhận nhận lại xe');
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Không thể xác nhận nhận lại xe');
    }
  };


  const handleConfirmFullPayment = async (orderId) => {
    try {
      await supplierConfirmFullPayment(orderId);
      toast.success('Đã xác nhận đã nhận đủ tiền');
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Không thể xác nhận đã nhận đủ tiền');
    }
  };

  const handleViewPayment = async (order) => {
    if (order.paymentDetails) {
      setSelectedPaymentOrder(order);
      setShowPaymentModal(true);
    } else {
      try {
        const res = await getBookingDetails(order.bookingId);
        console.log('Booking details API response:', res);
        const bookingData = res.data?.paymentDetails ? res.data : res.data?.data;
        setSelectedPaymentOrder({ ...order, paymentDetails: bookingData?.paymentDetails || [] });
        setShowPaymentModal(true);
      } catch (err) {
        toast.error('Không thể lấy chi tiết thanh toán');
      }
    }
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPaymentOrder(null);
  };

  // Tìm kiếm nâng cao
  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || (order.status?.statusName || order.statusName)?.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch =
      !search ||
      order.bookingId?.toString().includes(search) ||
      (order.customer?.name || order.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (order.car?.model || '').toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Xuất CSV
  const handleExportCSV = () => {
    const csv = Papa.unparse(filteredOrders.map(o => ({
      bookingId: o.bookingId,
      car: o.car?.model,
      customer: o.customer?.name || o.customerName,
      email: o.customer?.email,
      status: o.status?.statusName || o.statusName,
      totalFare: o.totalFare,
      pickup: o.pickupDateTime,
      dropoff: o.dropoffDateTime,
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supplier-orders.csv';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Modal chi tiết đơn
  const openModal = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  // Thêm helper kiểm tra hoàn tất booking và các payment đặc biệt
  const isBookingFullyCompleted = (order) =>
    Boolean(order.supplierDeliveryConfirm) &&
    Boolean(order.customerReceiveConfirm) &&
    Boolean(order.customerReturnConfirm) &&
    Boolean(order.supplierReturnConfirm) &&
    order.paymentDetails?.some(p => p.paymentType === 'full_payment' && p.paymentStatus === 'paid');

  const hasPayout = (order) =>
    order.paymentDetails?.some(p => p.paymentType === 'payout' && p.paymentStatus === 'paid');

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-100 to-blue-50">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-4 p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-2xl text-white border-2 border-blue-300/40">
          <div className="p-3 bg-white bg-opacity-20 rounded-2xl shadow-md">
            <FaClipboardList className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-4xl font-extrabold mb-1 drop-shadow-lg">Quản lý đơn đặt xe (Supplier)</h2>
            <p className="text-blue-100 text-lg font-medium">Xử lý giao xe, nhận lại xe, hoàn cọc</p>
          </div>
        </div>
      </div>
      {/* Filter & Search & Export */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:space-x-4 gap-4">
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-500" />
          <span className="text-gray-700 font-medium">Lọc theo trạng thái:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="in_progress">Đang thuê</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <FaSearch className="text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo mã đơn, tên khách, xe..."
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ minWidth: 220 }}
          />
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition ml-auto"
        >
          <FaFileExport /> Xuất Excel
        </button>
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <FaSyncAlt className="animate-spin text-4xl text-blue-500 mb-4" />
          <span className="text-xl text-gray-600 font-medium">Đang tải danh sách đơn đặt xe...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center flex flex-col items-center">
          <FaTimesCircle className="text-3xl text-red-500 mb-2" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Lỗi tải dữ liệu</h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchOrders} 
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
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
          <table className="w-full border-collapse bg-white rounded-3xl overflow-hidden shadow-xl text-sm md:text-base">
            <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
              <tr>
                <th className="py-4 px-6 text-left font-bold text-gray-700">Mã đơn</th>
                <th className="py-4 px-6 text-left font-bold text-gray-700">Xe</th>
                <th className="py-4 px-6 text-left font-bold text-gray-700">Khách hàng</th>
                <th className="py-4 px-6 text-left font-bold text-gray-700">Thời gian</th>
                <th className="py-4 px-6 text-left font-bold text-gray-700">Trạng thái</th>
                <th className="py-4 px-6 text-left font-bold text-gray-700">Tổng tiền</th>
                <th className="py-4 px-6 text-left font-bold text-gray-700">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, index) => {
                console.log('DEBUG:', {
                  id: order.bookingId,
                  status: order.status?.statusName || order.statusName,
                  customerReturnConfirm: order.customerReturnConfirm,
                  supplierReturnConfirm: order.supplierReturnConfirm
                });
                return (
                <tr key={order.bookingId} className={`border-t ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50/40 transition`}>
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
                      {isBookingFullyCompleted(order) && (
                        <span className="badge badge-success">Đã nhận đủ tiền</span>
                      )}
                      {hasPayout(order) && (
                        <span className="badge badge-info">Đã nhận payout</span>
                      )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-semibold text-green-600">
                      {(
                        order.totalAmount ??
                        order.totalFare ??
                        (order.priceBreakdown?.total ?? 0)
                      ).toLocaleString('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                        minimumFractionDigits: 0
                      })}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-2">
                      <button 
                        className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Xem chi tiết"
                        onClick={() => openModal(order)}
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
                      {(order.status?.statusName || order.statusName)?.toLowerCase() === 'confirmed' && order.hasFullPayment && !order.supplierConfirmedFullPayment && (
                        <button
                          onClick={() => handleConfirmFullPayment(order.bookingId)}
                          className="bg-green-100 text-green-600 p-2 rounded-lg hover:bg-green-200 transition-colors"
                          title="Xác nhận đã nhận đủ tiền"
                        >
                          <FaCheck className="text-sm" /> Nhận đủ tiền
                        </button>
                      )}
                      {(order.status?.statusName || order.statusName)?.toLowerCase() === 'confirmed' && order.hasFullPayment && order.supplierConfirmedFullPayment && (
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded font-medium text-xs">Đã xác nhận nhận đủ tiền</span>
                      )}
                        {(
                          ['in progress', 'in_progress'].includes(
                            (order.statusName || order.status?.statusName || order.status || '').toLowerCase()
                          )
                          && Boolean(order.customerReturnConfirm)
                          && !Boolean(order.supplierReturnConfirm)
                        ) && (
                        <button
                          onClick={() => handleSupplierConfirmReturn(order.bookingId)}
                          className="bg-green-100 text-green-600 p-2 rounded-lg hover:bg-green-200 transition-colors"
                          title="Xác nhận nhận lại xe"
                        >
                            <FaCheck className="text-sm" /> Đã nhận lại xe
                        </button>
                      )}
              
                      {(order.status?.statusName || order.statusName)?.toLowerCase() === 'completed' && order.depositRefunded && (
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded font-medium text-xs">Đã hoàn cọc</span>
                      )}
                      {(order.status?.statusName || order.statusName)?.toLowerCase() === 'completed' && order.refundStatus === 'pending' && (
                        <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded font-medium text-xs flex items-center gap-1"><FaSyncAlt className="animate-spin" /> Đang hoàn cọc...</span>
                      )}
                      {(order.status?.statusName || order.statusName)?.toLowerCase() === 'completed' && order.payoutStatus === 'completed' && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium text-xs">Đã nhận payout</span>
                      )}
                      {(order.status?.statusName || order.statusName)?.toLowerCase() === 'completed' && order.payoutStatus === 'pending' && (
                        <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded font-medium text-xs flex items-center gap-1"><FaSyncAlt className="animate-spin" /> Đang payout...</span>
                      )}
                      <button
                        className="bg-gray-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Xem chi tiết thanh toán"
                        onClick={() => handleViewPayment(order)}
                      >
                        <FaMoneyCheckAlt className="text-sm" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {/* Modal chi tiết đơn */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full relative animate-in fade-in duration-300">
            <button onClick={closeModal} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xl font-bold">×</button>
            <h3 className="text-2xl font-bold mb-4 text-blue-700 flex items-center gap-2"><FaClipboardList /> Chi tiết đơn #{selectedOrder.bookingId}</h3>
            <div className="mb-2"><span className="font-semibold">Xe:</span> {selectedOrder.car?.model} ({selectedOrder.car?.brand?.brandName})</div>
            <div className="mb-2"><span className="font-semibold">Khách hàng:</span> {selectedOrder.customer?.name || selectedOrder.customerName} ({selectedOrder.customer?.email})</div>
            <div className="mb-2"><span className="font-semibold">Thời gian nhận xe:</span> {new Date(selectedOrder.pickupDateTime).toLocaleString('vi-VN')}</div>
            <div className="mb-2"><span className="font-semibold">Thời gian trả xe:</span> {new Date(selectedOrder.dropoffDateTime || selectedOrder.dropoffDate).toLocaleString('vi-VN')}</div>
            <div className="mb-2"><span className="font-semibold">Trạng thái:</span> <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status?.statusName || selectedOrder.statusName)}`}>{selectedOrder.status?.statusName || selectedOrder.statusName}</span></div>
            <div className="mb-2"><span className="font-semibold">Tổng tiền:</span> <span className="text-green-700 font-bold">{(selectedOrder.totalAmount ?? selectedOrder.totalFare ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 })}</span></div>
            <div className="mb-2"><span className="font-semibold">Tiền cọc:</span> <span className="text-yellow-700 font-bold">{(selectedOrder.depositAmount || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 })}</span></div>
            <div className="mb-2"><span className="font-semibold">Trạng thái hoàn cọc:</span> {selectedOrder.depositRefunded ? <span className="text-green-600 font-semibold">Đã hoàn</span> : selectedOrder.refundStatus === 'pending' ? <span className="text-yellow-600 font-semibold">Đang hoàn...</span> : <span className="text-gray-500">Chưa hoàn</span>}</div>
            <div className="mb-2"><span className="font-semibold">Trạng thái payout:</span> {selectedOrder.payoutStatus === 'completed' ? <span className="text-blue-600 font-semibold">Đã payout</span> : selectedOrder.payoutStatus === 'pending' ? <span className="text-yellow-600 font-semibold">Đang payout...</span> : <span className="text-gray-500">Chưa payout</span>}</div>
            {/* Lịch sử thao tác nếu có */}
            {selectedOrder.history && selectedOrder.history.length > 0 && (
              <div className="mt-4">
                <div className="font-semibold mb-2">Lịch sử thao tác:</div>
                <ul className="list-disc pl-6 text-sm text-gray-700">
                  {selectedOrder.history.map((h, idx) => (
                    <li key={idx}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal hiển thị payment */}
      {showPaymentModal && selectedPaymentOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full relative animate-in fade-in duration-300">
            <button onClick={closePaymentModal} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xl font-bold">×</button>
            <h3 className="text-2xl font-bold mb-4 text-blue-700 flex items-center gap-2"><FaMoneyCheckAlt /> Lịch sử thanh toán #{selectedPaymentOrder.bookingId}</h3>
            {selectedPaymentOrder.paymentDetails && selectedPaymentOrder.paymentDetails.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {selectedPaymentOrder.paymentDetails.map((p, idx) => (
                  <li key={p.paymentId || idx} className="py-3 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold capitalize">{p.paymentType === 'deposit' ? 'Cọc' : p.paymentType === 'full_payment' ? 'Thanh toán đủ' : p.paymentType === 'refund' ? 'Hoàn cọc' : p.paymentType === 'payout' ? 'Payout' : p.paymentType}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${p.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : p.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{p.paymentStatus}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <span>Số tiền:</span>
                      <span className="font-bold">{Number(p.amount).toLocaleString('vi-VN')} VND</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                      <span>Phương thức:</span>
                      <span>{p.paymentMethod?.toUpperCase() || 'N/A'}</span>
                      <span>| Ngày:</span>
                      <span>{p.paymentDate ? new Date(p.paymentDate).toLocaleString('vi-VN') : 'N/A'}</span>
                      {p.transactionId && <span>| Mã GD: <code>{p.transactionId}</code></span>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500">Chưa có thông tin thanh toán</div>
            )}
          </div>
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