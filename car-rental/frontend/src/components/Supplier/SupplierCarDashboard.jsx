import React, { useState } from "react";
import {
  FaCar, FaClipboardList, FaChartBar, FaComments, FaPlus, FaSync
} from "react-icons/fa";
import SupplierCarList from "./SupplierCarList";
import SupplierCarForm from "./SupplierCarForm";
import SupplierOrderManagement from "./SupplierOrderManagement";
import SupplierReport from "./SupplierReport";
import ChatBox from '../Common/ChatBox';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const menuItems = [
  { key: "add-car", label: "Đăng tin cho thuê xe", icon: <FaPlus /> },
  { key: "car-status", label: "Cập nhật trạng thái xe", icon: <FaSync /> },
  { key: "orders", label: "Quản lý đơn đặt xe", icon: <FaClipboardList /> },
  { key: "report", label: "Xem báo cáo", icon: <FaChartBar /> },
  { key: "chat", label: "Chat/hỗ trợ khách hàng", icon: <FaComments /> },
];

const contentDemo = {
  "add-car": {
    title: "Đăng tin cho thuê xe",
    desc: "Tạo mới thông tin xe cho thuê, thêm hình ảnh, mô tả, giá cả..."
  },
  "car-status": {
    title: "Cập nhật trạng thái xe",
    desc: "Cập nhật trạng thái xe: có sẵn, đang thuê, bảo trì..."
  },
  "orders": {
    title: "Quản lý đơn đặt xe",
    desc: "Xem, xác nhận, từ chối hoặc cập nhật trạng thái các đơn đặt xe."
  },
  "report": {
    title: "Xem báo cáo",
    desc: "Xem báo cáo lượt đặt xe, doanh thu, phản hồi khách hàng..."
  },
  "chat": {
    title: "Chat/hỗ trợ khách hàng",
    desc: "Trò chuyện, hỗ trợ khách hàng nhanh chóng, tiện lợi."
  }
};

const SupplierCarDashboard = () => {
  const [selected, setSelected] = useState("add-car");
  const { user } = useContext(AuthContext);
  // Giả lập receiverId là một user cố định, sau này có thể chọn user cụ thể
  const demoUserId = "user1";
  const supplierId = user?.username || "supplier1";
  const supplierRole = user?.role || "SUPPLIER";

  const renderContent = () => {
    switch (selected) {
      case "add-car":
        return <SupplierCarForm />;
      case "car-status":
        return <SupplierCarList />;
      case "orders":
        return <SupplierOrderManagement />;
      case "report":
        return <SupplierReport />;
      case "chat":
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Chat/hỗ trợ khách hàng</h2>
            <ChatBox
              username={supplierId}
              role={supplierRole}
              senderId={supplierId}
              senderRole={supplierRole}
              receiverId={demoUserId}
              receiverRole="user"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r shadow-lg">
        <div className="p-6 font-bold text-xl text-blue-600">Quản lý xe</div>
        <nav className="flex flex-col">
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={`flex items-center px-6 py-4 text-left text-gray-700 hover:bg-blue-50 transition ${
                selected === item.key ? "bg-blue-100 text-blue-700 font-semibold" : ""
              }`}
              onClick={() => setSelected(item.key)}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{renderContent()}</main>
    </div>
  );
};

export default SupplierCarDashboard;