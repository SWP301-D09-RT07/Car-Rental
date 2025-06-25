import { useState, useEffect } from "react";
import styles from "../../../../styles/CarListings.module.scss";

const mockCars = [
  { id: 1, license_plate: "ABC123", model: "Toyota Camry", supplier: "jane_smith", status: "Chờ duyệt" },
  { id: 2, license_plate: "XYZ789", model: "Honda Civic", supplier: "jane_smith", status: "Đã duyệt" },
  { id: 3, license_plate: "DEF456", model: "Mazda 3", supplier: "mike_jones", status: "Chờ duyệt" },
  { id: 4, license_plate: "GHI789", model: "Ford Focus", supplier: "sarah_lee", status: "Đã duyệt" },
  { id: 5, license_plate: "JKL012", model: "Hyundai Sonata", supplier: "david_brown", status: "Chờ duyệt" },
  { id: 6, license_plate: "MNO345", model: "Kia Rio", supplier: "emma_wilson", status: "Đã duyệt" },
  { id: 7, license_plate: "PQR678", model: "Nissan Altima", supplier: "peter_parker", status: "Chờ duyệt" },
  { id: 8, license_plate: "STU901", model: "BMW 3 Series", supplier: "lisa_ray", status: "Đã duyệt" },
  { id: 9, license_plate: "VWX234", model: "Audi A4", supplier: "tom_hardy", status: "Chờ duyệt" },
  { id: 10, license_plate: "YZA567", model: "Mercedes C-Class", supplier: "anna_king", status: "Đã duyệt" },
  { id: 11, license_plate: "BCD890", model: "Volkswagen Golf", supplier: "chris_rock", status: "Chờ duyệt" },
  { id: 12, license_plate: "EFG123", model: "Subaru Outback", supplier: "sophia_mart", status: "Đã duyệt" },
];

const ITEMS_PER_PAGE = 5;

function CarListings() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [modalAction, setModalAction] = useState("");

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  const filteredCars = mockCars.filter((car) => {
    return filterStatus === "all" || car.status === filterStatus;
  });

  const totalPages = Math.ceil(filteredCars.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentCars = filteredCars.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleAction = (car, action) => {
    setSelectedCar(car);
    setModalAction(action);
    setShowModal(true);
  };

  const confirmAction = () => {
    console.log(`${modalAction} xe: ${selectedCar?.license_plate}`);
    setShowModal(false);
    setSelectedCar(null);
  };

  return (
    <div className={styles.carListingsContainer}>
      <h2 className={styles.title}>Quản lý Tin đăng xe</h2>

      <div className={styles.filters}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="Chờ duyệt">Chờ duyệt</option>
          <option value="Đã duyệt">Đã duyệt</option>
        </select>
      </div>

      <table className={styles.table}>
        <thead>
          <tr className={styles.tableHeader}>
            <th className={styles.tableHeaderCell}>ID</th>
            <th className={styles.tableHeaderCell}>Biển số</th>
            <th className={styles.tableHeaderCell}>Mô hình</th>
            <th className={styles.tableHeaderCell}>Chủ xe</th>
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
            currentCars.map((car) => (
              <tr key={car.id} className={styles.tableRow}>
                <td className={styles.tableCell}>{car.id}</td>
                <td className={styles.tableCell}>{car.license_plate}</td>
                <td className={styles.tableCell}>{car.model}</td>
                <td className={styles.tableCell}>{car.supplier}</td>
                <td className={styles.tableCell}>
                  <span className={`${styles.statusTag} ${car.status === "Đã duyệt" ? styles.approved : styles.pending}`}>
                    {car.status}
                  </span>
                </td>
                <td className={styles.tableCell}>
                  <div className={styles.actionButtons}>
                    <button
                      className={styles.approveButton}
                      onClick={() => handleAction(car, car.status === "Chờ duyệt" ? "Duyệt" : "Hủy duyệt")}
                    >
                      {car.status === "Chờ duyệt" ? "Duyệt" : "Hủy duyệt"}
                    </button>
                    <button
                      className={styles.editButton}
                      onClick={() => handleAction(car, "Chỉnh sửa")}
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      className={styles.lockButton}
                      onClick={() => handleAction(car, "Khóa")}
                    >
                      Khóa
                    </button>
                  </div>
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

      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Xác nhận hành động</h3>
            <p>
              Bạn có chắc chắn muốn {modalAction} xe <strong>{selectedCar?.license_plate}</strong>?
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

export default CarListings;