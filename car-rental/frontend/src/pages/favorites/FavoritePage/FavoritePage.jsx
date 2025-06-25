"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { getFavorites, removeFavorite } from "../../../services/api"

const FavoritePage = () => {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [removingId, setRemovingId] = useState(null)
  const [showToast, setShowToast] = useState({ show: false, message: "", type: "" })
  const navigate = useNavigate()

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const response = await getFavorites()
      setFavorites(response.data || [])
      setError(null)
    } catch (err) {
      setError(err.message || "Không thể tải danh sách yêu thích")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (carId) => {
    try {
      setRemovingId(carId)
      await removeFavorite(carId)
      setFavorites(favorites.filter((fav) => fav.carId !== carId))
      showToastMessage("Đã xóa khỏi danh sách yêu thích", "success")
    } catch (err) {
      showToastMessage("Không thể xóa khỏi danh sách yêu thích", "error")
    } finally {
      setRemovingId(null)
    }
  }

  const showToastMessage = (message, type) => {
    setShowToast({ show: true, message, type })
    setTimeout(() => setShowToast({ show: false, message: "", type: "" }), 3000)
  }

  const handleViewDetails = (carId) => {
    navigate(`/cars/${carId}`)
  }

  const handleBookNow = (carId) => {
    navigate(`/cars/${carId}?action=book`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-gray-600 text-lg">Đang tải danh sách yêu thích...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center bg-white rounded-2xl p-8 shadow-lg max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-error-warning-line text-2xl text-red-600"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Có lỗi xảy ra</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={fetchFavorites}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Toast Notification */}
      {showToast.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div
            className={`px-6 py-4 rounded-xl shadow-lg backdrop-blur-sm ${
              showToast.type === "success" ? "bg-green-500/90 text-white" : "bg-red-500/90 text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <i className={`text-xl ${showToast.type === "success" ? "ri-check-line" : "ri-error-warning-line"}`}></i>
              <span className="font-medium">{showToast.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors duration-300"
              >
                <i className="ri-arrow-left-line text-xl"></i>
                <span className="font-medium">Trang chủ</span>
              </Link>
              <div className="w-px h-6 bg-gray-300"></div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Xe yêu thích
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <i className="ri-heart-fill text-red-500"></i>
              <span>{favorites.length} xe</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {favorites.length === 0 ? (
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-center max-w-md">
              <div className="relative mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <i className="ri-heart-line text-5xl text-gray-400"></i>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <i className="ri-close-line text-white text-sm"></i>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Chưa có xe yêu thích</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Bạn chưa thêm xe nào vào danh sách yêu thích. Hãy khám phá và tìm những chiếc xe ưng ý nhất!
              </p>
              <div className="space-y-4">
                <Link
                  to="/search"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  <i className="ri-search-line"></i>
                  <span>Tìm kiếm xe</span>
                </Link>
                <div className="text-sm text-gray-500">
                  hoặc{" "}
                  <Link to="/" className="text-blue-600 hover:underline">
                    quay lại trang chủ
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <i className="ri-heart-fill text-white text-xl"></i>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{favorites.length}</div>
                      <div className="text-sm text-gray-600">Xe yêu thích</div>
                    </div>
                  </div>
                  <div className="w-px h-12 bg-gray-200"></div>
                  <div className="text-sm text-gray-600">
                    <div className="font-medium">Gợi ý:</div>
                    <div>Đặt xe sớm để có giá tốt nhất</div>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/search")}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300"
                >
                  <i className="ri-add-line"></i>
                  <span>Thêm xe khác</span>
                </button>
              </div>
            </div>

            {/* Favorites Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((favorite, index) => (
                <div
                  key={favorite.carId}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-200/50 hover:border-blue-200 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Car Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={
                        favorite.car?.image || favorite.car?.images?.[0]?.url || "/placeholder.svg?height=200&width=300"
                      }
                      alt={favorite.car?.name || favorite.car?.model}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Favorite Button */}
                    <button
                      onClick={() => handleRemoveFavorite(favorite.carId)}
                      disabled={removingId === favorite.carId}
                      className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300 group/btn"
                    >
                      {removingId === favorite.carId ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <i className="ri-heart-fill text-red-500 group-hover/btn:scale-110 transition-transform duration-300"></i>
                      )}
                    </button>

                    {/* Quick Actions */}
                    <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <button
                        onClick={() => handleViewDetails(favorite.carId)}
                        className="flex-1 bg-white/90 backdrop-blur-sm text-gray-900 py-2 px-4 rounded-lg font-medium hover:bg-white transition-all duration-300"
                      >
                        Chi tiết
                      </button>
                      <button
                        onClick={() => handleBookNow(favorite.carId)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                      >
                        Đặt ngay
                      </button>
                    </div>
                  </div>

                  {/* Car Info */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors duration-300">
                          {favorite.car?.name || favorite.car?.model}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <i className="ri-car-line"></i>
                          <span>{favorite.car?.brand || "Không rõ hãng"}</span>
                          <span>•</span>
                          <span>{favorite.car?.year || "2023"}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-blue-600">
                          {favorite.car?.dailyRate ? `${(favorite.car.dailyRate / 1000).toFixed(0)}K` : "500K"}
                        </div>
                        <div className="text-xs text-gray-500">/ ngày</div>
                      </div>
                    </div>

                    {/* Car Features */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <i className="ri-user-line"></i>
                        <span>{favorite.car?.seats || 5} chỗ</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <i className="ri-steering-2-line"></i>
                        <span>{favorite.car?.transmission || "Tự động"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <i className="ri-gas-station-line"></i>
                        <span>{favorite.car?.fuelType || "Xăng"}</span>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i
                              key={star}
                              className={`ri-star-${star <= (favorite.car?.rating || 4.8) ? "fill" : "line"} text-yellow-400 text-sm`}
                            ></i>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {favorite.car?.rating || 4.8} ({favorite.car?.reviewCount || 12} đánh giá)
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Đã thêm {new Date(favorite.createdAt || Date.now()).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-12 text-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-2">Tìm thêm xe yêu thích?</h3>
                <p className="text-blue-100 mb-6">Khám phá hàng nghìn xe chất lượng cao với giá tốt nhất</p>
                <Link
                  to="/search"
                  className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  <i className="ri-search-line"></i>
                  <span>Khám phá ngay</span>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fade-in-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out both;
        }
      `}</style>
    </div>
  )
}

export default FavoritePage
