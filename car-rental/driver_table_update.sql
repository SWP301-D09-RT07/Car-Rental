-- Migration để cập nhật dữ liệu cho bảng Driver
-- Chạy script này để cập nhật dữ liệu cho các cột NULL

-- Cập nhật dữ liệu mẫu cho các driver hiện có
UPDATE Driver 
SET 
    license_type = 'B2',
    license_expiry_date = DATEADD(YEAR, 5, GETDATE()),
    experience_years = CASE 
        WHEN driver_id = 1 THEN 5
        WHEN driver_id = 2 THEN 3
        WHEN driver_id = 3 THEN 7
        ELSE 3
    END
WHERE license_type IS NULL OR license_expiry_date IS NULL OR experience_years IS NULL;

PRINT 'Migration completed successfully!';
