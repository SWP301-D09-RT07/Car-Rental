import { useState, useEffect } from "react";
import { Bar, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from "chart.js";
import { getReportsData } from "@/services/api.js"; // Giả định file API nằm tại src/api/index.js
import styles from "../../../styles/Reports.module.scss";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "top" },
    title: { display: false },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: "y",
  plugins: {
    legend: { position: "top" },
    title: { display: false },
  },
  scales: {
    x: {
      beginAtZero: true,
      title: { display: true, text: "Doanh thu (VND)" },
    },
    y: {
      title: { display: true, text: "Nhà cung cấp" },
    },
  },
};

function Reports() {
  const [reports, setReports] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    popularCar: "",
    popularCarDetail: null,
    suppliersRevenue: [],
  });
  const [revenueData, setRevenueData] = useState({
    labels: [],
    datasets: [{ label: "Doanh thu (VND)", data: [], backgroundColor: "#4682B4", borderColor: "#4682B4", borderWidth: 1, fill: false }],
  });
  const [bookingsData, setBookingsData] = useState({
    labels: [],
    datasets: [{ label: "Lượt đặt", data: [], backgroundColor: "#4682B4", borderColor: "#4682B4", borderWidth: 1, fill: false }],
  });
  const [popularCarData, setPopularCarData] = useState({
    labels: [],
    datasets: [{ label: "Tỷ lệ phổ biến (%)", data: [], backgroundColor: "#4682B4", borderColor: "#4682B4", borderWidth: 1, fill: false }],
  });
  const [suppliersData, setSuppliersData] = useState({
    labels: [],
    datasets: [{ label: "Doanh thu (VND)", data: [], backgroundColor: "#4682B4", borderColor: "#4682B4", borderWidth: 1, barThickness: 20 }],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await getReportsData();
        const {
          totalRevenue,
          totalBookings,
          popularCar,
          popularCarDetail,
          suppliersRevenue,
          monthlyRevenue,
          monthlyBookings,
          monthlyPopularCar,
        } = response;

        setReports({
          totalRevenue,
          totalBookings,
          popularCar: popularCar?.model || "N/A",
          popularCarDetail,
          suppliersRevenue: suppliersRevenue.sort((a, b) => b.revenue - a.revenue),
        });

        const months = monthlyRevenue.map((item) => `Th${item.month}`);
        setRevenueData({
          labels: months,
          datasets: [{ ...revenueData.datasets[0], data: monthlyRevenue.map((item) => item.revenue) }],
        });

        setBookingsData({
          labels: months,
          datasets: [{ ...bookingsData.datasets[0], data: monthlyBookings.map((item) => item.count) }],
        });

        setPopularCarData({
          labels: months,
          datasets: [{ ...popularCarData.datasets[0], data: monthlyPopularCar.map((item) => item.percentage) }],
        });

        setSuppliersData({
          labels: suppliersRevenue.map((s) => s.supplierName),
          datasets: [{ ...suppliersData.datasets[0], data: suppliersRevenue.map((s) => s.revenue) }],
        });
      } catch (err) {
        // Hiển thị thông báo lỗi chi tiết
        setError(err.message || "Không thể tải dữ liệu báo cáo. Vui lòng thử lại sau.");
        console.error("Lỗi khi lấy báo cáo:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) return <div className={styles.loading}>Đang tải...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
      <div className={styles.reportsContainer}>
        <h2 className={styles.title}>Báo cáo Tổng quan</h2>
        <div className={styles.reportGrid}>
          <div className={styles.reportCard}>
            <h3 className={styles.cardTitle}>Tổng Doanh thu</h3>
            <p className={styles.cardValue}>{reports.totalRevenue.toLocaleString()} VND</p>
            <div className={styles.chartContainer}>
              <Line data={revenueData} options={lineChartOptions} height={100} />
            </div>
          </div>
          <div className={styles.reportCard}>
            <h3 className={styles.cardTitle}>Tổng Lượt Đặt</h3>
            <p className={styles.cardValue}>{reports.totalBookings}</p>
            <div className={styles.chartContainer}>
              <Line data={bookingsData} options={lineChartOptions} height={100} />
            </div>
          </div>
          <div className={styles.reportCard}>
            <h3 className={styles.cardTitle}>Xe Phổ Biến</h3>
            {reports.popularCarDetail ? (
              <div className={styles.popularCarDetail}>
                <div className={styles.carImage}>
                  <img 
                    src={reports.popularCarDetail.imageUrl || '/images/default-car.jpg'} 
                    alt={reports.popularCarDetail.carModel}
                    onError={(e) => {
                      e.target.src = '/images/default-car.jpg';
                    }}
                  />
                </div>
                <div className={styles.carInfo}>
                  <h4 className={styles.carModel}>{reports.popularCarDetail.carModel}</h4>
                  <p className={styles.carBrand}>{reports.popularCarDetail.brandName}</p>
                  <p className={styles.carPlate}>{reports.popularCarDetail.licensePlate}</p>
                  <p className={styles.supplierName}>
                    <strong>Chủ xe:</strong> {reports.popularCarDetail.supplierName}
                  </p>
                  <p className={styles.bookingCount}>
                    <strong>Số lượt đặt:</strong> {reports.popularCarDetail.bookingCount}
                  </p>
                  <p className={styles.carRevenue}>
                    <strong>Doanh thu:</strong> {reports.popularCarDetail.totalRevenue?.toLocaleString()} VND
                  </p>
                </div>
              </div>
            ) : (
              <p className={styles.cardValue}>{reports.popularCar}</p>
            )}
            <div className={styles.chartContainer}>
              <Line data={popularCarData} options={lineChartOptions} height={100} />
            </div>
          </div>
        </div>

        <div className={styles.suppliersSection}>
          <h3 className={styles.sectionTitle}>Doanh thu của Nhà cung cấp</h3>
          <div className={styles.suppliersChart}>
            <Bar data={suppliersData} options={barChartOptions} height={200} />
          </div>
        </div>
      </div>
  );
}

export default Reports;