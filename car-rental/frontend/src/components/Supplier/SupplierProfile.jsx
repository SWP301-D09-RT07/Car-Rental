import React, { useEffect, useState } from "react";
import { getProfile, updateProfile } from "@/services/api";
import { toast } from "react-toastify";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaSave, FaTimes } from "react-icons/fa";

const SupplierProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProfile();
      setProfile(data);
      setFormData({
        name: data.userDetail?.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.userDetail?.address || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Không thể tải thông tin hồ sơ');
      toast.error('Không thể tải thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile(formData);
      await fetchProfile(); // Refresh data
      setIsEditing(false);
      toast.success('Cập nhật hồ sơ thành công!');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(err.message || 'Cập nhật hồ sơ thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile.userDetail?.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      address: profile.userDetail?.address || ''
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin hồ sơ...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <FaUser className="text-red-500 text-3xl mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Lỗi tải dữ liệu</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchProfile} 
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <FaUser className="text-gray-400 text-3xl mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Không có dữ liệu</h3>
        <p className="text-gray-500">Không thể tải thông tin hồ sơ</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <FaUser className="text-blue-600 text-2xl" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Hồ sơ chủ xe</h2>
            <p className="text-gray-600">Quản lý thông tin cá nhân của bạn</p>
          </div>
        </div>
        
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <FaEdit className="mr-2" />
            Chỉnh sửa
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50"
            >
              <FaSave className="mr-2" />
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center"
            >
              <FaTimes className="mr-2" />
              Hủy
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Họ tên */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center mb-2">
            <FaUser className="text-blue-600 mr-3" />
            <label className="text-sm font-semibold text-gray-700">Họ tên</label>
          </div>
          {isEditing ? (
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập họ tên"
            />
          ) : (
            <p className="text-lg text-gray-800 ml-8">
              {profile.userDetail?.name || "Chưa cập nhật"}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center mb-2">
            <FaEnvelope className="text-blue-600 mr-3" />
            <label className="text-sm font-semibold text-gray-700">Email</label>
          </div>
          {isEditing ? (
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập email"
            />
          ) : (
            <p className="text-lg text-gray-800 ml-8">
              {profile.email || "Chưa cập nhật"}
            </p>
          )}
        </div>

        {/* Số điện thoại */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center mb-2">
            <FaPhone className="text-blue-600 mr-3" />
            <label className="text-sm font-semibold text-gray-700">Số điện thoại</label>
          </div>
          {isEditing ? (
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập số điện thoại"
            />
          ) : (
            <p className="text-lg text-gray-800 ml-8">
              {profile.phone || "Chưa cập nhật"}
            </p>
          )}
        </div>

        {/* Địa chỉ */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center mb-2">
            <FaMapMarkerAlt className="text-blue-600 mr-3" />
            <label className="text-sm font-semibold text-gray-700">Địa chỉ</label>
          </div>
          {isEditing ? (
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập địa chỉ"
            />
          ) : (
            <p className="text-lg text-gray-800 ml-8">
              {profile.userDetail?.address || "Chưa cập nhật"}
            </p>
          )}
        </div>

        {/* Thông tin bổ sung */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-700 mb-2">Thông tin bổ sung</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Vai trò:</span>
              <span className="ml-2 font-medium text-blue-600">Chủ xe</span>
            </div>
            <div>
              <span className="text-gray-600">Trạng thái:</span>
              <span className="ml-2 font-medium text-green-600">Hoạt động</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierProfile; 