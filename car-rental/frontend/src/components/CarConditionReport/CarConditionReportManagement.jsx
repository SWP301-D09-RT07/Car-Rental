import React, { useState, useEffect } from 'react';
import { 
    FaClipboardList, 
    FaSearch, 
    FaFilter, 
    FaEye, 
    FaCheck, 
    FaTimes,
    FaDownload,
    FaExclamationTriangle,
    FaCar,
    FaUser,
    FaCalendarAlt,
    FaChartBar
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/ui/Loading/LoadingSpinner';
import ViewReportModal from '@/components/CarConditionReport/CarConditionReportView';
import { 
    getAllCarConditionReports, 
    getCarConditionReportStats,
    confirmCarConditionReport,
    exportCarConditionReports 
} from '@/services/api';
import './CarConditionReportManagement.scss';

// Helper để loại bỏ filter không hợp lệ
function cleanFilters(filters) {
  const cleaned = { ...filters };
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === 'all' || cleaned[key] === '' || cleaned[key] == null) {
      delete cleaned[key];
    }
  });
  return cleaned;
}

const CarConditionReportManagement = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({});
    const [connectionError, setConnectionError] = useState(false);
    
    // Filter states
    const [filters, setFilters] = useState({
        reportType: 'all',
        status: 'all',
        dateRange: 'all',
        searchTerm: ''
    });
    
    // Modal states
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    useEffect(() => {
        fetchReports();
        fetchStats();
    }, [filters, currentPage]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await getAllCarConditionReports(cleanFilters({
                ...filters,
                page: currentPage - 1, // Backend expects 0-based pagination
                limit: itemsPerPage
            }));
            console.log('Admin reports response:', response); // Debug log
            
            // Handle both data.reports and direct response.data formats
            const reportsData = response.data?.reports || response.data || [];
            setReports(Array.isArray(reportsData) ? reportsData : []);
            setError(null); // Clear any previous errors
            setConnectionError(false); // Clear connection error flag
        } catch (error) {
            console.error('Error fetching reports:', error);
            
            // Check if it's a connection error (backend not running)
            if (error.message?.includes('ERR_CONNECTION_REFUSED') || 
                error.message?.includes('Network Error') ||
                error.code === 'ERR_NETWORK') {
                setError('Không thể kết nối với máy chủ. Vui lòng kiểm tra lại kết nối mạng hoặc liên hệ quản trị viên.');
                setConnectionError(true);
                console.warn('Backend server is not running. Please start the backend server.');
            } else {
                setError('Không thể tải danh sách báo cáo');
                setConnectionError(false);
            }
            setReports([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await getCarConditionReportStats(); // Không truyền filter vì backend không nhận
            console.log('Admin stats response:', response); // Debug log
            
            // Handle response format
            const statsData = response.data || response;
            
            // Transform stats to match UI expectations
            const transformedStats = {
                totalReports: statsData.total || 0,
                pendingReports: statsData.statusCounts?.pending || 0,
                confirmedReports: statsData.statusCounts?.confirmed || 0,
                damageReports: 0 // Calculate from reports if needed
            };
            
            setStats(transformedStats);
        } catch (error) {
            console.error('Error fetching stats:', error);
            
            // Check if it's a connection error (backend not running)
            if (error.message?.includes('ERR_CONNECTION_REFUSED') || 
                error.message?.includes('Network Error') ||
                error.code === 'ERR_NETWORK') {
                console.warn('Backend server is not running. Using fallback stats.');
                // Set fallback stats when backend is not available
                setStats({
                    totalReports: 0,
                    pendingReports: 0,
                    confirmedReports: 0,
                    damageReports: 0
                });
            } else {
                setStats({}); // Set empty object on other errors
            }
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const handleViewReport = (report) => {
        setSelectedReport(report);
        setShowViewModal(true);
    };

    const handleConfirmReport = async (reportId) => {
        try {
            const response = await confirmCarConditionReport(reportId);
            console.log('Confirm report response:', response); // Debug log
            
            await fetchReports();
            await fetchStats();
            toast.success('Đã xác nhận báo cáo thành công');
        } catch (error) {
            console.error('Error confirming report:', error);
            if (error.message?.includes('ERR_CONNECTION_REFUSED') || 
                error.message?.includes('Network Error') ||
                error.code === 'ERR_NETWORK') {
                toast.error('Không thể kết nối với máy chủ. Vui lòng kiểm tra kết nối mạng.');
            } else {
                toast.error('Không thể xác nhận báo cáo');
            }
        }
    };

    const handleExportReports = async () => {
        try {
            console.log('Exporting with filters:', filters); // Debug log
            const response = await exportCarConditionReports(filters);
            
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `car-condition-reports-${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url); // Clean up
            
            toast.success('Đã xuất báo cáo thành công');
        } catch (error) {
            console.error('Error exporting reports:', error);
            if (error.message?.includes('ERR_CONNECTION_REFUSED') || 
                error.message?.includes('Network Error') ||
                error.code === 'ERR_NETWORK') {
                toast.error('Không thể kết nối với máy chủ để xuất báo cáo. Vui lòng kiểm tra kết nối mạng.');
            } else {
                toast.error('Không thể xuất báo cáo');
            }
        }
    };

    const getStatusBadge = (isConfirmed) => {
        return isConfirmed ? (
            <span className="status-badge confirmed">
                <FaCheck className="w-3 h-3" />
                Đã xác nhận
            </span>
        ) : (
            <span className="status-badge pending">
                <FaExclamationTriangle className="w-3 h-3" />
                Chờ xác nhận
            </span>
        );
    };

    const getReportTypeBadge = (type) => {
        return type === 'PICKUP' ? (
            <span className="type-badge pickup">Nhận xe</span>
        ) : (
            <span className="type-badge return">Trả xe</span>
        );
    };

    const getConditionBadge = (condition) => {
        const conditionClass = {
            'EXCELLENT': 'excellent',
            'GOOD': 'good',
            'FAIR': 'fair',
            'POOR': 'poor'
        };

        const conditionLabel = {
            'EXCELLENT': 'Tuyệt vời',
            'GOOD': 'Tốt',
            'FAIR': 'Bình thường',
            'POOR': 'Kém'
        };

        return (
            <span className={`condition-badge ${conditionClass[condition]}`}>
                {conditionLabel[condition]}
            </span>
        );
    };

    const filteredReports = reports.filter(report => {
        const matchesReportType = filters.reportType === 'all' || report.reportType === filters.reportType;
        const matchesStatus = filters.status === 'all' || 
                            (filters.status === 'confirmed' && report.isConfirmed) ||
                            (filters.status === 'pending' && !report.isConfirmed);
        const matchesSearchTerm = !filters.searchTerm || 
                                report.bookingId.toString().includes(filters.searchTerm) ||
                                (report.car?.model || '').toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                                (report.reporter?.fullName || '').toLowerCase().includes(filters.searchTerm.toLowerCase());
        
        return matchesReportType && matchesStatus && matchesSearchTerm;
    });

    const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
    const paginatedReports = filteredReports.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="car-condition-report-management">
            {/* Connection Error Banner */}
            {connectionError && (
                <div className="connection-error-banner" style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    margin: '16px 0',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#991b1b'
                }}>
                    <FaExclamationTriangle style={{ marginRight: '8px', color: '#dc2626' }} />
                    <div>
                        <strong>Không thể kết nối với máy chủ</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                            Máy chủ backend hiện không khả dụng. Vui lòng khởi động máy chủ backend hoặc liên hệ quản trị viên.
                        </p>
                    </div>
                </div>
            )}
            
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <div className="header-left">
                        <div className="header-icon">
                            <FaClipboardList />
                        </div>
                        <div className="header-text">
                            <h1>Quản lý báo cáo tình trạng xe</h1>
                            <p>Theo dõi và xác nhận các báo cáo từ khách hàng và chủ xe</p>
                        </div>
                    </div>
                    <button className="export-btn" onClick={handleExportReports}>
                        <FaDownload />
                        Xuất báo cáo
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon total">
                        <FaClipboardList />
                    </div>
                    <div className="stat-content">
                        <div className="stat-number">{stats.totalReports || 0}</div>
                        <div className="stat-label">Tổng báo cáo</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon pending">
                        <FaExclamationTriangle />
                    </div>
                    <div className="stat-content">
                        <div className="stat-number">{stats.pendingReports || 0}</div>
                        <div className="stat-label">Chờ xác nhận</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon confirmed">
                        <FaCheck />
                    </div>
                    <div className="stat-content">
                        <div className="stat-number">{stats.confirmedReports || 0}</div>
                        <div className="stat-label">Đã xác nhận</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon damage">
                        <FaCar />
                    </div>
                    <div className="stat-content">
                        <div className="stat-number">{stats.damageReports || 0}</div>
                        <div className="stat-label">Có hư hỏng</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="filters-row">
                    <div className="filter-group">
                        <label>Loại báo cáo:</label>
                        <select
                            value={filters.reportType}
                            onChange={(e) => handleFilterChange('reportType', e.target.value)}
                        >
                            <option value="all">Tất cả</option>
                            <option value="PICKUP">Nhận xe</option>
                            <option value="RETURN">Trả xe</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Trạng thái:</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="all">Tất cả</option>
                            <option value="pending">Chờ xác nhận</option>
                            <option value="confirmed">Đã xác nhận</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Thời gian:</label>
                        <select
                            value={filters.dateRange}
                            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                        >
                            <option value="all">Tất cả</option>
                            <option value="today">Hôm nay</option>
                            <option value="week">Tuần này</option>
                            <option value="month">Tháng này</option>
                        </select>
                    </div>

                    <div className="search-group">
                        <FaSearch />
                        <input
                            type="text"
                            placeholder="Tìm theo mã đơn, xe, người báo cáo..."
                            value={filters.searchTerm}
                            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Reports Table */}
            <div className="reports-section">
                {loading ? (
                    <div className="loading-container">
                        <LoadingSpinner size="large" />
                    </div>
                ) : error ? (
                    <div className="error-container">
                        <FaTimes className="error-icon" />
                        <p>{error}</p>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="empty-container">
                        <FaClipboardList className="empty-icon" />
                        <h3>Không có báo cáo nào</h3>
                        <p>Chưa có báo cáo tình trạng xe nào phù hợp với bộ lọc hiện tại</p>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table className="reports-table">
                                <thead>
                                    <tr>
                                        <th>Mã đơn</th>
                                        <th>Loại báo cáo</th>
                                        <th>Xe</th>
                                        <th>Người báo cáo</th>
                                        <th>Tình trạng chung</th>
                                        <th>Ngày tạo</th>
                                        <th>Trạng thái</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedReports.map((report) => (
                                        <tr key={report.reportId}>
                                            <td>
                                                <span className="booking-id">#{report.bookingId}</span>
                                            </td>
                                            <td>
                                                {getReportTypeBadge(report.reportType)}
                                            </td>
                                            <td>
                                                <div className="car-info">
                                                    <div className="car-name">{report.car?.model || 'N/A'}</div>
                                                    <div className="car-plate">{report.car?.licensePlate || 'N/A'}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="reporter-info">
                                                    <div className="reporter-name">{report.reporter?.fullName || 'N/A'}</div>
                                                    <div className="reporter-type">
                                                        {report.reporter?.role === 'customer' ? 'Khách hàng' : 'Chủ xe'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="condition-summary">
                                                    {getConditionBadge(report.exteriorCondition)}
                                                    {report.damageNotes && (
                                                        <span className="damage-indicator">
                                                            <FaExclamationTriangle />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="date-info">
                                                    <div>{new Date(report.reportDate).toLocaleDateString('vi-VN')}</div>
                                                    <div className="time">{new Date(report.reportDate).toLocaleTimeString('vi-VN')}</div>
                                                </div>
                                            </td>
                                            <td>
                                                {getStatusBadge(report.isConfirmed)}
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="action-btn view"
                                                        onClick={() => handleViewReport(report)}
                                                        title="Xem chi tiết"
                                                    >
                                                        <FaEye />
                                                    </button>
                                                    {!report.isConfirmed && (
                                                        <button
                                                            className="action-btn confirm"
                                                            onClick={() => handleConfirmReport(report.reportId)}
                                                            title="Xác nhận báo cáo"
                                                        >
                                                            <FaCheck />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="pagination-btn"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                >
                                    Trước
                                </button>
                                
                                <div className="pagination-info">
                                    Trang {currentPage} / {totalPages}
                                </div>
                                
                                <button
                                    className="pagination-btn"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                >
                                    Sau
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* View Report Modal */}
            <ViewReportModal
                isOpen={showViewModal}
                onClose={() => {
                    setShowViewModal(false);
                    setSelectedReport(null);
                }}
                report={selectedReport}
                canConfirm={!selectedReport?.isConfirmed}
                onConfirm={handleConfirmReport}
            />
        </div>
    );
};

export default CarConditionReportManagement; 