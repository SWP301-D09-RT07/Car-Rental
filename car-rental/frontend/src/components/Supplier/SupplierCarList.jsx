import React, { useEffect, useState } from "react";
import { getSupplierCars } from "@/services/api";
import { toast } from "react-toastify";
import { FaCar, FaEdit, FaTrash, FaEye, FaPlus } from "react-icons/fa";

const SupplierCarList = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSupplierCars();
      setCars(data || []);
    } catch (err) {
      console.error('Error fetching supplier cars:', err);
      setError(err.message || 'Không thể tải danh sách xe');
      toast.error('Không thể tải danh sách xe');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'có sẵn':
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'đang thuê':
      case 'rented':
        return 'bg-blue-100 text-blue-800';
      case 'bảo trì':
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'không khả dụng':
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách xe...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <FaCar className="text-red-500 text-3xl mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Lỗi tải dữ liệu</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchCars} 
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <FaCar className="text-blue-600 text-2xl" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Danh sách xe của bạn</h2>
            <p className="text-gray-600">Quản lý tất cả xe cho thuê</p>
          </div>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
          <FaPlus className="mr-2" />
          Thêm xe mới
        </button>
      </div>

      {cars.length === 0 ? (
        <div className="text-center py-12">
          <FaCar className="text-gray-400 text-6xl mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Chưa có xe nào</h3>
          <p className="text-gray-500 mb-6">Bạn chưa đăng ký xe nào cho thuê</p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center mx-auto">
            <FaPlus className="mr-2" />
            Đăng ký xe đầu tiên
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-lg">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="py-4 px-6 text-left">Ảnh xe</th>
                <th className="py-4 px-6 text-left">Tên xe</th>
                <th className="py-4 px-6 text-left">Năm</th>
                <th className="py-4 px-6 text-left">Màu</th>
                <th className="py-4 px-6 text-left">Trạng thái</th>
                <th className="py-4 px-6 text-left">Giá/ngày</th>
                <th className="py-4 px-6 text-left">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car, index) => (
                <tr key={car.carId} className={`border-t ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
                  <td className="py-4 px-6">
                    {car.imageUrls && car.imageUrls.length > 0 ? (
                      <img 
                        src={car.imageUrls[0]} 
                        alt={car.model} 
                        className="w-20 h-16 object-cover rounded-lg shadow-md"
                        onError={(e) => {
                          e.target.src = '/images/default-car.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-20 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <FaCar className="text-gray-400 text-xl" />
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-semibold text-gray-800">{car.model}</div>
                      <div className="text-sm text-gray-500">{car.brand?.brandName || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                      {car.year}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                        style={{ backgroundColor: car.color?.toLowerCase() || '#ccc' }}
                      ></div>
                      <span className="text-gray-700">{car.color}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(car.statusName)}`}>
                      {car.statusName}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-semibold text-green-600">
                      {(car.dailyRate || 0).toLocaleString('vi-VN', { 
                        style: 'currency', 
                        currency: 'VND',
                        minimumFractionDigits: 0
                      })}
                    </div>
                    <div className="text-xs text-gray-500">/ngày</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex space-x-2">
                      <button 
                        className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Xem chi tiết"
                      >
                        <FaEye className="text-sm" />
                      </button>
                      <button 
                        className="bg-yellow-100 text-yellow-600 p-2 rounded-lg hover:bg-yellow-200 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <FaEdit className="text-sm" />
                      </button>
                      <button 
                        className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors"
                        title="Xóa"
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {cars.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{cars.length}</div>
            <div className="text-sm text-blue-600">Tổng số xe</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {cars.filter(car => car.statusName?.toLowerCase() === 'có sẵn').length}
            </div>
            <div className="text-sm text-green-600">Có sẵn</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {cars.filter(car => car.statusName?.toLowerCase() === 'đang thuê').length}
            </div>
            <div className="text-sm text-yellow-600">Đang thuê</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {cars.filter(car => car.statusName?.toLowerCase() === 'bảo trì').length}
            </div>
            <div className="text-sm text-red-600">Bảo trì</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierCarList; 