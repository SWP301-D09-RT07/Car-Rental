import { useState, useEffect } from "react";
import { Bar, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from "chart.js";
import { FaDollarSign, FaCar, FaChartLine, FaUsers, FaClock } from "react-icons/fa";
import styles from "../../../../styles/Home.module.scss";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

// Mock data
const mockReports = {
  revenue: 5680,
  bookings: 120,
  popularCar: "Toyota Camry",
};

const mockRecentActivities = [
  { time: "09:46", action: "Thanh toán $385.90 nhận từ John Doe" },
  { time: "09:46", action: "Đơn đặt xe mới #ML-3467" },
  { time: "09:46", action: "Thanh toán $64.95 đã thực hiện cho Michael" },
];

// Revenue forecast data
const revenueForecastData = {
  labels: ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8"],
  datasets: [
    {
      label: "Doanh thu (USD)",
      data: [3.5, -2, 3.8, -1.5, 2.0, -0.5, 2.5, -1.0],
      backgroundColor: (context) => {
        const value = context.dataset.data[context.dataIndex];
        return value >= 0 ? "#4682B4" : "#FFD700"; // $primary-blue, $accent-yellow
      },
      borderColor: (context) => {
        const value = context.dataset.data[context.dataIndex];
        return value >= 0 ? "#4682B4" : "#FFD700";
      },
      borderWidth: 1,
    },
  ],
};

// Total income data
const totalIncomeData = {
  labels: ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6"],
  datasets: [
    {
      label: "Tổng thu nhập (USD)",
      data: [680, 600, 650, 620, 700, 680],
      fill: false,
      borderColor: "#4682B4", // $primary-blue
      tension: 0.4,
    },
  ],
};

function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2><FaChartLine className={styles.headerIcon} /> Tổng quan</h2>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3><FaDollarSign className={styles.cardIcon} /> Tổng Doanh thu</h3>
          <p className={styles.value}>${mockReports.revenue}</p>
          <Line
            data={totalIncomeData}
            options={{
              scales: {
                y: {
                  beginAtZero: true,
                  min: 500,
                  max: 800,
                  ticks: {
                    stepSize: 100,
                    color: "#4A4A4A", // $gray-dark
                  },
                },
                x: {
                  ticks: {
                    color: "#4A4A4A", // $gray-dark
                  },
                },
              },
              plugins: {
                legend: {
                  display: false,
                },
              },
            }}
            height={100}
          />
        </div>
        <div className={styles.card}>
          <h3><FaCar className={styles.cardIcon} /> Tổng Lượt Đặt</h3>
          <p className={styles.value}>{mockReports.bookings}</p>
        </div>
        <div className={`${styles.card} ${styles.highlight}`}>
          <h3><FaUsers className={styles.cardIcon} /> Khách hàng mới</h3>
          <p className={styles.value}>83%</p>
          <div className={styles.progressBar}>
            <div className={styles.progress}></div>
          </div>
        </div>
      </div>

      <div className={`${styles.grid} ${styles.twoCols}`}>
        <div className={styles.chartCard}>
          <h3><FaChartLine className={styles.cardIcon} /> Dự báo Doanh thu</h3>
          <Bar
            data={revenueForecastData}
            options={{
              scales: {
                y: {
                  beginAtZero: true,
                  min: -4,
                  max: 4,
                  ticks: {
                    stepSize: 1,
                    color: "#4A4A4A", // $gray-dark
                  },
                },
                x: {
                  ticks: {
                    color: "#4A4A4A", // $gray-dark
                  },
                },
              },
              plugins: {
                legend: {
                  display: false,
                },
              },
            }}
            height={150}
          />
        </div>
        <div className={styles.card}>
          <h3><FaClock className={styles.cardIcon} /> Hoạt động Gần đây</h3>
          <div className={styles.activityList}>
            {mockRecentActivities.map((activity, index) => (
              <div key={index} className={styles.activityItem}>
                <span className={styles.dot}></span>
                <p className={styles.time}>{activity.time}</p>
                <p className={styles.action}>{activity.action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`${styles.grid} ${styles.oneCol}`}>
        <div className={styles.card}>
          <h3><FaCar className={styles.cardIcon} /> Xe Phổ Biến</h3>
          <div className={styles.popularCar}>
            <div className={styles.carImage}></div>
            <div className={styles.carDetails}>
              <p className={styles.carName}>{mockReports.popularCar}</p>
              <p className={styles.carInfo}>Chủ xe: jane_smith</p>
              <p className={styles.carInfo}>Lượt đặt: 73%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;