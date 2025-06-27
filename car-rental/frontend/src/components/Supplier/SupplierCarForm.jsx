import React, { useState } from "react";
import { addSupplierCar } from "../../services/api";
import { toast } from "react-toastify";
import { FaCar, FaUpload, FaTimes, FaSave } from "react-icons/fa";

const SupplierCarForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    model: "",
    year: "",
    color: "",
    dailyRate: "",
    description: "",
    statusName: "Có sẵn",
    images: []
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
      // Upload ảnh trước, lấy về url
      const formData = new FormData();
      form.images.forEach(img => formData.append("images", img));
      
      const res = await fetch("/api/supplier/cars/upload", {
        method: "POST",
        body: formData
      });
      
      if (!res.ok) {
        throw new Error('Upload ảnh thất bại');
      }
      
      const imageUrls = await res.json();

      // Gửi thông tin xe
      await addSupplierCar({
        ...form,
        year: parseInt(form.year),
        dailyRate: parseFloat(form.dailyRate),
        imageUrls
      });
      
      toast.success("Đăng tin xe thành công!");
      
      // Reset form
      setForm({
        model: "",
        year: "",
        color: "",
        dailyRate: "",
        description: "",
        statusName: "Có sẵn",
        images: []
      });
      setImagePreviews([]);
      setErrors({});
      
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error adding car:', err);
      toast.error(err.message || "Đăng tin thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
      <div className="flex items-center mb-8">
        <div className="bg-blue-100 p-3 rounded-full mr-4">
          <FaCar className="text-blue-600 text-2xl" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Đăng tin cho thuê xe</h2>
          <p className="text-gray-600">Thêm xe mới vào danh sách cho thuê</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6">
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
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.model ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ví dụ: Honda City, Toyota Vios..."
            required
          />
          {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model}</p>}
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
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.color ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ví dụ: Trắng, Đen, Xanh..."
            required
          />
          {errors.color && <p className="text-red-500 text-sm mt-1">{errors.color}</p>}
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
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.dailyRate ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ví dụ: 500000"
            min="0"
            required
          />
          {errors.dailyRate && <p className="text-red-500 text-sm mt-1">{errors.dailyRate}</p>}
        </div>

        {/* Mô tả */}
        <div>
          <label className="block mb-2 font-semibold text-gray-700">
            Mô tả
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            placeholder="Mô tả chi tiết về xe, tính năng, tình trạng..."
          />
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Có sẵn">Có sẵn</option>
            <option value="Đang thuê">Đang thuê</option>
            <option value="Bảo trì">Bảo trì</option>
            <option value="Không khả dụng">Không khả dụng</option>
          </select>
        </div>

        {/* Hình ảnh xe */}
        <div>
          <label className="block mb-2 font-semibold text-gray-700">
            Hình ảnh xe <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
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
              <FaUpload className="text-gray-400 text-3xl mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Nhấp để chọn ảnh hoặc kéo thả vào đây</p>
              <p className="text-sm text-gray-500">Tối đa 5 ảnh, mỗi ảnh không quá 5MB</p>
            </label>
          </div>
          {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
          
          {/* Image previews */}
          {imagePreviews.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Ảnh đã chọn:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={src}
                      alt={`preview-${idx}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit button */}
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
                images: []
              });
              setImagePreviews([]);
              setErrors({});
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Làm mới
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center disabled:opacity-50"
            disabled={loading}
          >
            <FaSave className="mr-2" />
            {loading ? "Đang đăng..." : "Đăng tin"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupplierCarForm;