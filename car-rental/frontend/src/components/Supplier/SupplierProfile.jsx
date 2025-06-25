import React, { useEffect, useState } from "react";
import { getProfile } from "@/services/api";

const SupplierProfile = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const userId = localStorage.getItem("userId");
        const data = await getProfile();
        setProfile(data);
      } catch (err) {
        setProfile(null);
        alert(err.message); // hoặc dùng toast.error(err.message)
      }
    }
    fetchProfile();
  }, []);

  if (!profile) return <div>Đang tải...</div>;

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold mb-6 text-blue-700">Hồ sơ chủ xe</h2>
      <div className="space-y-4">
        <div><b>Họ tên:</b> {profile.userDetail?.name || "Chưa cập nhật"}</div>
        <div><b>Email:</b> {profile.email}</div>
        <div><b>Số điện thoại:</b> {profile.phone || "Chưa cập nhật"}</div>
        <div><b>Địa chỉ:</b> {profile.userDetail?.address || "Chưa cập nhật"}</div>
      </div>
    </div>
  );
};

export default SupplierProfile; 