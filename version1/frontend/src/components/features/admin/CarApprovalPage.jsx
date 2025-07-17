import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaEye, FaCar, FaUser, FaCalendar } from 'react-icons/fa';
import { toast } from 'react-toastify';

const CarApprovalPage = () => {
  const [pendingCars, setPendingCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPendingCars();
  }, []);

  const fetchPendingCars = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/admin/pending-cars', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingCars(data.data || []);
      } else {
        toast.error('Lỗi khi tải danh sách xe chờ duyệt');
      }
    } catch (error) {
      console.error('Error fetching pending cars:', error);
      toast.error('Lỗi khi tải danh sách xe chờ duyệt');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (carId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/admin/approve-car/${carId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Đã duyệt xe thành công!');
        fetchPendingCars(); // Refresh list
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Lỗi khi duyệt xe');
      }
    } catch (error) {
      console.error('Error approving car:', error);
      toast.error('Lỗi khi duyệt xe');
    }
  };

  const handleReject = async (carId, reason = '') => {
    try {
      const token = localStorage.getItem('token');
      const url = reason 
        ? `/api/users/admin/reject-car/${carId}?reason=${encodeURIComponent(reason)}`
        : `/api/users/admin/reject-car/${carId}`;
        
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Đã từ chối xe thành công!');
        fetchPendingCars(); // Refresh list
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Lỗi khi từ chối xe');
      }
    } catch (error) {
      console.error('Error rejecting car:', error);
      toast.error('Lỗi khi từ chối xe');
    }
  };

  const viewCarDetails = (car) => {
    setSelectedCar(car);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-8">
        <div className="bg-orange-100 p-3 rounded-full mr-4">
          <FaCar className="text-orange-600 text-2xl" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Duyệt xe</h1>
          <p className="text-gray-600">Quản lý các xe chờ duyệt từ supplier</p>
        </div>
      </div>

      {pendingCars.length === 0 ? (
        <div className="text-center py-12">
          <FaCar className="text-gray-400 text-6xl mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Không có xe chờ duyệt</h3>
          <p className="text-gray-500">Tất cả xe đã được duyệt hoặc chưa có xe mới được đăng</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingCars.map((car) => (
            <div key={car.carId} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Car Image */}
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                {car.images && car.images.length > 0 ? (
                  <img 
                    src={car.images[0].imageUrl} 
                    alt={car.model}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaCar className="text-gray-400 text-4xl" />
                )}
              </div>

              {/* Car Info */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{car.model}</h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <FaUser className="mr-2" />
                    <span>Supplier: {car.supplier?.username || 'N/A'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaCalendar className="mr-2" />
                    <span>Năm: {car.year}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span>Màu: {car.color}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span>Biển số: {car.licensePlate}</span>
                  </div>
                  <div className="text-sm font-semibold text-green-600">
                    <span>Giá: {new Intl.NumberFormat('vi-VN').format(car.dailyRate)} VND/ngày</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => viewCarDetails(car)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FaEye className="mr-1" />
                    Chi tiết
                  </button>
                  <button
                    onClick={() => handleApprove(car.carId)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FaCheck className="mr-1" />
                    Duyệt
                  </button>
                  <button
                    onClick={() => handleReject(car.carId)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <FaTimes className="mr-1" />
                    Từ chối
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Car Details Modal */}
      {showModal && selectedCar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Chi tiết xe</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800">Thông tin xe</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-sm text-gray-600">Tên xe</p>
                      <p className="font-medium">{selectedCar.model}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Năm sản xuất</p>
                      <p className="font-medium">{selectedCar.year}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Màu xe</p>
                      <p className="font-medium">{selectedCar.color}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Biển số</p>
                      <p className="font-medium">{selectedCar.licensePlate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Số ghế</p>
                      <p className="font-medium">{selectedCar.numOfSeats}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Giá thuê/ngày</p>
                      <p className="font-medium text-green-600">
                        {new Intl.NumberFormat('vi-VN').format(selectedCar.dailyRate)} VND
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800">Thông tin supplier</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Tên</p>
                    <p className="font-medium">{selectedCar.supplier?.username || 'N/A'}</p>
                  </div>
                </div>

                {selectedCar.features && (
                  <div>
                    <h3 className="font-semibold text-gray-800">Mô tả</h3>
                    <p className="text-gray-700 mt-2">{selectedCar.features}</p>
                  </div>
                )}

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => {
                      handleApprove(selectedCar.carId);
                      setShowModal(false);
                    }}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FaCheck className="mr-2" />
                    Duyệt xe
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedCar.carId);
                      setShowModal(false);
                    }}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <FaTimes className="mr-2" />
                    Từ chối
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarApprovalPage; 