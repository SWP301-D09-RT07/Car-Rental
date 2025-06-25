import { useState, useEffect } from "react";
import styles from "../../../../styles/Bookings.module.scss";

const mockBookings = [
  { id: 1, customer: "john_doe", car: "Toyota Camry", start_date: "2025-06-01", status: "Đã xác nhận" },
  { id: 2, customer: "john_doe", car: "Honda Civic", start_date: "2025-06-05", status: "Chờ xử lý" },
  { id: 3, customer: "mike_jones", car: "Mazda 3", start_date: "2025-06-07", status: "Đã xác nhận" },
  { id: 4, customer: "sarah_lee", car: "Ford Focus", start_date: "2025-06-10", status: "Chờ xử lý" },
  { id: 5, customer: "david_brown", car: "Hyundai Sonata", start_date: "2025-06-12", status: "Đã xác nhận" },
  { id: 6, customer: "emma_wilson", car: "Kia Rio", start_date: "2025-06-15", status: "Chờ xử lý" },
  { id: 7, customer: "peter_parker", car: "Nissan Altima", start_date: "2025-06-18", status: "Đã xác nhận" },
  { id: 8, customer: "lisa_ray", car: "BMW 3 Series", start_date: "2025-06-20", status: "Chờ xử lý" },
  { id: 9, customer: "tom_hardy", car: "Audi A4", start_date: "2025-06-22", status: "Đã xác nhận" },
  { id: 10, customer: "anna_king", car: "Mercedes C-Class", start_date: "2025-06-25", status: "Chờ xử lý" },
  { id: 11, customer: "chris_rock", car: "Volkswagen Golf", start_date: "2025-06-28", status: "Đã xác nhận" },
  { id: 12, customer: "sophia_mart", car: "Subaru Outback", start_date: "2025-07-01", status: "Chờ xử lý" },
];

const ITEMS_PER_PAGE = 5;

function Bookings() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modalAction, setModalAction] = useState("");

  // Giả lập loading
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  // Lọc đơn đặt xe dựa trên trạng thái
  const filteredBookings = mockBookings.filter((booking) => {
    return filterStatus === "all" || booking.status === filterStatus;
  });

  // Tính toán số trang
  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);

  // Lấy danh sách đơn đặt xe cho trang hiện tại
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  // Xử lý chuyển trang
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Xử lý hành động
  const handleAction = (booking, action) => {
    setSelectedBooking(booking);
    setModalAction(action);
    setShowModal(true);
  };

  const confirmAction = () => {
    console.log(`${modalAction} đơn đặt xe ID: ${selectedBooking?.id}`);
    setShowModal(false);
    setSelectedBooking(null);
  };

  return (
    <div className={styles.bookingsContainer}>
      <h2 className={styles.title}>Quản lý Đơn đặt xe</h2>

      {/* Bộ lọc */}
      <div className={styles.filters}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="Chờ xử lý">Chờ xử lý</option>
          <option value="Đã xác nhận">Đã xác nhận</option>
        </select>
      </div>

      {/* Bảng đơn đặt xe */}
      <table className={styles.table}>
        <thead>
          <tr className={styles.tableHeader}>
            <th className={styles.tableHeaderCell}>ID</th>
            <th className={styles.tableHeaderCell}>Khách hàng</th>
            <th className={styles.tableHeaderCell}>Xe</th>
            <th className={styles.tableHeaderCell}>Ngày bắt đầu</th>
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
            currentBookings.map((booking) => (
              <tr key={booking.id} className={styles.tableRow}>
                <td className={styles.tableCell}>{booking.id}</td>
                <td className={styles.tableCell}>{booking.customer}</td>
                <td className={styles.tableCell}>{booking.car}</td>
                <td className={styles.tableCell}>{booking.start_date}</td>
                <td className={styles.tableCell}>
                  <span className={`${styles.statusTag} ${booking.status === "Đã xác nhận" ? styles.confirmed : styles.pending}`}>
                    {booking.status}
                  </span>
                </td>
                <td className={styles.tableCell}>
                  <div className={styles.actionButtons}>
                    <button
                      className={styles.viewButton}
                      onClick={() => handleAction(booking, "Xem")}
                    >
                      Xem
                    </button>
                    <button
                      className={styles.complaintButton}
                      onClick={() => handleAction(booking, "Xử lý khiếu nại")}
                    >
                      Xử lý khiếu nại
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
              Bạn có chắc chắn muốn {modalAction} đơn đặt xe ID <strong>{selectedBooking?.id}</strong>?
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

export default Bookings;