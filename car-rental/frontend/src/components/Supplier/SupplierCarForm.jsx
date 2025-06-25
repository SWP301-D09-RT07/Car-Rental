import React, { useState } from "react";
import { addSupplierCar } from "../../services/api";
import { toast } from "react-toastify";

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

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = e => {
    const files = Array.from(e.target.files);
    setForm({ ...form, images: files });
    setImagePreviews(files.map(file => URL.createObjectURL(file)));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      // Upload ảnh trước, lấy về url
      const formData = new FormData();
      form.images.forEach(img => formData.append("images", img));
      const res = await fetch("/api/supplier/cars/upload", {
        method: "POST",
        body: formData
      });
      const imageUrls = await res.json();

      // Gửi thông tin xe
      await addSupplierCar({
        ...form,
        year: parseInt(form.year),
        dailyRate: parseFloat(form.dailyRate),
        imageUrls
      });
      toast.success("Đăng tin xe thành công!");
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
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error("Đăng tin thất bại!");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 max-w-xl mx-auto mt-10" encType="multipart/form-data">
      <h2 className="text-2xl font-bold text-blue-700 mb-6">Đăng tin cho thuê xe</h2>
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Tên xe</label>
        <input
          type="text"
          name="model"
          value={form.model}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Năm sản xuất</label>
        <input
          type="number"
          name="year"
          value={form.year}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          min="1900"
          max={new Date().getFullYear()}
          required
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Màu xe</label>
        <input
          type="text"
          name="color"
          value={form.color}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Giá thuê/ngày (VND)</label>
        <input
          type="number"
          name="dailyRate"
          value={form.dailyRate}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Mô tả</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          rows={3}
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Trạng thái</label>
        <select
          name="statusName"
          value={form.statusName}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        >
          <option>Có sẵn</option>
          <option>Đang thuê</option>
          <option>Bảo trì</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Hình ảnh xe</label>
        <input
          type="file"
          name="images"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="w-full"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {imagePreviews.map((src, idx) => (
            <img
              key={idx}
              src={src}
              alt={`preview-${idx}`}
              className="w-24 h-20 object-cover rounded border"
            />
          ))}
        </div>
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? "Đang đăng..." : "Đăng tin"}
      </button>
    </form>
  );
};

export default SupplierCarForm;