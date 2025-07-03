import { Link } from "react-router-dom";
import { FaCheckCircle, FaClock, FaPhone, FaEnvelope, FaHome, FaUser, FaGift, FaHeadset } from "react-icons/fa";
import Header from "@/components/layout/Header/Header";
import Footer from "@/components/layout/Footer/Footer";
import { useState } from "react";

const OwnerRegistrationSuccessPage = () => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    window.location.href = "/login";
  };

  return (
    <div className="bg-gradient-to-br from-green-50 via-white to-blue-50 min-h-screen">
      <Header
        isAuthenticated={!!localStorage.getItem("token")}
        userEmail={localStorage.getItem("userEmail")}
        isUserDropdownOpen={isUserDropdownOpen}
        setIsUserDropdownOpen={setIsUserDropdownOpen}
        handleLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative mb-12">
            <div className="w-32 h-32 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-bounce">
              <FaCheckCircle className="text-6xl text-white" />
            </div>
            <div className="absolute inset-0 w-32 h-32 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full mx-auto animate-ping opacity-20"></div>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6">Đăng ký thành công!</h1>
          <p className="text-2xl text-gray-600 mb-12 leading-relaxed">Cảm ơn bạn đã đăng ký trở thành đối tác của chúng tôi. Chúng tôi sẽ xem xét hồ sơ và liên hệ với bạn sớm nhất.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
                <FaClock className="text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Thời gian xử lý</h3>
              <p className="text-gray-600">24-48 giờ làm việc</p>
            </div>
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
                <FaHeadset className="text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Hỗ trợ 24/7</h3>
              <p className="text-gray-600">Luôn sẵn sàng hỗ trợ bạn</p>
            </div>
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
                <FaGift className="text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Ưu đãi đặc biệt</h3>
              <p className="text-gray-600">Miễn phí tháng đầu</p>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50 mb-12">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">Các bước tiếp theo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">1</div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg mb-2">Xem xét hồ sơ</h4>
                    <p className="text-gray-600">Chúng tôi sẽ kiểm tra và xác thực thông tin bạn đã cung cấp</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">2</div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg mb-2">Liên hệ xác nhận</h4>
                    <p className="text-gray-600">Nhân viên sẽ gọi điện xác nhận và hướng dẫn các bước tiếp theo</p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">3</div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg mb-2">Kích hoạt tài khoản</h4>
                    <p className="text-gray-600">Tài khoản đối tác sẽ được kích hoạt sau khi hoàn tất xác thực</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">4</div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg mb-2">Bắt đầu kiếm tiền</h4>
                    <p className="text-gray-600">Đăng xe và bắt đầu nhận đơn đặt thuê từ khách hàng</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 border border-blue-200 mb-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Liên hệ hỗ trợ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-center gap-4 bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white"><FaPhone /></div>
                <div className="text-left">
                  <div className="font-bold text-gray-800">Hotline</div>
                  <div className="text-blue-600 font-semibold">1900 1234</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white"><FaEnvelope /></div>
                <div className="text-left">
                  <div className="font-bold text-gray-800">Email</div>
                  <div className="text-green-600 font-semibold">support@carental.com</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-8 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center"><FaHome className="mr-3 text-xl" />Về trang chủ</Link>
            <Link to="/profile" className="border-2 border-blue-600 text-blue-600 py-4 px-8 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl"><FaUser className="mr-3 text-xl" />Xem hồ sơ</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OwnerRegistrationSuccessPage; 