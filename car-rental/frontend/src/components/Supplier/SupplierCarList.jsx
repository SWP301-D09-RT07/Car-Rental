import React, { useEffect, useState } from "react";
import { getSupplierCars } from "@/services/api";

const SupplierCarList = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Debug: log token để kiểm tra interceptor
    const token = localStorage.getItem('token');
    console.log('SupplierCarList: token =', token);
    getSupplierCars().then(data => {
      setCars(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div>Đang tải danh sách xe...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto mt-10">
      <h2 className="text-2xl font-bold text-blue-700 mb-6">Danh sách xe của bạn</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-blue-50">
            <th className="py-2 px-4">Tên xe</th>
            <th className="py-2 px-4">Năm</th>
            <th className="py-2 px-4">Màu</th>
            <th className="py-2 px-4">Trạng thái</th>
            <th className="py-2 px-4">Giá/ngày</th>
            <th className="py-2 px-4">Ảnh</th>
          </tr>
        </thead>
        <tbody>
          {cars.map(car => (
            <tr key={car.carId} className="border-t">
              <td className="py-2 px-4">{car.model}</td>
              <td className="py-2 px-4">{car.year}</td>
              <td className="py-2 px-4">{car.color}</td>
              <td className="py-2 px-4">{car.statusName}</td>
              <td className="py-2 px-4">{car.dailyRate?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>
              <td className="py-2 px-4">
                {car.imageUrls && car.imageUrls.length > 0 && (
                  <img src={car.imageUrls[0]} alt="car" className="w-16 h-12 object-cover rounded" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SupplierCarList; 