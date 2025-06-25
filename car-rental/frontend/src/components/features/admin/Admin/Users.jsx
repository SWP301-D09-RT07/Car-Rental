import { useState, useEffect } from "react";
import styles from "../../../../styles/Users.module.scss";

const mockUsers = [
  { id: 1, username: "john_doe", role: "khách_hàng", email: "john@example.com", status: "Hoạt động" },
  { id: 2, username: "jane_smith", role: "chủ_xe", email: "jane@example.com", status: "Hoạt động" },
  { id: 3, username: "mike_jones", role: "khách_hàng", email: "mike@example.com", status: "Hoạt động" },
  { id: 4, username: "sarah_lee", role: "chủ_xe", email: "sarah@example.com", status: "Tạm khóa" },
  { id: 5, username: "david_brown", role: "khách_hàng", email: "david@example.com", status: "Hoạt động" },
  { id: 6, username: "emma_wilson", role: "chủ_xe", email: "emma@example.com", status: "Tạm khóa" },
  { id: 7, username: "peter_parker", role: "khách_hàng", email: "peter@example.com", status: "Hoạt động" },
  { id: 8, username: "lisa_ray", role: "chủ_xe", email: "lisa@example.com", status: "Hoạt động" },
  { id: 9, username: "tom_hardy", role: "khách_hàng", email: "tom@example.com", status: "Tạm khóa" },
  { id: 10, username: "anna_king", role: "chủ_xe", email: "anna@example.com", status: "Hoạt động" },
  { id: 11, username: "chris_rock", role: "khách_hàng", email: "chris@example.com", status: "Hoạt động" },
  { id: 12, username: "sophia_mart", role: "chủ_xe", email: "sophia@example.com", status: "Tạm khóa" },
];

const ITEMS_PER_PAGE = 5;

function Users() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Giả lập loading
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  // Lọc người dùng dựa trên vai trò và trạng thái
  const filteredUsers = mockUsers.filter((user) => {
    return (
      (filterRole === "all" || user.role === filterRole) &&
      (filterStatus === "all" || user.status === filterStatus)
    );
  });

  // Tính toán số trang
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  // Lấy danh sách người dùng cho trang hiện tại
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Xử lý chuyển trang
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Xử lý chặn người dùng
  const handleBlockUser = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const confirmBlock = () => {
    // Logic chặn người dùng
    console.log(`Chặn người dùng: ${selectedUser.username}`);
    setShowModal(false);
    setSelectedUser(null);
  };

  return (
    <div className={styles.usersContainer}>
      <h2 className={styles.title}>Quản lý Người dùng</h2>

      {/* Bộ lọc */}
      <div className={styles.filters}>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">Tất cả vai trò</option>
          <option value="khách_hàng">Khách hàng</option>
          <option value="chủ_xe">Chủ xe</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="Hoạt động">Hoạt động</option>
          <option value="Tạm khóa">Tạm khóa</option>
        </select>
      </div>

      {/* Bảng người dùng */}
      <table className={styles.table}>
        <thead>
          <tr className={styles.tableHeader}>
            <th className={styles.tableHeaderCell}>ID</th>
            <th className={styles.tableHeaderCell}>Tên đăng nhập</th>
            <th className={styles.tableHeaderCell}>Vai trò</th>
            <th className={styles.tableHeaderCell}>Email</th>
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
            currentUsers.map((user) => (
              <tr key={user.id} className={styles.tableRow}>
                <td className={styles.tableCell}>{user.id}</td>
                <td className={styles.tableCell}>{user.username}</td>
                <td className={styles.tableCell}>
                  <span className={`${styles.roleTag} ${user.role === "chủ_xe" ? styles.owner : styles.customer}`}>
                    {user.role}
                  </span>
                </td>
                <td className={styles.tableCell}>{user.email}</td>
                <td className={styles.tableCell}>
                  <span className={`${styles.statusTag} ${user.status === "Hoạt động" ? styles.active : styles.blocked}`}>
                    {user.status}
                  </span>
                </td>
                <td className={styles.tableCell}>
                  <button className={styles.editButton}>Chỉnh sửa</button>
                  <button
                    className={styles.blockButton}
                    onClick={() => handleBlockUser(user)}
                  >
                    {user.status === "Hoạt động" ? "Chặn" : "Mở chặn"}
                  </button>
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
              Bạn có chắc chắn muốn {selectedUser?.status === "Hoạt động" ? "chặn" : "mở chặn"} người dùng{" "}
              <strong>{selectedUser?.username}</strong>?
            </p>
            <div className={styles.modalActions}>
              <button className={styles.cancelButton} onClick={() => setShowModal(false)}>
                Hủy
              </button>
              <button className={styles.confirmButton} onClick={confirmBlock}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;