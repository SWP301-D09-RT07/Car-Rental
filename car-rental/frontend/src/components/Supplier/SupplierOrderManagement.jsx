import React, { useEffect, useState } from "react";
import { 
  getSupplierOrders, 
  supplierConfirmReturn, 
  refundDeposit, 
  supplierConfirmBooking, 
  supplierRejectBooking, 
  supplierConfirmFullPayment, 
  getBookingDetails, 
  supplierPrepareCar, 
  supplierConfirmDelivery,
  getPendingCashPayments,
  confirmCashReceived,
  getPendingPlatformFees,
  getTotalPendingPlatformFees,
  payPlatformFee
} from "@/services/api";
import { toast } from "react-toastify";
import { 
  FaClipboardList, 
  FaCheck, 
  FaTimes, 
  FaEye, 
  FaFilter, 
  FaSyncAlt, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaFileExport, 
  FaSearch, 
  FaMoneyCheckAlt,
  FaCar,
  FaUser
} from "react-icons/fa";
import Papa from 'papaparse';
import LoadingSpinner from "@/components/ui/Loading/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage/ErrorMessage";
import CashPaymentManagementModal from "./CashPaymentManagementModal";

const SupplierOrderManagement = () => {
  // States
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState(null);

  // Cash payment management states
  const [showCashPaymentModal, setShowCashPaymentModal] = useState(false);
  const [pendingCashPayments, setPendingCashPayments] = useState([]);
  const [pendingPlatformFees, setPendingPlatformFees] = useState([]);
  const [totalPendingFees, setTotalPendingFees] = useState(0);
  const [cashPaymentLoading, setCashPaymentLoading] = useState(false);

  // Effects
  useEffect(() => {
    fetchOrders();
    fetchCashPaymentData();
  }, []);

  // Fetch functions
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSupplierOrders();
      setOrders(data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải đơn đặt xe');
    } finally {
      setLoading(false);
    }
  };

  const fetchCashPaymentData = async () => {
    try {
      setCashPaymentLoading(true);
      
      // Mock data for testing UI
      const mockPendingPayments = [
        {
          paymentId: 1,
          bookingId: 123,
          amountReceived: 500000,
          platformFee: 25000,
          confirmationType: 'pickup',
          createdAt: new Date().toISOString()
        },
        {
          paymentId: 2,
          bookingId: 124,
          amountReceived: 750000,
          platformFee: 37500,
          confirmationType: 'delivery',
          createdAt: new Date().toISOString()
        }
      ];

      const mockPendingFees = [
        {
          paymentId: 1,
          bookingId: 121,
          platformFee: 30000,
          platformFeeDueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          platformFeeStatus: 'pending'
        },
        {
          paymentId: 2,
          bookingId: 122,
          platformFee: 45000,
          platformFeeDueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          platformFeeStatus: 'overdue'
        }
      ];

      let pendingPayments = mockPendingPayments;
      let pendingFees = mockPendingFees;
      let totalFees = { totalAmount: 75000 };

      // Try to fetch real data, fallback to mock
      try {
        pendingPayments = await getPendingCashPayments();
      } catch (err) {
        console.warn('Using mock data for pending payments:', err.message);
      }

      try {
        pendingFees = await getPendingPlatformFees();
      } catch (err) {
        console.warn('Using mock data for platform fees:', err.message);
      }

      try {
        totalFees = await getTotalPendingPlatformFees();
      } catch (err) {
        console.warn('Using mock data for total fees:', err.message);
      }

      setPendingCashPayments(pendingPayments || []);
      setPendingPlatformFees(pendingFees || []);
      setTotalPendingFees(totalFees?.totalAmount || 75000);
    } catch (err) {
      console.error('Error fetching cash payment data:', err);
      setPendingCashPayments([]);
      setPendingPlatformFees([]);
      setTotalPendingFees(0);
    } finally {
      setCashPaymentLoading(false);
    }
  };

  // Helper functions
  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'pending':
      case 'đang chờ':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'confirmed':
      case 'đã xác nhận':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'cancelled':
      case 'đã hủy':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'completed':
      case 'hoàn thành':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'in_progress':
      case 'in progress':
      case 'đang thuê':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'ready_for_pickup':
      case 'sẵn sàng nhận xe':
        return 'bg-cyan-100 text-cyan-700 border-cyan-300';
      case 'delivered':
      case 'đã giao xe':
        return 'bg-indigo-100 text-indigo-700 border-indigo-300';
      case 'refunded':
      case 'đã hoàn cọc':
        return 'bg-pink-100 text-pink-700 border-pink-300';
      case 'payout':
        return 'bg-teal-100 text-teal-700 border-teal-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusLabel = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'ready_for_pickup': return 'Đã chuẩn bị xe';
      case 'delivered': return 'Đã giao xe';
      case 'in_progress':
      case 'in progress': return 'Đang thuê';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      case 'refunded': return 'Đã hoàn cọc';
      case 'payout': return 'Đã chuyển tiền';
      case 'failed': return 'Thất bại';
      case 'rejected': return 'Bị từ chối';
      default: return status;
    }
  };

  const isBookingFullyCompleted = (order) =>
    Boolean(order.supplierDeliveryConfirm) &&
    Boolean(order.customerReceiveConfirm) &&
    Boolean(order.customerReturnConfirm) &&
    Boolean(order.supplierReturnConfirm) &&
    order.paymentDetails?.some(p => p.paymentType === 'full_payment' && p.paymentStatus === 'paid');

  const hasPayout = (order) =>
    order.paymentDetails?.some(p => p.paymentType === 'payout' && p.paymentStatus === 'paid');

  // Event handlers
  const handleConfirmOrder = async (orderId) => {
    try {
      await supplierConfirmBooking(orderId);
      toast.success('Đã xác nhận đơn đặt xe');
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Không thể xác nhận đơn đặt xe');
    }
  };

  const handleRejectOrder = async (orderId) => {
    try {
      await supplierRejectBooking(orderId);
      toast.success('Đã từ chối đơn đặt xe');
      fetchOrders();
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
        const bookingData = res.data?.paymentDetails ? res.data : res.data?.data;
        setSelectedPaymentOrder({ ...order, paymentDetails: bookingData?.paymentDetails || [] });
        setShowPaymentModal(true);
      } catch (err) {
        toast.error('Không thể lấy chi tiết thanh toán');
      }
    }
  };

  const handlePrepareCar = async (bookingId) => {
    try {
      await supplierPrepareCar(bookingId);
      toast.success('Đã chuyển sang trạng thái chờ nhận xe!');
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Không thể chuyển sang trạng thái chờ nhận xe');
    }
  };

  const handleSupplierDeliveryConfirm = async (bookingId) => {
    try {
      await supplierConfirmDelivery(bookingId);
      toast.success('Đã xác nhận giao xe cho khách!');
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Không thể xác nhận giao xe');
    }
  };

  const handleConfirmCashReceived = async (paymentId, confirmationData) => {
    try {
      await confirmCashReceived(paymentId, confirmationData);
      toast.success('Đã xác nhận nhận tiền mặt thành công');
      fetchCashPaymentData();
      fetchOrders();
    } catch (err) {
      console.error('Error confirming cash received:', err);
      toast.error(err.message || 'Không thể xác nhận nhận tiền mặt');
    }
  };

  const handlePayPlatformFee = async (confirmationId) => {
    try {
      await payPlatformFee(confirmationId);
      toast.success('Đã thanh toán phí platform thành công');
      fetchCashPaymentData();
    } catch (err) {
      console.error('Error paying platform fee:', err);
      toast.error(err.message || 'Không thể thanh toán phí platform');
    }
  };

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

  const openModal = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPaymentOrder(null);
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || (order.status?.statusName || order.statusName)?.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch =
      !search ||
      order.bookingId?.toString().includes(search) ||
      (order.customer?.name || order.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (order.car?.model || '').toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filter options
  const statusOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'ready_for_pickup', label: 'Đã chuẩn bị xe' },
    { value: 'in_progress', label: 'Đang thuê' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white/20 p-4 rounded-2xl mr-6 backdrop-blur-sm border border-white/20">
                <FaClipboardList className="text-4xl" />
              </div>
              <div>
                <h2 className="text-4xl font-heading font-bold mb-2">Quản lý đơn đặt xe</h2>
                <p className="text-blue-100 text-lg">Xử lý giao xe, nhận lại xe, hoàn cọc</p>
              </div>
            </div>
            
            {/* Cash Payment Management Button */}
            <button
              onClick={() => {
                setShowCashPaymentModal(true);
                fetchCashPaymentData();
              }}
              className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaMoneyCheckAlt className="w-5 h-5" />
              <span>Quản lý tiền mặt</span>
              {(pendingCashPayments.length > 0 || pendingPlatformFees.length > 0) && (
                <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs font-bold ml-2">
                  {pendingCashPayments.length + pendingPlatformFees.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Filter & Search & Export */}
        <div className="mb-8 bg-white/80 backdrop-blur-lg rounded-2xl border border-white/30 shadow-xl p-6">
          <div className="flex flex-col xl:flex-row xl:items-center gap-4">
            {/* Filter Section */}
            <div className="flex items-center gap-3 bg-gray-50/80 rounded-xl px-4 py-3 backdrop-blur-sm border border-gray-200/50">
              <FaFilter className="text-blue-600 w-5 h-5" />
              <span className="text-gray-700 font-semibold">Lọc theo trạng thái:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent border-none outline-none text-gray-700 font-medium"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Section */}
            <div className="flex items-center gap-3 bg-gray-50/80 rounded-xl px-4 py-3 backdrop-blur-sm border border-gray-200/50 flex-1">
              <FaSearch className="text-blue-600 w-5 h-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo mã đơn, tên khách, xe..."
                className="bg-transparent border-none outline-none flex-1 text-gray-700 font-medium placeholder-gray-500"
              />
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <FaFileExport className="w-4 h-4" />
              Xuất Excel
            </button>
          </div>
        </div>

        {/* Table & States */}
        {loading ? (
          <div className="flex items-center justify-center min-h-64">
            <LoadingSpinner size="large" />
          </div>
        ) : error ? (
          <ErrorMessage message={error} />
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-blue-100 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <FaClipboardList className="text-blue-500 text-4xl" />
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-4">
              {filterStatus === 'all' ? 'Chưa có đơn đặt xe nào' : 'Không có đơn đặt xe nào'}
            </h3>
            <p className="text-gray-500 mb-8 text-lg">
              {filterStatus === 'all' 
                ? 'Bạn chưa nhận được đơn đặt xe nào từ khách hàng' 
                : `Không có đơn đặt xe nào ở trạng thái "${filterStatus}"`
              }
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <tr>
                    <th className="py-4 px-6 text-left font-semibold">Mã đơn</th>
                    <th className="py-4 px-6 text-left font-semibold">Xe</th>
                    <th className="py-4 px-6 text-left font-semibold">Khách hàng</th>
                    <th className="py-4 px-6 text-left font-semibold">Thời gian</th>
                    <th className="py-4 px-6 text-left font-semibold">Trạng thái</th>
                    <th className="py-4 px-6 text-left font-semibold">Tổng tiền</th>
                    <th className="py-4 px-6 text-left font-semibold">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => (
                    <tr key={order.bookingId} className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/60 transition-all`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="font-mono text-sm bg-gradient-to-r from-blue-100 to-indigo-100 px-3 py-1 rounded-lg font-semibold text-blue-800">
                            #{order.bookingId}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-bold text-lg text-blue-700">{order.car?.model || 'N/A'}</div>
                          <div className="text-xs text-gray-400">{order.car?.licensePlate}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                            <FaUser className="text-sm text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{order.customer?.userDetail?.fullName || order.customer?.name || order.customerName || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{order.customer?.email || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span className="font-medium text-gray-800">Nhận xe:</span>
                          </div>
                          <div className="text-gray-600 ml-4">
                            {new Date(order.pickupDateTime).toLocaleString('vi-VN')}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            <span className="font-medium text-gray-800">Trả xe:</span>
                          </div>
                          <div className="text-gray-600 ml-4">
                            {new Date(order.dropoffDateTime || order.dropoffDate).toLocaleString('vi-VN')}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center">
                          <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm border-2 text-center min-w-[120px] transition-all
                            ${getStatusColor(order.status?.statusName || order.statusName || '')}
                          `}>
                            {getStatusLabel(order.status?.statusName || order.statusName || '')}
                          </span>
                        </div>
                        {isBookingFullyCompleted(order) && (
                          <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold mt-1 text-center">
                            {order.paymentDetails?.find(p => p.paymentType === 'full_payment' && p.paymentStatus === 'paid' && p.paymentMethod === 'cash')
                              ? 'Đã nhận đủ tiền mặt'
                              : 'Đã nhận đủ tiền'}
                          </div>
                        )}
                        {hasPayout(order) && (
                          <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mt-1 text-center">Đã nhận payout</div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-lg text-emerald-600">
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
                        <div className="flex flex-wrap gap-2 justify-center items-center">
                          <button 
                            className="flex items-center gap-1 bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-semibold shadow hover:bg-blue-200 transition-all text-sm"
                            title="Xem chi tiết"
                            onClick={() => openModal(order)}
                          >
                            <FaEye className="w-4 h-4" />
                            <span>Chi tiết</span>
                          </button>
                          
                          {/* Xác nhận booking */}
                          {(order.status?.statusName || order.statusName)?.toLowerCase() === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleConfirmOrder(order.bookingId)}
                                className="flex items-center gap-1 bg-green-100 text-green-700 px-4 py-2 rounded-xl font-semibold shadow hover:bg-green-200 transition-all text-sm"
                                title="Xác nhận"
                              >
                                <FaCheck className="w-4 h-4" />
                                <span>Xác nhận</span>
                              </button>
                              <button 
                                onClick={() => handleRejectOrder(order.bookingId)}
                                className="flex items-center gap-1 bg-red-100 text-red-600 px-4 py-2 rounded-xl font-semibold shadow hover:bg-red-200 transition-all text-sm"
                                title="Từ chối"
                              >
                                <FaTimes className="w-4 h-4" />
                                <span>Từ chối</span>
                              </button>
                            </>
                          )}
                          
                          {/* Xác nhận đã nhận đủ tiền */}
                          {(order.status?.statusName || order.statusName)?.toLowerCase() === 'confirmed' && order.hasFullPayment && !order.supplierConfirmedFullPayment && (
                            <button
                              onClick={() => handleConfirmFullPayment(order.bookingId)}
                              className="flex items-center gap-1 bg-green-100 text-green-700 px-4 py-2 rounded-xl font-semibold shadow hover:bg-green-200 transition-all text-sm"
                              title="Xác nhận đã nhận đủ tiền"
                            >
                              <FaCheck className="w-4 h-4" />
                              <span>Nhận đủ tiền</span>
                            </button>
                          )}
                          
                          {/* Xác nhận nhận lại xe */}
                          {(['in progress', 'in_progress'].includes((order.statusName || order.status?.statusName || order.status || '').toLowerCase())
                            && Boolean(order.customerReturnConfirm)
                            && !Boolean(order.supplierReturnConfirm)) && (
                            <button
                              onClick={() => handleSupplierConfirmReturn(order.bookingId)}
                              className="flex items-center gap-1 bg-green-100 text-green-700 px-4 py-2 rounded-xl font-semibold shadow hover:bg-green-200 transition-all text-sm"
                              title="Xác nhận nhận lại xe"
                            >
                              <FaCheck className="w-4 h-4" />
                              <span>Đã nhận lại xe</span>
                            </button>
                          )}
                          
                          {/* Đã chuẩn bị xe */}
                          {(order.status?.statusName || order.statusName)?.toLowerCase() === 'confirmed' && (!order.statusNext || order.statusNext !== 'ready_for_pickup') && (
                            <button
                              onClick={() => handlePrepareCar(order.bookingId)}
                              className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-xl font-semibold shadow hover:bg-yellow-200 transition-all text-sm"
                              title="Đã chuẩn bị xe"
                            >
                              <FaCar className="w-4 h-4" />
                              <span>Đã chuẩn bị xe</span>
                            </button>
                          )}
                          
                          {order.statusName === 'ready_for_pickup' && !order.supplierDeliveryConfirm && (
                            <button
                              className="flex items-center gap-1 bg-orange-100 text-orange-700 px-4 py-2 rounded-xl font-semibold shadow hover:bg-orange-200 transition-all text-sm border-2 border-orange-200"
                              onClick={() => handleSupplierDeliveryConfirm(order.bookingId)}
                              title="Đã giao xe cho khách"
                            >
                              <FaCar className="w-4 h-4" />
                              <span>Đã giao xe</span>
                            </button>
                          )}
                          
                          <button
                            className="flex items-center gap-1 bg-purple-100 text-purple-700 px-4 py-2 rounded-xl font-semibold shadow hover:bg-purple-200 transition-all text-sm"
                            title="Xem chi tiết thanh toán"
                            onClick={() => handleViewPayment(order)}
                          >
                            <FaMoneyCheckAlt className="w-4 h-4" />
                            <span>Thanh toán</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {orders.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-600">{orders.length}</div>
                  <div className="text-sm font-medium text-blue-600">Tổng đơn</div>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                  <FaClipboardList className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-yellow-600">
                    {orders.filter(order => (order.status?.statusName || order.statusName)?.toLowerCase() === 'pending').length}
                  </div>
                  <div className="text-sm font-medium text-yellow-600">Chờ xác nhận</div>
                </div>
                <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
                  <FaSyncAlt className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {orders.filter(order => (order.status?.statusName || order.statusName)?.toLowerCase() === 'confirmed').length}
                  </div>
                  <div className="text-sm font-medium text-green-600">Đã xác nhận</div>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                  <FaCheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {orders.filter(order => (order.status?.statusName || order.statusName)?.toLowerCase() === 'completed').length}
                  </div>
                  <div className="text-sm font-medium text-blue-600">Hoàn thành</div>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                  <FaCheck className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-red-600">
                    {orders.filter(order => (order.status?.statusName || order.statusName)?.toLowerCase() === 'cancelled').length}
                  </div>
                  <div className="text-sm font-medium text-red-600">Đã hủy</div>
                </div>
                <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                  <FaTimesCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal chi tiết đơn */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <FaClipboardList className="w-5 h-5" />
                  Chi tiết đơn #{selectedOrder.bookingId}
                </h3>
                <button onClick={closeModal} className="text-white hover:text-red-200 text-2xl font-bold">
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-600">Xe:</span>
                    <span className="font-medium">{selectedOrder.car?.model} ({selectedOrder.car?.brand?.brandName})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-600">Khách hàng:</span>
                    <span className="font-medium">{selectedOrder.customer?.name || selectedOrder.customerName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-600">Email:</span>
                    <span className="font-medium">{selectedOrder.customer?.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-600">Trạng thái:</span>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm border-2 text-center min-w-[120px] transition-all
                      ${getStatusColor(selectedOrder.status?.statusName || selectedOrder.statusName || '')}`}
                    >
                      {getStatusLabel(selectedOrder.status?.statusName || selectedOrder.statusName || '')}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-600">Nhận xe:</span>
                    <span className="font-medium">{new Date(selectedOrder.pickupDateTime).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-600">Trả xe:</span>
                    <span className="font-medium">{new Date(selectedOrder.dropoffDateTime || selectedOrder.dropoffDate).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-600">Tổng tiền:</span>
                    <span className="font-bold text-emerald-600 text-lg">
                      {(selectedOrder.totalAmount ?? selectedOrder.totalFare ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-600">Tiền cọc:</span>
                    <span className="font-bold text-yellow-600 text-lg">
                      {(selectedOrder.depositAmount || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-700 mb-3">Trạng thái hoàn cọc & Payout</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-600">Hoàn cọc:</span>
                    {selectedOrder.depositRefunded ? (
                      <span className="flex items-center gap-1 text-green-600 font-semibold">
                        <FaCheckCircle className="w-4 h-4" />
                        Đã hoàn
                      </span>
                    ) : selectedOrder.refundStatus === 'pending' ? (
                      <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                        <FaSyncAlt className="w-4 h-4 animate-spin" />
                        Đang hoàn...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-500">
                        <FaTimesCircle className="w-4 h-4" />
                        Chưa hoàn
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-600">Payout:</span>
                    {selectedOrder.payoutStatus === 'completed' ? (
                      <span className="flex items-center gap-1 text-blue-600 font-semibold">
                        <FaCheckCircle className="w-4 h-4" />
                        Đã payout
                      </span>
                    ) : selectedOrder.payoutStatus === 'pending' ? (
                      <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                        <FaSyncAlt className="w-4 h-4 animate-spin" />
                        Đang payout...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-500">
                        <FaTimesCircle className="w-4 h-4" />
                        Chưa payout
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedOrder.history && selectedOrder.history.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-700 mb-3">Lịch sử thao tác</h4>
                  <ul className="space-y-2">
                    {selectedOrder.history.map((h, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-blue-700">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal hiển thị payment */}
      {showPaymentModal && selectedPaymentOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <FaMoneyCheckAlt className="w-5 h-5" />
                  Lịch sử thanh toán #{selectedPaymentOrder.bookingId}
                </h3>
                <button onClick={closePaymentModal} className="text-white hover:text-red-200 text-2xl font-bold">
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              {selectedPaymentOrder.paymentDetails && selectedPaymentOrder.paymentDetails.length > 0 ? (
                <div className="space-y-4">
                  {selectedPaymentOrder.paymentDetails.map((p, idx) => (
                    <div key={p.paymentId || idx} className="bg-gray-50 rounded-xl p-4 border-l-4 border-blue-500">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-lg capitalize">
                          {p.paymentType === 'deposit' ? 'Cọc' : 
                           p.paymentType === 'full_payment' ? 'Thanh toán đủ' : 
                           p.paymentType === 'refund' ? 'Hoàn cọc' : 
                           p.paymentType === 'payout' ? 'Payout' : p.paymentType}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          p.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 
                          p.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {p.paymentStatus}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Số tiền:</span>
                          <span className="font-bold text-emerald-600 ml-2">
                            {Number(p.amount).toLocaleString('vi-VN')} VND
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Phương thức:</span>
                          <span className="ml-2 font-medium">{p.paymentMethod?.toUpperCase() || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Ngày thanh toán:</span>
                          <span className="ml-2">{p.paymentDate ? new Date(p.paymentDate).toLocaleString('vi-VN') : 'N/A'}</span>
                        </div>
                        {p.transactionId && (
                          <div>
                            <span className="font-medium text-gray-600">Mã giao dịch:</span>
                            <code className="ml-2 bg-gray-200 px-2 py-1 rounded text-xs">{p.transactionId}</code>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FaFileExport className="mx-auto mb-4 w-12 h-12 text-blue-400" />
                  <p className="text-lg font-semibold">Chưa có lịch sử thanh toán</p>
                  <p className="text-sm">Đơn đặt xe này chưa có bất kỳ giao dịch thanh toán nào.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal quản lý tiền mặt */}
      {showCashPaymentModal && (
        <CashPaymentManagementModal 
          isOpen={showCashPaymentModal} 
          onClose={() => setShowCashPaymentModal(false)} 
          pendingCashPayments={pendingCashPayments} 
          pendingPlatformFees={pendingPlatformFees}
          totalPendingFees={totalPendingFees}
          loading={cashPaymentLoading}
          onConfirmCashReceived={handleConfirmCashReceived}
          onPayPlatformFee={handlePayPlatformFee}
        />
      )}
    </div>
  );
};

export default SupplierOrderManagement;