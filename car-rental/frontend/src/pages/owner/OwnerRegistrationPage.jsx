import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { FaUser, FaIdCard, FaMapMarkerAlt, FaPhone, FaUpload, FaFileAlt, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaArrowLeft, FaShieldAlt, FaAward, FaCar, FaUserTie, FaCloudUploadAlt, FaEye, FaTrash, FaInfoCircle, FaRocket, FaGem, FaCrown } from "react-icons/fa";
import Header from "@/components/layout/Header/Header";
import Footer from "@/components/layout/Footer/Footer";
import { createOwnerRegistrationRequest } from "@/services/api";

// File Upload Component
const FileUpload = ({ label, description, acceptedTypes, maxSize, onFileSelect, file, onRemove, required = false, icon }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };
  const handleFileSelect = async (selectedFile) => {
    if (selectedFile.size > maxSize) {
      toast.error(`File quá lớn. Tối đa: ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
      return;
    }
    setIsUploading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onFileSelect(selectedFile);
      toast.success("Tải file thành công!");
    } catch {
      toast.error("Lỗi khi tải file. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };
  const handleInputChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) handleFileSelect(selectedFile);
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white">{icon}</div>
        <div>
          <label className="block text-lg font-bold text-gray-800">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      {!file ? (
        <div className={`relative border-3 border-dashed rounded-3xl p-8 text-center transition-all duration-300 cursor-pointer hover:shadow-xl ${isDragOver ? "border-blue-500 bg-blue-50 shadow-xl scale-105" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"}`}
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => document.getElementById(`file-${label}`).click()}>
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-blue-600 font-semibold">Đang tải file...</p>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <FaCloudUploadAlt className="text-4xl text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Kéo thả file hoặc click để chọn</h3>
              <p className="text-gray-600 mb-4">Định dạng: {acceptedTypes} • Tối đa: {(maxSize / 1024 / 1024).toFixed(1)}MB</p>
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-semibold inline-flex items-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <FaUpload className="mr-2" />Chọn file
              </div>
            </>
          )}
          <input id={`file-${label}`} type="file" accept={acceptedTypes} onChange={handleInputChange} className="hidden" />
        </div>
      ) : (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <FaFileAlt className="text-xl" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg">{file.name}</h4>
                <p className="text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB • Đã tải thành công</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" className="w-12 h-12 bg-blue-100 hover:bg-blue-200 rounded-xl flex items-center justify-center text-blue-600 transition-all duration-300 hover:scale-110" title="Xem file"><FaEye /></button>
              <button type="button" onClick={() => onRemove()} className="w-12 h-12 bg-red-100 hover:bg-red-200 rounded-xl flex items-center justify-center text-red-600 transition-all duration-300 hover:scale-110" title="Xóa file"><FaTrash /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const OwnerRegistrationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ 
    fullName: "", 
    idNumber: "", 
    address: "", 
    phoneNumber: "", 
    email: "" 
  });
  const [files, setFiles] = useState({ carDocuments: null, businessLicense: null, driverLicense: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Nhận thông tin từ trang đăng ký
  useEffect(() => {
    if (location.state) {
      const { email, username, phone } = location.state;
      setFormData(prev => ({
        ...prev,
        email: email || "",
        fullName: username || "",
        phoneNumber: phone ? formatPhoneNumber(phone) : ""
      }));
    }
  }, [location.state]);

  // Format số điện thoại theo chuẩn
  const formatPhoneNumber = (phone) => {
    // Loại bỏ tất cả ký tự không phải số
    const cleaned = phone.replace(/\D/g, '');
    
    // Nếu bắt đầu bằng 84, loại bỏ và thêm lại
    if (cleaned.startsWith('84')) {
      return `+${cleaned}`;
    }
    
    // Nếu bắt đầu bằng 0, thay thế bằng +84
    if (cleaned.startsWith('0')) {
      return `+84${cleaned.substring(1)}`;
    }
    
    // Nếu không có mã quốc gia, thêm +84
    if (cleaned.length === 9 || cleaned.length === 10) {
      return `+84${cleaned}`;
    }
    
    return phone; // Giữ nguyên nếu không thể format
  };

  // Validate
  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ tên";
    if (!formData.idNumber.trim()) newErrors.idNumber = "Vui lòng nhập số CMND/CCCD";
    else if (!/^\d{9,12}$/.test(formData.idNumber.replace(/\s/g, ""))) newErrors.idNumber = "Số CMND/CCCD không hợp lệ";
    if (!formData.address.trim()) newErrors.address = "Vui lòng nhập địa chỉ";
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Vui lòng nhập số điện thoại";
    else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phoneNumber.replace(/\s/g, ""))) newErrors.phoneNumber = "Số điện thoại không hợp lệ (ví dụ: +84123456789)";
    if (!formData.email.trim()) newErrors.email = "Vui lòng nhập email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Email không hợp lệ";
    if (!files.carDocuments) newErrors.carDocuments = "Vui lòng tải lên giấy tờ xe";
    if (!files.businessLicense) newErrors.businessLicense = "Vui lòng tải lên giấy phép kinh doanh";
    if (!files.driverLicense) newErrors.driverLicense = "Vui lòng tải lên bằng lái xe";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Format số điện thoại khi nhập
    if (name === 'phoneNumber') {
      const formattedValue = formatPhoneNumber(value);
      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };
  const handleFileSelect = (fileType, file) => {
    setFiles((prev) => ({ ...prev, [fileType]: file }));
    if (errors[fileType]) setErrors((prev) => ({ ...prev, [fileType]: "" }));
  };
  const handleFileRemove = (fileType) => {
    setFiles((prev) => ({ ...prev, [fileType]: null }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin và hoàn thiện các trường bắt buộc");
      return;
    }
    setIsSubmitting(true);
    try {
      await createOwnerRegistrationRequest({
        ...formData,
        carDocuments: files.carDocuments,
        businessLicense: files.businessLicense,
        driverLicense: files.driverLicense,
      });
      toast.success("Đăng ký thành công! Chúng tôi sẽ xem xét và phản hồi trong vòng 24h.");
      navigate("/owner-registration-success");
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    window.location.href = "/login";
  };
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      <Header isAuthenticated={!!localStorage.getItem("token")}
        userEmail={localStorage.getItem("userEmail")}
        isUserDropdownOpen={false}
        setIsUserDropdownOpen={() => {}}
        handleLogout={handleLogout}
        isMobileMenuOpen={false}
        setIsMobileMenuOpen={() => {}}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center text-sm text-gray-500 mb-8 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg">
          <Link to="/" className="hover:text-blue-600 transition-colors font-medium">Trang chủ</Link>
          <span className="mx-3 text-gray-400">•</span>
          <span className="text-gray-700 font-bold">Đăng ký chủ xe</span>
        </div>
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-3 rounded-full text-sm font-bold mb-6 shadow-lg animate-pulse">
            <FaCrown className="text-lg" />
            <span>Trở thành đối tác của chúng tôi</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 leading-tight">Đăng ký chủ xe</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">Tham gia cộng đồng cho thuê xe và bắt đầu kiếm thu nhập từ chiếc xe của bạn. Quy trình đăng ký đơn giản, nhanh chóng và hoàn toàn miễn phí.</p>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white text-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <FaUserTie className="text-3xl" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Thông tin đăng ký</h2>
              <p className="text-blue-100 text-lg">Vui lòng điền đầy đủ thông tin để hoàn tất đăng ký</p>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <FaUser className="text-xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Thông tin cá nhân</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-bold text-gray-800 mb-3">Họ và tên <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Nhập họ và tên đầy đủ" className={`w-full px-6 py-4 border-2 rounded-2xl text-lg transition-all duration-300 focus:ring-4 focus:ring-blue-100 ${errors.fullName ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-blue-500"}`} />
                      <FaUser className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {errors.fullName && (<p className="text-red-500 text-sm mt-2 flex items-center gap-2"><FaExclamationTriangle />{errors.fullName}</p>)}
                  </div>
                  <div>
                    <label className="block text-lg font-bold text-gray-800 mb-3">Số CMND/CCCD <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input type="text" name="idNumber" value={formData.idNumber} onChange={handleInputChange} placeholder="Nhập số CMND/CCCD" className={`w-full px-6 py-4 border-2 rounded-2xl text-lg transition-all duration-300 focus:ring-4 focus:ring-blue-100 ${errors.idNumber ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-blue-500"}`} />
                      <FaIdCard className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {errors.idNumber && (<p className="text-red-500 text-sm mt-2 flex items-center gap-2"><FaExclamationTriangle />{errors.idNumber}</p>)}
                  </div>
                  <div>
                    <label className="block text-lg font-bold text-gray-800 mb-3">Số điện thoại <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder="Ví dụ: +84123456789" className={`w-full px-6 py-4 border-2 rounded-2xl text-lg transition-all duration-300 focus:ring-4 focus:ring-blue-100 ${errors.phoneNumber ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-blue-500"}`} />
                      <FaPhone className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {errors.phoneNumber && (<p className="text-red-500 text-sm mt-2 flex items-center gap-2"><FaExclamationTriangle />{errors.phoneNumber}</p>)}
                  </div>
                  <div>
                    <label className="block text-lg font-bold text-gray-800 mb-3">Email <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Nhập địa chỉ email" className={`w-full px-6 py-4 border-2 rounded-2xl text-lg transition-all duration-300 focus:ring-4 focus:ring-blue-100 ${errors.email ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-blue-500"}`} />
                      <FaUser className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {errors.email && (<p className="text-red-500 text-sm mt-2 flex items-center gap-2"><FaExclamationTriangle />{errors.email}</p>)}
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-lg font-bold text-gray-800 mb-3">Địa chỉ <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <textarea name="address" value={formData.address} onChange={handleInputChange} placeholder="Nhập địa chỉ chi tiết" rows="3" className={`w-full px-6 py-4 border-2 rounded-2xl text-lg transition-all duration-300 focus:ring-4 focus:ring-blue-100 resize-none ${errors.address ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-blue-500"}`} />
                    <FaMapMarkerAlt className="absolute right-6 top-6 text-gray-400" />
                  </div>
                  {errors.address && (<p className="text-red-500 text-sm mt-2 flex items-center gap-2"><FaExclamationTriangle />{errors.address}</p>)}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <FaFileAlt className="text-xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Tải lên giấy tờ</h3>
                </div>
                <div className="space-y-8">
                  <div>
                    <FileUpload label="Giấy tờ xe" description="Đăng ký xe, bảo hiểm xe (PDF, JPG, PNG)" acceptedTypes=".pdf,.jpg,.jpeg,.png" maxSize={5 * 1024 * 1024} onFileSelect={(file) => handleFileSelect("carDocuments", file)} file={files.carDocuments} onRemove={() => handleFileRemove("carDocuments")} required={true} icon={<FaCar />} />
                    {errors.carDocuments && (<p className="text-red-500 text-sm mt-2 flex items-center gap-2"><FaExclamationTriangle />{errors.carDocuments}</p>)}
                  </div>
                  <div>
                    <FileUpload label="Giấy phép kinh doanh" description="Giấy phép kinh doanh hoặc đăng ký hộ kinh doanh (PDF, JPG, PNG)" acceptedTypes=".pdf,.jpg,.jpeg,.png" maxSize={5 * 1024 * 1024} onFileSelect={(file) => handleFileSelect("businessLicense", file)} file={files.businessLicense} onRemove={() => handleFileRemove("businessLicense")} required={true} icon={<FaAward />} />
                    {errors.businessLicense && (<p className="text-red-500 text-sm mt-2 flex items-center gap-2"><FaExclamationTriangle />{errors.businessLicense}</p>)}
                  </div>
                  <div>
                    <FileUpload label="Bằng lái xe" description="Bằng lái xe hạng B2 trở lên (PDF, JPG, PNG)" acceptedTypes=".pdf,.jpg,.jpeg,.png" maxSize={5 * 1024 * 1024} onFileSelect={(file) => handleFileSelect("driverLicense", file)} file={files.driverLicense} onRemove={() => handleFileRemove("driverLicense")} required={true} icon={<FaIdCard />} />
                    {errors.driverLicense && (<p className="text-red-500 text-sm mt-2 flex items-center gap-2"><FaExclamationTriangle />{errors.driverLicense}</p>)}
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                    <FaInfoCircle className="text-xl" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg mb-3">Lưu ý quan trọng</h4>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 text-sm flex-shrink-0" /><span>Tất cả thông tin phải chính xác và trung thực</span></li>
                      <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 text-sm flex-shrink-0" /><span>Giấy tờ phải còn hiệu lực và rõ nét</span></li>
                      <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 text-sm flex-shrink-0" /><span>Chúng tôi sẽ xem xét và phản hồi trong vòng 24-48h</span></li>
                      <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 text-sm flex-shrink-0" /><span>Bằng việc đăng ký, bạn đồng ý với điều khoản sử dụng</span></li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <Link to="/" className="flex-1 border-2 border-gray-300 text-gray-700 py-4 px-8 rounded-2xl font-bold text-lg text-center hover:bg-gray-50 transition-all duration-300 flex items-center justify-center"><FaArrowLeft className="mr-3" />Quay lại</Link>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 px-8 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center disabled:transform-none disabled:shadow-lg">
                  {isSubmitting ? (<><FaSpinner className="animate-spin mr-3 text-xl" />Đang xử lý...</>) : (<><FaCheckCircle className="mr-3 text-xl" />Xác nhận đăng ký</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="mt-16 text-center">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FaShieldAlt className="text-2xl text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Cam kết bảo mật</h3>
            <p className="text-gray-600 text-lg leading-relaxed">Thông tin cá nhân của bạn được bảo mật tuyệt đối. Chúng tôi chỉ sử dụng thông tin để xác thực và hỗ trợ quá trình đăng ký trở thành đối tác.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OwnerRegistrationPage; 