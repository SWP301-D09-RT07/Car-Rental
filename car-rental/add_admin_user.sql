-- Script để thêm user admin vào database
USE CarRentalDB;

-- Kiểm tra xem có role admin chưa
IF NOT EXISTS (SELECT 1 FROM Role WHERE role_name = 'admin')
BEGIN
    INSERT INTO Role (role_name, description) VALUES ('admin', 'Administrator role');
END

-- Kiểm tra xem có status active chưa
IF NOT EXISTS (SELECT 1 FROM Status WHERE status_name = 'active')
BEGIN
    INSERT INTO Status (status_name, description) VALUES ('active', 'Active user status');
END

-- Kiểm tra xem có country code VN chưa
IF NOT EXISTS (SELECT 1 FROM CountryCode WHERE country_code = 'VN')
BEGIN
    INSERT INTO CountryCode (country_code, country_name) VALUES ('VN', 'Vietnam');
END

-- Thêm user admin nếu chưa tồn tại
IF NOT EXISTS (SELECT 1 FROM [User] WHERE username = 'admin')
BEGIN
    INSERT INTO [User] (
        username, 
        email, 
        password_hash, 
        role_id, 
        status_id, 
        country_code, 
        created_at, 
        updated_at, 
        is_deleted
    ) VALUES (
        'admin',
        'admin@carrental.com',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
        (SELECT role_id FROM Role WHERE role_name = 'admin'),
        (SELECT status_id FROM Status WHERE status_name = 'active'),
        'VN',
        GETDATE(),
        GETDATE(),
        0
    );
    
    PRINT 'Admin user created successfully';
END
ELSE
BEGIN
    PRINT 'Admin user already exists';
END

-- Hiển thị thông tin user admin
SELECT 
    u.username,
    u.email,
    r.role_name,
    s.status_name
FROM [User] u
JOIN Role r ON u.role_id = r.role_id
JOIN Status s ON u.status_id = s.status_id
WHERE u.username = 'admin'; 