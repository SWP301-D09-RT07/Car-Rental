import { useState, useEffect } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  FaDollarSign,
  FaCar,
  FaChartLine,
  FaUsers,
  FaClock,
} from "react-icons/fa";
import styles from "../../../styles/Home.module.scss";
import { getReportsData } from '../../../services/api';
import { getItem } from '@/utils/auth';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
);

function Home() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getItem('token');
        console.log('[ADMIN HOME] Token in localStorage:', token);
        const overviewData = await getReportsData();
        setOverview(overviewData);
      } catch (err) {
        setError(err.message || 'Lỗi tải dữ liệu dashboard');
        console.error('[ADMIN HOME] fetchData error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className={styles.loading}>Đang tải dữ liệu...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!overview) return null;

  // Chuẩn bị dữ liệu biểu đồ thu nhập (nếu muốn vẽ)
  const totalIncomeData = {
    labels: overview.monthlyRevenue?.map(m => `Th${m.month}`) || [],
    datasets: [
      {
        label: "Tổng thu nhập (VND)",
        data: overview.monthlyRevenue?.map(m => m.revenue) || [],
        fill: false,
        borderColor: "#4682B4",
        tension: 0.4,
      },
    ],
  };

  return (
    <div className={`${styles.container} ${styles.adminContent}`}>
      <div className={styles.header}>
        <h2>
          <FaChartLine className={styles.headerIcon} /> Tổng quan
        </h2>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>
            <FaDollarSign className={styles.cardIcon} /> Tổng Doanh thu
          </h3>
          <p className={styles.value}>{overview.totalRevenue?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</p>
          <Line
            data={totalIncomeData}
            options={{
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { color: "#4A4A4A" },
                },
                x: {
                  ticks: { color: "#4A4A4A" },
                },
              },
              plugins: { legend: { display: false } },
            }}
            height={100}
          />
        </div>
        <div className={styles.card}>
          <h3>
            <FaCar className={styles.cardIcon} /> Tổng Lượt Đặt
          </h3>
          <p className={styles.value}>{overview.totalBookings}</p>
        </div>
      </div>

      <div className={`${styles.grid} ${styles.twoCols}`}>
        <div className={styles.card}>
          <h3>
            <FaCar className={styles.cardIcon} /> Xe Phổ Biến
          </h3>
          <div className={styles.popularCar}>
            {overview.popularCarDetail ? (
              <>
                <div className={styles.carImage}>
                  {overview.popularCarDetail.imageUrl && (
                    <img src={overview.popularCarDetail.imageUrl} alt={overview.popularCarDetail.carModel} style={{ width: 80, height: 50, objectFit: 'cover' }} />
                  )}
                </div>
                <div className={styles.carDetails}>
                  <p className={styles.carModel}>{overview.popularCarDetail.carModel}</p>
                  <p className={styles.carLicense}>{overview.popularCarDetail.licensePlate}</p>
                </div>
              </>
            ) : (
              <div>Không có dữ liệu xe phổ biến</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;