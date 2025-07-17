import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getCarConditionReportsByBooking, confirmCarConditionReport, disputeCarConditionReport } from '@/services/api';
import LoadingSpinner from '@/components/ui/Loading/LoadingSpinner';
import './CarConditionReportView.scss';

const CarConditionReportView = ({ 
    isOpen, 
    onClose, 
    bookingId, 
    currentUser,
    onConfirm 
}) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(null);
    const [disputing, setDisputing] = useState(null);

    useEffect(() => {
        if (isOpen && bookingId) {
            fetchReports();
        }
    }, [isOpen, bookingId]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            console.log('🔄 Fetching reports for booking:', bookingId); // Debug log
            const response = await getCarConditionReportsByBooking(bookingId);
            console.log('📊 Raw API response:', response);
            console.log('📊 Response type:', typeof response);
            console.log('📊 Is array:', Array.isArray(response));
            
            // API trả về trực tiếp array, không có wrapper .data
            const reportsData = Array.isArray(response) ? response : (response.data || []);
            console.log('📊 Reports data:', reportsData);
            console.log('📊 Reports count:', reportsData.length);
            
            setReports(reportsData);
            
            // Debug: Log each report details
            reportsData.forEach((report, index) => {
                console.log(`📋 Report ${index + 1}:`, {
                    reportId: report.reportId,
                    reportType: report.reportType,
                    isConfirmed: report.isConfirmed,
                    reportDate: report.reportDate
                });
            });
            
        } catch (error) {
            console.error('❌ Error fetching reports:', error);
            toast.error('Không thể tải báo cáo: ' + (error.message || 'Lỗi không xác định'));
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmReport = async (reportId) => {
        try {
            setConfirming(reportId);
            console.log('🔄 Confirming report:', reportId); // Debug log
            await confirmCarConditionReport(reportId); // Removed currentUser.userId parameter
            toast.success('Đã xác nhận báo cáo thành công!');
            
            // Update local state
            setReports(prev => prev.map(report => 
                report.reportId === reportId 
                    ? { ...report, isConfirmed: true, confirmedBy: currentUser.userId, confirmedAt: new Date().toISOString() }
                    : report
            ));
            
            onConfirm && onConfirm();
        } catch (error) {
            console.error('Error confirming report:', error);
            toast.error('Không thể xác nhận báo cáo');
        } finally {
            setConfirming(null);
        }
    };

    const handleDisputeReport = async (reportId) => {
        // Hiển thị prompt để nhập lý do tranh chấp
        const disputeReason = prompt('Vui lòng nhập lý do tranh chấp báo cáo này:');
        
        if (disputeReason === null) {
            // User clicked Cancel
            return;
        }
        
        if (!disputeReason.trim()) {
            toast.error('Vui lòng nhập lý do tranh chấp');
            return;
        }
        
        try {
            setDisputing(reportId);
            console.log('🔄 Disputing report:', reportId, 'Reason:', disputeReason);
            await disputeCarConditionReport(reportId, disputeReason.trim());
            toast.success('Đã gửi tranh chấp báo cáo thành công!');
            
            // Update local state - mark as disputed
            setReports(prev => prev.map(report => 
                report.reportId === reportId 
                    ? { 
                        ...report, 
                        statusName: 'disputed',
                        disputeReason: disputeReason.trim(),
                        disputedBy: currentUser.userId, 
                        disputedAt: new Date().toISOString() 
                    }
                    : report
            ));
            
            onConfirm && onConfirm();
        } catch (error) {
            console.error('Error disputing report:', error);
            toast.error('Không thể gửi tranh chấp báo cáo');
        } finally {
            setDisputing(null);
        }
    };

    const getConditionColor = (condition) => {
        switch (condition) {
            case 'EXCELLENT': return '#4CAF50';
            case 'GOOD': return '#8BC34A';
            case 'FAIR': return '#FF9800';
            case 'POOR': return '#F44336';
            default: return '#9E9E9E';
        }
    };

    const getConditionLabel = (condition) => {
        switch (condition) {
            case 'EXCELLENT': return 'Xuất sắc';
            case 'GOOD': return 'Tốt';
            case 'FAIR': return 'Khá';
            case 'POOR': return 'Kém';
            default: return condition;
        }
    };

    // Helper hiển thị badge trạng thái
    const getStatusBadge = (report) => {
        const status = report.statusName?.toLowerCase();
        if (status === 'pending') {
            return <div className="status-badge pending"><i className="fas fa-clock"></i> Chờ xác nhận</div>;
        }
        if (status === 'confirmed') {
            return <div className="status-badge confirmed"><i className="fas fa-check-circle"></i> Đã xác nhận</div>;
        }
        if (status === 'disputed') {
            return <div className="status-badge disputed"><i className="fas fa-exclamation-triangle"></i> Đang tranh chấp</div>;
        }
        if (status === 'resolved') {
            return <div className="status-badge resolved"><i className="fas fa-gavel"></i> Đã xử lý</div>;
        }
        if (status === 'cancelled' || status === 'canceled') {
            return <div className="status-badge cancelled"><i className="fas fa-ban"></i> Đã hủy</div>;
        }
        // Fallback legacy
        if (report.isConfirmed) {
            return <div className="status-badge confirmed"><i className="fas fa-check-circle"></i> Đã xác nhận</div>;
        }
        return <div className="status-badge pending"><i className="fas fa-clock"></i> Chờ xác nhận</div>;
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={(e) => {
            // Close modal khi click vào overlay (không phải modal content)
            if (e.target === e.currentTarget) {
                onClose();
            }
        }}>
            <div className="car-condition-view-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>
                        <i className="fas fa-clipboard-list"></i>
                        Báo cáo tình trạng xe
                    </h3>
                    <button className="close-btn" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="modal-content">
                    {loading ? (
                        <div className="loading-container">
                            <LoadingSpinner size="large" color="blue" />
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="no-reports">
                            <i className="fas fa-clipboard"></i>
                            <h4>Chưa có báo cáo nào</h4>
                            <p>Chưa có báo cáo tình trạng xe nào được tạo cho đặt xe này.</p>
                        </div>
                    ) : reports.length > 0 ? (
                        <div className="reports-container">
                            {reports.map((report) => (
                                <div key={report.reportId} className="report-card">
                                    <div className="report-header">
                                        <div className="report-title">
                                            <h4>
                                                <i className={`fas ${report.reportType === 'PICKUP' ? 'fa-download' : 'fa-upload'}`}></i>
                                                {report.reportType === 'PICKUP' ? 'Báo cáo khi nhận xe' : 'Báo cáo khi trả xe'}
                                            </h4>
                                            <div className="report-meta">
                                                <span className="report-date">
                                                    <i className="fas fa-clock"></i>
                                                    {new Date(report.reportDate).toLocaleString('vi-VN')}
                                                </span>
                                                <span className="reporter">
                                                    <i className="fas fa-user"></i>
                                                    Báo cáo bởi: {report.reporterName || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="report-status">
                                            {getStatusBadge(report)}
                                        </div>
                                    </div>

                                    <div className="report-content">
                                        {/* Basic Info */}
                                        <div className="info-section">
                                            <h5>Thông tin cơ bản</h5>
                                            <div className="info-grid">
                                                <div className="info-item">
                                                    <label>Mức nhiên liệu:</label>
                                                    <div className="fuel-display">
                                                        <span>{report.fuelLevel}%</span>
                                                        <div className="fuel-bar">
                                                            <div 
                                                                className="fuel-fill" 
                                                                style={{ width: `${report.fuelLevel}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="info-item">
                                                    <label>Số km:</label>
                                                    <span className="mileage">
                                                        {report.mileage?.toLocaleString()} km
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Condition Assessment */}
                                        <div className="condition-section">
                                            <h5>Đánh giá tình trạng</h5>
                                            <div className="condition-grid">
                                                {[
                                                    { key: 'exteriorCondition', label: 'Ngoại thất', icon: 'fa-car' },
                                                    { key: 'interiorCondition', label: 'Nội thất', icon: 'fa-chair' },
                                                    { key: 'engineCondition', label: 'Động cơ', icon: 'fa-cog' },
                                                    { key: 'tireCondition', label: 'Lốp xe', icon: 'fa-circle' }
                                                ].map(({ key, label, icon }) => (
                                                    <div key={key} className="condition-item">
                                                        <div className="condition-label">
                                                            <i className={`fas ${icon}`}></i>
                                                            {label}
                                                        </div>
                                                        <div 
                                                            className="condition-badge"
                                                            style={{ 
                                                                backgroundColor: getConditionColor(report[key]),
                                                                color: 'white'
                                                            }}
                                                        >
                                                            {getConditionLabel(report[key])}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        {(report.damageNotes || report.additionalNotes) && (
                                            <div className="notes-section">
                                                <h5>Ghi chú</h5>
                                                {report.damageNotes && (
                                                    <div className="note-item damage-note">
                                                        <strong>Ghi chú về hư hỏng:</strong>
                                                        <p>{report.damageNotes}</p>
                                                    </div>
                                                )}
                                                {report.additionalNotes && (
                                                    <div className="note-item additional-note">
                                                        <strong>Ghi chú bổ sung:</strong>
                                                        <p>{report.additionalNotes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Images */}
                                        {report.images && report.images.length > 0 ? (
                                            <div className="images-section">
                                                <h5>Hình ảnh minh chứng ({report.images.length})</h5>
                                                <div className="images-grid">
                                                    {report.images.map((image, index) => {
                                                        // Xử lý đường dẫn ảnh
                                                        let imageSrc = image.imageUrl;
                                                        
                                                        // Nếu imageUrl không bắt đầu với http hoặc /, thêm vào
                                                        if (!imageSrc.startsWith('http') && !imageSrc.startsWith('/')) {
                                                            imageSrc = `/${imageSrc}`;
                                                        }
                                                        
                                                        // Nếu đường dẫn tương đối, thêm base URL
                                                        if (imageSrc.startsWith('/uploads/')) {
                                                            imageSrc = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${imageSrc}`;
                                                        }
                                                        
                                                        return (
                                                            <div key={index} className="image-item">
                                                                <div className="image-container">
                                                                    <img 
                                                                        src={imageSrc}
                                                                        alt={image.description || `Image ${index + 1}`}
                                                                        onClick={() => window.open(imageSrc, '_blank')}
                                                                        onError={(e) => {
                                                                            console.error('🖼️ Supplier view - Image load error:', imageSrc);
                                                                            e.target.style.display = 'none';
                                                                            e.target.nextSibling.style.display = 'block';
                                                                        }}
                                                                    />
                                                                    <div className="image-error" style={{display: 'none', padding: '20px', background: '#f5f5f5', textAlign: 'center', border: '1px dashed #ccc'}}>
                                                                        <i className="fas fa-image" style={{fontSize: '2rem', color: '#ccc', marginBottom: '10px'}}></i>
                                                                        <p>Không thể tải ảnh</p>
                                                                        <small>{imageSrc}</small>
                                                                    </div>
                                                                </div>
                                                                <div className="image-info">
                                                                    <div className="image-type">
                                                                        {image.imageType === 'exterior_front' && 'Mặt trước xe'}
                                                                        {image.imageType === 'exterior_back' && 'Mặt sau xe'}
                                                                        {image.imageType === 'interior_dashboard' && 'Taplo nội thất'}
                                                                        {image.imageType === 'damage_detail' && 'Chi tiết hư hỏng'}
                                                                        {image.imageType === 'other' && 'Khác'}
                                                                        {!['exterior_front', 'exterior_back', 'interior_dashboard', 'damage_detail', 'other'].includes(image.imageType) && image.imageType}
                                                                    </div>
                                                                    {image.description && (
                                                                        <div className="image-description">
                                                                            {image.description}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="no-images" style={{padding: '20px', textAlign: 'center', background: '#f9f9f9', border: '1px dashed #ddd', marginTop: '16px'}}>
                                                <i className="fas fa-camera" style={{fontSize: '2rem', color: '#ccc', marginBottom: '10px'}}></i>
                                                <p>Không có hình ảnh minh chứng</p>
                                            </div>
                                        )}

                                        {/* Confirmation Section */}
                                        {report.isConfirmed && (
                                            <div className="confirmation-section">
                                                <div className="confirmation-info">
                                                    <i className="fas fa-check-circle"></i>
                                                    <span>
                                                        Đã được xác nhận bởi {report.confirmedByName || 'N/A'} 
                                                        vào {new Date(report.confirmedAt).toLocaleString('vi-VN')}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        {!report.isConfirmed && report.statusName?.toLowerCase() !== 'disputed' && currentUser.roleId !== report.reporterId && (
                                            <div className="report-actions">
                                                <button
                                                    className="btn confirm-btn"
                                                    onClick={() => handleConfirmReport(report.reportId)}
                                                    disabled={confirming === report.reportId || disputing === report.reportId}
                                                >
                                                    {confirming === report.reportId ? (
                                                        <>
                                                            <i className="fas fa-spinner fa-spin"></i>
                                                            Đang xác nhận...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="fas fa-check"></i>
                                                            Xác nhận báo cáo
                                                        </>
                                                    )}
                                                </button>
                                                
                                                <button
                                                    className="btn dispute-btn"
                                                    onClick={() => handleDisputeReport(report.reportId)}
                                                    disabled={confirming === report.reportId || disputing === report.reportId}
                                                >
                                                    {disputing === report.reportId ? (
                                                        <>
                                                            <i className="fas fa-spinner fa-spin"></i>
                                                            Đang gửi tranh chấp...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="fas fa-exclamation-triangle"></i>
                                                            Tranh chấp
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}

                                        {/* Dispute Information */}
                                        {report.statusName?.toLowerCase() === 'disputed' && (
                                            <div className="dispute-section">
                                                <div className="dispute-info">
                                                    <i className="fas fa-exclamation-triangle"></i>
                                                    <div className="dispute-content">
                                                        <strong>Báo cáo đang được tranh chấp</strong>
                                                        {report.disputeReason && (
                                                            <p className="dispute-reason">
                                                                <strong>Lý do:</strong> {report.disputeReason}
                                                            </p>
                                                        )}
                                                        <p className="dispute-note">
                                                            Vụ việc sẽ được admin xem xét và xử lý.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div className="modal-actions">
                    <button className="btn secondary" onClick={onClose}>
                        <i className="fas fa-times"></i>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CarConditionReportView;