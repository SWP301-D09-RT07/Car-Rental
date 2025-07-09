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
  const [processingId, setProcessingId] = useState(null);
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
    setProcessingId(payment.bookingId + '-' + actionType);
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
      setProcessingId(null);
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

  // Helper lấy payment full_payment đã paid cho mỗi booking
  const getFullPayment = (bookingId) =>
    payments.find(p =>
      p.bookingId === bookingId &&
      p.paymentType === 'full_payment' &&
      (p.paymentStatus === 'paid' || p.statusName === 'paid')
    );

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
      <div className="bg-white/90 rounded-3xl shadow-xl border border-gray-100 p-6 max-w-full overflow-x-auto mx-auto">
        {/* Bộ lọc/tìm kiếm */}
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <input
            type="text"
            placeholder="Tìm Booking ID, khách, supplier..."
            className="border rounded px-3 py-1"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ minWidth: 180 }}
          />
          <select
            className="border rounded px-2 py-1"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="all">Tất cả loại</option>
            <option value="deposit">Cọc</option>
            <option value="full_payment">Thanh toán đủ</option>
            <option value="refund">Hoàn cọc</option>
            <option value="payout">Payout</option>
          </select>
          <select
            className="border rounded px-2 py-1"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="paid">Đã thanh toán</option>
            <option value="refunded">Đã hoàn</option>
            <option value="completed">Hoàn thành</option>
            <option value="failed">Thất bại</option>
          </select>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
            onClick={handleExportCSV}
            type="button"
          >
            Xuất CSV
          </button>
        </div>
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <FaSyncAlt className="animate-spin text-4xl text-blue-500 mb-4" />
            <span className="text-xl text-gray-600 font-medium">Đang tải danh sách thanh toán...</span>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 font-medium py-8 flex flex-col items-center">
            <FaTimesCircle className="text-3xl mb-2" />
            {error}
          </div>
        ) : (
          <table className="min-w-[900px] w-full border border-gray-200 rounded-xl text-sm md:text-base">
            <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
              <tr>
                <th className="px-4 py-2 font-bold text-gray-700">Booking ID</th>
                <th className="px-4 py-2 font-bold text-gray-700">Customer</th>
                <th className="px-4 py-2 font-bold text-gray-700">Supplier</th>
                <th className="px-4 py-2 font-bold text-gray-700">Amount</th>
                <th className="px-4 py-2 font-bold text-gray-700">Type</th>
                <th className="px-4 py-2 font-bold text-gray-700">Status</th>
                <th className="px-4 py-2 font-bold text-gray-700">Ngày tạo</th>
                <th className="px-4 py-2 font-bold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p, idx) => {
                const fullPayment = getFullPayment(p.bookingId);
                // Chỉ render nút refund/payout 1 lần cho mỗi bookingId (ở payment full_payment)
                if (!fullPayment || p.paymentType !== 'full_payment') return (
                  <tr key={p.paymentId || p.transactionId || p.bookingId}>
                  <td className="px-4 py-2 text-blue-700 font-semibold">{p.bookingId}</td>
                  <td className="px-4 py-2">{p.customerName || p.customer?.fullName || '-'}</td>
                  <td className="px-4 py-2">{p.supplierName || p.supplier?.fullName || '-'}</td>
                  <td className="px-4 py-2 text-right">{p.amount?.toLocaleString()} <span className="text-xs text-gray-500">VND</span></td>
                  <td className="px-4 py-2 capitalize">
                    <span className={
                      p.paymentType === 'refund' ? 'bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full' :
                      p.paymentType === 'payout' ? 'bg-green-100 text-green-700 px-2 py-1 rounded-full' :
                      'bg-gray-100 text-gray-700 px-2 py-1 rounded-full'
                    }>
                      {p.paymentType}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {p.paymentType === 'refund' && (p.paymentStatus === 'paid' || p.paymentStatus === 'refunded' || p.paymentStatus === 'completed') && (
                      <span className="inline-flex items-center gap-1 text-green-600 font-semibold"><FaCheckCircle /> Đã hoàn cọc</span>
                    )}
                    {p.paymentType === 'payout' && (p.paymentStatus === 'paid' || p.paymentStatus === 'completed') && (
                      <span className="inline-flex items-center gap-1 text-blue-600 font-semibold"><FaCheckCircle /> Đã payout</span>
                    )}
                    {p.paymentStatus === 'failed' && (
                      <span className="inline-flex items-center gap-1 text-red-600 font-semibold"><FaTimesCircle /> {p.paymentStatus}</span>
                    )}
                    {p.paymentStatus === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-yellow-600 font-semibold"><FaSyncAlt className="animate-spin" /> Đang xử lý</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{p.paymentDate ? new Date(p.paymentDate).toLocaleString() : '-'}</td>
                  <td className="px-4 py-2 space-x-2">
                      <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs" onClick={() => handleViewDetails(p.bookingId)} title="Xem chi tiết thanh toán">Chi tiết</button>
                    </td>
                  </tr>
                );
                const canRefund =
                  Boolean(fullPayment.supplierDeliveryConfirm) &&
                  Boolean(fullPayment.customerReceiveConfirm) &&
                  Boolean(fullPayment.customerReturnConfirm) &&
                  Boolean(fullPayment.supplierReturnConfirm) &&
                  !payments.some(x => x.bookingId === p.bookingId && x.paymentType === 'refund' && (x.paymentStatus === 'paid' || x.statusName === 'paid'));
                const canPayout =
                  Boolean(fullPayment.supplierDeliveryConfirm) &&
                  Boolean(fullPayment.customerReceiveConfirm) &&
                  Boolean(fullPayment.customerReturnConfirm) &&
                  Boolean(fullPayment.supplierReturnConfirm) &&
                  !payments.some(x => x.bookingId === p.bookingId && x.paymentType === 'payout' && (x.paymentStatus === 'paid' || x.statusName === 'paid'));
                return (
                  <tr key={p.paymentId || p.transactionId || p.bookingId}>
                    <td className="px-4 py-2 text-blue-700 font-semibold">{p.bookingId}</td>
                    <td className="px-4 py-2">{p.customerName || p.customer?.fullName || '-'}</td>
                    <td className="px-4 py-2">{p.supplierName || p.supplier?.fullName || '-'}</td>
                    <td className="px-4 py-2 text-right">{p.amount?.toLocaleString()} <span className="text-xs text-gray-500">VND</span></td>
                    <td className="px-4 py-2 capitalize">
                      <span className={
                        p.paymentType === 'refund' ? 'bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full' :
                        p.paymentType === 'payout' ? 'bg-green-100 text-green-700 px-2 py-1 rounded-full' :
                        'bg-gray-100 text-gray-700 px-2 py-1 rounded-full'
                      }>
                        {p.paymentType}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {p.paymentType === 'refund' && (p.paymentStatus === 'paid' || p.paymentStatus === 'refunded' || p.paymentStatus === 'completed') && (
                        <span className="inline-flex items-center gap-1 text-green-600 font-semibold"><FaCheckCircle /> Đã hoàn cọc</span>
                    )}
                      {p.paymentType === 'payout' && (p.paymentStatus === 'paid' || p.paymentStatus === 'completed') && (
                        <span className="inline-flex items-center gap-1 text-blue-600 font-semibold"><FaCheckCircle /> Đã payout</span>
                      )}
                      {p.paymentStatus === 'failed' && (
                        <span className="inline-flex items-center gap-1 text-red-600 font-semibold"><FaTimesCircle /> {p.paymentStatus}</span>
                      )}
                      {p.paymentStatus === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-yellow-600 font-semibold"><FaSyncAlt className="animate-spin" /> Đang xử lý</span>
                    )}
                  </td>
                    <td className="px-4 py-2">{p.paymentDate ? new Date(p.paymentDate).toLocaleString() : '-'}</td>
                    <td className="px-4 py-2 space-x-2">
                      {canRefund && (
                        <button
                          onClick={() => {
                            handleRefund(p.bookingId);
                          }}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded transition flex items-center gap-2"
                        >
                          Hoàn cọc
                        </button>
                      )}
                      {canPayout && (
                        <button
                          onClick={() => {
                            handlePayout(p.bookingId);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition flex items-center gap-2"
                        >
                          Payout
                        </button>
                      )}
                      <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs" onClick={() => handleViewDetails(p.bookingId)} title="Xem chi tiết thanh toán">Chi tiết</button>
                    </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
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