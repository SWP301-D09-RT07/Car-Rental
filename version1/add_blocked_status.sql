USE CarRentalDB;

-- Thêm status "blocked" vào bảng Status
INSERT INTO Status (status_name, description)
VALUES (N'blocked', N'Bị chặn');

-- Kiểm tra xem đã thêm thành công chưa
SELECT * FROM Status WHERE status_name = 'blocked'; 