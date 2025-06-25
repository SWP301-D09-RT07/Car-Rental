import { useState, useEffect } from "react";
import { Bar, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from "chart.js";
import styles from "../../../../../styles/Reports.module.scss";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const mockReports = {
  revenue: 5680,
  bookings: 120,
  popularCar: "Toyota Camry",
  suppliersRevenue: [
    { supplier: "jane_smith", revenue: 2500 },
    { supplier: "mike_jones", revenue: 1800 },
    { supplier: "sarah_lee", revenue: 1380 },
  ].sort((a, b) => b.revenue - a.revenue),
};

const revenueData = {
  labels: ["Th5", "Th6", "Th7", "Th8", "Th9"],
  datasets: [
    {
      label: "Doanh thu (USD)",
      data: [5000, 5680, 6200, 5900, 6300],
      backgroundColor: "#4682B4",
      borderColor: "#4682B4",
      borderWidth: 1,
      fill: false,
    },
  ],
};

const bookingsData = {
  labels: ["Th5", "Th6", "Th7", "Th8", "Th9"],
  datasets: [
    {
      label: "Lượt đặt",
      data: [100, 120, 130, 115, 140],
      backgroundColor: "#4682B4",
      borderColor: "#4682B4",
      borderWidth: 1,
      fill: false,
    },
  ],
};

const popularCarData = {
  labels: ["Th5", "Th6", "Th7", "Th8", "Th9"],
  datasets: [
    {
      label: "Tỷ lệ phổ biến (%)",
      data: [60, 65, 70, 68, 72],
      backgroundColor: "#4682B4",
      borderColor: "#4682B4",
      borderWidth: 1,
      fill: false,
    },
  ],
};

const suppliersData = {
  labels: mockReports.suppliersRevenue.map((s) => s.supplier),
  datasets: [
    {
      label: "Doanh thu (USD)",
      data: mockReports.suppliersRevenue.map((s) => s.revenue),
      backgroundColor: "#4682B4",
      borderColor: "#4682B4",
      borderWidth: 1,
      barThickness: 20,
    },
  ],
};

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
      title: { display: true, text: "Doanh thu (USD)" },
    },
    y: {
      title: { display: true, text: "Chủ xe" },
    },
  },
};

function Reports() {
  return (
    <div className={styles.reportsContainer}>
      <h2 className={styles.title}>Báo cáo Tổng quan</h2>
      <div className={styles.reportGrid}>
        <div className={styles.reportCard}>
          <h3 className={styles.cardTitle}>Tổng Doanh thu</h3>
          <p className={styles.cardValue}>${mockReports.revenue}</p>
          <div className={styles.chartContainer}>
            <Line data={revenueData} options={lineChartOptions} height={100} />
          </div>
        </div>
        <div className={styles.reportCard}>
          <h3 className={styles.cardTitle}>Tổng Lượt Đặt</h3>
          <p className={styles.cardValue}>{mockReports.bookings}</p>
          <div className={styles.chartContainer}>
            <Line data={bookingsData} options={lineChartOptions} height={100} />
          </div>
        </div>
        <div className={styles.reportCard}>
          <h3 className={styles.cardTitle}>Xe Phổ Biến</h3>
          <p className={styles.cardValue}>{mockReports.popularCar}</p>
          <div className={styles.chartContainer}>
            <Line data={popularCarData} options={lineChartOptions} height={100} />
          </div>
        </div>
      </div>

      <div className={styles.suppliersSection}>
        <h3 className={styles.sectionTitle}>Doanh thu của Chủ xe</h3>
        <div className={styles.suppliersChart}>
          <Bar data={suppliersData} options={barChartOptions} height={200} />
        </div>
      </div>
    </div>
  );
}

export default Reports;