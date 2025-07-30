import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ChatWindow from "@/components/Chat/ChatWindow";
import { useLocation } from "react-router-dom";
import { FaUserCircle, FaSearch, FaComments, FaLock } from "react-icons/fa";
import Header from "@/components/layout/Header/Header";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

const Message = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const initialSelectedUser = location.state?.selectedUser || null;

  const [user, setUser] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(initialSelectedUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Thêm state cho dropdown và mobile menu
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lấy user profile khi vào trang
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await (await import('@/services/api')).getProfile();
        console.log('[Message.jsx] Profile fetched:', profile);
        // Map role from profile response to user object for frontend logic
        setUser({
          ...profile,
          role: profile.roleName || (profile.roleId === 3 ? "customer" : undefined)
        });
      } catch (err) {
        setUser(null);
      }
    };
    fetchProfile();
  }, []);

useEffect(() => {
    // Accept either role === "customer" or roleName === "customer" or roleId === 3
    const isCustomer = user && (user.role === "customer" || user.roleName === "customer" || user.roleId === 3);
    if (!user || !isCustomer || !(user?.userId || user?.id || user?.customerId)) {
      console.log('[Message.jsx] User missing id or role:', user);
      setError("auth");
      setLoading(false);
      return;
    }
    const token = sessionStorage.getItem("token");
    if (!token) {
      setError("auth");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    // Lấy customerId từ user
    const customerId = user?.userId || user?.id || user?.customerId;
    // Sử dụng hàm API mới để lấy danh sách supplier đã từng nhắn với customer
    import('@/services/api').then(apiModule => {
      apiModule.getSuppliersOfCustomer(customerId)
        .then(data => {
          setSuppliers(Array.isArray(data) ? data : []);
          // Không tự động chọn supplier đầu tiên nữa
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setSuppliers([]);
          setLoading(false);
        });
    });
  }, [user, selectedSupplier]);

  useEffect(() => {
    if (initialSelectedUser) setSelectedSupplier(initialSelectedUser);
  }, [initialSelectedUser]);

const isCustomer = user && (user.role === "customer" || user.roleName === "customer" || user.roleId === 3);
if (!user || !isCustomer) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-blue-600 mb-2">Bạn cần đăng nhập bằng tài khoản khách hàng</h2>
          <p className="text-gray-500 mb-4">Vui lòng đăng nhập để xem tin nhắn với các nhà cung cấp.</p>
          <a href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition">Đăng nhập</a>
        </div>
      </div>
    );
  }

  // Filter suppliers theo searchTerm
  const filteredSuppliers = Array.isArray(suppliers)
    ? suppliers.filter(sup => {
        const name = sup.fullName || sup.username || sup.email || "";
        return name.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : [];

  return (
    <>
      <Header
        isUserDropdownOpen={isUserDropdownOpen}
        setIsUserDropdownOpen={setIsUserDropdownOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold text-blue-700 mb-8">Tin nhắn với nhà cung cấp</h1>
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 flex overflow-hidden min-h-[600px]">
          <div className="flex-1 min-w-0 bg-white flex flex-col">
            {selectedSupplier ? (
              <ChatWindow 
                currentUser={{
                  id: user?.userId || user?.id || user?.customerId,
                  username: user?.userDetail?.fullName || user?.fullName || user?.username || user?.email,
                  role: user?.role?.roleName || user?.roleName || 'customer',
                }} 
                initialSelectedUser={selectedSupplier}
                onSelectUser={setSelectedSupplier}
              />
            ) : (
              <div className="flex flex-col h-full items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3 mx-auto">
                    <FaUserCircle className="w-10 h-10 text-gray-500" />
                  </div>
                  <h3 className="font-semibold text-gray-700 text-lg">Chọn cuộc trò chuyện</h3>
                  <p className="text-gray-500 text-sm">Chọn một nhà cung cấp để bắt đầu chat</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Message;
