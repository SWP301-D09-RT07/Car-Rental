import { useEffect, useState } from 'react';
import { getAllPayments, refundDeposit, payoutSupplier, getPayoutAmount } from '@/services/api';
import { FaMoneyCheckAlt, FaSyncAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Papa from 'papaparse';

function ConfirmActionModal({ open, onClose, onConfirm, actionType, payment, payoutLoading, payoutError, payoutAmount, payoutCurrency }) {
  if (!open || !payment) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 min-w-[320px] max-w-[90vw]">
        <h3 className="text-lg font-bold mb-4 text-gray-800">
          {actionType === 'refund' ? 'Xác nhận hoàn cọc' : 'Xác nhận payout cho supplier'}
        </h3>
        <div className="mb-4 space-y-1 text-sm text-gray-700">
          <div><b>Booking ID:</b> {payment.bookingId}</div>
          <div><b>Khách hàng:</b> {payment.customerName || payment.customer?.fullName || '-'}</div>
          <div><b>Supplier:</b> {payment.supplierName || payment.supplier?.fullName || '-'}</div>
          {actionType === 'payout' ? (
            payoutLoading ? (
              <div className="text-blue-600">Đang lấy số tiền payout...</div>
            ) : payoutError ? (
              <div className="text-red-600">Lỗi: {payoutError}</div>
            ) : (
              <div><b>Số tiền:</b> {Number(payoutAmount ?? payment.amount).toLocaleString('vi-VN')} {payoutCurrency || 'VND'}</div>
            )
          ) : (
            <div><b>Số tiền:</b> {Number(payment.amount).toLocaleString('vi-VN')} VND</div>
          )}
          <div><b>Loại thao tác:</b> {actionType === 'refund' ? 'Hoàn cọc cho khách' : 'Chuyển tiền cho supplier'}</div>
        </div>
        <div className="flex gap-3 justify-end mt-4">
          <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={onClose}>Hủy</button>
          <button className={actionType === 'refund' ? 'px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white' : 'px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white'} onClick={onConfirm} disabled={actionType === 'payout' && payoutLoading}>
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentDetailsModal({ open, onClose, payments, bookingId }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 min-w-[340px] max-w-[95vw]">
        <h3 className="text-lg font-bold mb-4 text-gray-800">Lịch sử thanh toán - Booking #{bookingId}</h3>
        <ul className="divide-y">
          {payments.map((p, idx) => (
            <li key={p.paymentId || p.transactionId || idx} className="py-3 flex flex-col gap-1">
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
        <div className="flex justify-end mt-4">
          <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

function PaymentsAdmin() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ open: false, actionType: '', payment: null });
  const [detailModal, setDetailModal] = useState({ open: false, payments: [], bookingId: null });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState(null);
  const [payoutAmount, setPayoutAmount] = useState(null);
  const [payoutCurrency, setPayoutCurrency] = useState('VND');

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllPayments();
      setPayments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleRefund = (bookingId) => {
    const payment = payments.find(p => p.bookingId === bookingId && p.paymentType === 'full_payment');
    setModal({ open: true, actionType: 'refund', payment });
  };

  const handlePayout = async (bookingId) => {
    // Ưu tiên lấy payment payout nếu đã có (để lấy đúng amount), nếu chưa có thì lấy full_payment
    const payoutPayment = payments.find(p => p.bookingId === bookingId && p.paymentType === 'payout');
    const payment = payoutPayment || payments.find(p => p.bookingId === bookingId && p.paymentType === 'full_payment');
    setModal({ open: true, actionType: 'payout', payment });
    setPayoutError(null);
    setPayoutAmount(null);
    setPayoutCurrency('VND');
    if (!payoutPayment) {
      setPayoutLoading(true);
      try {
        const data = await getPayoutAmount(bookingId);
        setPayoutAmount(Number(data.payoutAmount));
        setPayoutCurrency(data.currency || 'VND');
      } catch (err) {
        setPayoutError(err.message || 'Không lấy được số tiền payout');
      } finally {
        setPayoutLoading(false);
      }
    } else {
      setPayoutAmount(Number(payment.amount));
      setPayoutCurrency(payment.currency || 'VND');
    }
  };

  const confirmAction = async () => {
    const { actionType, payment } = modal;
    try {
      if (actionType === 'refund') {
        await refundDeposit(payment.bookingId);
        toast.success('Hoàn cọc thành công!');
      } else {
        await payoutSupplier(payment.bookingId);
        toast.success('Payout thành công!');
      }
      fetchPayments();
    } catch (err) {
      toast.error((actionType === 'refund' ? 'Hoàn cọc' : 'Payout') + ' thất bại: ' + err.message);
    } finally {
      setModal({ open: false, actionType: '', payment: null });
    }
  };

  const handleViewDetails = (bookingId) => {
    const relatedPayments = payments.filter(p => p.bookingId === bookingId);
    setDetailModal({ open: true, payments: relatedPayments, bookingId });
  };

  const handleExportCSV = () => {
    if (!filteredPayments.length) {
      toast.info('Không có dữ liệu để xuất!');
      return;
    }
    const csv = Papa.unparse(
      filteredPayments.map(p => ({
        BookingID: p.bookingId,
        Customer: p.customerName || p.customer?.fullName || '-',
        Supplier: p.supplierName || p.supplier?.fullName || '-',
        Amount: p.amount,
        Currency: p.currency,
        Type: p.paymentType,
        Status: p.paymentStatus,
        Date: p.paymentDate ? new Date(p.paymentDate).toLocaleString('vi-VN') : '-',
        TransactionID: p.transactionId,
      }))
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `payments_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPayments = payments.filter(p => {
    const searchText = search.toLowerCase();
    const matchSearch =
      !searchText ||
      (p.bookingId && String(p.bookingId).includes(searchText)) ||
      (p.customerName && p.customerName.toLowerCase().includes(searchText)) ||
      (p.supplierName && p.supplierName.toLowerCase().includes(searchText));
    const matchType = typeFilter === 'all' || p.paymentType === typeFilter;
    const matchStatus = statusFilter === 'all' || (p.paymentStatus && p.paymentStatus.toLowerCase() === statusFilter);
    return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-100 to-blue-50">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-4 p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-2xl text-white border-2 border-blue-300/40">
          <div className="p-3 bg-white bg-opacity-20 rounded-2xl shadow-md">
            <FaMoneyCheckAlt className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-4xl font-extrabold mb-1 drop-shadow-lg">Quản lý thanh toán & hoàn tiền</h2>
            <p className="text-blue-100 text-lg font-medium">Kiểm soát refund, payout và trạng thái giao dịch</p>
          </div>
        </div>
      </div>
      {/* Bộ lọc/tìm kiếm */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl shadow flex flex-wrap gap-3 items-end border border-blue-200">
        <div className="flex flex-col">
          <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><span className="mr-1">🔍</span>Tìm kiếm</label>
          <input
            type="text"
            placeholder="Tìm Booking ID, khách, supplier..."
            className="border border-blue-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm min-w-[180px]"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><span className="mr-1">📄</span>Loại giao dịch</label>
          <select
            className="border border-blue-200 rounded-xl px-2 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm min-w-[120px]"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="all">Tất cả loại</option>
            <option value="deposit">Cọc</option>
            <option value="full_payment">Thanh toán đủ</option>
            <option value="refund">Hoàn cọc</option>
            <option value="payout">Payout</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><span className="mr-1">📊</span>Trạng thái</label>
          <select
            className="border border-blue-200 rounded-xl px-2 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm min-w-[120px]"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="paid">Đã thanh toán</option>
            <option value="pending">Chờ xử lý</option>
            <option value="failed">Thất bại</option>
          </select>
        </div>
        <button
          className="ml-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-colors flex items-center gap-2"
          onClick={handleExportCSV}
        >
          <span>⬇️</span> Xuất CSV
        </button>
      </div>
      {/* Bảng dữ liệu */}
      <div className="rounded-2xl shadow-lg overflow-hidden border border-purple-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-purple-100 to-blue-50">
              <th className="py-4 px-6 text-left font-bold text-purple-700">
                <span className="inline-flex items-center gap-2">#️⃣ Booking ID</span>
              </th>
              <th className="py-4 px-6 text-left font-bold text-purple-700">
                <span className="inline-flex items-center gap-2">👤 Khách hàng</span>
              </th>
              <th className="py-4 px-6 text-left font-bold text-purple-700">
                <span className="inline-flex items-center gap-2">🚗 Supplier</span>
              </th>
              <th className="py-4 px-6 text-left font-bold text-purple-700">
                <span className="inline-flex items-center gap-2">📄 Loại</span>
              </th>
              <th className="py-4 px-6 text-left font-bold text-purple-700">
                <span className="inline-flex items-center gap-2">💰 Số tiền</span>
              </th>
              <th className="py-4 px-6 text-left font-bold text-purple-700">
                <span className="inline-flex items-center gap-2">📊 Trạng thái</span>
              </th>
              <th className="py-4 px-6 text-left font-bold text-purple-700">
                <span className="inline-flex items-center gap-2">📅 Ngày</span>
              </th>
              <th className="py-4 px-6 text-center font-bold text-purple-700">
                <span className="inline-flex items-center gap-2">⚡ Hành động</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="py-8 text-center text-blue-600 font-semibold">Đang tải dữ liệu...</td></tr>
            ) : error ? (
              <tr><td colSpan="8" className="py-8 text-center text-red-600 font-semibold">{error}</td></tr>
            ) : filteredPayments.length === 0 ? (
              <tr><td colSpan="8" className="py-8 text-center text-gray-500">Không có dữ liệu</td></tr>
            ) : (
              filteredPayments.map((p, idx) => (
                <tr key={p.paymentId || p.transactionId || idx} className="border-b border-gray-100 hover:bg-blue-50 transition">
                  <td className="py-4 px-6">{p.bookingId}</td>
                  <td className="py-4 px-6">{p.customerName || p.customer?.fullName || '-'}</td>
                  <td className="py-4 px-6">{p.supplierName || p.supplier?.fullName || '-'}</td>
                  <td className="py-4 px-6 capitalize">{p.paymentType === 'deposit' ? 'Cọc' : p.paymentType === 'full_payment' ? 'Thanh toán đủ' : p.paymentType === 'refund' ? 'Hoàn cọc' : p.paymentType === 'payout' ? 'Payout' : p.paymentType}</td>
                  <td className="py-4 px-6 font-bold">{Number(p.amount).toLocaleString('vi-VN')} {p.currency || 'VND'}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${p.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : p.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{p.paymentStatus}</span>
                  </td>
                  <td className="py-4 px-6">{p.paymentDate ? new Date(p.paymentDate).toLocaleString('vi-VN') : '-'}</td>
                  <td className="py-4 px-6 text-center">
                    <button className="px-3 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold mr-2 flex items-center gap-1" onClick={() => handleViewDetails(p.bookingId)}><span>🔎</span>Chi tiết</button>
                    {p.paymentType === 'full_payment' && p.paymentStatus === 'paid' && (
                      <button className="px-3 py-1 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-white font-semibold mr-2 flex items-center gap-1" onClick={() => handleRefund(p.bookingId)}><span>↩️</span>Hoàn cọc</button>
                    )}
                    {p.paymentType === 'full_payment' && p.paymentStatus === 'paid' && (
                      <button className="px-3 py-1 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold flex items-center gap-1" onClick={() => handlePayout(p.bookingId)}><span>💸</span>Payout</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <ConfirmActionModal
        open={modal.open}
        onClose={() => { setModal({ open: false, actionType: '', payment: null }); setPayoutError(null); setPayoutAmount(null); setPayoutLoading(false); }}
        onConfirm={confirmAction}
        actionType={modal.actionType}
        payment={modal.payment}
        payoutLoading={modal.actionType === 'payout' ? payoutLoading : false}
        payoutError={modal.actionType === 'payout' ? payoutError : null}
        payoutAmount={modal.actionType === 'payout' ? payoutAmount : null}
        payoutCurrency={modal.actionType === 'payout' ? payoutCurrency : null}
      />
      <PaymentDetailsModal
        open={detailModal.open}
        onClose={() => setDetailModal({ open: false, payments: [], bookingId: null })}
        payments={detailModal.payments}
        bookingId={detailModal.bookingId}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default PaymentsAdmin; 