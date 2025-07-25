-- Additional Status values for Platform Fee Payment and other features
INSERT INTO Status (status_name, description)
VALUES 
    -- Platform Fee Payment Status
    (N'processing', N'Đang xử lý thanh toán'),
    (N'overdue', N'Quá hạn'),
    (N'penalty_applied', N'Đã áp dụng phạt'),
    (N'escalated', N'Đã leo thang xử lý'),
    (N'suspended_due_to_overdue', N'Tạm ngưng do quá hạn'),
    
    -- Cash Payment Confirmation Status  
    (N'cash_confirmed', N'Đã xác nhận tiền mặt'),
    (N'cash_pending', N'Chờ xác nhận tiền mặt'),
    
    -- Booking Extended Status
    (N'returned', N'Đã trả xe'),
    (N'pickup_confirmed', N'Đã xác nhận nhận xe'),
    (N'return_confirmed', N'Đã xác nhận trả xe'),
    
    -- Payment Extended Status
    (N'partial_paid', N'Thanh toán một phần'),
    (N'full_paid', N'Thanh toán đầy đủ'),
    (N'refund_pending', N'Chờ hoàn tiền'),
    (N'refund_processing', N'Đang xử lý hoàn tiền'),
    
    -- Car Condition Report Status
    (N'damage_reported', N'Đã báo cáo hư hỏng'),
    (N'damage_confirmed', N'Xác nhận hư hỏng'),
    (N'repair_needed', N'Cần sửa chữa'),
    (N'repair_in_progress', N'Đang sửa chữa'),
    (N'repair_completed', N'Hoàn thành sửa chữa'),
    
    -- System Status
    (N'scheduled', N'Đã lên lịch'),
    (N'suspended', N'Tạm ngưng'),
    (N'archived', N'Đã lưu trữ'),
    
    -- User/Supplier Status
    (N'verified', N'Đã xác minh'),
    (N'unverified', N'Chưa xác minh'),
    (N'under_review', N'Đang xem xét');
GO

-- Update existing status descriptions for consistency
UPDATE Status SET description = N'Đang chờ xử lý' WHERE status_name = 'pending';
UPDATE Status SET description = N'Đang thực hiện' WHERE status_name = 'in_progress';
UPDATE Status SET description = N'Đã từ chối' WHERE status_name = 'rejected';
GO
