import { useState, useEffect } from "react";
import styles from "../../../../styles/Payments.module.scss";

const mockPayments = [
  { id: 1, booking_id: 1, amount: 300, currency: "USD", status: "Đã thanh toán", refund: null },
  { id: 2, booking_id: 2, amount: 250, currency: "USD", status: "Chờ thanh toán", refund: null },
  { id: 3, booking_id: 3, amount: 400, currency: "USD", status: "Đã thanh toán", refund: null },
  { id: 4, booking_id: 4, amount: 200, currency: "USD", status: "Chờ thanh toán", refund: null },
  { id: 5, booking_id: 5, amount: 350, currency: "USD", status: "Đã thanh toán", refund: null },
  { id: 6, booking_id: 6, amount: 280, currency: "USD", status: "Chờ thanh toán", refund: null },
  { id: 7, booking_id: 7, amount: 500, currency: "USD", status: "Đã thanh toán", refund: null },
  { id: 8, booking_id: 8, amount: 320, currency: "USD", status: "Chờ thanh toán", refund: null },
  { id: 9, booking_id: 9, amount: 450, currency: "USD", status: "Đã thanh toán", refund: null },
  { id: 10, booking_id: 10, amount: 270, currency: "USD", status: "Chờ thanh toán", refund: null },
  { id: 11, booking_id: 11, amount: 380, currency: "USD", status: "Đã thanh toán", refund: null },
  { id: 12, booking_id: 12, amount: 290, currency: "USD", status: "Chờ thanh toán", refund: null },
];

const ITEMS_PER_PAGE = 5;

function Payments() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [modalAction, setModalAction] = useState("");

  // Giả lập loading
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  // Lọc thanh toán dựa trên trạng thái
  const filteredPayments = mockPayments.filter((payment) => {
    return filterStatus === "all" || payment.status === filterStatus;
  });

  // Tính toán số trang
  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);

  // Lấy danh sách thanh toán cho trang hiện tại
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  // Xử lý chuyển trang
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Xử lý hành động
  const handleAction = (payment, action) => {
    setSelectedPayment(payment);
    setModalAction(action);
    setShowModal(true);
  };

  const confirmAction = () => {
    console.log(`${modalAction} thanh toán ID: ${selectedPayment?.id}`);
    setShowModal(false);
    setSelectedPayment(null);
  };

  return (
    <div className={styles.paymentsContainer}>
      <h2 className={styles.title}>Quản lý Thanh toán</h2>

      {/* Bộ lọc */}
      <div className={styles.filters}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="Chờ thanh toán">Chờ thanh toán</option>
          <option value="Đã thanh toán">Đã thanh toán</option>
        </select>
      </div>

      {/* Bảng thanh toán */}
      <table className={styles.table}>
        <thead>
          <tr className={styles.tableHeader}>
            <th className={styles.tableHeaderCell}>ID</th>
            <th className={styles.tableHeaderCell}>ID Đơn</th>
            <th className={styles.tableHeaderCell}>Số tiền</th>
            <th className={styles.tableHeaderCell}>Tiền tệ</th>
            <th className={styles.tableHeaderCell}>Trạng thái</th>
            <th className={styles.tableHeaderCell}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
              <tr key={index} className={styles.tableRow}>
                <td className={styles.tableCell}><div className={styles.skeleton}></div></td>
                <td className={styles.tableCell}><div className={styles.skeleton}></div></td>
                <td className={styles.tableCell}><div className={styles.skeleton}></div></td>
                <td className={styles.tableCell}><div className={styles.skeleton}></div></td>
                <td className={styles.tableCell}><div className={styles.skeleton}></div></td>
                <td className={styles.tableCell}><div className={styles.skeleton}></div></td>
              </tr>
            ))
          ) : (
            currentPayments.map((payment) => (
              <tr key={payment.id} className={styles.tableRow}>
                <td className={styles.tableCell}>{payment.id}</td>
                <td className={styles.tableCell}>{payment.booking_id}</td>
                <td className={styles.tableCell}>{payment.amount}</td>
                <td className={styles.tableCell}>{payment.currency}</td>
                <td className={styles.tableCell}>
                  <span className={`${styles.statusTag} ${payment.status === "Đã thanh toán" ? styles.paid : styles.pending}`}>
                    {payment.status}
                  </span>
                </td>
                <td className={styles.tableCell}>
                  <div className={styles.actionButtons}>
                    <button
                      className={styles.viewButton}
                      onClick={() => handleAction(payment, "Xem")}
                    >
                      Xem
                    </button>
                    <button
                      className={styles.refundButton}
                      onClick={() => handleAction(payment, "Hoàn tiền")}
                      disabled={payment.status !== "Đã thanh toán"}
                    >
                      Hoàn tiền
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Phân trang */}
      <div className={styles.pagination}>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={styles.paginationButton}
        >
          <span className={styles.icon}>←</span>
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`${styles.paginationButton} ${currentPage === page ? styles.activePage : ""}`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={styles.paginationButton}
        >
          <span className={styles.icon}>→</span>
        </button>
      </div>

      {/* Modal xác nhận */}
      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Xác nhận hành động</h3>
            <p>
              Bạn có chắc chắn muốn {modalAction} thanh toán ID <strong>{selectedPayment?.id}</strong>?
            </p>
            <div className={styles.modalActions}>
              <button className={styles.cancelButton} onClick={() => setShowModal(false)}>
                Hủy
              </button>
              <button className={styles.confirmButton} onClick={confirmAction}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payments;