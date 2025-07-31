import React, { useEffect, useState } from "react";
import { getProfile, updateProfile } from "@/services/api";
import { toast } from "react-toastify";
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaEdit, 
  FaSave, 
  FaTimes,
  FaUniversity, // ✅ THÊM ICON CHO BANKING
  FaCog
} from "react-icons/fa";
import LoadingSpinner from '@/components/ui/Loading/LoadingSpinner.jsx';
import BankAccountManager from '@/components/BankAccount/BankAccountManager'; // ✅ THÊM IMPORT

const SupplierProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  
  // ✅ THÊM STATE CHO TAB NAVIGATION
  const [activeTab, setActiveTab] = useState('profile');

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
        name: data.userDetail?.fullName || data.userDetail?.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.userDetail?.address || '',
        countryCode: data.countryCode || '',
        username: data.username || ''
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
      const dataToSend = {
        ...formData,
        countryCode: formData.countryCode || profile.countryCode || '',
        username: formData.username || profile.username || ''
      };

      function deepRemoveLanguage(obj) {
        if (Array.isArray(obj)) return obj.map(deepRemoveLanguage);
        if (obj && typeof obj === 'object') {
          const newObj = {};
          for (const key in obj) {
            if (key !== 'language' && key !== 'languageId') {
              newObj[key] = deepRemoveLanguage(obj[key]);
            }
          }
          return newObj;
        }
        return obj;
      }
      const cleanedData = deepRemoveLanguage(dataToSend);
      if ('preferredLanguage' in cleanedData) {
        delete cleanedData.preferredLanguage;
      }
      console.log('DATA SENT TO API:', cleanedData);
      await updateProfile(cleanedData);
      await fetchProfile();
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
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <LoadingSpinner size="large" color="blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-2xl p-8 text-center max-w-md mx-auto">
        <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <FaUser className="text-red-500 text-2xl" />
        </div>
        <h3 className="text-lg font-bold text-red-800 mb-2">Lỗi tải dữ liệu</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={fetchProfile} 
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-8 text-center max-w-md mx-auto">
        <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <FaUser className="text-gray-400 text-2xl" />
        </div>
        <h3 className="text-lg font-bold text-gray-600 mb-2">Không có dữ liệu</h3>
        <p className="text-gray-500">Không thể tải thông tin hồ sơ</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto"> {/* ✅ TĂNG MAX-WIDTH */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-5 translate-x-5"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white/20 p-4 rounded-2xl mr-6 backdrop-blur-sm border border-white/20">
                  <FaUser className="text-4xl" />
                </div>
                <div>
                  <h2 className="text-4xl font-heading font-bold mb-2">Hồ sơ chủ xe</h2>
                  <p className="text-blue-100 text-lg">Quản lý thông tin cá nhân và tài khoản thanh toán</p> {/* ✅ CẬP NHẬT MÔ TẢ */}
                </div>
              </div>
              
              {/* ✅ CHỈ HIỂN THỊ NÚT EDIT CHO TAB PROFILE */}
              {activeTab === 'profile' && !isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 flex items-center transition-all border border-white/20"
                >
                  <FaEdit className="mr-2" />
                  Chỉnh sửa
                </button>
              ) : activeTab === 'profile' && isEditing ? (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-500/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-green-500/30 flex items-center disabled:opacity-50 transition-all border border-white/20"
                  >
                    <FaSave className="mr-2" />
                    {saving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-red-500/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-red-500/30 flex items-center transition-all border border-white/20"
                  >
                    <FaTimes className="mr-2" />
                    Hủy
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* ✅ THÊM TAB NAVIGATION */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="flex space-x-8 px-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaUser className="mr-2" />
              Thông tin cá nhân
            </button>
            <button
              onClick={() => setActiveTab('banking')}
              className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'banking'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaUniversity className="mr-2" />
              Tài khoản ngân hàng
            </button>
          </div>
        </div>

        {/* ✅ TAB CONTENT */}
        <div className="p-8">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Họ tên */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                    <div className="flex items-center mb-4">
                      <div className="bg-blue-100 p-2 rounded-lg mr-3">
                        <FaUser className="text-blue-600" />
                      </div>
                      <label className="text-sm font-semibold text-gray-700">Họ tên</label>
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Nhập họ tên"
                      />
                    ) : (
                      <p className="text-lg font-medium text-gray-800 ml-9">
                        {profile.userDetail?.fullName || profile.userDetail?.name || "Chưa cập nhật"}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100">
                    <div className="flex items-center mb-4">
                      <div className="bg-green-100 p-2 rounded-lg mr-3">
                        <FaEnvelope className="text-green-600" />
                      </div>
                      <label className="text-sm font-semibold text-gray-700">Email</label>
                    </div>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="Nhập email"
                      />
                    ) : (
                      <p className="text-lg font-medium text-gray-800 ml-9">
                        {profile.email || "Chưa cập nhật"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Số điện thoại */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100">
                    <div className="flex items-center mb-4">
                      <div className="bg-purple-100 p-2 rounded-lg mr-3">
                        <FaPhone className="text-purple-600" />
                      </div>
                      <label className="text-sm font-semibold text-gray-700">Số điện thoại</label>
                    </div>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Nhập số điện thoại"
                      />
                    ) : (
                      <p className="text-lg font-medium text-gray-800 ml-9">
                        {profile.phone || "Chưa cập nhật"}
                      </p>
                    )}
                  </div>

                  {/* Thông tin bổ sung */}
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-2xl border border-gray-100">
                    <h4 className="font-semibold text-gray-700 mb-4 flex items-center">
                      <div className="bg-gray-100 p-2 rounded-lg mr-3">
                        <FaCog className="text-gray-600" />
                      </div>
                      Thông tin bổ sung
                    </h4>
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Vai trò:</span>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">Chủ xe</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Trạng thái:</span>
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Hoạt động
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Địa chỉ - Full Width */}
              <div className="mt-8">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl border border-orange-100">
                  <div className="flex items-center mb-4">
                    <div className="bg-orange-100 p-2 rounded-lg mr-3">
                      <FaMapMarkerAlt className="text-orange-600" />
                    </div>
                    <label className="text-sm font-semibold text-gray-700">Địa chỉ</label>
                  </div>
                  {isEditing ? (
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="Nhập địa chỉ"
                    />
                  ) : (
                    <p className="text-lg font-medium text-gray-800 ml-9">
                      {profile.userDetail?.address || "Chưa cập nhật"}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ✅ BANKING TAB */}
          {activeTab === 'banking' && (
            <div className="supplier-banking-section">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Tài khoản nhận thanh toán</h3>
                <p className="text-gray-600">
                  Quản lý tài khoản ngân hàng để nhận tiền từ khách hàng thuê xe của bạn. 
                  Tài khoản chính sẽ được sử dụng mặc định cho các giao dịch.
                </p>
              </div>
              
              {/* ✅ TÍCH HỢP BANKACCOUNTMANAGER */}
              <BankAccountManager 
                embedded={true}
                showHeader={false}
                title="Tài khoản nhận thanh toán"
                subtitle="Quản lý tài khoản để nhận tiền từ khách hàng"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierProfile;