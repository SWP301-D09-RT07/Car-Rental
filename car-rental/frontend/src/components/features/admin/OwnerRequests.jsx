import { useEffect, useState } from "react";
import { FaCheckCircle, FaTimesCircle, FaFileAlt, FaSpinner, FaEye } from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const OwnerRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/registration-requests`);
      setRequests(res.data);
    } catch (err) {
      toast.error("Không thể tải danh sách yêu cầu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/registration-requests/${id}/approve`);
      toast.success("Đã duyệt yêu cầu!");
      fetchRequests();
      setSelected(null);
    } catch {
      toast.error("Lỗi khi duyệt yêu cầu");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/registration-requests/${id}/reject`);
      toast.success("Đã từ chối yêu cầu!");
      fetchRequests();
      setSelected(null);
    } catch {
      toast.error("Lỗi khi từ chối yêu cầu");
    } finally {
      setActionLoading(false);
    }
  };

  const renderFileLink = (filePath, label) => {
    if (!filePath) return null;
    const url = `${BASE_URL}/${filePath}`;
    const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(filePath);
    const isPdf = /\.pdf$/i.test(filePath);
    console.log('renderFileLink:', { label, filePath, url, isImage, isPdf });
    return (
      <button
        type="button"
        onClick={() => {
          console.log('setPreviewFile:', { url, label, type: isImage ? 'image' : isPdf ? 'pdf' : 'other' });
          setPreviewFile({ url, label, type: isImage ? 'image' : isPdf ? 'pdf' : 'other' });
        }}
        className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border hover:bg-blue-100 transition-colors"
      >
        <FaFileAlt className="text-blue-600" /> 
        <span className="text-sm font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Yêu cầu đăng ký chủ xe</h1>
      {loading ? (
        <div className="flex items-center justify-center gap-3 text-blue-600 py-12">
          <FaSpinner className="animate-spin text-2xl" /> 
          <span className="text-lg font-medium">Đang tải danh sách yêu cầu...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaFileAlt className="text-4xl text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">Chưa có yêu cầu đăng ký</h3>
          <p className="text-gray-600">Hiện tại chưa có yêu cầu đăng ký chủ xe nào.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-xl shadow-lg">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <th className="py-4 px-6 text-left font-bold">Họ tên</th>
                <th className="py-4 px-6 text-left font-bold">Email</th>
                <th className="py-4 px-6 text-left font-bold">Số ĐT</th>
                <th className="py-4 px-6 text-left font-bold">Trạng thái</th>
                <th className="py-4 px-6 text-left font-bold">Ngày tạo</th>
                <th className="py-4 px-6 text-center font-bold">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-b hover:bg-blue-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-800">{req.fullName}</td>
                  <td className="py-4 px-6 text-gray-700">{req.email}</td>
                  <td className="py-4 px-6 text-gray-700 font-mono">{req.phoneNumber}</td>
                  <td className="py-4 px-6">
                    {req.status === 'pending' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-800">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                        Chờ duyệt
                      </span>
                    )}
                    {req.status === 'approved' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                        <FaCheckCircle className="mr-2" />
                        Đã duyệt
                      </span>
                    )}
                    {req.status === 'rejected' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800">
                        <FaTimesCircle className="mr-2" />
                        Từ chối
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-gray-600 text-sm">
                    {req.createdAt ? new Date(req.createdAt).toLocaleString('vi-VN') : ''}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button 
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm" 
                      onClick={() => setSelected(req)}
                    >
                      <FaEye className="mr-2" />
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Modal chi tiết */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl relative">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setSelected(null)}>&times;</button>
            <h2 className="text-2xl font-bold mb-4">Chi tiết yêu cầu</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="font-semibold text-gray-700 mb-1">Họ tên:</div>
                <div className="text-gray-900 font-medium">{selected.fullName}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-700 mb-1">Email:</div>
                <div className="text-gray-900 font-medium">{selected.email}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-700 mb-1">Số điện thoại:</div>
                <div className="text-gray-900 font-medium">{selected.phoneNumber}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-700 mb-1">Số CMND/CCCD:</div>
                <div className="text-gray-900 font-medium">{selected.idNumber}</div>
              </div>
              <div className="md:col-span-2">
                <div className="font-semibold text-gray-700 mb-1">Địa chỉ:</div>
                <div className="text-gray-900 font-medium">{selected.address}</div>
              </div>
            </div>
            <div className="mb-4">
              <div className="font-semibold mb-2">Giấy tờ đã upload:</div>
              <div className="flex flex-wrap gap-4">
                {renderFileLink(selected.carDocuments, "Giấy tờ xe")}
                {renderFileLink(selected.businessLicense, "Giấy phép KD")}
                {renderFileLink(selected.driverLicense, "Bằng lái xe")}
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              {selected.status === 'pending' && (
                <>
                  <button onClick={() => handleApprove(selected.id)} disabled={actionLoading} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                    {actionLoading ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />} Duyệt
                  </button>
                  <button onClick={() => handleReject(selected.id)} disabled={actionLoading} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                    {actionLoading ? <FaSpinner className="animate-spin" /> : <FaTimesCircle />} Từ chối
                  </button>
                </>
              )}
              {selected.status === 'approved' && (
                <span className="flex-1 text-green-700 font-bold flex items-center gap-2 justify-center"><FaCheckCircle /> Đã duyệt</span>
              )}
              {selected.status === 'rejected' && (
                <span className="flex-1 text-red-700 font-bold flex items-center gap-2 justify-center"><FaTimesCircle /> Đã từ chối</span>
              )}
            </div>
          </div>
        </div>
      )}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-4xl w-full relative flex flex-col items-center">
            <button
              className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-800 transition-colors"
              onClick={() => setPreviewFile(null)}
            >
              &times;
            </button>
            <div className="mb-4 font-bold text-lg text-gray-800">{previewFile.label}</div>
            {previewFile.type === 'image' && (
              <div className="w-full flex justify-center">
                <img 
                  src={previewFile.url} 
                  alt={previewFile.label} 
                  className="max-h-[70vh] max-w-full rounded-lg border shadow-lg" 
                  onError={(e) => {
                    console.error('Image load error:', previewFile.url);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="hidden text-center p-8">
                  <FaFileAlt className="text-6xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Không thể hiển thị hình ảnh</p>
                  <a 
                    href={previewFile.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Tải về để xem
                  </a>
                </div>
              </div>
            )}
            {previewFile.type === 'pdf' && (
              <div className="w-full">
                <iframe 
                  src={previewFile.url} 
                  title={previewFile.label} 
                  className="w-full border rounded-lg" 
                  style={{ height: '70vh' }}
                  onError={(e) => {
                    console.error('PDF load error:', previewFile.url);
                  }}
                />
              </div>
            )}
            {previewFile.type === 'other' && (
              <div className="text-center p-8">
                <FaFileAlt className="text-6xl text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">File không thể hiển thị trực tiếp</p>
                <a 
                  href={previewFile.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Tải về để xem
                </a>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <a 
                href={previewFile.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Mở trong tab mới
              </a>
              <a 
                href={previewFile.url} 
                download 
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Tải về
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerRequests; 