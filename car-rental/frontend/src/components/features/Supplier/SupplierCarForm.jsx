import React, { useState, useEffect } from "react";
import { addSupplierCar } from "@/services/api";
import { toast } from "react-toastify";
import { FaCar, FaUpload, FaTimes, FaSave } from "react-icons/fa";
import LoadingSpinner from "@/components/ui/Loading/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage/ErrorMessage";

const SupplierCarForm = ({ onSuccess, initialData = {}, onSubmit, isEdit }) => {
  const [form, setForm] = useState({
    model: "",
    year: "",
    color: "",
    dailyRate: "",
    description: "",
    statusName: "Có sẵn",
    images: [],
    licensePlate: "",
    brand: "",
    region: "",
    fuelType: "",
    transmission: "",
    numOfSeats: ""

  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit && initialData) {
      setForm({
        model: initialData.model || "",
        year: initialData.year || "",
        color: initialData.color || "",
        dailyRate: initialData.dailyRate || initialData.rentalPrice || "",
        description: initialData.description || initialData.describe || "",
        statusName: initialData.statusName || "Có sẵn",
        images: [],
        licensePlate: initialData.licensePlate || "",
        brand: initialData.brandName || initialData.brand?.brandName || initialData.brand || "",
        region: initialData.regionName || initialData.region?.regionName || initialData.region || "",
        fuelType: initialData.fuelTypeName || initialData.fuelType?.fuelTypeName || initialData.fuelType || "",
        transmission: initialData.transmission || "",
        numOfSeats: initialData.numOfSeats || ""
      });
      // Hiển thị preview ảnh cũ nếu có
      if (initialData.images && initialData.images.length > 0) {
        setImagePreviews(initialData.images.map(img => img.imageUrl || img.url || img));
      } else {
        setImagePreviews([]);
      }
    }
  }, [isEdit, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast.error('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)');
      return;
    }
    
    // Validate file size (max 5MB each)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      toast.error('Mỗi ảnh không được vượt quá 5MB');
      return;
    }
    
    // Limit to 5 images
    if (files.length > 5) {
      toast.error('Tối đa 5 ảnh cho mỗi xe');
      return;
    }
    
    setForm({ ...form, images: files });
    setImagePreviews(files.map(file => URL.createObjectURL(file)));
  };

  const removeImage = (index) => {
    const newImages = form.images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setForm({ ...form, images: newImages });
    setImagePreviews(newPreviews);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.model.trim()) {
      newErrors.model = 'Tên xe là bắt buộc';
    }
    
    if (!form.year) {
      newErrors.year = 'Năm sản xuất là bắt buộc';
    } else if (form.year < 1900 || form.year > new Date().getFullYear()) {
      newErrors.year = 'Năm sản xuất không hợp lệ';
    }
    
    if (!form.color.trim()) {
      newErrors.color = 'Màu xe là bắt buộc';
    }
    
    if (!form.dailyRate) {
      newErrors.dailyRate = 'Giá thuê là bắt buộc';
    } else if (form.dailyRate <= 0) {
      newErrors.dailyRate = 'Giá thuê phải lớn hơn 0';
    }
    
    if (form.images.length === 0) {
      newErrors.images = 'Vui lòng chọn ít nhất 1 ảnh';
    }

    if (!form.licensePlate.trim()) {
      newErrors.licensePlate = 'Biển số xe là bắt buộc';
    }
    
    if (!form.brand.trim()) {
      newErrors.brand = 'Hãng xe là bắt buộc';
    }
    
    if (!form.region.trim()) {
      newErrors.region = 'Khu vực là bắt buộc';
    }
    
    if (!form.fuelType.trim()) {
      newErrors.fuelType = 'Loại nhiên liệu là bắt buộc';
    }
    
    if (!form.transmission.trim()) {
      newErrors.transmission = 'Hộp số là bắt buộc';
    }
    
    if (!form.numOfSeats) {
      newErrors.numOfSeats = 'Số chỗ ngồi là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    setLoading(true);
    try {
      // Gọi API mới
      const carData = {
        name: form.model,
        year: parseInt(form.year),
        color: form.color,
        rentalPrice: parseFloat(form.dailyRate),
        description: form.description,
        licensePlate: form.licensePlate,
        brand: form.brand,
        region: form.region,
        fuelType: form.fuelType,
        transmission: form.transmission,
        numOfSeats: parseInt(form.numOfSeats)
      };
      await addSupplierCar(carData, form.images);
        toast.success('Xe đã được gửi lên hệ thống thành công. Vui lòng chờ admin duyệt.');
      setForm({
        model: '',
        year: '',
        color: '',
        dailyRate: '',
        description: '',
        statusName: 'Có sẵn',
        images: [],
        licensePlate: '',
        brand: '',
        region: '',
        fuelType: '',
        transmission: '',
        numOfSeats: ''
      });
      setImagePreviews([]);
      setErrors({});
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error adding car:', err);
      toast.error(err.message || 'Đăng tin thất bại!');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-5 translate-x-5"></div>
          <div className="relative z-10">
            <div className="flex items-center">
              <div className="bg-white/20 p-4 rounded-2xl mr-6 backdrop-blur-sm border border-white/20">
                <FaCar className="text-4xl" />
        </div>
        <div>
                <h2 className="text-4xl font-heading font-bold mb-2">
                  {isEdit ? 'Chỉnh sửa thông tin xe' : 'Đăng tin cho thuê xe'}
                </h2>
                <p className="text-blue-100 text-lg">
                  {isEdit ? 'Cập nhật thông tin xe của bạn' : 'Thêm xe mới vào danh sách cho thuê'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8">
          <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-8">
            {/* Basic Information Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
              <h3 className="text-xl font-heading font-bold text-gray-800 mb-6 flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <FaCar className="text-blue-600" />
      </div>
                Thông tin cơ bản
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tên xe */}
        <div>
          <label className="block mb-2 font-semibold text-gray-700">
            Tên xe <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="model"
            value={form.model}
            onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.model ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ví dụ: Honda City, Toyota Vios..."
            required
          />
          {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model}</p>}
        </div>

                {/* Hãng xe */}
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">
                    Hãng xe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.brand ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Ví dụ: Toyota, Honda, Kia..."
                    required
                  />
                  {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand}</p>}
        </div>

        {/* Năm sản xuất */}
        <div>
          <label className="block mb-2 font-semibold text-gray-700">
            Năm sản xuất <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="year"
            value={form.year}
            onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.year ? 'border-red-500' : 'border-gray-300'
            }`}
            min="1900"
            max={new Date().getFullYear()}
            placeholder="Ví dụ: 2020"
            required
          />
          {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year}</p>}
        </div>

        {/* Màu xe */}
        <div>
          <label className="block mb-2 font-semibold text-gray-700">
            Màu xe <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="color"
            value={form.color}
            onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.color ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ví dụ: Trắng, Đen, Xanh..."
            required
          />
          {errors.color && <p className="text-red-500 text-sm mt-1">{errors.color}</p>}
        </div>

        {/* Biển số xe */}
        <div>
          <label className="block mb-2 font-semibold text-gray-700">
            Biển số xe <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="licensePlate"
            value={form.licensePlate}
            onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.licensePlate ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Ví dụ: 30A-123.45"
            required
          />
          {errors.licensePlate && <p className="text-red-500 text-sm mt-1">{errors.licensePlate}</p>}
        </div>

                {/* Số chỗ ngồi */}
        <div>
          <label className="block mb-2 font-semibold text-gray-700">
                    Số chỗ ngồi <span className="text-red-500">*</span>
          </label>
          <input
                    type="number"
                    name="numOfSeats"
                    value={form.numOfSeats}
            onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.numOfSeats ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Ví dụ: 4, 5, 7..."
                    min="1"
            required
          />
                  {errors.numOfSeats && <p className="text-red-500 text-sm mt-1">{errors.numOfSeats}</p>}
                </div>
              </div>
        </div>

            {/* Technical Information Section */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100">
              <h3 className="text-xl font-heading font-bold text-gray-800 mb-6 flex items-center">
                <div className="bg-green-100 p-2 rounded-lg mr-3">
                  <FaCar className="text-green-600" />
        </div>
                Thông tin kỹ thuật
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Loại nhiên liệu */}
        <div>
          <label className="block mb-2 font-semibold text-gray-700">
            Loại nhiên liệu <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="fuelType"
            value={form.fuelType}
            onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${errors.fuelType ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Ví dụ: Xăng, Dầu, Điện..."
            required
          />
          {errors.fuelType && <p className="text-red-500 text-sm mt-1">{errors.fuelType}</p>}
        </div>

        {/* Hộp số */}
        <div>
          <label className="block mb-2 font-semibold text-gray-700">
            Hộp số <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="transmission"
            value={form.transmission}
            onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${errors.transmission ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Ví dụ: Số tự động, Số sàn..."
            required
          />
          {errors.transmission && <p className="text-red-500 text-sm mt-1">{errors.transmission}</p>}
        </div>

                {/* Trạng thái */}
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">
                    Trạng thái
                  </label>
                  <select
                    name="statusName"
                    value={form.statusName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  >
                    <option value="Có sẵn">Có sẵn</option>
                    <option value="Đang thuê">Đang thuê</option>
                    <option value="Bảo trì">Bảo trì</option>
                    <option value="Không khả dụng">Không khả dụng</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location & Price Section */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100">
              <h3 className="text-xl font-heading font-bold text-gray-800 mb-6 flex items-center">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <FaCar className="text-purple-600" />
                </div>
                Vị trí & Giá cả
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Khu vực */}
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">
                    Khu vực <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="region"
                    value={form.region}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${errors.region ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Ví dụ: Hà Nội, TP.HCM..."
                    required
                  />
                  {errors.region && <p className="text-red-500 text-sm mt-1">{errors.region}</p>}
                </div>

                {/* Giá thuê/ngày */}
        <div>
          <label className="block mb-2 font-semibold text-gray-700">
                    Giá thuê/ngày (VND) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
                    name="dailyRate"
                    value={form.dailyRate}
            onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      errors.dailyRate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ví dụ: 500000"
                    min="0"
            required
          />
                  {errors.dailyRate && <p className="text-red-500 text-sm mt-1">{errors.dailyRate}</p>}
                </div>
        </div>

              {/* Mô tả */}
              <div className="mt-6">
          <label className="block mb-2 font-semibold text-gray-700">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  rows={4}
                  placeholder="Mô tả chi tiết về xe, tính năng, tình trạng..."
                />
              </div>
            </div>

            {/* Images Section */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl border border-orange-100">
              <h3 className="text-xl font-heading font-bold text-gray-800 mb-6 flex items-center">
                <div className="bg-orange-100 p-2 rounded-lg mr-3">
                  <FaUpload className="text-orange-600" />
                </div>
            Hình ảnh xe <span className="text-red-500">*</span>
              </h3>
              
              <div className="border-2 border-dashed border-orange-300 rounded-xl p-8 text-center hover:border-orange-400 transition-colors bg-white/50">
            <input
              type="file"
              name="images"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
                  <FaUpload className="text-orange-400 text-4xl mx-auto mb-4" />
                  <p className="text-gray-700 mb-2 font-medium">Nhấp để chọn ảnh hoặc kéo thả vào đây</p>
              <p className="text-sm text-gray-500">Tối đa 5 ảnh, mỗi ảnh không quá 5MB</p>
            </label>
          </div>
          {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
          
          {/* Image previews */}
          {imagePreviews.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-700 mb-4">Ảnh đã chọn:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {imagePreviews.map((src, idx) => (
                      <div key={idx} className="relative group">
                    <img
                          src={typeof src === 'string' ? src : URL.createObjectURL(src)}
                      alt={`preview-${idx}`}
                          className="w-full h-32 object-cover rounded-xl border shadow-md transition-transform group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                    >
                          <FaTimes className="text-sm" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

            {/* Submit buttons */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={() => {
              setForm({
                model: "",
                year: "",
                color: "",
                dailyRate: "",
                description: "",
                statusName: "Có sẵn",
                images: [],
                    licensePlate: "",
                    brand: "",
                    region: "",
                    fuelType: "",
                    transmission: "",
                    numOfSeats: ""
              });
              setImagePreviews([]);
              setErrors({});
            }}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Làm mới
          </button>
          <button
            type="submit"
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 flex items-center disabled:opacity-50 shadow-lg transition-all duration-200"
            disabled={loading}
          >
            <FaSave className="mr-2" />
                {loading ? <LoadingSpinner size="small" color="white" /> : (isEdit ? "Cập nhật" : "Đăng tin")}
          </button>
        </div>
      </form>
        </div>
      </div>
    </div>
  );
};

export default SupplierCarForm;