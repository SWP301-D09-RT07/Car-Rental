import { useState, useEffect } from "react";
import styles from "@/styles/Users.module.scss";
import api, { toggleUserStatus } from "../../../services/api.js";

const ITEMS_PER_PAGE = 10;

function Users() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [blockReason, setBlockReason] = useState("");

  // Lấy danh sách người dùng từ API (liên quan đến getUsers của hoàng)
  useEffect(() => {
    const fetchUsers = async () => {
      console.log("=== BẮT ĐẦU FETCH USERS ===");
      console.log("Current page:", currentPage);
      console.log("Filter role:", filterRole);
      console.log("Filter status:", filterStatus);
      
      try {
        setIsLoading(true);
        setError(null);
        
        const params = new URLSearchParams({
          page: currentPage,
          size: ITEMS_PER_PAGE,
          ...(filterRole !== "all" && { role: filterRole }),
          ...(filterStatus !== "all" && { status: filterStatus }),
        });
        
        console.log("API URL:", `/api/users?${params.toString()}`);
        console.log("Request params:", Object.fromEntries(params));
        
        const response = await api.get(`/api/users?${params.toString()}`);
        console.log("Response status:", response.status);
        console.log("Response data:", response.data);
        
        setUsers(response.data.content);
        setTotalPages(response.data.totalPages);
        console.log("Users loaded:", response.data.content.length);
        console.log("Total pages:", response.data.totalPages);
        console.log("=== KẾT THÚC FETCH USERS - THÀNH CÔNG ===");
      } catch (error) {
        console.error("=== LỖI TRONG FETCH USERS ===");
        console.error("Error:", error);
        console.error("Error response:", error.response);
        console.error("Error status:", error.response?.status);
        console.error("Error data:", error.response?.data);
        setError(error.response?.data?.message || "Lỗi khi tải danh sách người dùng");
        console.log("=== KẾT THÚC LỖI FETCH USERS ===");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [currentPage, filterRole, filterStatus]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleBlockUser = (user) => {
    console.log("=== BẮT ĐẦU HANDLE BLOCK USER ===");
    console.log("User to block:", user);
    setSelectedUser(user);
    setBlockReason(""); // Reset lý do khi mở modal
    setShowModal(true);
    console.log("Modal opened for user:", user.username);
    console.log("=== KẾT THÚC HANDLE BLOCK USER ===");
  };

  const confirmBlock = async () => {
    console.log("=== BẮT ĐẦU CONFIRM BLOCK ===");
    console.log("Selected user:", selectedUser);
    console.log("Block reason:", blockReason);
    
    try {
      setError(null);
      console.log("Toggling user:", selectedUser.userId);
      
      // Gọi API toggleUserStatus với lý do (chỉ khi chặn)
      const reason = selectedUser.statusName === "active" ? blockReason : null;
      console.log("Calling toggleUserStatus with reason:", reason);
      
      const response = await toggleUserStatus(selectedUser.userId, reason);
      console.log("API response:", response);
      
      // Cập nhật trạng thái người dùng trong danh sách
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.userId === selectedUser.userId
            ? { ...user, statusName: response.statusName }
            : user
        )
      );
      
      console.log("Updated users list successfully");
      setShowModal(false);
      setSelectedUser(null);
      setBlockReason("");
      console.log("=== KẾT THÚC CONFIRM BLOCK - THÀNH CÔNG ===");
    } catch (error) {
      console.error("=== LỖI TRONG CONFIRM BLOCK ===");
      console.error("Error:", error);
      console.error("Error message:", error.message);
      setError(error.message);
      console.log("=== KẾT THÚC LỖI CONFIRM BLOCK ===");
    }
  };

  return (
      <div className={`${styles.usersContainer} ${styles.adminContent}`}>
        <h2 className={styles.title}>Quản lý Người dùng</h2>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <div className={styles.filters}>
          <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className={styles.filterSelect}
          >
            <option value="all">Tất cả vai trò</option>
            <option value="customer">Khách hàng</option>
            <option value="supplier">Chủ xe</option>
          </select>
          <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={styles.filterSelect}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="blocked">Bị chặn</option>
          </select>
        </div>

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
              Array.from({length: ITEMS_PER_PAGE}).map((_, index) => (
                  <tr key={index} className={styles.tableRow}>
                    <td className={styles.tableCell}>
                      <div className={styles.skeleton}></div>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.skeleton}></div>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.skeleton}></div>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.skeleton}></div>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.skeleton}></div>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.skeleton}></div>
                    </td>
                  </tr>
              ))
          ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.tableCell}>
                  Không có người dùng nào
                </td>
              </tr>
          ) : (
              users.map((user) => (
                  <tr key={user.userId} className={styles.tableRow}>
                    <td className={styles.tableCell}>{user.userId}</td>
                    <td className={styles.tableCell}>{user.username}</td>
                    <td className={styles.tableCell}>
                  <span
                      className={`${styles.roleTag} ${
                          user.roleName === "supplier" ? styles.owner : styles.customer
                      }`}
                  >
                    {user.roleName === "customer" ? "Khách hàng" : "Chủ xe"}
                  </span>
                    </td>
                    <td className={styles.tableCell}>{user.email}</td>
                    <td className={styles.tableCell}>
                      <div className={styles.statusContainer}>
                        <div className={styles.statusRow}>
                          <span className={styles.statusLabel}>Trạng thái:</span>
                          <span
                              className={`${styles.statusTag} ${
                                  user.statusName === "active" ? styles.active : styles.blocked
                              }`}
                          >
                            {user.statusName === "active" ? "Hoạt động" : "Bị chặn"}
                          </span>
                        </div>
                        <div className={styles.statusRow}>
                          <span className={styles.statusLabel}>Đăng nhập:</span>
                          <span
                              className={`${styles.accountStatusTag} ${
                                  user.statusName === "online" ? styles.unblocked : styles.blocked
                              }`}
                          >
                            {user.statusName === "online" ? "Online" : "Offline"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <button
                          className={styles.blockButton}
                          onClick={() => handleBlockUser(user)}
                      >
                        {user.statusName === "active" ? "Chặn" : "Mở chặn"}
                      </button>
                    </td>
                  </tr>
              ))
          )}
          </tbody>
        </table>

        <div className={styles.pagination}>
          <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={styles.paginationButton}
          >
            <span className={styles.icon}>←</span>
          </button>
          {Array.from({length: totalPages}, (_, i) => i + 1).map((page) => (
              <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`${styles.paginationButton} ${
                      currentPage === page ? styles.activePage : ""
                  }`}
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

        {showModal && (
            <div className={styles.modal}>
              <div className={styles.modalContent}>
                <h3>Xác nhận hành động</h3>
                <p>
                  Bạn có chắc chắn muốn{" "}
                  {selectedUser?.statusName === "active" ? "chặn" : "mở chặn"} người
                  dùng <strong>{selectedUser?.username}</strong>?
                </p>
                
                {selectedUser?.statusName === "active" && (
                  <div className={styles.reasonInput}>
                    <label htmlFor="blockReason">Lý do chặn (tùy chọn):</label>
                    <textarea
                      id="blockReason"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder="Nhập lý do chặn tài khoản..."
                      rows={3}
                      className={styles.reasonTextarea}
                    />
                  </div>
                )}
                
                <div className={styles.modalActions}>
                  <button
                      className={styles.cancelButton}
                      onClick={() => {
                        setShowModal(false);
                        setBlockReason("");
                      }}
                  >
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